# BAGBOT2 Phase 2 - Brain Architecture

## 🧠 Overview

This document describes the complete architecture for BAGBOT2's Phase 2 implementation:
1. **Mindset Engine v2** - Advanced trading psychology
2. **Strategy Arsenal System** - Plugin-based strategy framework
3. **Micro Trend Follower** - Ultra-fast tick-based strategy
4. **Multi-Market Router** - Cross-market trading support
5. **Subscription Framework** - Tiered access control

---

## 📁 File Structure

```
bagbot/
├── trading/
│   ├── mindset_engine.py          # NEW: Enhanced psychological engine
│   ├── strategy_arsenal.py        # NEW: Strategy plugin framework
│   ├── market_router.py           # NEW: Multi-market abstraction
│   ├── strategies/
│   │   ├── __init__.py
│   │   └── micro_trend_follower.py  # NEW: Tick-based strategy
│   ├── mindset.py                 # EXISTING: Basic mindset
│   ├── risk_manager.py            # EXISTING
│   └── order_router.py            # EXISTING
├── backend/
│   ├── subscription_manager.py    # NEW: Token & tier management
│   ├── subscription_middleware.py # NEW: Auth middleware
│   └── models.py                  # EXISTING: Will be extended
├── api/
│   └── subscription_routes.py     # NEW: Subscription API
└── data/
    └── state/
        ├── mindset_state.json         # NEW: Psychological state
        ├── daily_metrics.json         # NEW: Performance history
        └── strategy_confidence.json   # NEW: Strategy performance
```

---

## 🧠 1. Mindset Engine v2

### Philosophy

```
"My job is simple: protect capital, protect gains, always end each day positive.
I reset every midnight, but I never sleep.
I evaluate my performance daily.
I stay calm, never panic, never revenge trade.
I take small wins consistently rather than chasing big risks."
```

### Key Features

**Emotional States:**
- `CALM` - Normal operations
- `CAUTIOUS` - After small loss
- `DEFENSIVE` - After significant loss (reduced position sizing)
- `CONFIDENT` - After consistent wins (increased allocation)
- `LOCKED` - Emergency circuit breaker activated

**Daily Cycle:**
- Automatic reset at midnight
- Starting equity tracking
- Performance grading (A+ to F)
- Trade counting and rate limiting
- Win/loss streak tracking

**Guardrails:**
- Daily loss limits (default: 3%)
- Max trades per day (default: 20)
- Revenge trade cooldown (default: 30 min)
- Risk multiplier based on emotional state
- Circuit breaker on excessive losses

### Usage Example

```python
from bagbot.trading.mindset_engine import MindsetEngine

# Initialize
engine = MindsetEngine()

# Check if trading is allowed
current_equity = 10000.0
trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}

can_trade, reason = engine.should_trade(current_equity, trade)
if can_trade:
    # Execute trade
    pass
else:
    print(f"Trade blocked: {reason}")

# Record trade outcome
engine.record_trade_outcome(
    trade=trade,
    profit=50.0,
    profit_percent=0.5
)

# Daily evaluation
metrics = engine.evaluate_daily_performance(current_equity)
print(f"Grade: {metrics.grade} | P&L: ${metrics.pnl:.2f}")
```

---

## 🎯 2. Strategy Arsenal System

### Architecture

The Strategy Arsenal provides a plugin-based framework where multiple strategies can coexist, compete, and be managed independently.

**Base Strategy Class:**
```python
class BaseStrategy(ABC):
    @abstractmethod
    def generate_signals(market_data, account) -> List[Signal]
    
    @abstractmethod
    def on_tick(tick) -> Optional[Signal]
    
    @abstractmethod
    def on_trade_executed(trade) -> None
    
    @abstractmethod
    def on_trade_closed(trade, profit) -> None
```

**Strategy Metadata:**
- Name, version, author
- Strategy type (trend, mean reversion, etc.)
- Timeframe (tick, 1m, 1h, etc.)
- Supported markets (crypto, forex, stocks)
- Risk level (1-5)
- Default risk parameters

**Strategy Arsenal Manager:**
- Register/unregister strategies
- Activate/deactivate strategies
- Route market data to active strategies
- Collect and prioritize signals
- Track per-strategy performance

### Usage Example

```python
from bagbot.trading.strategy_arsenal import StrategyArsenal
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower

# Initialize arsenal
arsenal = StrategyArsenal()

# Register strategies
micro_strategy = MicroTrendFollower()
arsenal.register_strategy(micro_strategy, auto_activate=True)

# Get signals from all active strategies
market_data = {"price": 50000, "volume": 1000}
account = {"balance": 10000, "equity": 10500}

signals = arsenal.get_all_signals(market_data, account)

# Process signals
for signal in signals:
    print(f"{signal.strategy_name}: {signal.side} {signal.symbol} @ {signal.strength}")
```

---

## ⚡ 3. Micro Trend Follower Strategy

### Design

Ultra-fast tick-based strategy that follows candle movements in real-time.

**Core Logic:**
- Process every tick (millisecond resolution)
- Go long on upward ticks
- Flip short on downward reversals
- No hesitation, instant reactions
- Tight stop-loss protection

