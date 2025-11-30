# BAGBOT2 Phase 2 - Installation & Integration Guide

## 📋 Pre-Integration Checklist

- [x] All Phase 2 files created
- [x] Test files written
- [x] Documentation complete
- [x] Demo script functional
- [ ] Review architecture diagram
- [ ] Run demo script
- [ ] Run test suite
- [ ] Integration steps completed

---

## 🚀 Installation Steps

### Step 1: Verify Files Exist

Run this to check all files are in place:

```bash
cd /Users/bagumadavis/Desktop/bagbot

# Check core files
ls -l bagbot/trading/mindset_engine.py
ls -l bagbot/trading/strategy_arsenal.py
ls -l bagbot/trading/market_router.py
ls -l bagbot/trading/strategies/micro_trend_follower.py
ls -l bagbot/backend/subscription_manager.py
ls -l bagbot/backend/subscription_middleware.py
ls -l bagbot/api/subscription_routes.py

# Check test files
ls -l bagbot/tests/test_mindset_engine.py
ls -l bagbot/tests/test_strategy_arsenal.py
ls -l bagbot/tests/test_subscription_manager.py

# Check documentation
ls -l BRAIN_ARCHITECTURE.md
ls -l PHASE_2_QUICK_REF.md
ls -l PHASE_2_SUMMARY.md
ls -l SYSTEM_ARCHITECTURE_DIAGRAM.md
ls -l brain_demo.py
```

All files should exist. ✅

---

### Step 2: Run Demo Script

```bash
source .venv/bin/activate
python brain_demo.py
```

**Expected Output:**
- Mindset Engine initialization ✅
- Strategy Arsenal setup ✅
- Tick processing with signals ✅
- Trade execution simulation ✅
- Daily performance evaluation ✅
- Subscription system demo ✅

If any errors, check Python environment and dependencies.

---

### Step 3: Run Test Suite

```bash
# Run all Phase 2 tests
pytest bagbot/tests/test_mindset_engine.py -v
pytest bagbot/tests/test_strategy_arsenal.py -v
pytest bagbot/tests/test_subscription_manager.py -v

# Or run all at once
pytest bagbot/tests/test_mindset_engine.py bagbot/tests/test_strategy_arsenal.py bagbot/tests/test_subscription_manager.py -v
```

**Expected:**
- 15+ tests for Mindset Engine → PASS
- 15+ tests for Strategy Arsenal → PASS
- 15+ tests for Subscription Manager → PASS

---

### Step 4: Update main.py

Edit `bagbot/backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# EXISTING IMPORTS
from .api import admin_routes, strategy_routes, webhook_routes
# ... other existing imports ...

# ADD THESE NEW IMPORTS
from .api.subscription_routes import router as subscription_router
from .backend.subscription_manager import SubscriptionManager
from .backend.subscription_middleware import SubscriptionAuthMiddleware

app = FastAPI(
    title="BAGBOT2 API",
    description="Professional Trading Bot API",
    version="2.0.0"
)

# EXISTING CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD SUBSCRIPTION MIDDLEWARE (OPTIONAL - enable when ready for production)
# subscription_manager = SubscriptionManager()
# app.add_middleware(SubscriptionAuthMiddleware, subscription_manager=subscription_manager)

# EXISTING ROUTERS
app.include_router(admin_routes.router)
app.include_router(strategy_routes.router)
app.include_router(webhook_routes.router)
# ... other existing routers ...

# ADD NEW SUBSCRIPTION ROUTER
app.include_router(subscription_router)

# ... rest of your existing code ...
```

**Note:** Leave subscription middleware commented out for now. Enable it when you're ready to enforce token authentication.

---

### Step 5: Set Environment Variables

Add to your `.env` file or export in shell:

```bash
# Admin Access
ADMIN_TOKEN=your-super-secure-admin-token-here-change-this

# Mindset Engine Settings
DAILY_PROFIT_TARGET_PERCENT=1.0
MAX_DAILY_LOSS_PERCENT=3.0
MAX_TRADES_PER_DAY=20
REVENGE_TRADE_COOLDOWN=30

# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./bagbot.db

# Existing settings remain unchanged
MAX_ORDER_USD=10000.0
DEFAULT_STOP_LOSS_PERCENT=2.0
# ... etc ...
```

---

### Step 6: Initialize Database

```bash
source .venv/bin/activate
cd bagbot

python -c "
from backend.subscription_manager import SubscriptionManager
sm = SubscriptionManager()
print('✅ Database initialized')
"
```

This creates the database tables for API tokens and usage logs.

---

### Step 7: Create Your First API Token

Start the server:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal:

```bash
export ADMIN_TOKEN="your-super-secure-admin-token-here-change-this"

curl -X POST http://localhost:8000/api/subscription/tokens \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "davis",
    "tier": "enterprise",
    "name": "Davis Main Token"
  }'
```

**Save the returned token!** You'll need it for API calls.

Example response:
```json
{
  "token": "very_long_random_string_here_SAVE_THIS",
  "token_prefix": "abcd1234",
  "tier": "enterprise",
  "daily_call_limit": -1,
  "created_at": "2025-11-24T..."
}
```

---

### Step 8: Test API Token

```bash
# Set your token
export API_TOKEN="<paste your token here>"

# Test authenticated endpoint
curl http://localhost:8000/api/subscription/tiers \
  -H "Authorization: Bearer $API_TOKEN"
```

Should return tier information.

---

### Step 9: Integrate with Trading System

Create a new file `bagbot/main_trading_loop.py` (example):

