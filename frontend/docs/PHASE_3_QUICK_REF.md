# Phase 3 Quick Reference

## 🚀 Quick Start

```python
# Initialize all Phase 3 systems
from bagbot.trading.risk_engine import RiskEngine, RiskMode
from bagbot.trading.news_filter import NewsFilter
from bagbot.trading.streak_manager import StreakManager
from bagbot.trading.strategy_switcher import StrategySwitcher
from bagbot.trading.markets import ParallelMarketRouter
from bagbot.trading.markets.crypto import BinanceAdapter

# Setup
risk = RiskEngine()
news = NewsFilter()
streak = StreakManager()
switcher = StrategySwitcher()
router = ParallelMarketRouter()

# Configure
risk.set_risk_mode(RiskMode.NORMAL)
router.register_adapter(BinanceAdapter(testnet=True))
await router.start()
```

## 📊 Common Operations

### Calculate Position Size
```python
result = risk.calculate_position_size(
    account_balance=10000,
    symbol="EURUSD",
    entry_price=1.1000,
    stop_loss_price=1.0950
)
print(f"Size: {result.position_size}")
```

### Check News Safety
```python
decision = await news.check_trading_conditions(symbols=["EURUSD"])
if decision.safe_to_trade:
    position_size *= decision.position_size_multiplier
```

### Get Strategy Recommendation
```python
rec = switcher.get_recommendation(
    market_conditions={"volatility": 0.5},
    streak_manager_status=streak.get_status(),
    news_filter_status=news.get_status(),
    mindset_state="calm",
    current_spread=1.2
)
print(f"Use: {rec.strategy_name}")
```

### Record Trade
```python
# Update all systems
risk.record_trade_result(pnl=50, market="forex", strategy="mtf")
streak.record_trade(pnl=50, strategy_name="mtf")
```

### Execute Order
```python
order = await router.create_order(
    market_name="Binance",
    symbol="BTCUSDT",
    side=OrderSide.BUY,
    quantity=0.001
)
```

## 🔐 Admin Controls

### Emergency Stop
```python
router.trigger_global_stop("System maintenance")
router.release_global_stop()
```

### Override Risk Limits
```python
risk.enable_admin_override("Manual review complete")
risk.disable_admin_override()
```

### Override News Filter
```python
news.enable_manual_override("False positive", duration_minutes=30)
news.disable_manual_override()
```

### Unlock Losing Streak
```python
streak.enable_admin_override("Assessment complete")
streak.disable_admin_override()
```

### Force Strategy Switch
```python
switcher.force_switch("conservative_scalper", "Admin decision")
```

## 📈 Monitoring

### Get All Status
```python
# Risk status
risk_status = risk.get_risk_report()

# News status
news_status = news.get_status()

# Streak status
streak_status = streak.get_status()

# Market performance
perf = router.get_market_performance()

# Strategy status
switcher_status = switcher.get_status()
```

### Key Metrics
```python
# Risk metrics
print(f"Daily loss: ${risk_status['daily_loss']}")
print(f"Drawdown: {risk_status['current_drawdown']:.1%}")

# Streak metrics
print(f"Win rate: {streak_status['metrics']['win_rate']:.1%}")
print(f"Confidence: {streak_status['confidence_score']:.1%}")

# Market health
market_health = streak.get_market_health()
print(f"Market: {market_health['state']}")
```

## 🎯 Strategy Profiles

### Available Strategies
- `micro_trend_follower` - Fast scalping, low volatility
- `mean_reversion` - Range trading, Asian session
- `conservative_scalper` - Safe plays, any condition
- `breakout_trader` - High volatility, trending markets

### Strategy Switching Logic
```
High Volatility → breakout_trader
Low Volatility → micro_trend_follower
Losing Streak → conservative_scalper
Ranging Market → mean_reversion
News Events → conservative_scalper or pause
```

## 🌍 Multi-Market Setup

### Register Markets
```python
# Crypto
router.register_adapter(BinanceAdapter(testnet=True))

# Forex
router.register_adapter(MT5Adapter(
    account=12345,
    password="pass",
    server="Demo-Server"
))

# Stocks
router.register_adapter(AlpacaAdapter(paper=True))
```

