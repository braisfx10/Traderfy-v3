const fs = require('fs');
const UnifiedTradingParser = require('./lib/unifiedTradingParser.js');

// Leer el archivo HTML
const htmlContent = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');

console.log('HTML file size:', htmlContent.length);
console.log('First 500 chars:', htmlContent.substring(0, 500));

// Crear parser y probar
const parser = new UnifiedTradingParser(htmlContent);

// Test specific method
console.log('\n=== Testing cTrader detection ===');

// Simulate the same logic
const cheerio = require('cheerio');
const $ = cheerio.load(htmlContent);

let historialFound = false;
$('table').each((tableIndex, table) => {
  $(table).find('tr').each((rowIndex, row) => {
    const rowText = $(row).text().trim();
    
    if (rowText.includes('Historial')) {
      console.log(`Found Historial row ${rowIndex}:`, rowText.substring(0, 100));
      historialFound = true;
    }
    
    if (rowText.includes('Símbolo')) {
      console.log(`Found Symbol row ${rowIndex}:`, rowText.substring(0, 100));
    }
    
    if (rowText.includes('EURUSD')) {
      console.log(`Found EURUSD row ${rowIndex}:`, rowText.substring(0, 100));
    }
  });
});

console.log('Historial section found:', historialFound);

// Test the parser
const trades = parser.parseCTrader();
console.log('Trades extracted:', trades.length);