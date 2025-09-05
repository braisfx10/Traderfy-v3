// Parser para reportes HTML de MetaTrader 4/5 y cTrader
import { load } from 'cheerio'
import MT5Parser from './mt5Parser.js'

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
      
      // Detectar tipo de reporte
      const reportType = this.detectReportType($)
      console.log('Detected report type:', reportType)
      
      if (reportType === 'MT5') {
        return this.parseMT5ReportNew()
      } else {
        // Parser original para cTrader y MT4
        return this.parseOriginalReport($)
      }
    } catch (error) {
      console.error('Error parsing HTML report:', error)
      throw new Error('Failed to parse trading report')
    }
  }

  detectReportType($) {
    const text = $.text()
    
    // Detectar MetaTrader 5 por su estructura específica
    if (text.includes('Informe del historial de trading') && 
        text.includes('Posiciones') && 
        text.includes('Transacciones') &&
        text.includes('Beneficio Neto')) {
      return 'MT5'
    }
    
    return 'CTRADER_MT4'
  }

  parseMT5ReportNew() {
    console.log('Using new MT5 parser...')
    
    const mt5Parser = new MT5Parser(this.htmlContent)
    const mt5Result = mt5Parser.parse()
    
    // Convertir resultado MT5 al formato esperado por el frontend
    const trades = mt5Result.positions.map(position => ({
      symbol: position.symbol,
      direction: position.type,
      close_time: position.close_time,
      entry_price: position.open_price,
      close_price: position.close_price,
      lots: position.volume,
      pnl: position.profit,
      position_id: position.ticket,
      commission: position.commission,
      swap: position.swap,
      stop_loss: position.stop_loss,
      take_profit: position.take_profit
    }))
    
    // Extraer información de la cuenta
    const accountInfo = {
      accountNumber: mt5Result.account.account_number,
      currency: mt5Result.account.currency,
      broker: mt5Result.account.broker,
      company: mt5Result.account.company,
      reportDate: mt5Result.account.report_date,
      name: mt5Result.account.name
    }
    
    // Convertir withdraws si existen en transacciones
    const withdraws = mt5Result.transactions
      .filter(tx => tx.type && tx.type.toLowerCase().includes('withdraw'))
      .map(tx => ({
        id: tx.transaction_id,
        date: tx.time,
        type: tx.type,
        amount: Math.abs(tx.profit || 0),
        rawAmount: tx.profit || 0,
        close_time: tx.time
      }))
    
    // Crear resumen
    const summary = {
      netProfit: mt5Result.results.net_profit,
      grossProfit: mt5Result.results.gross_profit,
      grossLoss: mt5Result.results.gross_loss,
      profitFactor: mt5Result.results.profit_factor,
      totalTrades: mt5Result.results.total_trades,
      longPositions: mt5Result.results.long_positions.count,
      longWinRate: mt5Result.results.long_positions.percent_profitable,
      deposit: this.extractInitialBalanceFromTransactions(mt5Result.transactions),
      initialBalance: this.extractInitialBalanceFromTransactions(mt5Result.transactions)
    }
    
    console.log('MT5 conversion completed:', {
      trades: trades.length,
      withdraws: withdraws.length,
      accountInfo
    })
    
    return {
      accountInfo,
      trades,
      withdraws,
      summary,
      totalTrades: trades.length,
      mt5Data: mt5Result // Mantener datos originales por si se necesitan
    }
  }

  extractInitialBalanceFromTransactions(transactions) {
    // Buscar depósito inicial en transacciones
    const initialDeposit = transactions.find(tx => 
      tx.type && (
        tx.type.toLowerCase().includes('balance') ||
        tx.type.toLowerCase().includes('deposit') ||
        tx.comment.toLowerCase().includes('initial')
      )
    )
    
    return initialDeposit ? initialDeposit.balance : 25000 // Default
  }

  extractMT5AccountInfo($) {
    // Extraer información del header
    $('tr').each((index, row) => {
      const cells = $(row).find('th, td')
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim()
        const value = $(cells[1]).text().trim()
        
        if (label.includes('Nombre:')) {
          this.accountInfo.name = value.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
        }
        
        if (label.includes('Cuenta de trading:')) {
          // Extraer número de cuenta y detalles
          const accountMatch = value.match(/(\d+)\s*\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/)
          if (accountMatch) {
            this.accountInfo.accountNumber = accountMatch[1]
            this.accountInfo.currency = accountMatch[2]
            this.accountInfo.broker = accountMatch[3]
            this.accountInfo.accountType = accountMatch[4]
            this.accountInfo.marginType = accountMatch[5]
          }
        }
        
        if (label.includes('Empresa:')) {
          this.accountInfo.company = value
        }
        
        if (label.includes('Fecha:')) {
          // Convertir formato YYYY.MM.DD a DD/MM/YYYY
          const dateMatch = value.match(/(\d{4})\.(\d{2})\.(\d{2})/)
          if (dateMatch) {
            this.accountInfo.reportDate = `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`
          }
        }
      }
    })
  }

  extractMT5Positions($) {
    let foundPositionsSection = false
    console.log('Starting MT5 positions extraction...')
    
    $('tr').each((index, row) => {
      const rowText = $(row).text().trim()
      
      // Detectar inicio de la sección "Posiciones"
      if (rowText === 'Posiciones') {
        foundPositionsSection = true
        console.log('Found Posiciones section')
        return
      }
      
      // Detectar fin de la sección (cuando llega a "Órdenes" o "Transacciones")
      if (foundPositionsSection && (rowText === 'Órdenes' || rowText === 'Transacciones')) {
        foundPositionsSection = false
        console.log(`Ending Posiciones section at: ${rowText}`)
        return
      }
      
      // Procesar filas de posiciones
      if (foundPositionsSection) {
        const cells = $(row).find('td')
        console.log(`Processing row with ${cells.length} cells in Posiciones section`)
        if (cells.length >= 13) { // MT5 positions have many columns
          const trade = this.parseMT5PositionRow(cells, $)
          if (trade) {
            console.log('Successfully parsed MT5 trade:', trade.symbol, trade.pnl)
            this.trades.push(trade)
          }
        }
      }
    })
    
    console.log(`Extracted ${this.trades.length} positions from MT5 report`)
  }

  parseMT5PositionRow(cells, $) {
    try {
      const cellTexts = []
      cells.each((index, cell) => {
        cellTexts.push($(cell).text().trim())
      })
      
      // Verificar que no sea una fila de encabezado
      if (cellTexts.some(text => 
        text.includes('Fecha/Hora') || 
        text.includes('Posición') || 
        text.includes('Símbolo') ||
        text === '')) {
        return null
      }
      
      // Estructura de MT5 Posiciones:
      // 0: Fecha/Hora apertura, 1: Posición, 2: Símbolo, 3: Tipo, 4: Volumen, 
      // 5: Precio apertura, 6: S/L, 7: T/P, 8: Fecha/Hora cierre, 
      // 9: Precio cierre, 10: Comisión, 11: Swap, 12: Beneficio
      
      const openTime = cellTexts[0]
      const positionId = cellTexts[1]
      const symbol = cellTexts[2]
      const type = cellTexts[3]
      const volume = cellTexts[4]
      const openPrice = cellTexts[5]
      const sl = cellTexts[6]
      const tp = cellTexts[7]
      const closeTime = cellTexts[8]
      const closePrice = cellTexts[9]
      const commission = cellTexts[10]
      const swap = cellTexts[11]
      const profit = cellTexts[12]
      
      // Validar datos mínimos requeridos
      if (!symbol || !type || !closeTime || !profit) {
        return null
      }
      
      // Convertir formato de fecha de MT5 (YYYY.MM.DD HH:MM:SS) a formato esperado
      const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
        if (match) {
          return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`
        }
        return dateStr
      }
      
      return {
        symbol: symbol,
        direction: type.toLowerCase(), // 'buy' or 'sell'
        close_time: formatDate(closeTime),
        entry_price: parseFloat(openPrice) || 0,
        close_price: parseFloat(closePrice) || 0,
        lots: parseFloat(volume) || 0,
        pnl: parseFloat(profit.replace(/[^\d.-]/g, '')) || 0,
        position_id: positionId,
        commission: parseFloat(commission) || 0,
        swap: parseFloat(swap) || 0,
        stop_loss: parseFloat(sl) || 0,
        take_profit: parseFloat(tp) || 0
      }
    } catch (error) {
      console.error('Error parsing MT5 position row:', error)
      return null
    }
  }

  extractMT5Summary($) {
    const summaryData = {}
    let foundResultsSection = false
    
    $('tr').each((index, row) => {
      const rowText = $(row).text().trim()
      
      // Detectar sección "Resultados"
      if (rowText === 'Resultados') {
        foundResultsSection = true
        return
      }
      
      if (foundResultsSection) {
        const cells = $(row).find('td')
        if (cells.length >= 4) {
          const cellTexts = []
          cells.each((i, cell) => {
            cellTexts.push($(cell).text().trim())
          })
          
          // Extraer métricas específicas
          if (cellTexts[0]?.includes('Beneficio Neto:')) {
            summaryData.netProfit = parseFloat(cellTexts[1]?.replace(/[^\d.-]/g, '')) || 0
          }
          if (cellTexts[2]?.includes('Beneficio Bruto:')) {
            summaryData.grossProfit = parseFloat(cellTexts[3]?.replace(/[^\d.-]/g, '')) || 0
          }
          if (cellTexts[4]?.includes('Pérdidas Brutas:')) {
            summaryData.grossLoss = parseFloat(cellTexts[5]?.replace(/[^\d.-]/g, '')) || 0
          }
          if (cellTexts[0]?.includes('Factor de Beneficio:')) {
            summaryData.profitFactor = parseFloat(cellTexts[1]?.replace(/[^\d.-]/g, '')) || 0
          }
          if (cellTexts[0]?.includes('Total de operaciones ejecutadas:')) {
            summaryData.totalTrades = parseInt(cellTexts[1]) || 0
          }
          if (cellTexts[2]?.includes('Posiciones largas (% rentables):')) {
            const longMatch = cellTexts[3]?.match(/(\d+)\s*\(([^)]+)%\)/)
            if (longMatch) {
              summaryData.longPositions = parseInt(longMatch[1]) || 0
              summaryData.longWinRate = parseFloat(longMatch[2]) || 0
            }
          }
        }
      }
    })
    
    // Extraer balance inicial de la sección de transacciones
    this.extractMT5InitialBalance($, summaryData)
    
    this.summary = summaryData
    console.log('MT5 Summary extracted:', summaryData)
  }

  extractMT5InitialBalance($, summaryData) {
    let foundTransactionsSection = false
    
    $('tr').each((index, row) => {
      const rowText = $(row).text().trim()
      
      if (rowText === 'Transacciones') {
        foundTransactionsSection = true
        return
      }
      
      if (foundTransactionsSection) {
        const cells = $(row).find('td')
        if (cells.length >= 13) {
          const cellTexts = []
          cells.each((i, cell) => {
            cellTexts.push($(cell).text().trim())
          })
          
          // Buscar "Initial Deposit" o "balance"
          if (cellTexts.some(text => text.includes('Initial Deposit') || text.includes('balance'))) {
            // El balance está en la penúltima columna
            const balanceText = cellTexts[cellTexts.length - 2]
            const balance = parseFloat(balanceText?.replace(/[^\d.-]/g, '')) || 0
            if (balance > 0) {
              summaryData.deposit = balance
              summaryData.initialBalance = balance
              return false // Salir del each
            }
          }
        }
      }
    })
  }

  // Método original para cTrader/MT4
  parseOriginalReport($) {
    // Extraer información de la cuenta
    this.extractAccountInfo($)
    
    // Extraer operaciones del historial
    this.extractTrades($)
    
    // Extraer withdraws de la sección de transacciones
    this.extractWithdraws($)
    
    // Extraer resumen
    this.extractSummary($)
    
    return {
      accountInfo: this.accountInfo,
      trades: this.trades,
      withdraws: this.withdraws || [],
      summary: this.summary,
      totalTrades: this.trades.length
    }
  }

  extractWithdraws($) {
    this.withdraws = []
    let foundTransactionsSection = false
    
    console.log('Looking for withdraws in Transacciones section...')
    
    $('table').each((tableIndex, table) => {
      $(table).find('tr').each((rowIndex, row) => {
        const rowText = $(row).text().trim()
        
        // Detectar sección de Transacciones
        if (rowText.includes('Transacciones')) {
          foundTransactionsSection = true
          console.log('Found Transacciones section')
          return
        }
        
        // Si estamos en la sección de transacciones, buscar withdraws
        if (foundTransactionsSection) {
          const cells = $(row).find('td')
          if (cells.length >= 4) {
            const cellTexts = []
            cells.each((i, cell) => {
              cellTexts.push($(cell).text().trim())
            })
            
            // Buscar fila con "Withdraw" en la columna "Tipo"
            const tipoIndex = cellTexts.findIndex(text => text === 'Withdraw')
            
            if (tipoIndex !== -1) {
              const id = cellTexts[1] || ''
              const fecha = cellTexts[2] || ''
              const tipo = cellTexts[3] || ''
              const cantidad = cellTexts[4] || ''
              
              console.log('Found withdraw:', { id, fecha, tipo, cantidad })
              
              if (tipo === 'Withdraw' && cantidad) {
                const withdrawAmount = parseFloat(cantidad.replace(/[^\d.-]/g, '')) || 0
                
                this.withdraws.push({
                  id: id,
                  date: fecha,
                  type: tipo,
                  amount: Math.abs(withdrawAmount), // Siempre positivo para withdraw
                  rawAmount: withdrawAmount, // Mantener el valor original negativo
                  close_time: fecha // Para compatibilidad con el formato de trades
                })
                
                console.log('Added withdraw:', withdrawAmount)
              }
            }
          }
          
          // Si llegamos a otra sección, salir
          if (rowText.includes('Resumen') || rowText.includes('Summary')) {
            foundTransactionsSection = false
          }
        }
      })
    })
    
    console.log(`Total withdraws found: ${this.withdraws.length}`)
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