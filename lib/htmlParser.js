// Parser para reportes HTML de MetaTrader 4/5 y cTrader
import { load } from 'cheerio'
import UnifiedTradingParser from './unifiedTradingParser.js'

export class TradingReportParser {
  constructor(htmlContent) {
    this.htmlContent = htmlContent
    this.trades = []
    this.accountInfo = {}
    this.summary = {}
  }

  parse() {
    try {
      console.log('Using new unified trading parser...')
      
      // Usar el nuevo parser unificado
      const unifiedParser = new UnifiedTradingParser(this.htmlContent)
      const result = unifiedParser.parse()
      
      console.log('Unified parser result:', {
        trades: result.trades.length,
        reportType: unifiedParser.reportType
      })
      
      // Convertir resultado unificado al formato esperado por el frontend
      return this.convertUnifiedResult(result, unifiedParser.reportType)
      
    } catch (error) {
      console.error('Error in unified parser, falling back to original parser:', error)
      
      // Fallback al parser original si hay problemas
      const $ = load(this.htmlContent)
      const reportType = this.detectReportType($)
      
      if (reportType === 'MT5') {
        return this.parseMT5ReportNew()
      } else {
        return this.parseOriginalReport($)
      }
    }
  }

  convertUnifiedResult(unifiedResult, reportType) {
    // Convertir trades del formato unificado al formato esperado por el frontend
    const trades = unifiedResult.trades.map((trade, index) => ({
      symbol: trade.symbol || '',
      direction: this.capitalizeFirst(trade.type || 'buy'),
      close_time: trade.time || '',
      entry_price: parseFloat(trade.entry_price) || 0,
      close_price: parseFloat(trade.exit_price) || 0,
      lots: parseFloat(trade.volume) || 0,
      pnl: parseFloat(trade.profit) || 0,
      position_id: `trade-${index + 1}`,
      commission: 0,
      swap: 0,
      stop_loss: 0,
      take_profit: 0,
      id: `unified-${index + 1}`,
      account_id: 'unified-account',
      open_time: trade.time || ''
    }))

    // Extraer información básica de la cuenta
    const accountInfo = this.extractBasicAccountInfo()
    
    // Convertir resultados del formato unificado al formato esperado
    const summary = {
      netProfit: unifiedResult.results.net_profit || 0,
      grossProfit: unifiedResult.results.gross_profit || 0,
      grossLoss: unifiedResult.results.gross_loss || 0,
      profitFactor: unifiedResult.results.profit_factor || 0,
      totalTrades: unifiedResult.results.total_trades || trades.length,
      longPositions: unifiedResult.results.longs_won || 0,
      shortPositions: unifiedResult.results.shorts_won || 0,
      bestTrade: unifiedResult.results.best_trade || 0,
      worstTrade: unifiedResult.results.worst_trade || 0,
      
      // Métricas avanzadas del Enhanced TradingHistoryParser
      avgWin: unifiedResult.results.average_win || 0,
      avgLoss: unifiedResult.results.average_loss || 0,
      winningTrades: unifiedResult.results.winning_trades || 0,
      losingTrades: unifiedResult.results.losing_trades || 0,
      winRate: unifiedResult.results.win_rate || 0,
      expectancy: unifiedResult.results.expectancy || 0,
      maxDrawdown: unifiedResult.results.max_drawdown || 0,
      sharpeRatio: unifiedResult.results.sharpe_ratio || 0,
      recoveryFactor: unifiedResult.results.recovery_factor || 0,
      largestWin: unifiedResult.results.largest_win || 0,
      largestLoss: unifiedResult.results.largest_loss || 0,
      
      // Información de cuenta
      deposit: 15000, // Default, se puede mejorar extrayendo del HTML
      withdrawal: 0,
      initialBalance: 15000,
      balance: 15000 + (unifiedResult.results.net_profit || 0),
      realizedPnl: unifiedResult.results.net_profit || 0
    }

    console.log('Converted unified result:', {
      trades: trades.length,
      netProfit: summary.netProfit,
      totalTrades: summary.totalTrades
    })

    return {
      accountInfo,
      trades,
      withdraws: [], // Se puede mejorar para detectar withdraws del formato unificado
      summary,
      totalTrades: trades.length,
      unifiedData: unifiedResult // Mantener datos originales
    }
  }

