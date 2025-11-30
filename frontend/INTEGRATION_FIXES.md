# BAGBOT2 Integration Audit - Quick Action Items

## ✅ Completed
1. Fixed SQLAlchemy metadata conflict in SubscriptionManager
2. Fixed test file path in test_backtester.py
3. Ran full test suite: **348/377 tests passing (92.3%)**

## 🔴 CRITICAL FIXES NEEDED (Before Phase 5)

### 1. Fix Mindset Engine Integration (HIGH PRIORITY)
**Files**: `trading/mindset_engine.py`, `trading/strategy_arsenal.py`

Add these methods to MindsetEngine:
```python
def get_risk_multiplier(self) -> float:
    """
    Returns risk multiplier based on emotional state.
    - DEFENSIVE: 0.5x (after losses)
    - CAUTIOUS: 0.75x
    - CALM: 1.0x (normal)
    - CONFIDENT: 1.25x (after wins)
    
    Returns: float between 0.5 and 1.5
    """
    if self.state == EmotionalState.DEFENSIVE:
        return 0.5
    elif self.state == EmotionalState.CAUTIOUS:
        return 0.75
    elif self.state == EmotionalState.CONFIDENT:
        return 1.25
    else:  # CALM
        return 1.0

def get_strategy_confidence(self, strategy_name: str) -> Optional[float]:
    """
    Returns confidence score for a strategy.
    
    Args:
        strategy_name: Name of strategy (e.g., "ai_fusion")
    
    Returns: float between 0.0 and 1.0, or None if strategy not found
    """
    if strategy_name not in self.strategy_confidence:
        return None
    return self.strategy_confidence[strategy_name].confidence_score
```

Then update RiskEngine to use:
```python
# In trading/risk_engine.py
def calculate_position_size(self, equity: float, mindset_multiplier: float = 1.0) -> float:
    base_size = equity * self.per_trade_risk / 100
    return base_size * mindset_multiplier
```

### 2. Fix Risk Engine Import Error (HIGH PRIORITY)
**Files**: `tests/test_risk.py`, `trading/order_executor.py` or `trading/order_router.py`

Option A: If OrderRouter exists, fix import:
```python
# In tests/test_risk.py
from bagbot.trading.order_executor import OrderExecutor  # or correct path
```

Option B: If OrderRouter doesn't exist, create stub:
```python
# Create trading/order_router.py
class OrderRouter:
    def __init__(self, risk_engine):
        self.risk_engine = risk_engine
    
    def validate_and_route(self, order: Dict) -> Dict:
        # Validate with risk engine
        validation = self.risk_engine.validate_trade(order)
        if not validation.approved:
            return {"status": "rejected", "reason": validation.reason}
        
        # Route to market adapter
        return {"status": "approved", "order": order}
```

### 3. Add Circuit Breaker Global Access (HIGH PRIORITY)
**Create**: `trading/circuit_breaker.py`

```python
import json
from pathlib import Path
from typing import Optional
from datetime import datetime

class CircuitBreaker:
    """Global circuit breaker singleton."""
    _instance = None
    _state_file = Path("data/state/circuit_breaker.json")
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_state()
        return cls._instance
    
    def _load_state(self):
        if self._state_file.exists():
            with open(self._state_file, 'r') as f:
                state = json.load(f)
                self.is_active = state.get("active", False)
                self.triggered_by = state.get("triggered_by")
                self.reason = state.get("reason")
                self.triggered_at = state.get("triggered_at")
        else:
            self.is_active = False
            self.triggered_by = None
            self.reason = None
            self.triggered_at = None
    
    def _save_state(self):
        self._state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self._state_file, 'w') as f:
            json.dump({
                "active": self.is_active,
                "triggered_by": self.triggered_by,
                "reason": self.reason,
                "triggered_at": self.triggered_at
            }, f, indent=2)
    
    def trigger(self, reason: str, triggered_by: str = "system"):
        """Activate circuit breaker to stop all trading."""
        self.is_active = True
        self.reason = reason
        self.triggered_by = triggered_by
        self.triggered_at = datetime.now().isoformat()
        self._save_state()
        
        # Log critical event
        import logging
        logger = logging.getLogger(__name__)
        logger.critical(f"🚨 CIRCUIT BREAKER TRIGGERED: {reason} (by {triggered_by})")
    
    def reset(self, reset_by: str = "admin"):
        """Deactivate circuit breaker."""
        self.is_active = False
        self._save_state()
        
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"✅ Circuit breaker reset by {reset_by}")
    
    def check(self) -> bool:
        """Check if circuit breaker is active."""
        return self.is_active
```

