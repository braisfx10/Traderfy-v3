// Parser unificado para archivos HTML de MetaTrader 5 y cTrader
import { load } from 'cheerio'

export class UnifiedTradingParser {
  constructor(htmlContent) {
    this.htmlContent = htmlContent
    this.$ = load(htmlContent)
    this.reportType = this.detectReportType()
  }

  parse() {
    console.log(`Parsing ${this.reportType} report...`)
    
    if (this.reportType === 'MT5') {
      return this.parseMT5()
    } else {
      return this.parseCTrader()
    }
  }

  detectReportType() {
    const text = this.$.text()
    
    // Detectar MetaTrader 5 por su estructura específica
    if (text.includes('Informe del historial de trading') && 
        text.includes('Posiciones') && 
        text.includes('Beneficio Neto')) {
      return 'MT5'
    }
    
    // Detectar cTrader por su estructura
    if (text.includes('Extracto de Cuenta') || 
        text.includes('Historial') ||
        text.includes('USD neto')) {
      return 'CTRADER'
    }
    
    return 'CTRADER' // Default fallback
  }

  parseMT5() {
    const trades = this.extractMT5Trades()
    const results = this.extractMT5Results()
    
    return {
      trades,
      results
    }
  }

  parseCTrader() {
    const trades = this.extractCTraderTrades()
    const results = this.calculateCTraderResults(trades)
    
    return {
      trades,
      results
    }
  }

  extractMT5Trades() {
    const trades = []
    let inPositionsSection = false
    let headerFound = false

    this.$('tr').each((index, row) => {
      const rowText = this.$(row).text().trim()
      
      // Detectar inicio de sección Posiciones
      if (rowText === 'Posiciones') {
        inPositionsSection = true
        headerFound = false
        return
      }
      
      // Detectar fin de sección
      if (inPositionsSection && (rowText.includes('Órdenes') || rowText === '' || rowText.includes('Transacciones'))) {
        if (rowText.includes('Órdenes') || rowText.includes('Transacciones')) {
          inPositionsSection = false
          return
        }
      }
      
      if (inPositionsSection) {
        const cells = this.$(row).find('td')
        
        // Buscar fila de encabezados
        if (!headerFound) {
          const hasHeaderBg = this.$(row).attr('bgcolor') === '#E5F0FC'
          const hasHeaderText = rowText.includes('Fecha/Hora') && rowText.includes('Beneficio')
          
          if (hasHeaderBg || hasHeaderText) {
            headerFound = true
            return
          }
        }
        
        // Procesar filas de datos
        if (headerFound && cells.length >= 13) {
          const bgColor = this.$(row).attr('bgcolor')
          if (bgColor === '#FFFFFF' || bgColor === '#F7F7F7') {
            const trade = this.parseMT5TradeRow(cells)
            if (trade) {
              trades.push(trade)
            }
          }
        }
      }
    })

    console.log(`Extracted ${trades.length} MT5 trades`)
    return trades
  }

  parseMT5TradeRow(cells) {
    try {
      const cellTexts = []
      cells.each((i, cell) => {
        let text = this.$(cell).text().trim()
        // Manejar colspan expandiendo con null si es necesario
        const colspan = this.$(cell).attr('colspan')
        if (colspan && parseInt(colspan) > 1) {
          cellTexts.push(text)
          // Añadir nulls para mantener alineación
          for (let j = 1; j < parseInt(colspan); j++) {
            cellTexts.push(null)
          }
        } else {
          cellTexts.push(text)
        }
      })

      // Verificar que tenemos datos válidos
      if (!cellTexts[2] || !cellTexts[3] || cellTexts[12] === undefined) {
        return null
      }

      // Estructura MT5 Posiciones (13 columnas):
      // 0: Fecha/Hora apertura, 1: Posición, 2: Símbolo, 3: Tipo, 4: Volumen,
      // 5: Precio apertura, 6: S/L, 7: T/P, 8: Fecha/Hora cierre,
      // 9: Precio cierre, 10: Comisión, 11: Swap, 12: Beneficio

      return {
        time: this.normalizeMT5Date(cellTexts[8] || cellTexts[0]), // Fecha de cierre preferida
        symbol: cellTexts[2],
        type: (cellTexts[3] || '').toLowerCase(),
        volume: this.parseNumber(cellTexts[4]),
        entry_price: this.parseNumber(cellTexts[5]),
        exit_price: this.parseNumber(cellTexts[9]),
        profit: this.parseNumber(cellTexts[12]),
        balance: null // MT5 no tiene balance por trade, se calcula después
      }
    } catch (error) {
      console.error('Error parsing MT5 trade row:', error)
      return null
    }
  }

