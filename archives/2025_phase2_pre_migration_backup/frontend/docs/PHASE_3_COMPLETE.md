# Phase 3 Complete - Advanced Trading Intelligence

## 🎯 Overview

Phase 3 adds the advanced intelligence layer to BAGBOT2, focusing on risk management, news awareness, multi-market parallel execution, performance tracking, and intelligent strategy switching.

## ✅ Completed Components

### 1. Risk Engine (`bagbot/trading/risk_engine.py`)

**Purpose:** Unified risk management across all strategies and markets.

**Key Features:**
- Position sizing with volatility adjustment
- Daily loss limits with kill-switch
- Drawdown management (soft + hard limits)
- Risk modes: Conservative, Normal, Aggressive
- Dynamic risk scaling with Mindset Engine integration
- Emergency shutdown mechanism
- Spread & slippage detection
- Multi-market risk isolation (max 50% per market)
- State persistence to JSON files

**Usage:**
```python
from bagbot.trading.risk_engine import RiskEngine, RiskMode

# Initialize
engine = RiskEngine()

# Configure risk mode
engine.set_risk_mode(RiskMode.AGGRESSIVE)

# Calculate position size
result = engine.calculate_position_size(
    account_balance=10000,
    symbol="EURUSD",
    entry_price=1.1000,
    stop_loss_price=1.0950,
    current_volatility=0.015,
    current_spread_pips=1.5
)

print(f"Position size: {result.position_size}")
print(f"Risk amount: ${result.risk_amount:.2f}")

# Record trade result
engine.record_trade_result(
    pnl=50.0,
    market="forex",
    strategy="micro_trend_follower"
)

# Check if emergency stop triggered
if engine.is_emergency_active():
    print("Trading locked due to risk limits")
```

### 2. News Filter (`bagbot/trading/news_filter.py`)

**Purpose:** Smart fundamental shield to prevent trading during dangerous news conditions.

**Key Features:**
- Multiple news sources (ForexFactory, Binance, TradingView webhooks)
- Impact levels: Low, Medium, High, Critical
- Filter modes: Allow, Soft Filter, Hard Filter, Kill Switch
- Automatic event detection (NFP, FOMC, CPI, etc.)
- Manual override with time expiry
- Crypto-specific volatility warnings
- Position size multipliers based on news risk

**Usage:**
```python
from bagbot.trading.news_filter import NewsFilter, parse_forexfactory_response

# Initialize
filter = NewsFilter()

# Register news source
filter.register_source(
    name="ForexFactory",
    url="https://api.forexfactory.com/calendar",
    parser=parse_forexfactory_response,
    check_interval=300  # Check every 5 minutes
)

# Check trading conditions
decision = await filter.check_trading_conditions(
    symbols=["EURUSD", "GBPUSD"],
    current_time=datetime.now()
)

if decision.safe_to_trade:
    position_size *= decision.position_size_multiplier
    print(f"Safe to trade (multiplier: {decision.position_size_multiplier})")
else:
    print(f"Trading blocked: {decision.reason}")

# Manual override
filter.enable_manual_override(
    reason="Admin review completed",
    duration_minutes=30
)
```

### 3. Multi-Market Router (`bagbot/trading/markets/`)

**Purpose:** Parallel multi-market execution with per-market risk management.

**Architecture:**
- **Base Interface:** `market_adapter.py` - Abstract adapter for all markets
- **Parallel Router:** `parallel_router.py` - Coordinates multiple market pipelines
- **Crypto:** `crypto/binance_adapter.py` - Binance adapter
- **Forex:** `forex/mt5_adapter.py` - MetaTrader 5 adapter
- **Stocks:** `stocks/alpaca_adapter.py` - Alpaca adapter

**Features:**
- Parallel price stream processing
- Per-market performance tracking
- Independent emergency stops per market
- Market-specific rate limiting (20 orders/min per market)
- Health score tracking
- Global emergency stop capability

**Usage:**
```python
from bagbot.trading.markets import ParallelMarketRouter
from bagbot.trading.markets.crypto import BinanceAdapter
from bagbot.trading.markets.forex import MT5Adapter
from bagbot.trading.markets.stocks import AlpacaAdapter

# Initialize router
router = ParallelMarketRouter()

# Register adapters
router.register_adapter(BinanceAdapter(testnet=True))
router.register_adapter(MT5Adapter(
    account=12345,
    password="password",
    server="Demo-Server"
))
router.register_adapter(AlpacaAdapter(paper=True))

# Start all markets in parallel
await router.start()

# Create order on specific market
order = await router.create_order(
    market_name="Binance",
    symbol="BTCUSDT",
    side=OrderSide.BUY,
    quantity=0.001
)

# Get performance across all markets
performance = router.get_market_performance()
for market, stats in performance.items():
    print(f"{market}: Win Rate {stats['win_rate']:.1%}, PnL ${stats['total_pnl']:.2f}")

# Emergency stop for specific market
router.trigger_market_stop("Binance", "Unusual volatility")
```