**Parameters:**
```python
config = {
    "tick_threshold": 0.0001,        # Min price move to trigger
    "reversal_threshold": 0.0002,    # Price move to flip position
    "order_cooldown_ms": 100,        # Min time between orders
    "spread_compensation": True,     # Account for bid/ask spread
    "slippage_buffer": 0.0001,      # Slippage protection
    "momentum_window": 10,           # Ticks for momentum calculation
    "max_orders_per_minute": 20     # Rate limiting
}
```

**Position Logic:**
```
NO POSITION:
  - Upward tick + positive momentum → Go LONG
  - Downward tick + negative momentum → Go SHORT

LONG POSITION:
  - Large downward reversal → Flip to SHORT
  - Stop loss hit → Close position
  - Take profit hit → Close position

SHORT POSITION:
  - Large upward reversal → Flip to LONG
  - Stop loss hit → Close position
  - Take profit hit → Close position
```

### Usage Example

```python
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower

# Initialize
strategy = MicroTrendFollower()
strategy.activate()

# Process tick
tick = {
    "symbol": "BTCUSDT",
    "price": 50000.12,
    "volume": 0.5,
    "bid": 50000.10,
    "ask": 50000.14,
    "timestamp": "2025-11-24T12:00:00.123Z"
}

signal = strategy.on_tick(tick)

if signal:
    print(f"Signal: {signal.side} {signal.symbol} @ ${signal.entry_price:.4f}")
    print(f"Stop Loss: ${signal.stop_loss:.4f}")
    print(f"Reason: {signal.reason}")
```

---

## 🌐 4. Multi-Market Router

### Design

Unified interface for trading across different markets and brokers.

**Supported Markets:**
- Crypto (Binance, Coinbase, Kraken, etc.)
- Forex (MT5, OANDA, etc.)
- Stocks (Alpaca, Interactive Brokers, etc.)
- Futures
- Options

**Connector Interface:**
```python
class MarketConnector(ABC):
    async def connect() -> bool
    async def get_account_info() -> AccountInfo
    async def place_order(order_request) -> Order
    async def get_positions() -> List[Position]
    async def subscribe_to_ticks(symbol, callback) -> bool
```

### Usage Example

```python
from bagbot.trading.market_router import MarketRouter, MarketType, OrderRequest, OrderSide, OrderType
from bagbot.trading.binance_connector import BinanceConnector

# Initialize router
router = MarketRouter()

# Register connectors
binance = BinanceConnector(config={...})
router.register_connector(MarketType.CRYPTO, binance)

# Register symbols
router.register_symbol("BTCUSDT", MarketType.CRYPTO)

# Place order (routes to correct connector)
order_request = OrderRequest(
    symbol="BTCUSDT",
    side=OrderSide.BUY,
    order_type=OrderType.MARKET,
    quantity=0.1
)

order = await router.place_order("BTCUSDT", order_request)

# Get aggregated account info
summary = await router.get_account_summary()
print(f"Total Equity: ${summary['total_equity']:.2f}")
```

---

## 💳 5. Subscription Framework

### Tier System

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| API Calls/Day | 1,000 | 50,000 | Unlimited |
| API Calls/Min | 10 | 100 | 1,000 |
| Strategies | 1 | 5 | Unlimited |
| Positions | 3 | 20 | Unlimited |
| Max Order Size | $100 | $10,000 | Unlimited |
| Advanced Strategies | ❌ | ✅ | ✅ |
| Tick Data | ❌ | ✅ | ✅ |
| Multi-Market | ❌ | ✅ | ✅ |
| WebSocket | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### API Token Management

**Create Token (Admin):**
```bash
curl -X POST http://localhost:8000/api/subscription/tokens \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "tier": "pro",
    "name": "My Trading Bot",
    "expires_in_days": 365
  }'
```

**Use Token:**
```bash
curl http://localhost:8000/api/strategy/status \
  -H "Authorization: Bearer <user_token>"
```

**Token Validation Flow:**
1. Extract token from `Authorization: Bearer <token>` header
2. Hash and lookup in database
3. Check status, expiry, rate limits
4. Record API call
5. Attach token info to request
6. Return response with rate limit headers

---

## 🔧 Integration Steps

### Step 1: Add Subscription Routes to Main App

Edit `bagbot/backend/main.py`:

```python
from fastapi import FastAPI
from .api.subscription_routes import router as subscription_router
from .backend.subscription_manager import SubscriptionManager
from .backend.subscription_middleware import SubscriptionAuthMiddleware

app = FastAPI()

# Initialize subscription manager
subscription_manager = SubscriptionManager()

# Add subscription middleware (optional - enable when ready)
# app.add_middleware(SubscriptionAuthMiddleware, subscription_manager=subscription_manager)

# Include routes
app.include_router(subscription_router)
```

### Step 2: Create Initial API Token

