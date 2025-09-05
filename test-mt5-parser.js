import fs from 'fs'
import MT5Parser from './lib/mt5Parser.js'

// Test the MT5 parser directly
const testMT5Parser = () => {
  try {
    // Read the MT5 test file
    const htmlContent = fs.readFileSync('/app/public/mt5-test.html', 'utf8')
    console.log('HTML file loaded, length:', htmlContent.length)
    
    // Create parser instance
    const parser = new MT5Parser(htmlContent)
    console.log('Parser created')
    
    // Parse the content
    const result = parser.parse()
    console.log('Parsing completed')
    
    // Show results
    console.log('\n=== MT5 PARSING RESULTS ===')
    console.log('Account:', JSON.stringify(result.account, null, 2))
    console.log('Positions found:', result.positions.length)
    console.log('First position:', JSON.stringify(result.positions[0], null, 2))
    console.log('Transactions found:', result.transactions.length)
    console.log('Results:', JSON.stringify(result.results, null, 2))
    
  } catch (error) {
    console.error('Error testing MT5 parser:', error)
  }
}

testMT5Parser()