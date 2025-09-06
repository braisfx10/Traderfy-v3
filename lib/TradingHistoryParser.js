class TradingHistoryParser {
  constructor() {
    this.platforms = {
      MT5: 'MetaTrader5',
      CTRADER: 'cTrader'
    };
  }

  /**
   * Main parsing function that detects platform and extracts data
   * @param {string} htmlContent - Raw HTML content from uploaded file
   * @returns {Object} Parsed trading data with standardized format
   */
  parseHTML(htmlContent) {
    try {
      // Use JSDOM for Node.js environment or DOMParser for browser
      let doc;
      if (typeof window !== 'undefined' && window.DOMParser) {
        // Browser environment
        const parser = new DOMParser();
        doc = parser.parseFromString(htmlContent, 'text/html');
      } else {
        // Node.js environment
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(htmlContent);
        doc = dom.window.document;
      }
      
      // Detect platform
      const platform = this.detectPlatform(doc, htmlContent);
      
      if (platform === this.platforms.MT5) {
        return this.parseMT5(doc);
      } else if (platform === this.platforms.CTRADER) {
        return this.parseCTrader(doc);
      } else {
        throw new Error('Plataforma no reconocida. Solo se soportan MetaTrader 5 y cTrader.');
      }
    } catch (error) {
      throw new Error(`Error al parsear el archivo: ${error.message}`);
    }
  }

  /**
   * Detect trading platform based on HTML structure and content
   */
  detectPlatform(doc, htmlContent) {
    // Check for MT5 indicators
    if (htmlContent.includes('Informe del historial de trading') || 
        htmlContent.includes('SLH Markets') ||
        doc.querySelector('table') && doc.querySelector('table').innerHTML.includes('Posiciones')) {
      return this.platforms.MT5;
    }
    
    // Check for cTrader indicators
    if (htmlContent.includes('PropFirmsTech') || 
        htmlContent.includes('Extracto de Cuenta') ||
        htmlContent.includes('Historial') ||
        doc.querySelector('.dataTable')) {
      return this.platforms.CTRADER;
    }
    
    return null;
  }

  /**
   * Parse MetaTrader 5 HTML format
   */
  parseMT5(doc) {
    const data = {
      platform: this.platforms.MT5,
      accountInfo: this.extractMT5AccountInfo(doc),
      positions: this.extractMT5Positions(doc),
      orders: this.extractMT5Orders(doc),
      transactions: this.extractMT5Transactions(doc),
      summary: this.extractMT5Summary(doc)
    };

    // Calculate metrics
    data.metrics = this.calculateMetrics(data);
    
    return data;
  }

  /**
   * Parse cTrader HTML format
   */
  parseCTrader(doc) {
    const data = {
      platform: this.platforms.CTRADER,
      accountInfo: this.extractCTraderAccountInfo(doc),
      positions: [], // cTrader shows no current positions in this format
      orders: [], // cTrader shows no pending orders in this format
      history: this.extractCTraderHistory(doc),
      transactions: this.extractCTraderTransactions(doc),
      summary: this.extractCTraderSummary(doc)
    };

    // Calculate metrics
    data.metrics = this.calculateMetrics(data);
    
    return data;
  }

  // MT5 Extraction Methods
  extractMT5AccountInfo(doc) {
    const accountInfo = {};
    
    try {
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim().replace(':', '');
          const value = cells[1].textContent.trim();
          
          if (key.includes('Nombre')) accountInfo.name = value;
          if (key.includes('Cuenta de trading')) accountInfo.account = value;
          if (key.includes('Empresa')) accountInfo.company = value;
          if (key.includes('Fecha')) accountInfo.date = value;
        }
      });
    } catch (error) {
      console.warn('Error extracting MT5 account info:', error);
    }
    
    return accountInfo;
  }

  extractMT5Positions(doc) {
    const positions = [];
    
    try {
      const positionRows = this.getTableRows(doc, 'Posiciones');
      
      positionRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 13) {
          positions.push({
            openTime: cells[0]?.textContent?.trim(),
            ticket: cells[1]?.textContent?.trim(),
            symbol: cells[2]?.textContent?.trim(),
            type: cells[3]?.textContent?.trim(),
            volume: parseFloat(cells[4]?.textContent?.trim()) || 0,
            openPrice: parseFloat(cells[5]?.textContent?.trim()) || 0,
            sl: parseFloat(cells[6]?.textContent?.trim()) || 0,
            tp: parseFloat(cells[7]?.textContent?.trim()) || 0,
            closeTime: cells[8]?.textContent?.trim(),
            closePrice: parseFloat(cells[9]?.textContent?.trim()) || 0,
            commission: parseFloat(cells[10]?.textContent?.trim()) || 0,
            swap: parseFloat(cells[11]?.textContent?.trim()) || 0,
            profit: parseFloat(cells[12]?.textContent?.trim()) || 0
          });
        }
      });
    } catch (error) {
      console.warn('Error extracting MT5 positions:', error);
    }
    
    return positions;
  }

  extractMT5Orders(doc) {
    const orders = [];
    
    try {
      const orderRows = this.getTableRows(doc, 'Órdenes');
      
      orderRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 10) {
          orders.push({
            openTime: cells[0]?.textContent?.trim(),
            ticket: cells[1]?.textContent?.trim(),
            symbol: cells[2]?.textContent?.trim(),
            type: cells[3]?.textContent?.trim(),
            volume: cells[4]?.textContent?.trim(),
            price: parseFloat(cells[5]?.textContent?.trim()) || 0,
            sl: parseFloat(cells[6]?.textContent?.trim()) || 0,
            tp: parseFloat(cells[7]?.textContent?.trim()) || 0,
            time: cells[8]?.textContent?.trim(),
            state: cells[9]?.textContent?.trim(),
            comment: cells[10]?.textContent?.trim()
          });
        }
      });
    } catch (error) {
      console.warn('Error extracting MT5 orders:', error);
    }
    
    return orders;
  }

  extractMT5Transactions(doc) {
    const transactions = [];
    
    try {
      const transactionRows = this.getTableRows(doc, 'Transacciones');
      
      transactionRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 14) {
          transactions.push({
            time: cells[0]?.textContent?.trim(),
            deal: cells[1]?.textContent?.trim(),
            symbol: cells[2]?.textContent?.trim(),
            type: cells[3]?.textContent?.trim(),
            direction: cells[4]?.textContent?.trim(),
            volume: parseFloat(cells[5]?.textContent?.trim()) || 0,
            price: parseFloat(cells[6]?.textContent?.trim()) || 0,
            order: cells[7]?.textContent?.trim(),
            commission: parseFloat(cells[9]?.textContent?.trim()) || 0,
            fee: parseFloat(cells[10]?.textContent?.trim()) || 0,
            swap: parseFloat(cells[11]?.textContent?.trim()) || 0,
            profit: parseFloat(cells[12]?.textContent?.trim()) || 0,
            balance: parseFloat(cells[13]?.textContent?.trim()) || 0,
            comment: cells[14]?.textContent?.trim()
          });
        }
      });
    } catch (error) {
      console.warn('Error extracting MT5 transactions:', error);
    }
    
    return transactions;
  }

  extractMT5Summary(doc) {
    const summary = {};
    
    try {
      // Extract balance information
      const balanceRows = doc.querySelectorAll('tr');
      balanceRows.forEach(row => {
        const text = row.textContent;
        if (text.includes('Balance:')) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            summary.balance = parseFloat(cells[1].textContent.trim()) || 0;
          }
        }
      });

      // Extract performance metrics from results section
      const resultRows = this.getTableRows(doc, 'Resultados');
      resultRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const metric = cells[0]?.textContent?.trim();
          const value = cells[1]?.textContent?.trim();
          
          if (metric.includes('Beneficio Neto')) summary.netProfit = parseFloat(value) || 0;
          if (metric.includes('Beneficio Bruto')) summary.grossProfit = parseFloat(value) || 0;
          if (metric.includes('Pérdidas Brutas')) summary.grossLoss = parseFloat(value) || 0;
          if (metric.includes('Factor de Beneficio')) summary.profitFactor = parseFloat(value) || 0;
          if (metric.includes('Total de operaciones')) summary.totalTrades = parseInt(value) || 0;
        }
      });
    } catch (error) {
      console.warn('Error extracting MT5 summary:', error);
    }
    
    return summary;
  }

  // cTrader Extraction Methods
  extractCTraderAccountInfo(doc) {
    const accountInfo = {};
    
    try {
      const rows = doc.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent;
        if (text.includes('Cuenta :')) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            accountInfo.account = cells[1].textContent.trim();
          }
        }
        if (text.includes('Divisa :')) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            accountInfo.currency = cells[1].textContent.trim();
          }
        }
      });
      
      // Extract timestamp from summary
      const timeElement = doc.querySelector('.summary-style');
      if (timeElement) {
        accountInfo.date = timeElement.textContent.trim();
      }
      
      accountInfo.company = 'PropFirmsTech';
    } catch (error) {
      console.warn('Error extracting cTrader account info:', error);
    }
    
    return accountInfo;
  }

  extractCTraderHistory(doc) {
    const history = [];
    
    try {
      const historyTable = this.getCTraderTable(doc, 'Historial');
      if (historyTable) {
        const rows = historyTable.querySelectorAll('tr');
        
        for (let i = 2; i < rows.length - 1; i++) { // Skip header and totals
          const cells = rows[i].querySelectorAll('td');
          if (cells.length >= 9) {
            const symbol = cells[1]?.textContent?.trim();
            const direction = cells[2]?.textContent?.trim();
            
            // Filter out non-trading transactions
            const nonTradingSymbols = ['Depósito', 'Retirada', 'Deposit', 'Withdrawal', 'Balance', 'Credit', 'Total Neto', 'Initial Deposit'];
            if (nonTradingSymbols.some(term => symbol && (symbol.includes(term) || symbol === term))) {
              continue; // Skip this row
            }
            
            history.push({
              symbol: symbol,
              direction: direction,
              closeTime: cells[3]?.textContent?.trim(),
              entryPrice: parseFloat(cells[4]?.textContent?.trim()) || 0,
              exitPrice: parseFloat(cells[5]?.textContent?.trim()) || 0,
              volume: cells[6]?.textContent?.trim(),
              netUSD: parseFloat(cells[7]?.textContent?.trim()) || 0,
              balanceUSD: parseFloat(cells[8]?.textContent?.trim()) || 0
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting cTrader history:', error);
    }
    
    return history;
  }

  extractCTraderTransactions(doc) {
    const transactions = [];
    
    try {
      const transactionTable = this.getCTraderTable(doc, 'Transacciones');
      if (transactionTable) {
        const rows = transactionTable.querySelectorAll('tr');
        
        for (let i = 2; i < rows.length; i++) { // Skip header
          const cells = rows[i].querySelectorAll('td');
          if (cells.length >= 6) {
            transactions.push({
              id: cells[1]?.textContent?.trim(),
              time: cells[2]?.textContent?.trim(),
              type: cells[3]?.textContent?.trim(),
              amount: parseFloat(cells[4]?.textContent?.trim()) || 0,
              note: cells[5]?.textContent?.trim()
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting cTrader transactions:', error);
    }
    
    return transactions;
  }

  extractCTraderSummary(doc) {
    const summary = {};
    
    try {
      const summaryTable = this.getCTraderTable(doc, 'Resumen');
      if (summaryTable) {
        const rows = summaryTable.querySelectorAll('tr');
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const key = cells[0]?.textContent?.trim();
            const value = cells[1]?.textContent?.trim();
            
            if (key === 'Depósito') summary.deposit = parseFloat(value) || 0;
            if (key === 'Retirada') summary.withdrawal = parseFloat(value) || 0;
            if (key === 'Total neto') summary.netTotal = parseFloat(value) || 0;
            if (key === 'Capital') summary.equity = parseFloat(value) || 0;
            if (key === 'P&L devengadas') summary.realizedPL = parseFloat(value) || 0;
          }
        });
        
        // Extract balance from the balance-style element
        const balanceElement = doc.querySelector('.balance-style');
        if (balanceElement) {
          summary.balance = parseFloat(balanceElement.textContent.trim()) || 0;
        }
      }
    } catch (error) {
      console.warn('Error extracting cTrader summary:', error);
    }
    
    return summary;
  }

  // Helper Methods
  getTableRows(doc, sectionName) {
    const rows = [];
    let foundSection = false;
    
    const allRows = doc.querySelectorAll('tr');
    
    for (const row of allRows) {
      const text = row.textContent.trim();
      
      if (text.includes(sectionName)) {
        foundSection = true;
        continue;
      }
      
      if (foundSection) {
        // Stop if we hit another section
        if (text.includes('Órdenes') || text.includes('Transacciones') || 
            text.includes('Posiciones') || text.includes('Resultados')) {
          if (!text.includes(sectionName)) {
            break;
          }
        }
        
        // Skip header rows and empty rows
        if (row.querySelectorAll('th').length === 0 && 
            row.querySelectorAll('td').length > 0 && 
            !text.includes('Total') && 
            !text.includes('Balance:')) {
          rows.push(row);
        }
      }
    }
    
    return rows;
  }

  getCTraderTable(doc, sectionName) {
    const tables = doc.querySelectorAll('.dataTable');
    
    for (const table of tables) {
      if (table.textContent.includes(sectionName)) {
        return table;
      }
    }
    
    return null;
  }

  /**
   * Calculate comprehensive trading metrics
   */
  calculateMetrics(data) {
    const metrics = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      recoveryFactor: 0
    };

    try {
      let trades = [];
      
      // Get trades from appropriate source based on platform
      if (data.platform === this.platforms.MT5) {
        trades = data.positions.filter(pos => pos.profit !== 0);
      } else if (data.platform === this.platforms.CTRADER) {
        trades = data.history.map(h => ({ profit: h.netUSD }));
      }

      if (trades.length === 0) return metrics;

      metrics.totalTrades = trades.length;
      
      // Calculate win/loss metrics
      const profits = [];
      const losses = [];
      
      trades.forEach(trade => {
        const profit = trade.profit || 0;
        if (profit > 0) {
          profits.push(profit);
          metrics.totalProfit += profit;
        } else if (profit < 0) {
          losses.push(Math.abs(profit));
          metrics.totalLoss += Math.abs(profit);
        }
      });
      
      metrics.winningTrades = profits.length;
      metrics.losingTrades = losses.length;
      metrics.winRate = metrics.totalTrades > 0 ? (metrics.winningTrades / metrics.totalTrades) * 100 : 0;
      
      // Calculate profit metrics
      metrics.netProfit = metrics.totalProfit - metrics.totalLoss;
      metrics.profitFactor = metrics.totalLoss > 0 ? metrics.totalProfit / metrics.totalLoss : 0;
      
      metrics.averageWin = profits.length > 0 ? metrics.totalProfit / profits.length : 0;
      metrics.averageLoss = losses.length > 0 ? metrics.totalLoss / losses.length : 0;
      
      metrics.largestWin = profits.length > 0 ? Math.max(...profits) : 0;
      metrics.largestLoss = losses.length > 0 ? Math.max(...losses) : 0;
      
      // Calculate expectancy
      const avgWin = metrics.averageWin;
      const avgLoss = metrics.averageLoss;
      const winProb = metrics.winRate / 100;
      const lossProb = 1 - winProb;
      
      metrics.expectancy = (winProb * avgWin) - (lossProb * avgLoss);
      
      // Calculate drawdown (simplified)
      let runningBalance = data.summary?.balance || 0;
      let peak = runningBalance;
      let maxDD = 0;
      
      trades.forEach(trade => {
        runningBalance += (trade.profit || 0);
        if (runningBalance > peak) {
          peak = runningBalance;
        } else {
          const drawdown = ((peak - runningBalance) / peak) * 100;
          maxDD = Math.max(maxDD, drawdown);
        }
      });
      
      metrics.maxDrawdown = maxDD;
      metrics.recoveryFactor = maxDD > 0 ? metrics.netProfit / maxDD : 0;
      
      // Simple Sharpe ratio approximation
      if (trades.length > 1) {
        const returns = trades.map(t => t.profit || 0);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1);
        const stdDev = Math.sqrt(variance);
        metrics.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
      }

    } catch (error) {
      console.warn('Error calculating metrics:', error);
    }
    
    return metrics;
  }

  /**
   * Format metrics for display
   */
  formatMetrics(metrics) {
    return {
      'Total de Operaciones': metrics.totalTrades,
      'Operaciones Ganadoras': `${metrics.winningTrades} (${metrics.winRate.toFixed(1)}%)`,
      'Operaciones Perdedoras': `${metrics.losingTrades} (${(100 - metrics.winRate).toFixed(1)}%)`,
      'Beneficio Neto': `$${metrics.netProfit.toFixed(2)}`,
      'Factor de Beneficio': metrics.profitFactor.toFixed(2),
      'Ganancia Promedio': `$${metrics.averageWin.toFixed(2)}`,
      'Pérdida Promedio': `$${metrics.averageLoss.toFixed(2)}`,
      'Mayor Ganancia': `$${metrics.largestWin.toFixed(2)}`,
      'Mayor Pérdida': `$${metrics.largestLoss.toFixed(2)}`,
      'Expectativa': `$${metrics.expectancy.toFixed(2)}`,
      'Máximo Drawdown': `${metrics.maxDrawdown.toFixed(2)}%`,
      'Factor de Recuperación': metrics.recoveryFactor.toFixed(2),
      'Ratio de Sharpe': metrics.sharpeRatio.toFixed(3)
    };
  }
}

export default TradingHistoryParser;