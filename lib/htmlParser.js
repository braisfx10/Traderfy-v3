// Parser para reportes HTML de MetaTrader 4/5 y cTrader
import { load } from 'cheerio'

export class TradingReportParser {
  constructor(htmlContent) {
    this.htmlContent = htmlContent
    this.trades = []
    this.accountInfo = {}
    this.summary = {}
  }

  parse() {
    try {
      // Usar cheerio para parsear HTML en Node.js
      const $ = load(this.htmlContent)
      
      // Extraer información de la cuenta
      this.extractAccountInfo($)
      
      // Extraer operaciones del historial
      this.extractTrades($)
      
      // Extraer resumen
      this.extractSummary($)
      
      return {
        accountInfo: this.accountInfo,
        trades: this.trades,
        summary: this.summary,
        totalTrades: this.trades.length
      }
    } catch (error) {
      console.error('Error parsing HTML report:', error)
      throw new Error('Failed to parse trading report')
    }
  }

  extractAccountInfo($) {
    // Buscar información de cuenta en el header
    const accountText = $.text()
    
    // Extraer número de cuenta
    const accountMatch = accountText.match(/Cuenta\s*:\s*(\d+)/)
    if (accountMatch) {
      this.accountInfo.accountNumber = accountMatch[1]
    }
    
    // Extraer divisa
    const currencyMatch = accountText.match(/Divisa\s*:\s*([A-Z]{3})/)
    if (currencyMatch) {
      this.accountInfo.currency = currencyMatch[1]
    }
    
    // Extraer fecha
    const dateMatch = accountText.match(/(\d{2}\/\d{2}\/\d{4})/)
    if (dateMatch) {
      this.accountInfo.reportDate = dateMatch[1]
    }
  }

  extractTrades($) {
    // Buscar todas las filas de la tabla que contengan datos de trades
    const rows = $('table tr')
    
    rows.each((index, row) => {
      const cells = $(row).find('td')
      if (cells.length >= 8) { // Necesitamos al menos 8 columnas para trades completos
        const trade = this.parseTradeRow(cells, $)
        if (trade) {
          this.trades.push(trade)
        }
      }
    })
    
    console.log(`Extracted ${this.trades.length} trades from HTML`)
  }

  parseTradeRow(cells, $) {
    try {
      const cellTexts = []
      cells.each((index, cell) => {
        cellTexts.push($(cell).text().trim())
      })
      
      // Verificar que no sea una fila de encabezado
      if (cellTexts.some(text => text.includes('Símbolo') || text.includes('Dirección') || text.includes('Totales'))) {
        return null
      }
      
      // Extraer datos según la estructura específica de MetaTrader
      let symbol = ''
      let direction = ''
      let closeTime = ''
      let entryPrice = 0
      let closePrice = 0
      let lots = 0
      let pnl = 0
      let balance = 0
      
      // Iterar por las celdas en orden esperado
      for (let i = 0; i < cellTexts.length; i++) {
        const text = cellTexts[i]
        
        // Columna 1: Símbolo (EURUSD, XAUUSD, etc.)
        if (i === 1 && (/^[A-Z]{6}$/.test(text) || /^XAU/.test(text) || /^GBP/.test(text) || /^USD/.test(text))) {
          symbol = text
        }
        
        // Columna 2: Dirección de apertura (Buy/Sell)
        if (i === 2 && (text === 'Buy' || text === 'Sell')) {
          direction = text
        }
        
        // Columna 3: Hora de cierre (DD/MM/YYYY HH:MM:SS)
        if (i === 3 && /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/.test(text)) {
          closeTime = text
        }
        
        // Columna 4: Precio de entrada
        if (i === 4 && /^\d+\.\d+$/.test(text)) {
          entryPrice = parseFloat(text)
        }
        
        // Columna 5: Precio de cierre
        if (i === 5 && /^\d+\.\d+$/.test(text)) {
          closePrice = parseFloat(text)
        }
        
        // Columna 6: Cantidad de Cierre (X.XX Lotes)
        if (i === 6 && text.includes('Lotes')) {
          const lotMatch = text.match(/([\d.]+)\s+Lotes/)
          if (lotMatch) {
            lots = parseFloat(lotMatch[1])
          }
        }
        
        // Columna 7: USD neto (P&L - puede ser negativo)
        if (i === 7) {
          // Remover espacios y caracteres especiales, preservar el signo negativo
          const cleanText = text.replace(/\s/g, '').replace(/[^\d.-]/g, '')
          if (/^-?\d+\.?\d*$/.test(cleanText)) {
            pnl = parseFloat(cleanText)
          }
        }
        
        // Columna 8: Saldo USD
        if (i === 8) {
          const cleanText = text.replace(/\s/g, '').replace(/[^\d.-]/g, '')
          if (/^\d+\.?\d*$/.test(cleanText)) {
            balance = parseFloat(cleanText)
          }
        }
      }
      
      // Validar que tenemos los datos mínimos necesarios
      if (symbol && direction && closeTime && !isNaN(pnl)) {
        console.log(`Parsed trade: ${symbol} ${direction} P&L: ${pnl}`)
        return {
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          direction,
          close_time: this.parseDateTime(closeTime),
          entry_price: entryPrice || 0,
          close_price: closePrice || 0,
          lots: lots || 0,
          pnl: pnl,
          balance: balance || 0,
          account_id: null,
          user_id: null,
          created_at: new Date().toISOString()
        }
      }
      
      return null
    } catch (error) {
      console.error('Error parsing trade row:', error)
      return null
    }
  }

