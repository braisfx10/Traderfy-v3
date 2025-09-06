import fs from 'fs';
import { parseHTMLReport } from './lib/htmlParser.js';

// Simular exactamente lo que hace la UI
async function simulateUIUpload() {
    try {
        console.log('=== SIMULATING UI FILE UPLOAD ===');
        
        // Leer el archivo como lo haría la UI
        const text = fs.readFileSync('./public/ftt-15k-real.html', 'utf-8');
        console.log('File loaded, length:', text.length);
        
        // Llamar a parseHTMLReport como lo hace la UI (ahora con await)
        console.log('Calling parseHTMLReport...');
        const parsedData = await parseHTMLReport(text);
        console.log('parseHTMLReport completed');
        
        // Validar que tenemos la estructura esperada
        console.log('parsedData type:', typeof parsedData);
        console.log('parsedData is null?', parsedData === null);
        console.log('parsedData is undefined?', parsedData === undefined);
        
        if (parsedData) {
            console.log('parsedData keys:', Object.keys(parsedData));
            console.log('Has trades?', 'trades' in parsedData);
            
            if (parsedData.trades) {
                console.log('Trades type:', typeof parsedData.trades);
                console.log('Trades is array?', Array.isArray(parsedData.trades));
                console.log('Trades length:', parsedData.trades.length);
                
                // Simular el check que falla
                if (parsedData.trades.length === 0) {
                    console.log('❌ No trades found');
                } else {
                    console.log('✅ Success - trades found:', parsedData.trades.length);
                    console.log('First trade preview:', {
                        symbol: parsedData.trades[0].symbol,
                        direction: parsedData.trades[0].direction,
                        pnl: parsedData.trades[0].pnl
                    });
                }
            } else {
                console.log('❌ No trades property in parsedData');
            }
        } else {
            console.log('❌ parsedData is null/undefined');
        }
        
    } catch (error) {
        console.error('❌ Error in simulation:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
}

simulateUIUpload();