  extractBasicAccountInfo() {
    const $ = load(this.htmlContent)
    const accountInfo = {
      accountNumber: 'unified-account',
      currency: 'USD',
      broker: 'Unknown',
      company: 'Unknown',
      reportDate: new Date().toISOString(),
      name: 'Unknown'
    }

    // Intentar extraer información básica
    $('tr, td, th').each((i, element) => {
      const text = $(element).text().trim()
      
      if (text.includes('Cuenta') && text.match(/\d{6,}/)) {
        const accountMatch = text.match(/(\d{6,})/)
        if (accountMatch) {
          accountInfo.accountNumber = accountMatch[1]
        }
      }
      
      if (text.includes('USD') || text.includes('EUR') || text.includes('GBP')) {
        const currencyMatch = text.match(/(USD|EUR|GBP)/i)
        if (currencyMatch) {
          accountInfo.currency = currencyMatch[1].toUpperCase()
        }
      }
    })

    return accountInfo
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
    const trades = mt5Result.positions.map(position => {
      // Asegurar que las fechas están en formato correcto
      let closeTime = position.close_time
      if (closeTime && !closeTime.includes('T')) {
        // Convertir YYYY-MM-DD HH:MM:SS a formato ISO si es necesario
        closeTime = closeTime.replace(' ', 'T') + '.000Z'
      }
      
      return {
        symbol: position.symbol || '',
        direction: position.type || 'buy', // 'buy' or 'sell'
        close_time: position.close_time || '', // Mantener formato original para que el frontend lo parsee
        entry_price: parseFloat(position.open_price) || 0,
        close_price: parseFloat(position.close_price) || 0,
        lots: parseFloat(position.volume) || 0,
        pnl: parseFloat(position.profit) || 0,
        position_id: position.ticket || '',
        commission: parseFloat(position.commission) || 0,
        swap: parseFloat(position.swap) || 0,
        stop_loss: parseFloat(position.stop_loss) || 0,
        take_profit: parseFloat(position.take_profit) || 0,
        // Campos adicionales que pueden ser necesarios
        id: position.ticket || '',
        account_id: mt5Result.account.account_number || '',
        open_time: position.open_time || ''
      }
    })
    
    console.log('Sample converted MT5 trade:', trades[0])
    
    
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

  // Función helper para capitalizar la primera letra
  capitalizeFirst(str) {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}

// Función helper para procesar archivos HTML cargados
export const parseHTMLReport = async (htmlContent) => {
  try {
    console.log('parseHTMLReport: Starting with Enhanced TradingHistoryParser approach')
    
    // Usar el UnifiedTradingParser probado pero con mejoras de TradingHistoryParser
    const { UnifiedTradingParser } = await import('./unifiedTradingParser.js')
    const unifiedParser = new UnifiedTradingParser(htmlContent)
    const unifiedResult = unifiedParser.parse()
    
    console.log('parseHTMLReport: Base parsing completed, trades found:', unifiedResult.trades.length)
    console.log('parseHTMLReport: Report type:', unifiedParser.reportType)
    
    // Aplicar mejoras del TradingHistoryParser: métricas avanzadas
    const enhancedResult = enhanceWithAdvancedMetrics(unifiedResult, unifiedParser.reportType)
    
    // Convertir al formato esperado por la aplicación
    const parser = new TradingReportParser(htmlContent)
    const convertedResult = parser.convertUnifiedResult(enhancedResult, unifiedParser.reportType)
    
    console.log('parseHTMLReport: Enhanced conversion completed, final trades count:', convertedResult.trades.length)
    
    return convertedResult
  } catch (error) {
    console.error('Error using Enhanced parser, falling back to old parser:', error)
    // Fallback al parser viejo en caso de error
    const parser = new TradingReportParser(htmlContent)
    return parser.parse()
  }
}

// Función para aplicar las mejoras de métricas avanzadas del TradingHistoryParser
function enhanceWithAdvancedMetrics(unifiedResult, reportType) {
  const trades = unifiedResult.trades || []
  
  if (trades.length === 0) return unifiedResult
  
  // Calcular métricas avanzadas como TradingHistoryParser
  const profits = []
  const losses = []
  
  trades.forEach(trade => {
    const profit = trade.profit || 0
    if (profit > 0) {
      profits.push(profit)
    } else if (profit < 0) {
      losses.push(Math.abs(profit))
    }
  })
  
  const totalProfit = profits.reduce((sum, p) => sum + p, 0)
  const totalLoss = losses.reduce((sum, l) => sum + l, 0)
  const netProfit = totalProfit - totalLoss
  const winRate = trades.length > 0 ? (profits.length / trades.length) * 100 : 0
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0
  
  const averageWin = profits.length > 0 ? totalProfit / profits.length : 0
  const averageLoss = losses.length > 0 ? totalLoss / losses.length : 0
  const largestWin = profits.length > 0 ? Math.max(...profits) : 0
  const largestLoss = losses.length > 0 ? Math.max(...losses) : 0
  
  // Calcular expectativa matemática
  const winProb = winRate / 100
  const lossProb = 1 - winProb
  const expectancy = (winProb * averageWin) - (lossProb * averageLoss)
  
  // Calcular drawdown simplificado
  let runningBalance = 15000 // Balance inicial por defecto
  let peak = runningBalance
  let maxDrawdown = 0
  
  trades.forEach(trade => {
    runningBalance += (trade.profit || 0)
    if (runningBalance > peak) {
      peak = runningBalance
    } else {
      const drawdown = ((peak - runningBalance) / peak) * 100
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
  })
  
  const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : 0
  
  // Ratio de Sharpe simplificado
  let sharpeRatio = 0
  if (trades.length > 1) {
    const returns = trades.map(t => t.profit || 0)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)
    const stdDev = Math.sqrt(variance)
    sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0
  }
  
  // Agregar métricas avanzadas a results
  const enhancedResults = {
    ...unifiedResult.results,
    // Métricas básicas mejoradas
    total_trades: trades.length,
    winning_trades: profits.length,
    losing_trades: losses.length,
    win_rate: winRate,
    gross_profit: totalProfit,
    gross_loss: totalLoss,
    net_profit: netProfit,
    profit_factor: profitFactor,
    
    // Métricas avanzadas del TradingHistoryParser
    average_win: averageWin,
    average_loss: averageLoss,
    largest_win: largestWin,
    largest_loss: largestLoss,
    expectancy: expectancy,
    max_drawdown: maxDrawdown,
    recovery_factor: recoveryFactor,
    sharpe_ratio: sharpeRatio,
    
    // Información adicional
    best_trade: largestWin,
    worst_trade: -largestLoss,
    longs_won: trades.filter(t => (t.type === 'buy' || t.type === 'Buy') && t.profit > 0).length,
    shorts_won: trades.filter(t => (t.type === 'sell' || t.type === 'Sell') && t.profit > 0).length
  }
  
  console.log('Enhanced metrics calculated:', {
    totalTrades: enhancedResults.total_trades,
    winRate: enhancedResults.win_rate.toFixed(1) + '%',
    netProfit: enhancedResults.net_profit.toFixed(2),
    profitFactor: enhancedResults.profit_factor.toFixed(2),
    expectancy: enhancedResults.expectancy.toFixed(2),
    maxDrawdown: enhancedResults.max_drawdown.toFixed(2) + '%',
    sharpeRatio: enhancedResults.sharpe_ratio.toFixed(3)
  })
  
  return {
    ...unifiedResult,
    results: enhancedResults
  }
}