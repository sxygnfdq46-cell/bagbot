# BAGBOT2 Phase 2 Quick Reference

## 🚀 Quick Start

### 1. Run the Complete Demo

```bash
cd /Users/bagumadavis/Desktop/bagbot
source .venv/bin/activate
python brain_demo.py
```

This demonstrates:
- Mindset Engine
- Strategy Arsenal
- Micro Trend Follower
- Subscription System

---

## 🧠 Mindset Engine

### Initialize

```python
from bagbot.trading.mindset_engine import MindsetEngine

mindset = MindsetEngine()
mindset.reset_daily(starting_equity=10000.0)
```

### Check if Trading is Allowed

```python
trade = {"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}
can_trade, reason = mindset.should_trade(current_equity=10500.0, proposed_trade=trade)

if can_trade:
    # Execute trade
    pass
else:
    print(f"Blocked: {reason}")
```

### Record Trade Outcome

```python
mindset.record_trade_outcome(
    trade={"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1},
    profit=50.0,
    profit_percent=0.5
)
```

### Daily Evaluation

```python
metrics = mindset.evaluate_daily_performance(current_equity=10550.0)
print(f"Grade: {metrics.grade}")
print(f"P&L: ${metrics.pnl:+.2f} ({metrics.pnl_percent:+.2f}%)")
print(f"Emotional State: {metrics.emotional_state}")
```

### Get Risk Multiplier

```python
multiplier = mindset.get_risk_multiplier()
# 0.0 (locked) to 1.25 (confident)
```

---

## 🎯 Strategy Arsenal

### Initialize and Register Strategies

```python
from bagbot.trading.strategy_arsenal import StrategyArsenal
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower

arsenal = StrategyArsenal()

# Register strategy
micro = MicroTrendFollower()
arsenal.register_strategy(micro, auto_activate=True)
```

### Get Signals

```python
market_data = {"price": 50000, "volume": 1000}
account = {"balance": 10000, "equity": 10500}

signals = arsenal.get_all_signals(market_data, account)

for signal in signals:
    print(f"{signal.strategy_name}: {signal.side} {signal.symbol}")
```

### Process Ticks (for tick-based strategies)

```python
tick = {
    "symbol": "BTCUSDT",
    "price": 50000.12,
    "volume": 0.5,
    "timestamp": "2025-11-24T12:00:00Z"
}

signals = arsenal.route_tick(tick)
```

### Notify of Trade Execution

```python
trade = {
    "strategy_name": "MicroTrendFollower",
    "symbol": "BTCUSDT",
    "side": "buy",
    "price": 50000.0
}

arsenal.notify_trade_executed(trade)
arsenal.notify_trade_closed(trade, profit=50.0)
```

### Manage Strategies

```python
# Activate
arsenal.activate_strategy("MicroTrendFollower")

# Deactivate
arsenal.deactivate_strategy("MicroTrendFollower")

# List all
strategies = arsenal.get_strategy_list()

# Get status
status = arsenal.get_strategy_status("MicroTrendFollower")
```

---

## ⚡ Micro Trend Follower

### Configuration

```python
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower
from bagbot.trading.strategy_arsenal import StrategyConfig

config = StrategyConfig(
    enabled=True,
    position_size_percent=0.5,
    stop_loss_percent=0.5,
    take_profit_percent=1.0,
    custom_params={
        "tick_threshold": 0.0001,
        "reversal_threshold": 0.0002,
        "order_cooldown_ms": 100,
        "max_orders_per_minute": 20
    }
)

strategy = MicroTrendFollower(config)
```

### Process Tick

```python
tick = {
    "symbol": "BTCUSDT",
    "price": 50000.12,
    "volume": 0.5,
    "bid": 50000.10,
    "ask": 50000.14,
    "timestamp": "2025-11-24T12:00:00Z"
}

signal = strategy.on_tick(tick)

if signal:
    print(f"{signal.side} @ ${signal.entry_price:.4f}")
    print(f"Stop Loss: ${signal.stop_loss:.4f}")
    print(f"Reason: {signal.reason}")
```

### Get Statistics

```python
stats = strategy.get_statistics()
print(f"Ticks: {stats['total_ticks_processed']}")
print(f"Signals: {stats['signals_generated']}")
print(f"Reversals: {stats['reversals_count']}")
```

---

## 💳 Subscription System

### Create API Token (Admin)

```bash
curl -X POST http://localhost:8000/api/subscription/tokens \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "tier": "pro",
    "name": "My Bot Token",
    "expires_in_days": 365
  }'
```

Response:
```json
{
  "token": "long_random_string_SAVE_THIS",
  "token_prefix": "abcd1234",
  "tier": "pro",
  "daily_call_limit": 50000
}
```

