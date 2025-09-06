const fs = require('fs');
const fetch = require('node-fetch');

// Leer el archivo HTML
const htmlContent = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');

// Crear el JSON payload de forma segura
const payload = {
  htmlContent: htmlContent,
  accountId: "ftt15k"
};

// Enviar request
fetch('http://localhost:3000/api/parse-html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log('Trades count:', data.trades ? data.trades.length : 0);
  console.log('Report type:', data.reportType);
  if (data.trades && data.trades.length > 0) {
    console.log('First trade:', data.trades[0]);
  }
  if (data.error) {
    console.log('Error:', data.error);
  }
})
.catch(error => {
  console.error('Request error:', error);
});