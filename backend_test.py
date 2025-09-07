#!/usr/bin/env python3
"""
Next.js API Endpoints and HTML Parser Testing
Tests the API endpoints and HTML parsing functionality after supervisor configuration fix
"""

import requests
import json
import os
from datetime import datetime

# Configuration - Use localhost for internal testing
BASE_URL = 'http://localhost:3000'
API_URL = f"{BASE_URL}/api"

def load_mt5_test_file():
    """Load the MT5 test HTML file"""
    try:
        with open('/app/public/mt5-test.html', 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"✅ MT5 test file loaded successfully ({len(content)} characters)")
        return content
    except Exception as e:
        print(f"❌ Failed to load MT5 test file: {e}")
        return None

def test_api_parse_html(html_content):
    """Test the /api/parse-html endpoint with MT5 data"""
    print("\n🔍 Testing POST /api/parse-html endpoint...")
    
    try:
        payload = {
            "htmlContent": html_content,
            "accountId": "test-account-123"
        }
        
        response = requests.post(
            f"{API_URL}/parse-html",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API endpoint working correctly")
            
            # Verify response structure
            print(f"📊 Response contains:")
            print(f"  - Trades: {len(data.get('trades', []))}")
            print(f"  - Account Info: {bool(data.get('accountInfo'))}")
            print(f"  - Summary: {bool(data.get('summary'))}")
            print(f"  - Message: {data.get('message', 'N/A')}")
            
            # Verify trade data
            trades = data.get('trades', [])
            if trades:
                print(f"\n📈 First trade details:")
                first_trade = trades[0]
                for key, value in first_trade.items():
                    print(f"  - {key}: {value}")
                
                # Check expected profits
                expected_profits = [-313.95, 431.6, 100.75, -185.25, 219.05]
                actual_profits = [trade.get('pnl', 0) for trade in trades]
                
                print(f"\n💰 Profit verification:")
                print(f"  Expected: {expected_profits}")
                print(f"  Actual:   {actual_profits}")
                
                if actual_profits == expected_profits:
                    print("✅ All profits match expected values")
                else:
                    print("❌ Profit values don't match")
                
                # Check symbols
                symbols = [trade.get('symbol') for trade in trades]
                print(f"  Symbols: {symbols}")
                
                # Check account_id assignment
                account_ids = [trade.get('account_id') for trade in trades]
                print(f"  Account IDs: {set(account_ids)}")
                
                if all(aid == "test-account-123" for aid in account_ids):
                    print("✅ Account ID correctly assigned to all trades")
                else:
                    print("❌ Account ID assignment issue")
            
            return data
        else:
            print(f"❌ API request failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return None

def test_data_format_consistency(api_data):
    """Test that the data format is consistent with frontend expectations"""
    print("\n🔍 Testing data format consistency...")
    
    if not api_data or not api_data.get('trades'):
        print("❌ No trade data to test")
        return False
    
    trades = api_data['trades']
    required_fields = [
        'symbol', 'direction', 'close_time', 'entry_price', 
        'close_price', 'lots', 'pnl', 'account_id'
    ]
    
    print(f"📋 Checking required fields: {required_fields}")
    
    all_valid = True
    for i, trade in enumerate(trades):
        missing_fields = [field for field in required_fields if field not in trade]
        if missing_fields:
            print(f"❌ Trade {i+1} missing fields: {missing_fields}")
            all_valid = False
        else:
            print(f"✅ Trade {i+1} has all required fields")
    
    # Check data types
    print(f"\n🔢 Checking data types...")
    sample_trade = trades[0]
    
    type_checks = [
        ('symbol', str),
        ('direction', str),
        ('entry_price', (int, float)),
        ('close_price', (int, float)),
        ('lots', (int, float)),
        ('pnl', (int, float))
    ]
    
    for field, expected_type in type_checks:
        actual_value = sample_trade.get(field)
        if isinstance(actual_value, expected_type):
            print(f"✅ {field}: {type(actual_value).__name__} ({actual_value})")
        else:
            print(f"❌ {field}: Expected {expected_type}, got {type(actual_value)} ({actual_value})")
            all_valid = False
    
    return all_valid

def test_account_association(api_data):
    """Test that trades are correctly associated with accounts"""
    print("\n🔍 Testing account association...")
    
    if not api_data:
        print("❌ No API data to test")
        return False
    
    trades = api_data.get('trades', [])
    account_info = api_data.get('accountInfo', {})
    
    print(f"📊 Account Info:")
    for key, value in account_info.items():
        print(f"  - {key}: {value}")
    
    # Check if all trades have the same account_id
    account_ids = [trade.get('account_id') for trade in trades]
    unique_account_ids = set(account_ids)
    
    print(f"🔗 Account ID consistency:")
    print(f"  - Unique account IDs: {unique_account_ids}")
    print(f"  - Total trades: {len(trades)}")
    
    if len(unique_account_ids) == 1:
        print("✅ All trades have consistent account_id")
        return True
    else:
        print("❌ Inconsistent account_id assignment")
        return False

def test_storage_simulation():
    """Simulate how data would be stored in localStorage"""
    print("\n🔍 Testing storage simulation...")
    
    # Load MT5 data
    html_content = load_mt5_test_file()
    if not html_content:
        return False
    
    # Get API response
    api_data = test_api_parse_html(html_content)
    if not api_data:
        return False
    
    # Simulate frontend processing
    print(f"\n💾 Simulating frontend data processing...")
    
    # Simulate account structure
    test_account = {
        "id": "test-account-123",
        "name": "MT5 Test Account",
        "broker": "SLH Markets Ltd",
        "currency": "USD",
        "trades": [],
        "withdraws": []
    }
    
    # Process trades as frontend would
    processed_trades = []
    for trade in api_data.get('trades', []):
        processed_trade = {
            **trade,
            "account_id": test_account["id"],
            "user_id": "demo"
        }
        processed_trades.append(processed_trade)
    
    # Update account with trades
    test_account["trades"] = processed_trades
    test_account["summary"] = api_data.get('summary', {})
    
    print(f"✅ Processed {len(processed_trades)} trades for storage")
    print(f"📊 Account summary: {test_account['summary']}")
    
    # Simulate localStorage storage
    storage_data = {
        "accounts": [test_account],
        "trades": processed_trades
    }
    
    print(f"💾 Storage data structure:")
    print(f"  - Accounts: {len(storage_data['accounts'])}")
    print(f"  - Total trades: {len(storage_data['trades'])}")
    
    return True

def test_metrics_calculation():
    """Test that metrics can be calculated from the data"""
    print("\n🔍 Testing metrics calculation...")
    
    # Load and process data
    html_content = load_mt5_test_file()
    if not html_content:
        return False
    
    api_data = test_api_parse_html(html_content)
    if not api_data:
        return False
    
    trades = api_data.get('trades', [])
    
    # Calculate basic metrics
    total_trades = len(trades)
    total_pnl = sum(trade.get('pnl', 0) for trade in trades)
    winning_trades = [t for t in trades if t.get('pnl', 0) > 0]
    losing_trades = [t for t in trades if t.get('pnl', 0) < 0]
    
    win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0
    
    print(f"📊 Calculated Metrics:")
    print(f"  - Total Trades: {total_trades}")
    print(f"  - Total P&L: ${total_pnl:.2f}")
    print(f"  - Winning Trades: {len(winning_trades)}")
    print(f"  - Losing Trades: {len(losing_trades)}")
    print(f"  - Win Rate: {win_rate:.1f}%")
    
    # Verify against expected values
    expected_total_pnl = sum([-313.95, 431.6, 100.75, -185.25, 219.05])
    
    if abs(total_pnl - expected_total_pnl) < 0.01:
        print(f"✅ Total P&L matches expected: ${expected_total_pnl:.2f}")
    else:
        print(f"❌ Total P&L mismatch. Expected: ${expected_total_pnl:.2f}, Got: ${total_pnl:.2f}")
    
    if total_trades == 5:
        print("✅ Trade count matches expected: 5")
    else:
        print(f"❌ Trade count mismatch. Expected: 5, Got: {total_trades}")
    
    return True

def run_complete_mt5_test():
    """Run the complete MT5 data flow test"""
    print("🚀 Starting Complete MT5 Data Flow Test")
    print("=" * 60)
    
    # Test 1: Load MT5 file
    html_content = load_mt5_test_file()
    if not html_content:
        print("❌ CRITICAL: Cannot load MT5 test file")
        return False
    
    # Test 2: API endpoint
    api_data = test_api_parse_html(html_content)
    if not api_data:
        print("❌ CRITICAL: API endpoint failed")
        return False
    
    # Test 3: Data format consistency
    format_ok = test_data_format_consistency(api_data)
    if not format_ok:
        print("❌ CRITICAL: Data format issues detected")
    
    # Test 4: Account association
    account_ok = test_account_association(api_data)
    if not account_ok:
        print("❌ WARNING: Account association issues")
    
    # Test 5: Storage simulation
    storage_ok = test_storage_simulation()
    if not storage_ok:
        print("❌ WARNING: Storage simulation failed")
    
    # Test 6: Metrics calculation
    metrics_ok = test_metrics_calculation()
    if not metrics_ok:
        print("❌ WARNING: Metrics calculation failed")
    
    print("\n" + "=" * 60)
    print("🏁 MT5 Data Flow Test Complete")
    
    if api_data and format_ok:
        print("✅ CORE FUNCTIONALITY: Working")
        print("📊 Expected 5 XAUUSD trades with profits: -313.95, 431.6, 100.75, -185.25, 219.05")
        
        actual_profits = [trade.get('pnl', 0) for trade in api_data.get('trades', [])]
        print(f"📈 Actual profits: {actual_profits}")
        
        if len(actual_profits) == 5:
            print("✅ RESULT: MT5 parser extracts correct number of trades")
        else:
            print("❌ RESULT: Trade count mismatch")
            
        return True
    else:
        print("❌ CORE FUNCTIONALITY: Failed")
        return False

if __name__ == "__main__":
    success = run_complete_mt5_test()
    exit(0 if success else 1)