// Test del parser HTML
const { parseHTMLReport } = require('./lib/htmlParser')

// HTML de ejemplo simplificado para testing
const testHTML = `
<table>
  <tr>
    <td>Totales</td>
    <td>Símbolo</td>
    <td>Dirección de apertura</td>
    <td>Hora de cierre (UTC+0)</td>
    <td>Precio de entrada</td>
    <td>Precio de cierre</td>
    <td>Cantidad de Cierre</td>
    <td>USD neto</td>
    <td>Saldo USD</td>
  </tr>
  <tr>
    <td></td>
    <td>EURUSD</td>
    <td>Buy</td>
    <td>30/07/2025 13:13:02.678</td>
    <td>1.14748</td>
    <td>1.14640</td>
    <td>0.65 Lotes</td>
    <td>-71.66</td>
    <td>14 928.34</td>
  </tr>
  <tr>
    <td></td>
    <td>XAUUSD</td>
    <td>Sell</td>
    <td>31/07/2025 10:17:59.922</td>
    <td>3306.79</td>
    <td>3304.76</td>
    <td>5.00 Lotes</td>
    <td>101.50</td>
    <td>14 577.54</td>
  </tr>
</table>
`

try {
  console.log('Testing HTML Parser...')
  const result = parseHTMLReport(testHTML)
  console.log('Parsed result:', JSON.stringify(result, null, 2))
  
  if (result.trades && result.trades.length > 0) {
    console.log('✅ Parser working - found', result.trades.length, 'trades')
    console.log('First trade:', result.trades[0])
  } else {
    console.log('❌ Parser not finding trades')
  }
} catch (error) {
  console.error('❌ Parser error:', error)
}