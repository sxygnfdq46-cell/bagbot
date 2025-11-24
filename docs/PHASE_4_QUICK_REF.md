"""
PHASE 4 QUICK REFERENCE
=======================

## 🚀 Quick Start

### Import All Phase 4 Components
```python
# News Intelligence
from bagbot.trading.news_anchor import NewsAnchor, MarketBias

# Market Adapters
from bagbot.trading.markets.tradingview_adapter import TradingViewAdapter
from bagbot.trading.markets.htm.htm_adapter import HTMAdapter, TimeFrame
from bagbot.trading.markets.forex.oanda_adapter import OandaAdapter
from bagbot.trading.markets.crypto.bybit_adapter import BybitAdapter
from bagbot.trading.markets.crypto.okx_adapter import OKXAdapter
from bagbot.trading.markets.generic_rest_adapter import GenericRESTAdapter

# Strategies
from bagbot.trading.strategies.fvg_strategy import FVGStrategy
from bagbot.trading.strategies.breaker_block_strategy import BreakerBlockStrategy
from bagbot.trading.strategies.liquidity_sweep_strategy import LiquiditySweepStrategy
from bagbot.trading.strategies.mean_reversion_strategy import MeanReversionStrategy
from bagbot.trading.strategies.supply_demand_strategy import SupplyDemandStrategy
from bagbot.trading.strategies.volatility_breakout_strategy import VolatilityBreakoutStrategy
from bagbot.trading.strategies.trend_continuation_strategy import TrendContinuationStrategy

# Knowledge System
from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine
```

## 📰 News Anchor - Market Intelligence

### Get Morning Briefing
```python
anchor = NewsAnchor()
briefing = await anchor.generate_morning_briefing()

print(f"Bias: {briefing.market_bias}")  # RISK_ON/RISK_OFF/NEUTRAL
print(f"Grade: {briefing.fundamental_grade}")  # VERY_BULLISH to VERY_BEARISH
print(f"Events: {briefing.key_events}")
```

### Get Real-Time Context
```python
context = anchor.get_market_context()
print(f"Risk Level: {context['risk_level']}")  # 0.0-1.0
print(f"Bias: {context['bias']}")
```

### Add Custom News Source
```python
def my_source_fetcher():
    return [{"title": "Event", "impact": "high"}]

def my_parser(event):
    return {"title": event["title"], "impact": 0.8}

anchor.register_source("my_source", my_source_fetcher, my_parser)
```

## 📊 Market Adapters

### TradingView - Webhook Signals
```python
adapter = TradingViewAdapter()

# Process webhook (called by FastAPI route)
webhook_data = {
    "symbol": "EURUSD",
    "action": "buy",
    "price": 1.0500,
    "indicator": "RSI_Oversold"
}
result = adapter.process_webhook(webhook_data)

# Check queue
signals = adapter.get_queued_signals()
```

### HTM - High Timeframe Model
```python
adapter = HTMAdapter()

candles = {
    TimeFrame.H4: [{"open": 1.0, "close": 1.02, "high": 1.025, "low": 0.995}],
    TimeFrame.D1: [{"open": 1.0, "close": 1.03, "high": 1.035, "low": 0.99}],
    TimeFrame.W1: [{"open": 1.0, "close": 1.05, "high": 1.055, "low": 0.98}]
}

bias = adapter.analyze_direction_bias(candles)
print(f"Direction: {bias['direction']}")  # STRONG_BULLISH/BULLISH/NEUTRAL/BEARISH/STRONG_BEARISH
print(f"Confidence: {bias['confidence']}")
```

### Oanda - Forex Trading
```python
adapter = OandaAdapter(
    api_key="your_key",
    account_id="your_account",
    practice=True  # Use practice account
)

await adapter.connect()
price = await adapter.get_price("EURUSD")
order = await adapter.create_order("EURUSD", "buy", 0.01, stop_loss=1.0450)
```

### Bybit - Crypto Futures
```python
adapter = BybitAdapter(
    api_key="your_key",
    api_secret="your_secret",
    testnet=True
)

await adapter.connect()
price = await adapter.get_price("BTCUSDT")
```

### Generic REST - Any Exchange
```python
adapter = GenericRESTAdapter(base_url="https://api.exchange.com")

# Configure custom endpoint
adapter.configure_endpoint(
    name="get_price",
    method="GET",
    path="/v1/ticker/{symbol}",
    response_parser=lambda r: r.json()["last_price"]
)

price = await adapter._request("get_price", symbol="BTCUSD")
```

## 🎯 Pro Strategies

### FVG Strategy - Fair Value Gaps
```python
strategy = FVGStrategy(min_gap_size=0.001)

candles = [
    {"high": 1.0000, "low": 0.9950, "close": 0.9980},
    {"high": 1.0100, "low": 1.0000, "close": 1.0050},  # Gap
    {"high": 1.0150, "low": 1.0050, "close": 1.0120},
]

signal = strategy.analyze(candles)
if signal:
    print(f"{signal['action']} at {signal['entry']}")
```

### Liquidity Sweep - Stop Hunts
```python
strategy = LiquiditySweepStrategy(sweep_threshold=0.001)
signal = strategy.analyze(candles)
```

### Mean Reversion - Range Trading
```python
strategy = MeanReversionStrategy(period=20, std_dev=2.0)
signal = strategy.analyze(candles)
```

### Supply/Demand - Zone Trading
```python
strategy = SupplyDemandStrategy(zone_strength_min=2)
signal = strategy.analyze(candles)
```

### Volatility Breakout - High Volatility
```python
strategy = VolatilityBreakoutStrategy(atr_period=14, breakout_multiplier=2.0)
signal = strategy.analyze(candles)
```

### Trend Continuation - Pullbacks
```python
strategy = TrendContinuationStrategy(trend_period=50, pullback_percent=0.382)
signal = strategy.analyze(candles)
```

## 🧠 Knowledge Ingestion Engine

### Initialize Engine
```python
engine = KnowledgeIngestionEngine(knowledge_dir="data/knowledge")
```

### Ingest Text
```python
text = """
Order blocks are institutional accumulation zones.
Fair value gaps indicate price imbalances.
Risk management is crucial for long-term success.
"""

result = engine.ingest_text(text, source="trading_notes")
print(f"Extracted {result['concepts_extracted']} concepts")
```

### Ingest PDF
```python
result = engine.ingest_pdf("path/to/trading_book.pdf")
```

### Learn from Market Data
```python
candles = [
    {"high": 1.01, "low": 1.00, "close": 1.005, "timestamp": "2024-01-01T00:00:00"},
    {"high": 1.03, "low": 1.00, "close": 1.025, "timestamp": "2024-01-01T01:00:00"},
]

result = engine.ingest_market_data(candles, symbol="EURUSD")
```

### Get Summary
```python
summary = engine.get_knowledge_summary()
print(f"Total concepts: {summary['total_concepts']}")
print(f"By category: {summary['by_category']}")
print(f"Latest: {summary['latest_concepts']}")
```

### Apply Knowledge
```python
updates = engine.apply_knowledge_to_systems()
print(f"Strategy updates: {updates['strategy_updates']}")
print(f"Risk updates: {updates['risk_updates']}")
print(f"Psychology updates: {updates['psychology_updates']}")
```

## 🛠️ Knowledge CLI Tool

### Upload Text
```bash
python scripts/knowledge_feeder_cli.py text "FVG indicates imbalance"
```

### Upload PDF
```bash
python scripts/knowledge_feeder_cli.py pdf trading_psychology.pdf
```

### Get Summary
```bash
python scripts/knowledge_feeder_cli.py summary
```

### Apply Knowledge
```bash
python scripts/knowledge_feeder_cli.py apply
```

## 🌐 Knowledge API Endpoints

### Upload PDF
```python
import requests

files = {"file": open("trading_book.pdf", "rb")}
response = requests.post("http://localhost:8000/knowledge/upload", files=files)
```

### Ingest Text
```python
data = {"content": "Order blocks mark zones", "source": "api"}
response = requests.post("http://localhost:8000/knowledge/text", json=data)
```

### Get Summary
```python
response = requests.get("http://localhost:8000/knowledge/summary")
summary = response.json()
```

### Apply Knowledge
```python
response = requests.post("http://localhost:8000/knowledge/apply")
updates = response.json()
```

## 📈 Integration with Existing Systems

### With Strategy Switcher
```python
# News Anchor influences strategy selection
context = anchor.get_market_context()
if context['bias'] == 'RISK_OFF':
    switcher.prefer_conservative_strategies()
```

### With Mindset Engine
```python
# Knowledge Engine updates emotional model
engine.apply_knowledge_to_systems()  # Updates Mindset Engine
```

### With Risk Engine
```python
# News Anchor adjusts risk levels
risk_level = anchor.get_market_context()['risk_level']
risk_engine.adjust_position_size(risk_level)
```

### With Parallel Market Router
```python
# Add new adapter dynamically
router.add_adapter("bybit", BybitAdapter(...))
router.add_adapter("custom", GenericRESTAdapter(...))
```

## 🔍 Common Patterns

### Morning Routine
```python
# 1. Get market briefing
briefing = await anchor.generate_morning_briefing()

# 2. Check HTM bias
htm_bias = htm_adapter.analyze_direction_bias(candles)

# 3. Load knowledge
summary = engine.get_knowledge_summary()

# 4. Select strategies based on context
if briefing.market_bias == MarketBias.RISK_ON:
    active_strategies = [TrendContinuationStrategy(), VolatilityBreakoutStrategy()]
else:
    active_strategies = [MeanReversionStrategy(), SupplyDemandStrategy()]
```

### Real-Time Trading
```python
# 1. Get TradingView signal
signal = tradingview_adapter.get_latest_signal()

# 2. Check HTM direction
htm_bias = htm_adapter.get_current_bias()

# 3. Validate with strategy
strategy_signal = strategy.analyze(candles)

# 4. Execute if aligned
if signal and htm_bias == "BULLISH" and strategy_signal:
    execute_trade(strategy_signal)
```

### Learning Loop
```python
# Continuous education
while True:
    # 1. Ingest new knowledge
    engine.ingest_text(daily_notes)
    
    # 2. Learn from market
    engine.ingest_market_data(recent_candles, symbol)
    
    # 3. Apply updates
    engine.apply_knowledge_to_systems()
    
    await asyncio.sleep(86400)  # Daily
```

## 📋 Checklist for Production

- [ ] Add real API keys for all adapters
- [ ] Configure TradingView webhook secret
- [ ] Set up news source API keys
- [ ] Install python-multipart for file uploads
- [ ] Add PyPDF2/pdfplumber for PDF parsing
- [ ] Test each adapter with real market data
- [ ] Upload initial knowledge base (trading books)
- [ ] Configure HTM timeframes for your strategy
- [ ] Set up monitoring for adapter health
- [ ] Test Knowledge Engine learning cycle

## 🎯 Key Files

- `bagbot/trading/news_anchor.py` - Market intelligence
- `bagbot/trading/markets/tradingview_adapter.py` - TradingView integration
- `bagbot/trading/markets/htm/htm_adapter.py` - High timeframe model
- `bagbot/trading/strategies/*.py` - 8 pro strategies
- `bagbot/trading/knowledge_ingestion_engine.py` - Learning system
- `bagbot/scripts/knowledge_feeder_cli.py` - CLI tool
- `bagbot/api/knowledge_feeder_api.py` - REST API

## 📚 Documentation

- `docs/PHASE_4_COMPLETE.md` - Full implementation guide
- `docs/PHASE_4_PROGRESS.md` - Development progress
- `tests/test_phase4_strategies.py` - Strategy tests
- `tests/test_knowledge_engine.py` - Knowledge system tests

---
**Phase 4 Complete: The bot can now trade globally, learn continuously, and evolve beyond its code.**