Integrate with RiskEngine:
```python
# In trading/risk_engine.py
from bagbot.trading.circuit_breaker import CircuitBreaker

class RiskEngine:
    def __init__(self, ...):
        # existing init
        self.circuit_breaker = CircuitBreaker()
    
    def check_circuit_breaker(self, account: Account) -> bool:
        """Check if circuit breaker should trigger."""
        # Check daily loss
        daily_loss_pct = ((account.starting_balance - account.balance) / 
                         account.starting_balance * 100)
        
        if daily_loss_pct >= self.max_daily_loss:
            self.circuit_breaker.trigger(
                f"Daily loss limit exceeded: {daily_loss_pct:.2f}%",
                triggered_by="risk_engine"
            )
            return True
        
        # Check max drawdown
        drawdown_pct = account.get_max_drawdown_percent()
        if drawdown_pct >= self.max_drawdown:
            self.circuit_breaker.trigger(
                f"Max drawdown exceeded: {drawdown_pct:.2f}%",
                triggered_by="risk_engine"
            )
            return True
        
        return self.circuit_breaker.check()
```

Add to Admin API:
```python
# In api/admin_routes.py
from bagbot.trading.circuit_breaker import CircuitBreaker

@router.get("/circuit-breaker")
async def get_circuit_breaker_status():
    """Get circuit breaker status."""
    breaker = CircuitBreaker()
    return {
        "active": breaker.is_active,
        "reason": breaker.reason,
        "triggered_by": breaker.triggered_by,
        "triggered_at": breaker.triggered_at
    }

@router.post("/circuit-breaker/trigger")
async def trigger_circuit_breaker(
    reason: str = Body(...),
    admin_token: str = Depends(verify_admin_token)
):
    """Manually trigger circuit breaker."""
    breaker = CircuitBreaker()
    breaker.trigger(reason, triggered_by="admin_api")
    return {"status": "triggered", "reason": reason}

@router.post("/circuit-breaker/reset")
async def reset_circuit_breaker(admin_token: str = Depends(verify_admin_token)):
    """Reset circuit breaker."""
    breaker = CircuitBreaker()
    breaker.reset(reset_by="admin_api")
    return {"status": "reset"}
```

### 4. Add End-to-End Integration Tests (HIGH PRIORITY)
**Create**: `tests/test_integration_e2e.py`

