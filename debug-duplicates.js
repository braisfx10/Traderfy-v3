const fs = require('fs');

// Probar directamente con el UnifiedTradingParser para debug
async function debugDuplicates() {
    try {
        console.log('=== DEBUGGING TRADE DUPLICATES ===');
        
        // Importar el parser
        const { UnifiedTradingParser } = await import('./lib/unifiedTradingParser.js');
        
        // Leer el archivo HTML
        const htmlContent = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');
        console.log('HTML file loaded, length:', htmlContent.length);
        
        // Crear instancia del parser
        const parser = new UnifiedTradingParser(htmlContent);
        console.log('Parser created, detected type:', parser.reportType);
        
        // Parsear directamente
        const result = parser.parse();
        console.log('Parsing completed!');
        
        console.log('\n=== RESULTS ANALYSIS ===');
        console.log('Total trades found:', result.trades.length);
        
        // Analizar trades únicos por símbolo y profit
        const uniqueTrades = new Map();
        const duplicateTrades = [];
        
        result.trades.forEach((trade, index) => {
            const key = `${trade.symbol}-${trade.type}-${trade.profit}-${trade.time}`;
            
            if (uniqueTrades.has(key)) {
                console.log(`DUPLICATE FOUND at index ${index}:`, {
                    symbol: trade.symbol,
                    type: trade.type,
                    profit: trade.profit,
                    time: trade.time,
                    originalIndex: uniqueTrades.get(key)
                });
                duplicateTrades.push(trade);
            } else {
                uniqueTrades.set(key, index);
            }
        });
        
        console.log('\n=== DUPLICATE ANALYSIS ===');
        console.log('Unique trades:', uniqueTrades.size);
        console.log('Duplicate trades:', duplicateTrades.length);
        console.log('Total trades:', result.trades.length);
        console.log('Expected total (unique only):', uniqueTrades.size);
        
        // Mostrar primeros 10 trades con sus índices
        console.log('\n=== FIRST 10 TRADES ===');
        result.trades.slice(0, 10).forEach((trade, i) => {
            console.log(`${i+1}: ${trade.symbol} ${trade.type} ${trade.profit} ${trade.time?.substring(0, 16)}`);
        });
        
        // Calcular profit total real
        const totalProfit = result.trades.reduce((sum, trade) => sum + trade.profit, 0);
        const uniqueProfit = Array.from(uniqueTrades.keys()).reduce((sum, key) => {
            const trade = result.trades.find(t => `${t.symbol}-${t.type}-${t.profit}-${t.time}` === key);
            return sum + trade.profit;
        }, 0);
        
        console.log('\n=== PROFIT ANALYSIS ===');
        console.log('Total profit (with duplicates):', totalProfit.toFixed(2));
        console.log('Unique profit (no duplicates):', uniqueProfit.toFixed(2));
        
    } catch (error) {
        console.error('Error in debug:', error);
    }
}

debugDuplicates();