  parseDateTime(timeString) {
    try {
      // Convertir DD/MM/YYYY HH:MM:SS.mmm a formato ISO
      const match = timeString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        const [, day, month, year, hour, minute, second] = match
        const date = new Date(year, month - 1, day, hour, minute, second)
        return date.toISOString()
      }
      return new Date().toISOString()
    } catch (error) {
      return new Date().toISOString()
    }
  }

  extractSummary($) {
    const text = $.text()
    console.log('Extracting summary from HTML...')
    
    // Extraer valores específicos del resumen final
    this.summary = {}
    
    // Depósito
    const depositMatch = text.match(/Depósito[:\s]*([0-9\s.,]+)/i)
    if (depositMatch) {
      this.summary.deposit = parseFloat(depositMatch[1].replace(/[\s,]/g, ''))
      console.log('Deposit found:', this.summary.deposit)
    }
    
    // Capital
    const capitalMatch = text.match(/Capital[:\s]*([0-9\s.,]+)/i)
    if (capitalMatch) {
      this.summary.capital = parseFloat(capitalMatch[1].replace(/[\s,]/g, ''))
      console.log('Capital found:', this.summary.capital)
    }
    
    // Saldo
    const balanceMatch = text.match(/Saldo[:\s]*([0-9\s.,]+)/i)
    if (balanceMatch) {
      this.summary.balance = parseFloat(balanceMatch[1].replace(/[\s,]/g, ''))
      console.log('Balance found:', this.summary.balance)
    }
    
    // Retirada (Withdrawal)
    const withdrawalMatch = text.match(/Retirada[:\s]*([0-9\s.,]+)/i)
    if (withdrawalMatch) {
      this.summary.withdrawal = parseFloat(withdrawalMatch[1].replace(/[\s,]/g, ''))
      console.log('Withdrawal found:', this.summary.withdrawal)
    }
    
    // Total neto
    const netTotalMatch = text.match(/Total neto[:\s]*([0-9\s.,]+)/i)
    if (netTotalMatch) {
      this.summary.netTotal = parseFloat(netTotalMatch[1].replace(/[\s,]/g, ''))
      console.log('Net Total found:', this.summary.netTotal)
    }
    
    // P&L devengadas (ESTE ES EL VALOR CRÍTICO)
    const realizedPnlMatch = text.match(/P&L devengadas[:\s]*([0-9\s.,]+)/i)
    if (realizedPnlMatch) {
      this.summary.realizedPnl = parseFloat(realizedPnlMatch[1].replace(/[\s,]/g, ''))
      console.log('CRITICAL: Realized P&L found:', this.summary.realizedPnl)
      // Este debe ser 1999.35 según el usuario
    }
    
    // P&L no devengadas
    const unrealizedPnlMatch = text.match(/P&L no deven\.[:\s]*([0-9\s.,]+)/i)
    if (unrealizedPnlMatch) {
      this.summary.unrealizedPnl = parseFloat(unrealizedPnlMatch[1].replace(/[\s,]/g, ''))
      console.log('Unrealized P&L found:', this.summary.unrealizedPnl)
    }
    
    // Margen libre
    const freeMarginMatch = text.match(/Margen libre[:\s]*([0-9\s.,]+)/i)
    if (freeMarginMatch) {
      this.summary.freeMargin = parseFloat(freeMarginMatch[1].replace(/[\s,]/g, ''))
      console.log('Free Margin found:', this.summary.freeMargin)
    }

    // Calcular estadísticas básicas basadas en trades reales
    if (this.trades.length > 0) {
      const winningTrades = this.trades.filter(t => t.pnl > 0)
      const losingTrades = this.trades.filter(t => t.pnl < 0)
      
      // Usar el P&L devengadas real en lugar de sumar trades individuales
      this.summary.totalPnl = this.summary.realizedPnl || this.trades.reduce((sum, t) => sum + t.pnl, 0)
      
      this.summary.totalTrades = this.trades.length
      this.summary.winningTrades = winningTrades.length
      this.summary.losingTrades = losingTrades.length
      this.summary.winRate = ((winningTrades.length / this.trades.length) * 100).toFixed(2)
      
      if (winningTrades.length > 0) {
        this.summary.avgWin = (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length).toFixed(2)
      }
      
      if (losingTrades.length > 0) {
        this.summary.avgLoss = (losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length).toFixed(2)
      }
      
      // Profit Factor
      const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
      const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
      this.summary.profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : 'Infinito'
      
      console.log('Summary calculated:', this.summary)
    }
  }
}

// Función helper para procesar archivos HTML cargados
export const parseHTMLReport = (htmlContent) => {
  const parser = new TradingReportParser(htmlContent)
  return parser.parse()
}