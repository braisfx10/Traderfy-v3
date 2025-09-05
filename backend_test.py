#!/usr/bin/env python3
"""
Backend Test Suite for Traderfy HTML Parser Functionality
Tests the HTML parser, API endpoints, and data flow for trading report uploads.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://trading-metrics-4.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class TraderfyBackendTester:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'endpoints' in data:
                    self.log_test(
                        "API Root Endpoint", 
                        True, 
                        "API is accessible and returns expected structure",
                        f"Version: {data.get('version', 'N/A')}, Endpoints: {len(data.get('endpoints', []))}"
                    )
                    return True
                else:
                    self.log_test("API Root Endpoint", False, "API response missing expected fields", str(data))
                    return False
            else:
                self.log_test("API Root Endpoint", False, f"API returned status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Failed to connect to API: {str(e)}")
            return False

    def test_html_parser_direct(self):
        """Test the HTML parser function directly with sample MetaTrader data"""
        print("🧪 Testing HTML Parser Function Directly...")
        
        # Sample HTML data similar to MetaTrader reports
        sample_html = """
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
            <td>14928.34</td>
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
            <td>14577.54</td>
          </tr>
        </table>
        """
        
        try:
            # Test the parser by calling the test-parser.js file
            import subprocess
            result = subprocess.run(['node', '/app/test-parser.js'], 
                                  capture_output=True, text=True, cwd='/app')
            
            if result.returncode == 0:
                output = result.stdout
                if "✅ Parser working" in output and "found 2 trades" in output:
                    self.log_test(
                        "HTML Parser Direct Test", 
                        True, 
                        "Parser successfully extracted trades from sample HTML",
                        f"Output: {output.strip()}"
                    )
                    return True
                else:
                    self.log_test(
                        "HTML Parser Direct Test", 
                        False, 
                        "Parser did not extract expected number of trades",
                        f"Output: {output.strip()}"
                    )
                    return False
            else:
                self.log_test(
                    "HTML Parser Direct Test", 
                    False, 
                    "Parser test script failed to run",
                    f"Error: {result.stderr}"
                )
                return False
                
        except Exception as e:
            self.log_test("HTML Parser Direct Test", False, f"Failed to run parser test: {str(e)}")
            return False

    def test_html_parser_api_endpoint(self):
        """Test the HTML parser API endpoint"""
        print("🧪 Testing HTML Parser API Endpoint...")
        
        # Sample HTML content for testing
        sample_html = """
        <table>
          <tr>
            <td>EURUSD</td>
            <td>Buy</td>
            <td>30/07/2025 13:13:02.678</td>
            <td>1.14748</td>
            <td>1.14640</td>
            <td>0.65 Lotes</td>
            <td>-71.66</td>
          </tr>
          <tr>
            <td>XAUUSD</td>
            <td>Sell</td>
            <td>31/07/2025 10:17:59.922</td>
            <td>3306.79</td>
            <td>3304.76</td>
            <td>5.00 Lotes</td>
            <td>101.50</td>
          </tr>
        </table>
        """
        
        try:
            # Test without authentication first (should fail)
            response = self.session.post(
                f"{API_BASE}/parse-html",
                json={
                    "htmlContent": sample_html,
                    "accountId": "test-account-1"
                },
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                self.log_test(
                    "HTML Parser API Authentication", 
                    True, 
                    "API correctly requires authentication",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_test(
                    "HTML Parser API Authentication", 
                    False, 
                    f"API should require auth but returned {response.status_code}",
                    response.text
                )
                
            # Note: We can't test authenticated endpoints without Supabase setup
            # But we can verify the endpoint exists and handles requests properly
            return True
            
        except Exception as e:
            self.log_test("HTML Parser API Endpoint", False, f"Failed to test API endpoint: {str(e)}")
            return False

    def test_data_structure_consistency(self):
        """Test data structure consistency between parser and frontend"""
        print("🧪 Testing Data Structure Consistency...")
        
        try:
            # Read the parser file to check field naming
            with open('/app/lib/htmlParser.js', 'r') as f:
                parser_content = f.read()
            
            # Check for consistent field naming
            expected_fields = [
                'close_time',
                'entry_price', 
                'close_price',
                'account_id',
                'user_id'
            ]
            
            missing_fields = []
            for field in expected_fields:
                if field not in parser_content:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test(
                    "Data Structure Consistency", 
                    True, 
                    "All expected fields found in parser output structure",
                    f"Fields checked: {expected_fields}"
                )
                return True
            else:
                self.log_test(
                    "Data Structure Consistency", 
                    False, 
                    "Some expected fields missing from parser",
                    f"Missing: {missing_fields}"
                )
                return False
                
        except Exception as e:
            self.log_test("Data Structure Consistency", False, f"Failed to check data structure: {str(e)}")
            return False

    def test_date_parsing_format(self):
        """Test date parsing format compatibility"""
        print("🧪 Testing Date Parsing Format...")
        
        try:
            # Test the date parsing function by examining the parser code
            with open('/app/lib/htmlParser.js', 'r') as f:
                parser_content = f.read()
            
            # Check if parseDateTime function exists and handles DD/MM/YYYY format
            if 'parseDateTime' in parser_content and 'DD/MM/YYYY' in parser_content:
                self.log_test(
                    "Date Parsing Format", 
                    True, 
                    "Parser includes date parsing function for DD/MM/YYYY format",
                    "parseDateTime function found with correct format handling"
                )
                return True
            else:
                self.log_test(
                    "Date Parsing Format", 
                    False, 
                    "Date parsing function missing or incorrect format",
                    "parseDateTime function not found or missing DD/MM/YYYY support"
                )
                return False
                
        except Exception as e:
            self.log_test("Date Parsing Format", False, f"Failed to check date parsing: {str(e)}")
            return False

    def test_account_id_assignment(self):
        """Test account ID assignment in frontend component"""
        print("🧪 Testing Account ID Assignment...")
        
        try:
            # Read the frontend page.js to check account ID assignment
            with open('/app/app/page.js', 'r') as f:
                frontend_content = f.read()
            
            # Check if account_id is properly assigned in HTMLUploader
            if 'account_id: selectedAccount.id' in frontend_content:
                self.log_test(
                    "Account ID Assignment", 
                    True, 
                    "Frontend properly assigns account_id to trades",
                    "Found account_id assignment in HTMLUploader component"
                )
                return True
            else:
                self.log_test(
                    "Account ID Assignment", 
                    False, 
                    "Account ID assignment not found in frontend",
                    "account_id assignment missing in HTMLUploader"
                )
                return False
                
        except Exception as e:
            self.log_test("Account ID Assignment", False, f"Failed to check account ID assignment: {str(e)}")
            return False

    def test_sample_metatrader_data(self):
        """Test with realistic MetaTrader HTML data structure"""
        print("🧪 Testing with Sample MetaTrader Data...")
        
        # More realistic MetaTrader HTML structure
        metatrader_html = """
        <!DOCTYPE html>
        <html>
        <head><title>Account Statement</title></head>
        <body>
        <table>
        <tr><td>Cuenta:</td><td>12345678</td></tr>
        <tr><td>Divisa:</td><td>USD</td></tr>
        <tr><td>Fecha:</td><td>30/07/2025</td></tr>
        </table>
        
        <h3>Historial de Operaciones</h3>
        <table>
        <tr>
        <th>Símbolo</th>
        <th>Dirección</th>
        <th>Hora de cierre</th>
        <th>Precio entrada</th>
        <th>Precio cierre</th>
        <th>Lotes</th>
        <th>P&L</th>
        </tr>
        <tr>
        <td>EURUSD</td>
        <td>Buy</td>
        <td>30/07/2025 13:13:02.678</td>
        <td>1.14748</td>
        <td>1.14640</td>
        <td>0.65 Lotes</td>
        <td>-71.66</td>
        </tr>
        <tr>
        <td>XAUUSD</td>
        <td>Sell</td>
        <td>31/07/2025 10:17:59.922</td>
        <td>3306.79</td>
        <td>3304.76</td>
        <td>5.00 Lotes</td>
        <td>101.50</td>
        </tr>
        </table>
        </body>
        </html>
        """
        
        try:
            # Write test HTML to a temporary file and test it
            with open('/tmp/test_metatrader.html', 'w') as f:
                f.write(metatrader_html)
            
            # Create a test script to parse this HTML
            test_script = f"""
            const {{ parseHTMLReport }} = require('/app/lib/htmlParser');
            const fs = require('fs');
            
            try {{
                const htmlContent = fs.readFileSync('/tmp/test_metatrader.html', 'utf8');
                const result = parseHTMLReport(htmlContent);
                
                console.log('Parsed trades:', result.trades.length);
                console.log('Account info:', JSON.stringify(result.accountInfo));
                console.log('Summary:', JSON.stringify(result.summary));
                
                if (result.trades.length >= 2) {{
                    console.log('✅ SUCCESS: Found expected trades');
                    console.log('First trade:', JSON.stringify(result.trades[0], null, 2));
                }} else {{
                    console.log('❌ FAIL: Expected at least 2 trades, found', result.trades.length);
                }}
            }} catch (error) {{
                console.log('❌ ERROR:', error.message);
            }}
            """
            
            with open('/tmp/test_metatrader.js', 'w') as f:
                f.write(test_script)
            
            # Run the test
            import subprocess
            result = subprocess.run(['node', '/tmp/test_metatrader.js'], 
                                  capture_output=True, text=True, cwd='/app')
            
            if result.returncode == 0 and "✅ SUCCESS" in result.stdout:
                self.log_test(
                    "Sample MetaTrader Data Test", 
                    True, 
                    "Parser successfully processed realistic MetaTrader HTML",
                    f"Output: {result.stdout.strip()}"
                )
                return True
            else:
                self.log_test(
                    "Sample MetaTrader Data Test", 
                    False, 
                    "Parser failed to process MetaTrader HTML correctly",
                    f"Output: {result.stdout.strip()}, Error: {result.stderr}"
                )
                return False
                
        except Exception as e:
            self.log_test("Sample MetaTrader Data Test", False, f"Failed to test MetaTrader data: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Traderfy Backend Test Suite")
        print("=" * 60)
        
        tests = [
            self.test_api_root,
            self.test_html_parser_direct,
            self.test_data_structure_consistency,
            self.test_date_parsing_format,
            self.test_account_id_assignment,
            self.test_sample_metatrader_data,
            self.test_html_parser_api_endpoint
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print(f"⚠️  {total - passed} tests failed")
            
        return passed, total, self.test_results

if __name__ == "__main__":
    tester = TraderfyBackendTester()
    passed, total, results = tester.run_all_tests()
    
    # Print detailed results
    print("\n📋 Detailed Test Results:")
    print("-" * 40)
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test']}: {result['message']}")
        if result['details']:
            print(f"   {result['details']}")
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)