### Market-Specific Operations
```python
# Execute on specific market
await router.create_order(market_name="Binance", ...)
await router.create_order(market_name="MT5", ...)
await router.create_order(market_name="Alpaca", ...)

# Stop specific market
router.trigger_market_stop("Binance", "High volatility")
```

## 🔔 News Filter Sources

### Register Sources
```python
from bagbot.trading.news_filter import parse_forexfactory_response

news.register_source(
    name="ForexFactory",
    url="https://api.forexfactory.com/calendar",
    parser=parse_forexfactory_response,
    check_interval=300
)
```

### Impact Levels
- **LOW** - Minor data releases
- **MEDIUM** - Important data, reduce size 50%
- **HIGH** - Major events, block new trades
- **CRITICAL** - NFP, FOMC, etc., full shutdown

## 🎛️ Risk Modes

### Conservative
- Risk per trade: 0.5%
- Max positions: 1
- Daily loss limit: $100

### Normal
- Risk per trade: 1.0%
- Max positions: 3
- Daily loss limit: $300

### Aggressive
- Risk per trade: 2.0%
- Max positions: 5
- Daily loss limit: $500

### Change Mode
```python
risk.set_risk_mode(RiskMode.CONSERVATIVE)
risk.set_risk_mode(RiskMode.NORMAL)
risk.set_risk_mode(RiskMode.AGGRESSIVE)
```

## 📁 State Files

```
data/state/
├── risk_state.json       # Risk limits, daily loss
└── streak_state.json     # Win/loss tracking
```

### Manual State Reset
```python
# Reset streak
streak.reset_streak()

# Reset daily limits
risk.reset_daily()
```

## ⚠️ Safety Checks

### Before Trading
```python
# 1. Check news
if not (await news.check_trading_conditions(symbols)).safe_to_trade:
    return  # Skip trade

# 2. Check risk limits
if risk.is_emergency_active():
    return  # Daily limit hit

# 3. Check streak lock
if streak.is_locked():
    return  # Too many losses

# 4. Check market health
if streak.get_market_health()['state'] == 'unhealthy':
    return  # Poor conditions
```

## 🔧 Troubleshooting

### Reset Everything
```python
# Clear admin overrides
risk.disable_admin_override()
news.disable_manual_override()
streak.disable_admin_override()

# Reset daily limits
risk.reset_daily()

# Release emergency stops
router.release_global_stop()
```

### Check System Health
```python
# Risk engine OK?
assert not risk.is_emergency_active()

# Markets connected?
assert router.running

# No manual overrides?
assert not news.manual_override
assert not streak.admin_override
```

## 📞 Integration Points

### With Phase 2 Systems

```python
# Mindset Engine
mindset_multiplier = mindset.get_emotional_multiplier()
position_size *= mindset_multiplier

# Strategy Arsenal
active_strategy = arsenal.get_active_strategy()
recommendation = switcher.get_recommendation(...)

# Market Router
order = await router.create_order(...)
```

## 🎯 Complete Trading Flow

```python
async def trade():
    # 1. Check news
    news_ok = (await news.check_trading_conditions(["EURUSD"])).safe_to_trade
    
    # 2. Get strategy
    rec = switcher.get_recommendation(...)
    
    # 3. Calculate size
    size = risk.calculate_position_size(...)
    
    # 4. Apply multipliers
    final_size = (
        size.position_size *
        news.check_trading_conditions(...).position_size_multiplier *
        streak.get_risk_multiplier()
    )
    
    # 5. Execute
    order = await router.create_order(
        market_name="MT5",
        symbol="EURUSD",
        side=OrderSide.BUY,
        quantity=final_size
    )
    
    # 6. Record (after close)
    risk.record_trade_result(pnl=50, market="forex", strategy=rec.strategy_name)
    streak.record_trade(pnl=50, strategy_name=rec.strategy_name)
```

---

**Phase 3 Systems Ready! 🚀**

For full documentation, see: `docs/PHASE_3_COMPLETE.md`
