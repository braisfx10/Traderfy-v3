const fs = require('fs');
const http = require('http');

// Leer el archivo HTML
const htmlContent = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');

// Crear el JSON payload de forma segura
const payload = JSON.stringify({
  htmlContent: htmlContent,
  accountId: "ftt15k"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/parse-html',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('=== NUEVO TRADINGHISTORYPARSER TEST ===');
      console.log('Trades count:', result.trades ? result.trades.length : 0);
      console.log('Report type:', result.reportType);
      console.log('Platform detected:', result.reportType);
      
      if (result.trades && result.trades.length > 0) {
        console.log('\nFirst trade:', result.trades[0]);
        console.log('\nSample of more trades:');
        for (let i = 0; i < Math.min(5, result.trades.length); i++) {
          const trade = result.trades[i];
          console.log(`${i+1}. ${trade.symbol} ${trade.direction} P&L: ${trade.pnl}`);
        }
      }
      
      if (result.summary) {
        console.log('\n=== ADVANCED METRICS ===');
        console.log('Net Profit:', result.summary.netProfit);
        console.log('Win Rate:', result.summary.winRate + '%');
        console.log('Profit Factor:', result.summary.profitFactor);
        console.log('Sharpe Ratio:', result.summary.sharpeRatio);
        console.log('Max Drawdown:', result.summary.maxDrawdown + '%');
        console.log('Expectancy:', result.summary.expectancy);
        console.log('Recovery Factor:', result.summary.recoveryFactor);
      }
      
      if (result.error) {
        console.log('Error:', result.error);
      }
    } catch (e) {
      console.error('Parse error:', e);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(payload);
req.end();