### Use API Token

```bash
curl http://localhost:8000/api/some-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User's Tokens

```bash
curl http://localhost:8000/api/subscription/tokens/user123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Upgrade Token

```bash
curl -X PUT http://localhost:8000/api/subscription/tokens/1/upgrade?new_tier=enterprise \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Revoke Token

```bash
curl -X DELETE http://localhost:8000/api/subscription/tokens/1?reason=Abuse \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Get Usage Statistics

```bash
curl http://localhost:8000/api/subscription/usage/user123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Tier Limits (Public)

```bash
curl http://localhost:8000/api/subscription/tiers
```

---

## 🧪 Run Tests

```bash
# All tests
pytest bagbot/tests/test_mindset_engine.py -v
pytest bagbot/tests/test_strategy_arsenal.py -v
pytest bagbot/tests/test_subscription_manager.py -v

# Specific test
pytest bagbot/tests/test_mindset_engine.py::test_daily_reset -v
```

---

## 🔧 Environment Variables

Add to `.env` or set in environment:

```bash
# Mindset Engine
DAILY_PROFIT_TARGET_PERCENT=1.0
MAX_DAILY_LOSS_PERCENT=3.0
MAX_TRADES_PER_DAY=20
REVENGE_TRADE_COOLDOWN=30

# Subscription
DATABASE_URL=sqlite:///./bagbot.db
ADMIN_TOKEN=your-secure-admin-token-here

# Existing
MAX_ORDER_USD=10000.0
DEFAULT_STOP_LOSS_PERCENT=2.0
```

---

## 📊 Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **API Calls/Day** | 1,000 | 50,000 | Unlimited |
| **API Calls/Min** | 10 | 100 | 1,000 |
| **Max Strategies** | 1 | 5 | Unlimited |
| **Max Positions** | 3 | 20 | Unlimited |
| **Max Order Value** | $100 | $10,000 | Unlimited |
| **Advanced Strategies** | ❌ | ✅ | ✅ |
| **Tick Data Access** | ❌ | ✅ | ✅ |
| **Multi-Market** | ❌ | ✅ | ✅ |
| **WebSocket** | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |

---

## 🔐 Authentication Flow

1. **Public endpoints**: No auth required
   - `/api/subscription/tiers`
   - `/health`
   - `/docs`

2. **User endpoints**: Require API token
   - `Authorization: Bearer <token>`
   - Rate-limited by tier

3. **Admin endpoints**: Require admin token
   - `Authorization: Bearer <admin_token>`
   - Set via `ADMIN_TOKEN` env var

---

## 🌐 Multi-Market Router (Coming Soon)

```python
from bagbot.trading.market_router import MarketRouter, MarketType

router = MarketRouter()

# Register connectors
router.register_connector(MarketType.CRYPTO, binance_connector)
router.register_connector(MarketType.FOREX, mt5_connector)

# Register symbols
router.register_symbol("BTCUSDT", MarketType.CRYPTO)
router.register_symbol("EURUSD", MarketType.FOREX)

# Place order (routes automatically)
order = await router.place_order("BTCUSDT", order_request)

# Get aggregated account info
summary = await router.get_account_summary()
```

---

## 📝 Integration Checklist

- [x] Mindset Engine implemented
- [x] Strategy Arsenal implemented
- [x] Micro Trend Follower implemented
- [x] Subscription system implemented
- [x] API routes created
- [x] Tests written
- [ ] Add subscription routes to main.py
- [ ] Enable subscription middleware
- [ ] Set ADMIN_TOKEN in production
- [ ] Create initial API tokens
- [ ] Integrate with live market data
- [ ] Deploy to production

---

## 🚨 Common Issues

### Token validation fails
- Check token format: `Bearer <token>`
- Verify token not expired
- Check database connection

### Rate limit hit
- Check tier limits
- Upgrade tier if needed
- Use admin override for testing

### Mindset blocks trade
- Check emotional state
- Review daily P&L
- Check revenge trade cooldown
- Verify not at daily trade limit

### Strategy not generating signals
- Verify strategy is activated
- Check if tick-based strategy receiving ticks
- Review strategy configuration

---

## 📚 Documentation

- **Full Architecture**: `BRAIN_ARCHITECTURE.md`
- **Demo Script**: `brain_demo.py`
- **Test Files**: `bagbot/tests/test_*.py`
- **Inline Docs**: All modules have comprehensive docstrings

---

## 🆘 Need Help?

1. Read inline code comments
2. Check test files for usage examples
3. Run `python brain_demo.py` to see everything working
4. Review `BRAIN_ARCHITECTURE.md` for detailed explanations

**Happy Trading! 🚀**
