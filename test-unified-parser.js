import fs from "fs"; import UnifiedTradingParser from "./lib/unifiedTradingParser.js"; 

console.log("=== TESTING MT5 FILE ===");
const mt5Html = fs.readFileSync("/app/public/mt5-real.html", "utf8");
const mt5Parser = new UnifiedTradingParser(mt5Html);
const mt5Result = mt5Parser.parse();
console.log("MT5 Report Type:", mt5Parser.reportType);
console.log("MT5 Trades Found:", mt5Result.trades.length);
console.log("MT5 Sample Trade:", mt5Result.trades[0]);
console.log("MT5 Results:", mt5Result.results);

console.log("
=== TESTING CTRADER FILE ===");
const ctraderHtml = fs.readFileSync("/app/public/ctrader-with-withdraws.html", "utf8");
const ctraderParser = new UnifiedTradingParser(ctraderHtml);
const ctraderResult = ctraderParser.parse();
console.log("cTrader Report Type:", ctraderParser.reportType);
console.log("cTrader Trades Found:", ctraderResult.trades.length);
console.log("cTrader Sample Trade:", ctraderResult.trades[0]);
console.log("cTrader Results:", ctraderResult.results);