```bash
# Set admin token
export ADMIN_TOKEN="your-secure-admin-token-here"

# Start server
uvicorn backend.main:app --reload

# Create free tier token for testing
curl -X POST http://localhost:8000/api/subscription/tokens \
  -H "Authorization: Bearer your-secure-admin-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "tier": "free",
    "name": "Development Token"
  }'

# Save the returned token!
```

### Step 3: Initialize Mindset Engine

```python
# In your main trading loop
from bagbot.trading.mindset_engine import MindsetEngine

mindset = MindsetEngine()

# At midnight or on startup
mindset.reset_daily(current_equity=10000.0)

# Before each trade
can_trade, reason = mindset.should_trade(current_equity, proposed_trade)

# After each trade
mindset.record_trade_outcome(trade, profit, profit_percent)

# End of day
metrics = mindset.evaluate_daily_performance(current_equity)
```

### Step 4: Register Strategies

```python
from bagbot.trading.strategy_arsenal import StrategyArsenal
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower

arsenal = StrategyArsenal()

# Register micro trend follower
micro_strategy = MicroTrendFollower()
arsenal.register_strategy(micro_strategy, auto_activate=True)

# Add more strategies as they're developed
```

### Step 5: Set Up Multi-Market Support

```python
from bagbot.trading.market_router import MarketRouter, MarketType
from bagbot.trading.binance_connector import BinanceConnector  # Existing

router = MarketRouter()

# Register Binance for crypto
binance = BinanceConnector(api_key=..., api_secret=...)
await binance.connect()
router.register_connector(MarketType.CRYPTO, binance)

# Register symbols
router.register_symbol("BTCUSDT", MarketType.CRYPTO)
router.register_symbol("ETHUSDT", MarketType.CRYPTO)

# Future: Add MT5 for forex, Alpaca for stocks, etc.
```

---

## 🧪 Testing Plan

### 1. Mindset Engine Tests

```bash
# Test emotional state transitions
pytest tests/test_mindset_engine.py::test_emotional_states

# Test daily reset
pytest tests/test_mindset_engine.py::test_daily_reset

# Test revenge trade prevention
pytest tests/test_mindset_engine.py::test_revenge_trade_cooldown

# Test circuit breaker
pytest tests/test_mindset_engine.py::test_circuit_breaker
```

### 2. Strategy Arsenal Tests

```bash
# Test strategy registration
pytest tests/test_strategy_arsenal.py::test_register_strategy

# Test signal generation
pytest tests/test_strategy_arsenal.py::test_collect_signals

# Test performance tracking
pytest tests/test_strategy_arsenal.py::test_performance_tracking
```

### 3. Micro Trend Follower Tests

```bash
# Test tick processing
pytest tests/test_micro_trend_follower.py::test_tick_processing

# Test position reversal
pytest tests/test_micro_trend_follower.py::test_position_reversal

# Test stop loss
pytest tests/test_micro_trend_follower.py::test_stop_loss
```

### 4. Subscription System Tests

```bash
# Test token creation
pytest tests/test_subscription.py::test_create_token

# Test token validation
pytest tests/test_subscription.py::test_validate_token

# Test rate limiting
pytest tests/test_subscription.py::test_rate_limiting

# Test tier limits
pytest tests/test_subscription.py::test_tier_limits
```

---

## 🚀 Deployment Checklist

- [ ] Database migration for subscription tables
- [ ] Set `ADMIN_TOKEN` in production environment
- [ ] Create production API tokens
- [ ] Enable subscription middleware in main.py
- [ ] Configure rate limits per tier
- [ ] Set up monitoring for:
  - Daily mindset resets
  - Strategy performance
  - API token usage
  - Rate limit violations
- [ ] Test all authentication flows
- [ ] Document API token management for users

---

## 📊 Monitoring & Observability

**Key Metrics to Track:**

1. **Mindset Engine:**
   - Current emotional state
   - Daily P&L
   - Consecutive wins/losses
   - Circuit breaker triggers

2. **Strategy Arsenal:**
   - Active strategies count
   - Signals generated per strategy
   - Win rate per strategy
   - Average profit per strategy

3. **Subscription System:**
   - API calls per tier
   - Rate limit violations
   - Token creation/revocation
   - Usage by endpoint

**Logging:**
```python
# All systems use structured logging
logger.info(f"🧠 Emotional state: {state}")
logger.info(f"⚡ Signal generated: {signal}")
logger.info(f"💳 Token validated: {token.tier}")
```

---

## 🔮 Future Enhancements

1. **More Strategies:**
   - Mean reversion
   - Breakout detection
   - Grid trading
   - Arbitrage

2. **Advanced Features:**
   - Strategy backtesting API
   - Live strategy competition
   - Auto strategy selection
   - Portfolio optimization

3. **Multi-Market Expansion:**
   - MT5 connector (Forex)
   - Alpaca connector (US Stocks)
   - Options trading support

4. **AI Integration:**
   - Sentiment analysis
   - Pattern recognition
   - Predictive modeling
   - Strategy optimization

---

## 📞 Support

For questions about this architecture:
- Check inline code comments
- Review test files for usage examples
- See `QUICK_REFERENCE.txt` for common operations

**End of Brain Architecture Document**
