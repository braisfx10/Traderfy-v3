// Parser para reportes HTML de MetaTrader 4/5 y cTrader
export class TradingReportParser {
  constructor(htmlContent) {
    this.htmlContent = htmlContent
    this.trades = []
    this.accountInfo = {}
    this.summary = {}
  }

  parse() {
    try {
      // Crear un parser DOM simulado para el navegador
      const parser = new DOMParser()
      const doc = parser.parseFromString(this.htmlContent, 'text/html')
      
      // Extraer información de la cuenta
      this.extractAccountInfo(doc)
      
      // Extraer operaciones del historial
      this.extractTrades(doc)
      
      // Extraer resumen
      this.extractSummary(doc)
      
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

  extractAccountInfo(doc) {
    // Buscar información de cuenta en el header
    const accountSection = doc.querySelector('table') || doc
    const accountText = accountSection.textContent || ''
    
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

  extractTrades(doc) {
    // Buscar la tabla de historial
    const tables = doc.querySelectorAll('table')
    let historialTable = null
    
    for (const table of tables) {
      const tableText = table.textContent || ''
      if (tableText.includes('Historial') || tableText.includes('Símbolo')) {
        historialTable = table
        break
      }
    }
    
    if (!historialTable) {
      console.warn('No se encontró tabla de historial')
      return
    }
    
    // Extraer filas de la tabla
    const rows = historialTable.querySelectorAll('tr')
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 7) {
        const trade = this.parseTradeRow(cells)
        if (trade) {
          this.trades.push(trade)
        }
      }
    }
  }

  parseTradeRow(cells) {
    try {
      const cellTexts = Array.from(cells).map(cell => cell.textContent.trim())
      
      // Buscar el símbolo, dirección, etc. en las celdas
      let symbol = ''
      let direction = ''
      let closeTime = ''
      let entryPrice = 0
      let closePrice = 0
      let lots = 0
      let pnl = 0
      
      for (let i = 0; i < cellTexts.length; i++) {
        const text = cellTexts[i]
        
        // Símbolo (EURUSD, XAUUSD, etc.)
        if (/^[A-Z]{6}$/.test(text) || /^XAU/.test(text) || /^GBP/.test(text)) {
          symbol = text
        }
        
        // Dirección (Buy/Sell)
        if (text === 'Buy' || text === 'Sell') {
          direction = text
        }
        
        // Fecha y hora (DD/MM/YYYY HH:MM:SS)
        if (/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/.test(text)) {
          closeTime = text
        }
        
        // Precios (números decimales)
        if (/^\d+\.\d+$/.test(text)) {
          const price = parseFloat(text)
          if (price > 1 && entryPrice === 0) {
            entryPrice = price
          } else if (price > 1 && closePrice === 0) {
            closePrice = price
          }
        }
        
        // Lotes (X.XX Lotes)
        if (text.includes('Lotes')) {
          const lotMatch = text.match(/([\d.]+)\s+Lotes/)
          if (lotMatch) {
            lots = parseFloat(lotMatch[1])
          }
        }
        
        // P&L (puede ser negativo)
        if (/^-?\d+\.\d+$/.test(text) || /^-?\d+$/.test(text)) {
          const value = parseFloat(text)
          if (Math.abs(value) > 0 && Math.abs(value) < 10000) {
            pnl = value
          }
        }
      }
      
      // Validar que tenemos datos mínimos
      if (symbol && direction && closeTime && pnl !== 0) {
        return {
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          direction,
          close_time: this.parseDateTime(closeTime),
          entry_price: entryPrice,
          close_price: closePrice,
          lots,
          pnl,
          account_id: null, // Se asignará en el componente
          user_id: null, // Se asignará en el componente
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

  extractSummary(doc) {
    const text = doc.textContent || ''
    
    // Extraer total P&L
    const totalMatch = text.match(/Totales.*?(-?\d+\.\d+)/)
    if (totalMatch) {
      this.summary.totalPnl = parseFloat(totalMatch[1])
    }
    
    // Extraer balance final
    const balanceMatch = text.match(/Saldo.*?(\d+\.\d+)/)
    if (balanceMatch) {
      this.summary.finalBalance = parseFloat(balanceMatch[1])
    }
    
    // Calcular estadísticas básicas
    if (this.trades.length > 0) {
      const winningTrades = this.trades.filter(t => t.pnl > 0)
      const losingTrades = this.trades.filter(t => t.pnl < 0)
      
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
    }
  }
}

// Función helper para procesar archivos HTML cargados
export const parseHTMLReport = (htmlContent) => {
  const parser = new TradingReportParser(htmlContent)
  return parser.parse()
}