  extractCTraderTrades() {
    const trades = []
    let inHistorialSection = false
    let headerFound = false

    console.log('Searching for cTrader Historial section...')

    this.$('table').each((tableIndex, table) => {
      this.$(table).find('tr').each((rowIndex, row) => {
        const rowText = this.$(row).text().trim()
        
        // Detectar sección Historial
        if (rowText === 'Historial') {
          inHistorialSection = true
          headerFound = false
          console.log('Found cTrader Historial section')
          return
        }
        
        // Detectar fin de sección
        if (inHistorialSection && (rowText.includes('Totales') && rowText.includes('900.00'))) {
          inHistorialSection = false
          console.log('Found end of Historial section at totals')
          return
        }
        
        if (inHistorialSection) {
          const cells = this.$(row).find('td')
          
          // Buscar encabezados
          if (!headerFound && rowText.includes('Símbolo') && (rowText.includes('USD neto') || rowText.includes('Dirección de apertura'))) {
            headerFound = true
            console.log('Found cTrader header row')
            return
          }
          
          // Procesar filas de datos - debe tener class="cell-text" y datos válidos
          if (headerFound && cells.length >= 8) {
            const hasValidData = this.$(cells[1]).find('nobr').length > 0 || 
                                this.$(cells[1]).text().trim().length > 2
            
            if (hasValidData) {
              const trade = this.parseCTraderTradeRow(cells)
              if (trade) {
                trades.push(trade)
                console.log('Parsed cTrader trade:', trade.symbol, trade.type, trade.profit)
              }
            }
          }
        }
      })
    })

    console.log(`Extracted ${trades.length} cTrader trades`)
    return trades
  }

  parseCTraderTradeRow(cells) {
    try {
      const cellTexts = []
      cells.each((i, cell) => {
        // Extraer texto, incluyendo el contenido de elementos <nobr>
        const nobrText = this.$(cell).find('nobr').text().trim()
        const cellText = nobrText || this.$(cell).text().trim()
        cellTexts.push(cellText)
      })

      console.log('DEBUG cTrader row:', cellTexts)

      // Verificar que no sea fila vacía o de totales
      if (cellTexts.every(text => text === '') || 
          cellTexts.some(text => text.includes('Totales')) ||
          !cellTexts[1] || cellTexts[1].length < 2) {
        return null
      }

      // Estructura cTrader según el HTML real:
      // 0: (vacío), 1: Símbolo, 2: Dirección de apertura, 3: Hora de cierre,
      // 4: Precio de entrada, 5: Precio de cierre, 6: Cantidad de Cierre, 7: USD neto, 8: Saldo USD

      return {
        time: this.normalizeCTraderDate(cellTexts[3]),
        symbol: cellTexts[1],
        type: (cellTexts[2] || 'buy').toLowerCase(),
        volume: this.extractVolumeFromCTrader(cellTexts[6]), // "1.00 Lotes" -> 1.00
        entry_price: this.parseNumber(cellTexts[4]),
        exit_price: this.parseNumber(cellTexts[5]),
        profit: this.parseNumber(cellTexts[7]),
        balance: this.parseNumber(cellTexts[8])
      }
    } catch (error) {
      console.error('Error parsing cTrader trade row:', error)
      return null
    }
  }

