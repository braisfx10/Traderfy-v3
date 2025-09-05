// Parser específico para MetaTrader 5 HTML reports
import { load } from 'cheerio'

export class MT5Parser {
  constructor(htmlContent) {
    this.htmlContent = htmlContent
    this.$ = load(htmlContent)
  }

  parse() {
    console.log('Parsing MetaTrader 5 HTML report...')
    
    const result = {
      account: this.extractAccountInfo(),
      positions: this.extractPositions(),
      orders: this.extractOrders(),
      transactions: this.extractTransactions(),
      results: this.extractResults()
    }
    
    console.log('MT5 parsing completed:', {
      positions: result.positions.length,
      orders: result.orders.length,
      transactions: result.transactions.length,
      account: result.account.account_number
    })
    
    return result
  }

  extractAccountInfo() {
    const account = {
      name: "",
      account_number: "",
      broker: "",
      currency: "",
      type: "",
      company: "",
      report_date: ""
    }

    // Buscar información de la cuenta en las filas del header
    this.$('tr').each((index, row) => {
      const cells = this.$(row).find('th, td')
      if (cells.length >= 2) {
        const label = this.$(cells[0]).text().trim()
        const value = this.$(cells[1]).text().trim()
        
        if (label.includes('Nombre:')) {
          account.name = value.replace(/[^\w\s-]/g, '').trim()
        }
        
        if (label.includes('Cuenta de trading:')) {
          // Extraer: 7722842 (USD, SLHMarkets-Live, demo, Hedge)
          const accountMatch = value.match(/(\d+)\s*\(([^,]+),\s*([^,]+),\s*([^,]+),?\s*([^)]*)\)/)
          if (accountMatch) {
            account.account_number = accountMatch[1]
            account.currency = accountMatch[2]
            account.broker = accountMatch[3]
            account.type = accountMatch[4]
            if (accountMatch[5]) {
              account.type += ' ' + accountMatch[5]
            }
          }
        }
        
        if (label.includes('Empresa:')) {
          account.company = value
        }
        
        if (label.includes('Fecha:')) {
          // Convertir 2025.09.03 18:49 a YYYY-MM-DD HH:MM:SS
          const dateMatch = value.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/)
          if (dateMatch) {
            account.report_date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}:00`
          }
        }
      }
    })

    return account
  }

  extractPositions() {
    const positions = []
    let inPositionsSection = false
    let headerFound = false

    console.log('Extracting positions from MT5 report...')

    this.$('tr').each((index, row) => {
      const rowText = this.$(row).text().trim()
      
      // Detectar inicio de sección Posiciones
      if (rowText === 'Posiciones') {
        inPositionsSection = true
        headerFound = false
        console.log('Found Posiciones section')
        return
      }
      
      // Detectar fin de sección
      if (inPositionsSection && (rowText.includes('Transacciones') || rowText.includes('Órdenes'))) {
        inPositionsSection = false
        console.log('End of Posiciones section')
        return
      }
      
      if (inPositionsSection) {
        const cells = this.$(row).find('td')
        
        // Buscar fila de encabezados
        if (!headerFound && this.$(row).find('td b, th b').length > 0) {
          headerFound = true
          console.log('Found positions header row')
          return
        }
        
        // Procesar filas de datos
        if (headerFound && cells.length >= 13) {
          const position = this.parsePositionRow(cells)
          if (position) {
            positions.push(position)
            console.log('Parsed position:', position.symbol, position.profit)
          }
        }
      }
    })

    console.log(`Extracted ${positions.length} positions`)
    return positions
  }

  parsePositionRow(cells) {
    try {
      const cellTexts = []
      cells.each((i, cell) => {
        cellTexts.push(this.$(cell).text().trim())
      })

      // Verificar que no sea fila vacía o de encabezado
      if (cellTexts.every(text => text === '') || 
          cellTexts.some(text => text.includes('Fecha/Hora'))) {
        return null
      }

      // Estructura esperada de MT5 Posiciones:
      // 0: Fecha/Hora apertura, 1: Posición, 2: Símbolo, 3: Tipo, 4: Volumen,
      // 5: Precio apertura, 6: S/L, 7: T/P, 8: Fecha/Hora cierre,
      // 9: Precio cierre, 10: Comisión, 11: Swap, 12: Beneficio

      return {
        open_time: this.normalizeDateTime(cellTexts[0]),
        ticket: cellTexts[1],
        symbol: cellTexts[2],
        type: cellTexts[3].toLowerCase(),
        volume: this.parseNumber(cellTexts[4]),
        open_price: this.parseNumber(cellTexts[5]),
        stop_loss: this.parseNumber(cellTexts[6]),
        take_profit: this.parseNumber(cellTexts[7]),
        close_time: this.normalizeDateTime(cellTexts[8]),
        close_price: this.parseNumber(cellTexts[9]),
        commission: this.parseNumber(cellTexts[10]),
        swap: this.parseNumber(cellTexts[11]),
        profit: this.parseNumber(cellTexts[12])
      }
    } catch (error) {
      console.error('Error parsing position row:', error)
      return null
    }
  }

  extractOrders() {
    // Implementar extracción de órdenes si existe la sección
    const orders = []
    // Por ahora retornar array vacío, se puede implementar después
    return orders
  }

  extractTransactions() {
    const transactions = []
    let inTransactionsSection = false
    let headerFound = false

    this.$('tr').each((index, row) => {
      const rowText = this.$(row).text().trim()
      
      if (rowText === 'Transacciones') {
        inTransactionsSection = true
        headerFound = false
        console.log('Found Transacciones section')
        return
      }
      
      if (inTransactionsSection && rowText.includes('Resultados')) {
        inTransactionsSection = false
        console.log('End of Transacciones section')
        return
      }
      
      if (inTransactionsSection) {
        const cells = this.$(row).find('td')
        
        if (!headerFound && this.$(row).find('td b, th b').length > 0) {
          headerFound = true
          return
        }
        
        if (headerFound && cells.length >= 13) {
          const transaction = this.parseTransactionRow(cells)
          if (transaction) {
            transactions.push(transaction)
          }
        }
      }
    })

    return transactions
  }

  parseTransactionRow(cells) {
    try {
      const cellTexts = []
      cells.each((i, cell) => {
        cellTexts.push(this.$(cell).text().trim())
      })

      if (cellTexts.every(text => text === '')) {
        return null
      }

      // Estructura de transacciones MT5
      return {
        time: this.normalizeDateTime(cellTexts[0]),
        transaction_id: cellTexts[1],
        symbol: cellTexts[2],
        type: cellTexts[3],
        direction: cellTexts[4],
        volume: this.parseNumber(cellTexts[5]),
        price: this.parseNumber(cellTexts[6]),
        order_id: cellTexts[7],
        commission: this.parseNumber(cellTexts[8]),
        fee: this.parseNumber(cellTexts[9]),
        swap: this.parseNumber(cellTexts[10]),
        profit: this.parseNumber(cellTexts[11]),
        balance: this.parseNumber(cellTexts[12]),
        comment: cellTexts[13] || ''
      }
    } catch (error) {
      console.error('Error parsing transaction row:', error)
      return null
    }
  }

  extractResults() {
    const results = {
      net_profit: 0,
      gross_profit: 0,
      gross_loss: 0,
      profit_factor: 0,
      expected_payoff: 0,
      recovery_factor: 0,
      sharpe_ratio: 0,
      absolute_drawdown: 0,
      maximal_drawdown: { value: 0, percent: 0 },
      relative_drawdown: { percent: 0, value: 0 },
      total_trades: 0,
      short_positions: { count: 0, percent_profitable: 0 },
      long_positions: { count: 0, percent_profitable: 0 },
      best_trade: 0,
      worst_trade: 0,
      average_profit_trade: 0,
      average_loss_trade: 0,
      max_consecutive_wins: { count: 0, profit: 0 },
      max_consecutive_losses: { count: 0, loss: 0 }
    }

    let inResultsSection = false

    this.$('tr').each((index, row) => {
      const rowText = this.$(row).text().trim()
      
      if (rowText === 'Resultados') {
        inResultsSection = true
        console.log('Found Resultados section')
        return
      }
      
      if (inResultsSection) {
        const cells = this.$(row).find('td')
        if (cells.length >= 2) {
          const cellTexts = []
          cells.each((i, cell) => {
            cellTexts.push(this.$(cell).text().trim())
          })
          
          // Mapear los valores según las etiquetas
          this.mapResultValue(cellTexts, results)
        }
      }
    })

    return results
  }

  mapResultValue(cellTexts, results) {
    const fullText = cellTexts.join(' ').toLowerCase()
    
    if (fullText.includes('beneficio neto')) {
      results.net_profit = this.parseNumber(cellTexts[1])
    }
    if (fullText.includes('beneficio bruto')) {
      results.gross_profit = this.parseNumber(cellTexts[1])
    }
    if (fullText.includes('pérdidas brutas')) {
      results.gross_loss = this.parseNumber(cellTexts[1])
    }
    if (fullText.includes('factor de beneficio')) {
      results.profit_factor = this.parseNumber(cellTexts[1])
    }
    if (fullText.includes('total de operaciones')) {
      results.total_trades = parseInt(cellTexts[1]) || 0
    }
    if (fullText.includes('posiciones largas')) {
      const match = cellTexts[1].match(/(\d+)\s*\(([^)]+)%\)/)
      if (match) {
        results.long_positions.count = parseInt(match[1]) || 0
        results.long_positions.percent_profitable = parseFloat(match[2]) || 0
      }
    }
  }

  normalizeDateTime(dateStr) {
    if (!dateStr) return ''
    
    // Convertir 2025.08.19 16:01:32 a formato compatible con JavaScript Date
    const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (match) {
      // Formato: DD/MM/YYYY HH:MM:SS (compatible con el formato español usado en el frontend)
      return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`
    }
    
    return dateStr
  }

  parseNumber(str) {
    if (!str || str === '') return 0
    
    // Remover espacios y convertir a número
    const cleaned = str.replace(/\s+/g, '').replace(/[^\d.-]/g, '')
    const number = parseFloat(cleaned)
    
    return isNaN(number) ? 0 : number
  }
}

export default MT5Parser