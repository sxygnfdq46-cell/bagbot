# 🛡️ SAFE MODE QUICK REFERENCE

## 🎯 What Is Safe Mode?

Safe Mode is a system-wide protection mechanism that **blocks all real trading operations** while allowing normal system operation for analysis, backtesting, and simulation.

**Default State**: ✅ **ENABLED** (System boots with trading disabled)

---

## 📊 Status Check

### API Endpoint
```bash
curl http://localhost:8000/api/safe-mode/status
```

### Response
```json
{
  "enabled": true,
  "level": "simulation",
  "is_active": true,
  "real_trading_allowed": false,
  "block_real_orders": true
}
```

### Python Code
```python
from backend.safe_mode import get_safe_mode_manager

safe_mode = get_safe_mode_manager()

# Check if active
if safe_mode.is_safe_mode_active():
    print("🛡️ Safe mode is ACTIVE - No real trading")

# Get full status
status = safe_mode.get_status()
print(f"Level: {status['level']}")
print(f"Real trading allowed: {status['real_trading_allowed']}")
```

---

## 🔐 Protection Levels

| Level | Real Trading | Simulation | Market Data | Use Case |
|-------|-------------|------------|-------------|----------|
| **SIMULATION** | ❌ Blocked | ✅ Active | ✅ Active | Default - Safe testing |
| **READ_ONLY** | ❌ Blocked | ❌ Blocked | ✅ Active | Analysis only |
| **FULL_LOCKDOWN** | ❌ Blocked | ❌ Blocked | ❌ Blocked | Emergency stop |

---

## 🎛️ Activate Safe Mode

### API Call
```bash
curl -X POST "http://localhost:8000/api/safe-mode/activate" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "simulation",
    "reason": "Testing new strategy",
    "activated_by": "admin"
  }'
```

### Python Code
```python
from backend.safe_mode import get_safe_mode_manager, SafeModeLevel

safe_mode = get_safe_mode_manager()

safe_mode.activate_safe_mode(
    level=SafeModeLevel.SIMULATION,
    reason="Testing new strategy",
    activated_by="admin"
)
```

---

## ⚠️ Deactivate Safe Mode (DANGEROUS)

### Requirements
1. Set environment variable:
   ```bash
   export ALLOW_REAL_TRADING=CONFIRMED_ENABLED
   ```

2. Call deactivation:
   ```bash
   curl -X POST "http://localhost:8000/api/safe-mode/deactivate" \
     -H "Content-Type: application/json" \
     -d '{"deactivated_by": "admin"}'
   ```

### Python Code
```python
import os
from backend.safe_mode import get_safe_mode_manager

# CRITICAL: Set environment variable first
os.environ['ALLOW_REAL_TRADING'] = 'CONFIRMED_ENABLED'

safe_mode = get_safe_mode_manager()
safe_mode.deactivate_safe_mode(deactivated_by="admin")
```

### Without Environment Variable
```
❌ RuntimeError: Cannot deactivate safe mode without 
   ALLOW_REAL_TRADING=CONFIRMED_ENABLED
```

---

## 🧪 Test Safe Mode Protection

### Test Blocked Order
```bash
# This should return 403 Forbidden when safe mode is active
curl -X POST "http://localhost:8000/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USD",
    "side": "BUY",
    "amount": 0.1,
    "order_type": "MARKET"
  }'
```

### Expected Response (HTTP 403)
```json
{
  "error": "Safe Mode Active",
  "message": "All trading operations are currently blocked",
  "safe_mode_status": {
    "enabled": true,
    "level": "simulation"
  },
  "endpoint": "/api/orders",
  "method": "POST"
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/backend/safe_mode.py` | Central safe mode manager (653 lines) |
| `/backend/execution/LiveExecutionRelaySync.py` | Execution layer protection |
| `/backend/main.py` | API middleware + endpoints |
| `/frontend/components/SafeModeBanner.tsx` | Visual indicator |
| `/data/state/safe_mode.json` | Persistent state storage |

---

## 🛡️ Protection Layers

### Layer 1: HTTP Middleware
```
Request → safe_mode_middleware() → 403 if trading endpoint + safe mode active
```

### Layer 2: Execution Layer
```
ExecutionPlan → LiveExecutionRelaySync.dispatch_execution_plan()
  → safe_mode_manager.is_safe_mode_active()
  → Return simulated result
```

### Layer 3: Visual Indicator
```
Frontend loads → SafeModeBanner component
  → Polls /api/safe-mode/status every 10s
  → Shows banner at top if active
```