  extractMT5Results() {
    const results = {
      net_profit: 0,
      gross_profit: 0,
      gross_loss: 0,
      profit_factor: 0,
      drawdown: 0,
      total_trades: 0,
      longs_won: 0,
      shorts_won: 0,
      best_trade: 0,
      worst_trade: 0
    }

    let inResultsSection = false

    this.$('tr').each((index, row) => {
      const rowText = this.$(row).text().trim()
      
      if (rowText === 'Resultados') {
        inResultsSection = true
        return
      }
      
      if (inResultsSection) {
        const cells = this.$(row).find('td')
        if (cells.length >= 2) {
          const cellTexts = []
          cells.each((i, cell) => {
            cellTexts.push(this.$(cell).text().trim())
          })
          
          // Procesar pares etiqueta-valor
          for (let i = 0; i < cellTexts.length - 1; i += 2) {
            const label = cellTexts[i]
            const value = cellTexts[i + 1]
            
            if (label && label.includes('Beneficio Neto')) {
              results.net_profit = this.parseNumber(value)
            }
            if (label && label.includes('Beneficio Bruto')) {
              results.gross_profit = this.parseNumber(value)
            }
            if (label && label.includes('Pérdidas Brutas')) {
              results.gross_loss = Math.abs(this.parseNumber(value))
            }
            if (label && label.includes('Factor de Beneficio')) {
              results.profit_factor = this.parseNumber(value)
            }
            if (label && label.includes('Total de operaciones')) {
              results.total_trades = parseInt(value) || 0
            }
            if (label && label.includes('Posiciones largas')) {
              const match = value.match(/(\d+)\s*\(([^)]+)%\)/)
              if (match) {
                const longCount = parseInt(match[1]) || 0
                const longWinRate = parseFloat(match[2]) || 0
                results.longs_won = Math.round((longCount * longWinRate) / 100)
              }
            }
          }
        }
      }
    })

    return results
  }

  calculateCTraderResults(trades) {
    if (!trades || trades.length === 0) {
      return {
        net_profit: 0,
        gross_profit: 0,
        gross_loss: 0,
        profit_factor: 0,
        drawdown: 0,
        total_trades: 0,
        longs_won: 0,
        shorts_won: 0,
        best_trade: 0,
        worst_trade: 0
      }
    }

    const profits = trades.filter(t => t.profit > 0)
    const losses = trades.filter(t => t.profit < 0)
    const longs = trades.filter(t => t.type === 'buy')
    const shorts = trades.filter(t => t.type === 'sell')

    const grossProfit = profits.reduce((sum, t) => sum + t.profit, 0)
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0))
    const netProfit = grossProfit - grossLoss

    return {
      net_profit: netProfit,
      gross_profit: grossProfit,
      gross_loss: grossLoss,
      profit_factor: grossLoss > 0 ? grossProfit / grossLoss : 0,
      drawdown: 0, // Se calcularía con más datos históricos
      total_trades: trades.length,
      longs_won: longs.filter(t => t.profit > 0).length,
      shorts_won: shorts.filter(t => t.profit > 0).length,
      best_trade: Math.max(...trades.map(t => t.profit)),
      worst_trade: Math.min(...trades.map(t => t.profit))
    }
  }

  // Utilidades de normalización
  normalizeMT5Date(dateStr) {
    if (!dateStr) return null
    
    // Convertir "2025.08.19 16:01:32" a "2025-08-19 16:01:32"
    const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`
    }
    
    return dateStr
  }

  normalizeCTraderDate(dateStr) {
    if (!dateStr) return null
    
    // Convertir "30/07/2025 15:13:02.678" a "2025-07-30 15:13:02"
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]} ${match[4]}:${match[5]}:${match[6]}`
    }
    
    return dateStr
  }

  extractVolumeFromCTrader(volumeStr) {
    if (!volumeStr) return 0
    
    // Extraer número de "2.00 Lotes" -> 2.00
    const match = volumeStr.match(/(\d+\.?\d*)\s*Lotes?/i)
    if (match) {
      return parseFloat(match[1])
    }
    
    return this.parseNumber(volumeStr)
  }

  parseNumber(str) {
    if (!str || str === '' || str === null) return 0
    
    // Eliminar espacios de miles y mantener decimales
    // "14 928.34" -> "14928.34"
    // "1 526.20" -> "1526.20"
    const cleaned = str.toString()
      .replace(/\s+/g, '') // Eliminar espacios
      .replace(/[^\d.-]/g, '') // Solo dígitos, punto y guión
    
    const number = parseFloat(cleaned)
    return isNaN(number) ? 0 : number
  }
}

export default UnifiedTradingParser