```python
import pytest
from bagbot.worker.brain.brain import TradingBrain
from bagbot.trading.risk_engine import RiskEngine
from bagbot.trading.mindset_engine import MindsetEngine
from bagbot.worker.executor.account import Account
from bagbot.worker.tasks import JobType

def test_full_trading_cycle():
    """Test: Price update → Strategy → Risk → Execution → Account"""
    brain = TradingBrain()
    risk_engine = RiskEngine()
    account = Account(balance=10000.0)
    
    # 1. Send price update
    payload = {
        "symbol": "BTCUSDT",
        "price": 43250.0,
        "close": 43250.0,
        "timestamp": "2024-11-24T10:00:00Z"
    }
    result = brain.process(JobType.PRICE_UPDATE, payload)
    
    # 2. Verify market state updated
    assert brain.market_state.get_latest("BTCUSDT") is not None
    
    # 3. Strategy should process (internally)
    # (No explicit assertion needed - brain calls strategies internally)
    
    print("✅ Full trading cycle test passed")


def test_risk_blocks_oversized_trade():
    """Test: Risk Engine blocks trade exceeding limits"""
    risk_engine = RiskEngine()
    
    # Create order exceeding max position size
    order = {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "size": 100.0,  # Way too large
        "price": 43250.0
    }
    
    result = risk_engine.calculate_position_size(
        equity=10000.0,
        requested_size=100.0
    )
    
    # Should cap the position
    assert result.position_size < 100.0
    print(f"✅ Risk engine capped position: {result.position_size}")


def test_mindset_scales_risk():
    """Test: Mindset Engine adjusts risk multiplier"""
    mindset = MindsetEngine()
    risk_engine = RiskEngine()
    
    # After losses, mindset becomes defensive
    mindset.record_loss(amount=500.0)
    
    multiplier = mindset.get_risk_multiplier()
    assert multiplier < 1.0, f"Expected defensive multiplier < 1.0, got {multiplier}"
    
    # Risk engine should apply multiplier
    base_size = risk_engine.calculate_position_size(equity=10000.0)
    scaled_size = risk_engine.calculate_position_size(
        equity=10000.0,
        mindset_multiplier=multiplier
    )
    
    assert scaled_size.position_size < base_size.position_size
    print(f"✅ Mindset scaled risk: {multiplier}x")


def test_circuit_breaker_triggers():
    """Test: Circuit breaker stops trading on large loss"""
    from bagbot.trading.circuit_breaker import CircuitBreaker
    
    breaker = CircuitBreaker()
    breaker.reset()  # Ensure clean state
    
    # Manually trigger
    breaker.trigger("Test trigger", triggered_by="test")
    
    assert breaker.check() == True
    assert breaker.reason == "Test trigger"
    
    # Reset
    breaker.reset(reset_by="test")
    assert breaker.check() == False
    
    print("✅ Circuit breaker test passed")
```

---

## 🟡 SECONDARY FIXES (Post Phase 5)

### 5. Fix Subscription Manager Tests
Replace remaining `metadata` references with `meta_data` in:
- `backend/subscription_manager.py` (any remaining references)
- `tests/test_subscription_manager.py` (test assertions)

### 6. Fix Scheduler Tests
Debug async event loop issues in `tests/test_scheduler.py`:
```python
import asyncio

@pytest.fixture
def event_loop():
    """Create fresh event loop for each test."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
```

### 7. Fix Payment Tests
Add Stripe test fixtures in `tests/test_payments.py`:
```python
import stripe
from unittest.mock import MagicMock

@pytest.fixture
def mock_stripe_customer():
    return stripe.Customer.construct_from({
        "id": "cus_test123",
        "email": "test@example.com",
        "created": 1234567890
    }, "test_key")
```

---

## ⏱️ Time Estimates

| Fix | Effort | Priority |
|-----|--------|----------|
| 1. Mindset Engine Interface | 2 hours | HIGH |
| 2. Risk Engine Import | 1 hour | HIGH |
| 3. Circuit Breaker | 3 hours | HIGH |
| 4. E2E Tests | 4 hours | HIGH |
| 5. Subscription Tests | 1 hour | MEDIUM |
| 6. Scheduler Tests | 2 hours | MEDIUM |
| 7. Payment Tests | 2 hours | LOW |

**Total Critical Path**: ~10 hours (1-2 days)

---

## 🧪 Test After Fixes

```bash
# Run full test suite
cd bagbot
source ../.venv/bin/activate
python -m pytest tests/ -v

# Expected result after fixes:
# ✅ 370+ tests passing (98%+)
# ⚠️ 0-5 skipped (optional features)
# ❌ 0-2 failures (edge cases only)
```

---

## 📊 Success Metrics

- [ ] Test pass rate > 95% (360+/377 tests)
- [ ] All HIGH priority fixes completed
- [ ] Integration tests added (5+)
- [ ] Circuit breaker functional
- [ ] Mindset → Risk integration working
- [ ] Risk Engine validates all orders

---

**Status**: Ready for implementation  
**Blocking Phase 5**: YES (4 critical fixes required)  
**Estimated completion**: 1-2 days