---

## 🎨 Frontend Banner

When safe mode is active, a fixed banner appears at the top of all pages:

```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ SAFE MODE ACTIVE | SIMULATION | All real trading   │
│                       operations are blocked       ⚪   │
└─────────────────────────────────────────────────────────┘
```

**Colors**:
- Blue = SIMULATION level
- Yellow = READ_ONLY level  
- Red = FULL_LOCKDOWN level

---

## 🔍 Verify Protection

### Check All Protected Endpoints
```bash
# These should all return 403 when safe mode is active
curl -X POST http://localhost:8000/api/orders
curl -X POST http://localhost:8000/api/trade
curl -X POST http://localhost:8000/api/execute
curl -X POST http://localhost:8000/api/tradingview/webhook
curl -X PUT http://localhost:8000/api/position/123
curl -X DELETE http://localhost:8000/api/order/456
```

### Check Execution Layer
```python
from backend.execution.LiveExecutionRelaySync import LiveExecutionRelaySync
from backend.execution.TradingActionExecutionMapper import ExecutionPlan, ExecutionAction, OrderType

relay = LiveExecutionRelaySync()
await relay.initialize()

plan = ExecutionPlan(
    action=ExecutionAction.BUY,
    order_type=OrderType.MARKET,
    size=0.1
)

result = await relay.dispatch_execution_plan(plan)

# If safe mode active:
assert result.success == True
assert "SIMULATED" in result.broker_order_id
assert result.reason == "SIMULATED - Safe mode active"
```

---

## 📝 Log Messages

### Safe Mode Activation
```
🛡️ SAFE MODE ACTIVATED
Level: simulation
Reason: Testing new strategy
By: admin
All real trading operations are now BLOCKED
```

### Blocked Operation
```
🛡️ SAFE MODE BLOCKED: POST /api/orders
```

### Simulated Execution
```
🛡️ SAFE MODE ACTIVE - Simulating execution: BUY 0.1
```

### Deactivation Attempt (Without Env Var)
```
❌ SAFE MODE DEACTIVATION BLOCKED
Set environment variable: ALLOW_REAL_TRADING=CONFIRMED_ENABLED
to enable real trading operations
```

---

## 🚨 Emergency Stop

If system is executing real trades unexpectedly:

### Immediate Stop
```bash
# Activate full lockdown
curl -X POST "http://localhost:8000/api/safe-mode/activate" \
  -d '{"level": "full_lockdown", "reason": "EMERGENCY STOP"}'
```

### Verify Stop
```bash
curl http://localhost:8000/api/safe-mode/status | jq .
```

---

## 💡 Best Practices

1. **Always test in safe mode first** - Never deploy untested strategies to live trading
2. **Use environment variable** - Require explicit confirmation to disable safe mode
3. **Monitor logs** - Check for blocked operations during testing
4. **Verify banner** - Frontend should always show safe mode status
5. **Persistent state** - Safe mode survives server restarts
6. **Multi-layer protection** - Don't rely on single protection mechanism

---

## 🎓 Architecture Summary

```
┌──────────────┐
│   Frontend   │  SafeModeBanner (visual indicator)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   FastAPI    │  safe_mode_middleware (HTTP blocker)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Execution   │  LiveExecutionRelaySync (execution guard)
│    Layer     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Broker     │  ❌ NEVER REACHED IN SAFE MODE
│  Adapters    │
└──────────────┘
```

---

## ✅ Quick Checklist

Before enabling real trading:

- [ ] All strategies tested in safe mode
- [ ] Risk parameters verified
- [ ] Position sizing confirmed
- [ ] Stop-loss logic validated
- [ ] Take-profit logic validated
- [ ] Emergency stop procedures ready
- [ ] Monitoring systems active
- [ ] Logs being captured
- [ ] `ALLOW_REAL_TRADING=CONFIRMED_ENABLED` set
- [ ] Team notified of live trading activation

---

## 🔗 Related Documentation

- `SAFE_MODE_ACTIVATION_COMPLETE.md` - Full implementation details
- `RISK_MANAGER_QUICK_REF.md` - Risk management system
- `ORDER_ROUTER_SUMMARY.md` - Order routing logic
- `TRADING_CONNECTOR_SUMMARY.md` - Exchange connectors

---

**Last Updated**: 2024  
**Status**: ✅ Operational  
**Default State**: Safe Mode ENABLED

🛡️ **Stay Safe. Trade Smart.** 🛡️