### 4. Streak Manager (`bagbot/trading/streak_manager.py`)

**Purpose:** Performance awareness system with automatic risk adjustment.

**Rules:**
- After 3 losses → Reduce position size by 50%
- After 5 losses → Trading locked (admin override needed)
- After 5 wins → Auto-increase risk (capped at +20%)

**Key Features:**
- Win/loss streak tracking
- Confidence score calculation (0.0 to 1.0)
- Risk multiplier adjustment
- Per-strategy performance tracking
- Market health assessment
- Admin override capability
- State persistence

**Usage:**
```python
from bagbot.trading.streak_manager import StreakManager

# Initialize
manager = StreakManager()

# Record trade results
manager.record_trade(pnl=50.0, strategy_name="micro_trend_follower")
manager.record_trade(pnl=-30.0, strategy_name="micro_trend_follower")

# Get risk multiplier
multiplier = manager.get_risk_multiplier()
position_size *= multiplier

# Check if locked
if manager.is_locked():
    print("Trading locked after losing streak")
    manager.enable_admin_override("Manual review completed")

# Get confidence score
confidence = manager.get_confidence_score()
print(f"Confidence: {confidence:.1%}")

# Get strategy health
health = manager.get_strategy_health("micro_trend_follower")
print(f"Strategy health: {health['health_score']:.1%}")
```

### 5. Strategy Switcher (`bagbot/trading/strategy_switcher.py`)

**Purpose:** Intelligent strategy selection based on market conditions.

**Switching Logic:**
- **High Volatility** → Pause Micro Trend Follower → Activate Breakout Trader
- **Low Volatility** → Activate Micro Trend Follower
- **Losing Streak** → Switch to Conservative Scalper
- **Ranging Market** → Activate Mean Reversion
- **News Events** → Pause aggressive strategies

**Key Features:**
- Market condition detection
- Time-based strategy preferences (session awareness)
- Spread-based filtering
- Confidence-based recommendations
- 15-minute cooldown between switches
- Force override capability

**Usage:**
```python
from bagbot.trading.strategy_switcher import StrategySwitcher

# Initialize
switcher = StrategySwitcher()

# Get recommendation
recommendation = switcher.get_recommendation(
    market_conditions={
        "volatility": 0.8,
        "trend_strength": 0.7
    },
    streak_manager_status=streak_manager.get_status(),
    news_filter_status=news_filter.get_status(),
    mindset_state="cautious",
    current_spread=1.5
)

print(f"Recommended: {recommendation.strategy_name}")
print(f"Confidence: {recommendation.confidence:.1%}")
print(f"Reason: {recommendation.reason}")

# Switch strategy
if switcher.switch_strategy(
    new_strategy=recommendation.strategy_name,
    reason=recommendation.reason
):
    print("Strategy switched successfully")

# Force switch (admin)
switcher.force_switch("conservative_scalper", "Admin decision")
```

## 🔗 System Integration

### Integration Flow

```
┌─────────────────┐
│  Market Data    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  News Filter    │────▶│ Risk Engine  │
└────────┬────────┘     └──────┬───────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌──────────────┐
│ Streak Manager  │────▶│  Mindset     │
└────────┬────────┘     │   Engine     │
         │              └──────┬───────┘
         ▼                      │
┌─────────────────┐             │
│   Strategy      │◀────────────┘
│   Switcher      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Strategy      │
│   Arsenal       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Multi-Market   │
│    Router       │
└─────────────────┘
```

### Example: Complete Trading Flow

```python
from bagbot.trading.risk_engine import RiskEngine
from bagbot.trading.news_filter import NewsFilter
from bagbot.trading.streak_manager import StreakManager
from bagbot.trading.strategy_switcher import StrategySwitcher
from bagbot.trading.mindset_engine import MindsetEngine
from bagbot.trading.markets import ParallelMarketRouter

async def execute_trading_cycle():
    """Complete trading cycle with all Phase 3 systems."""
    
    # Initialize systems
    risk_engine = RiskEngine()
    news_filter = NewsFilter()
    streak_manager = StreakManager()
    strategy_switcher = StrategySwitcher()
    mindset = MindsetEngine()
    router = ParallelMarketRouter()
    
    # 1. Check news conditions
    news_decision = await news_filter.check_trading_conditions(
        symbols=["EURUSD"]
    )
    
    if not news_decision.safe_to_trade:
        print(f"News filter blocked: {news_decision.reason}")
        return
    
    # 2. Get strategy recommendation
    recommendation = strategy_switcher.get_recommendation(
        market_conditions={"volatility": 0.5, "trend_strength": 0.6},
        streak_manager_status=streak_manager.get_status(),
        news_filter_status=news_filter.get_status(),
        mindset_state=mindset.current_state.value,
        current_spread=1.2
    )
    
    # 3. Calculate position size
    position_result = risk_engine.calculate_position_size(
        account_balance=10000,
        symbol="EURUSD",
        entry_price=1.1000,
        stop_loss_price=1.0950,
        current_volatility=0.015,
        current_spread_pips=1.2
    )
    
    # Apply news filter multiplier
    final_size = position_result.position_size * news_decision.position_size_multiplier
    
    # Apply streak manager multiplier
    final_size *= streak_manager.get_risk_multiplier()
    
    # 4. Execute trade
    order = await router.create_order(
        market_name="MT5",
        symbol="EURUSD",
        side=OrderSide.BUY,
        quantity=final_size
    )
    
    print(f"Order executed: {order.id}")
    
    # 5. Record result (after trade closes)
    pnl = 50.0  # Example P&L
    
    # Update all systems
    risk_engine.record_trade_result(
        pnl=pnl,
        market="forex",
        strategy=recommendation.strategy_name
    )
    
    streak_manager.record_trade(
        pnl=pnl,
        strategy_name=recommendation.strategy_name
    )
    
    mindset.record_trade_outcome(
        win=(pnl > 0),
        pnl=pnl
    )
```

