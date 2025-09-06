import fs from 'fs';
import TradingHistoryParser from './lib/TradingHistoryParser.js';

// Probar directamente la nueva clase
async function testNewParser() {
    try {
        console.log('=== TESTING NEW TRADINGHISTORYPARSER DIRECTLY ===');
        
        // Leer el archivo HTML
        const htmlContent = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');
        console.log('HTML file loaded, length:', htmlContent.length);
        
        // Crear instancia del parser
        const parser = new TradingHistoryParser();
        console.log('TradingHistoryParser instance created');
        
        // Parsear el contenido
        const tradingData = parser.parseHTML(htmlContent);
        console.log('Parsing completed!');
        
        console.log('\n=== RESULTS ===');
        console.log('Platform detected:', tradingData.platform);
        console.log('Total trades:', tradingData.history ? tradingData.history.length : 0);
        console.log('Account info:', tradingData.accountInfo);
        
        if (tradingData.history && tradingData.history.length > 0) {
            console.log('\nFirst 5 trades:');
            for (let i = 0; i < Math.min(5, tradingData.history.length); i++) {
                const trade = tradingData.history[i];
                console.log(`${i + 1}. ${trade.symbol} ${trade.direction} P&L: ${trade.netUSD}`);
            }
        }
        
        console.log('\n=== ADVANCED METRICS ===');
        const formattedMetrics = parser.formatMetrics(tradingData.metrics);
        Object.entries(formattedMetrics).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        
        console.log('\n=== SUMMARY INFO ===');
        console.log('Deposit:', tradingData.summary?.deposit);
        console.log('Withdrawal:', tradingData.summary?.withdrawal);
        console.log('Balance:', tradingData.summary?.balance);
        
    } catch (error) {
        console.error('Error testing new parser:', error);
    }
}

testNewParser();