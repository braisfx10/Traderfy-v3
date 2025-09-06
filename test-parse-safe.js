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
      console.log('Trades count:', result.trades ? result.trades.length : 0);
      console.log('Report type:', result.reportType);
      if (result.trades && result.trades.length > 0) {
        console.log('First trade:', result.trades[0]);
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