## 📊 Monitoring & Admin Controls

### Risk Engine Status
```python
status = risk_engine.get_risk_report()
# Returns: daily_loss, drawdown, risk_mode, emergency_active, etc.
```

### News Filter Status
```python
status = news_filter.get_status()
# Returns: active_events, manual_override, recent_events
```

### Streak Manager Status
```python
status = streak_manager.get_status()
# Returns: current_streak, win_rate, confidence_score, locked
```

### Market Router Performance
```python
performance = router.get_market_performance()
# Returns per-market: trades, win_rate, pnl, health_score
```

## 🔐 Admin Override Capabilities

### 1. Emergency Shutdown
```python
# Per-market stop
router.trigger_market_stop("Binance", "Unusual activity")

# Global stop
router.trigger_global_stop("System maintenance")
```

### 2. Risk Override
```python
risk_engine.enable_admin_override("Manual review completed")
```

### 3. News Filter Override
```python
news_filter.enable_manual_override("Confirmed false positive", duration_minutes=30)
```

### 4. Unlock Losing Streak
```python
streak_manager.enable_admin_override("Risk assessment complete")
```

### 5. Force Strategy Switch
```python
strategy_switcher.force_switch("conservative_scalper", "Market conditions")
```

## 📁 File Structure

```
bagbot/trading/
├── risk_engine.py              # Risk management
├── news_filter.py              # News event filtering
├── streak_manager.py           # Performance tracking
├── strategy_switcher.py        # Strategy selection
└── markets/
    ├── __init__.py
    ├── market_adapter.py       # Base adapter interface
    ├── parallel_router.py      # Multi-market coordinator
    ├── crypto/
    │   ├── __init__.py
    │   └── binance_adapter.py  # Binance connector
    ├── forex/
    │   ├── __init__.py
    │   └── mt5_adapter.py      # MT5 connector
    └── stocks/
        ├── __init__.py
        └── alpaca_adapter.py   # Alpaca connector
```

## 🔄 State Persistence

All systems persist state to JSON files for restart resilience:

- **Risk Engine:** `data/state/risk_state.json`
- **Streak Manager:** `data/state/streak_state.json`
- **News Filter:** In-memory cache (refreshed from APIs)
- **Market Router:** Real-time tracking (no persistence needed)

## 🚀 Next Steps

### Testing (Phase 3.1)
- Unit tests for all 5 new components
- Integration tests with Phase 2 systems
- Load tests for parallel market execution
- News filter API mock tests

### Documentation (Phase 3.2)
- API endpoint documentation for admin controls
- Market adapter extension guide
- News source integration guide

### Deployment (Phase 3.3)
- Environment variable configuration
- API key management
- State file initialization
- Admin panel integration

## 📝 Environment Variables

```bash
# Risk Engine
BAGBOT_RISK_MODE=normal  # conservative, normal, aggressive
BAGBOT_MAX_DAILY_LOSS=300.0
BAGBOT_HARD_DRAWDOWN=0.15
BAGBOT_SOFT_DRAWDOWN=0.10

# News Filter
NEWS_FOREXFACTORY_API_KEY=your_key_here

# Market Adapters
BINANCE_API_KEY=your_key_here
BINANCE_SECRET_KEY=your_secret_here
ALPACA_API_KEY=your_key_here
ALPACA_SECRET_KEY=your_secret_here

# MT5 (passed programmatically)
# MT5_ACCOUNT, MT5_PASSWORD, MT5_SERVER
```

## ✅ Completion Summary

**Lines of Code:** ~2,500 lines
**Files Created:** 13 files
**Systems Implemented:** 5 major systems
**Integration Points:** 8+ cross-system integrations

Phase 3 is **COMPLETE** and ready for testing! 🎉