```python
"""
Main trading loop integrating all Phase 2 components
"""

import asyncio
import logging
from datetime import datetime

from trading.mindset_engine import MindsetEngine
from trading.strategy_arsenal import StrategyArsenal
from trading.strategies.micro_trend_follower import MicroTrendFollower
from trading.binance_connector import BinanceConnector  # Your existing connector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Main trading loop."""
    
    # Initialize components
    mindset = MindsetEngine()
    arsenal = StrategyArsenal()
    
    # Register strategies
    micro = MicroTrendFollower()
    arsenal.register_strategy(micro, auto_activate=True)
    
    # Connect to exchange
    binance = BinanceConnector(
        api_key="your_api_key",
        api_secret="your_api_secret"
    )
    await binance.connect()
    
    # Get starting equity
    account = await binance.get_account_info()
    mindset.reset_daily(account['equity'])
    
    logger.info("🚀 Trading system started")
    
    # Main loop
    while True:
        try:
            # Get latest tick
            tick = await binance.get_latest_tick("BTCUSDT")
            
            # Route to strategies
            signals = arsenal.route_tick(tick)
            
            for signal in signals:
                # Check with mindset
                can_trade, reason = mindset.should_trade(
                    account['equity'],
                    {
                        "symbol": signal.symbol,
                        "side": signal.side,
                        "quantity": 0.1
                    }
                )
                
                if can_trade:
                    # Execute trade
                    logger.info(f"Executing: {signal.side} {signal.symbol}")
                    # order = await binance.place_order(...)
                    
                    # Notify arsenal
                    # arsenal.notify_trade_executed(...)
                else:
                    logger.info(f"Trade blocked: {reason}")
            
            # Check for daily reset
            if datetime.now().hour == 0 and datetime.now().minute == 0:
                account = await binance.get_account_info()
                mindset.reset_daily(account['equity'])
            
            await asyncio.sleep(0.1)  # 100ms tick rate
            
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
```

---

### Step 10: Enable Subscription Middleware (Optional)

When ready to enforce token authentication:

In `bagbot/backend/main.py`, uncomment these lines:

```python
# Initialize subscription manager
subscription_manager = SubscriptionManager()

# Add middleware
app.add_middleware(SubscriptionAuthMiddleware, subscription_manager=subscription_manager)
```

Now all API endpoints (except public ones) will require `Authorization: Bearer <token>` header.

---

## 🧪 Verification Tests

### Test 1: Mindset Engine

```python
python -c "
from bagbot.trading.mindset_engine import MindsetEngine
m = MindsetEngine()
m.reset_daily(10000.0)
can_trade, reason = m.should_trade(10000.0, {'symbol': 'BTC', 'side': 'buy', 'quantity': 0.1})
print(f'Can trade: {can_trade}')
print(f'Reason: {reason}')
"
```

### Test 2: Strategy Arsenal

```python
python -c "
from bagbot.trading.strategy_arsenal import StrategyArsenal
from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower
a = StrategyArsenal()
s = MicroTrendFollower()
a.register_strategy(s, auto_activate=True)
print(f'Strategies: {len(a.strategies)}')
print(f'Active: {a.active_strategies}')
"
```

### Test 3: Subscription Manager

```python
python -c "
from bagbot.backend.subscription_manager import SubscriptionManager, SubscriptionTier
sm = SubscriptionManager()
token_str, token = sm.create_token('test_user', SubscriptionTier.FREE, 'Test')
validated = sm.validate_token(token_str)
print(f'Token created: {token.token_prefix}')
print(f'Validated: {validated is not None}')
"
```

All should execute without errors.

---

## 📊 Post-Installation Monitoring

### Watch Logs

```bash
tail -f logs/bagbot.log
```

Look for:
- 🧠 Mindset Engine events
- ⚡ Strategy signals
- 💳 Token validations
- 🌐 Order routing

### Check State Files

```bash
cat data/state/mindset_state.json
cat data/state/daily_metrics.json
cat data/state/strategy_confidence.json
```

### Monitor Database

```bash
sqlite3 bagbot.db

.tables
SELECT * FROM api_tokens;
SELECT * FROM usage_logs ORDER BY timestamp DESC LIMIT 10;
.quit
```

---

## 🔧 Troubleshooting

### Import Errors

```bash
# Ensure you're in the right directory
cd /Users/bagumadavis/Desktop/bagbot

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Reinstall in dev mode
pip install -e .
```

### Database Errors

```bash
# Delete and recreate
rm bagbot.db
python -c "from bagbot.backend.subscription_manager import SubscriptionManager; SubscriptionManager()"
```

### Token Validation Fails

- Check token is not expired
- Verify `Authorization: Bearer <token>` format (note the space)
- Ensure token wasn't revoked
- Check database connection

### Mindset Blocks All Trades

```bash
# Reset mindset state
rm data/state/mindset_state.json

# Or manually reset in Python
python -c "
from bagbot.trading.mindset_engine import MindsetEngine
m = MindsetEngine()
m.reset_daily(10000.0)
print('Mindset reset')
"
```

---

## ✅ Final Checklist

- [ ] All files verified
- [ ] Demo script runs successfully
- [ ] All tests pass
- [ ] main.py updated with subscription routes
- [ ] Environment variables set
- [ ] Database initialized
- [ ] First API token created
- [ ] Token authentication tested
- [ ] Trading loop example reviewed
- [ ] Monitoring setup understood
- [ ] Documentation reviewed

---

## 🎯 You're Ready!

Once all checklist items are complete, your BAGBOT2 Phase 2 system is fully operational.

**Next Steps:**
1. Test in paper trading mode
2. Monitor performance for 24 hours
3. Tune strategy parameters
4. Deploy to production when confident

**Need Help?**
- Review `BRAIN_ARCHITECTURE.md` for detailed explanations
- Run `python brain_demo.py` to see everything working
- Check test files for usage examples
- All modules have comprehensive docstrings

**Happy Trading! 🚀**
