# Trading Mindset Module - Quick Reference

## Overview
The `TradingMindset` class implements institutional-grade trading discipline and risk management psychology, enforcing strict rules to protect capital during adverse market conditions.

## Core Principles
1. **Stop-Loss Required**: Every trade must have a stop-loss
2. **Defensive Mode**: Never increase exposure after a loss
3. **Drawdown Limits**: Respect daily drawdown thresholds
4. **Capital Protection**: Protect capital above all else

## Environment Variables

```bash
# Order and position limits
MAX_ORDER_USD=10000.0              # Maximum single order size
MAX_OPEN_POSITIONS=5               # Maximum concurrent positions
DEFAULT_STOP_LOSS_PERCENT=2.0      # Default stop-loss distance

# Risk management
DAILY_MAX_DRAWDOWN_PERCENT=5.0     # Daily drawdown limit (triggers halt)
EOD_ACTION=tighten_stops           # End-of-day action: close_all|hedge_all|tighten_stops
```

## API Reference

### TradingMindset Class

#### `daily_mission(account, open_positions, signals) -> List[TradingAction]`
Determines daily trading actions based on account state and signals.

**Features:**
- Initializes daily equity tracking
- Checks for drawdown breach (emergency exits if exceeded)
- Validates stop-losses on all open positions
- Enters defensive mode after losses (blocks new trades)
- Processes signals only when conditions allow

**Returns:** Prioritized list of TradingAction objects

```python
from trading.mindset import TradingMindset

mindset = TradingMindset()

account = {"balance": 100000, "equity": 100000}
positions = [...]  # Open positions
signals = [...]    # Trading signals

actions = mindset.daily_mission(account, positions, signals)

for action in actions:
    if action.action_type == ActionType.EMERGENCY_EXIT:
        print(f"Emergency exit {action.symbol}: {action.reason}")
```

#### `pre_trade_check(order_payload, account) -> PreTradeCheckResult`
Validates order before execution with strict risk checks.

**Validation Checks:**
1. Trading not halted
2. Stop-loss present (suggests one if missing)
3. Order size within MAX_ORDER_USD
4. Not in defensive mode (after loss)
5. Within drawdown limits (80% threshold)
6. Stop-loss reasonably placed (0.5% - 10% range)

**Returns:** PreTradeCheckResult with approval status and reason

```python
order = {
    "symbol": "BTCUSDT",
    "side": "buy",
    "amount": 0.1,
    "price": 50000.0,
    "stop_loss": 49000.0  # Required!
}

result = mindset.pre_trade_check(order, account)

if result.approved:
    # Execute trade
    pass
else:
    print(f"Order rejected: {result.reason}")
    if result.suggested_stop_loss:
        print(f"Suggested stop-loss: {result.suggested_stop_loss}")
```

#### `eod_routine(open_positions, account) -> EODReport`
End of day analysis and risk management.

**Actions Based on P&L:**
- **Breached Limit**: Close all positions, halt trading
- **Significant Loss (70%+ of limit)**: Apply EOD_ACTION (close/hedge/tighten)
- **Minor Loss**: Tighten stop-losses
- **Profit**: Maintain positions

**Returns:** EODReport with analysis and recommended actions

```python
report = mindset.eod_routine(positions, account)

print(f"Daily P&L: ${report.total_pnl:.2f} ({report.total_pnl_percent:.2f}%)")
print(f"Recommended: {report.recommended_action.value}")

if report.should_stop_trading:
    print("⚠️ TRADING HALTED FOR TOMORROW")

for action in report.actions:
    # Execute EOD actions
    execute_action(action)
```

#### `record_trade_result(pnl: float) -> None`
Records trade result to update defensive state.

```python
# After closing a trade
pnl = -500.0  # Loss
mindset.record_trade_result(pnl)

# Defensive mode activated:
# - last_trade_was_loss = True
# - consecutive_losses += 1
# - New positions blocked until next profit
```

## Data Classes

### TradingAction
```python
@dataclass
class TradingAction:
    action_type: ActionType      # Type of action
    symbol: Optional[str]         # Trading symbol
    side: Optional[str]           # buy or sell
    quantity: Optional[float]     # Amount
    price: Optional[float]        # Price
    stop_loss: Optional[float]    # Stop-loss level
    reason: str                   # Why this action
    priority: int                 # Urgency (higher = more urgent)
```

### ActionType (Enum)
- `OPEN_POSITION`: Open new position
- `CLOSE_POSITION`: Close existing position
- `ADJUST_STOP_LOSS`: Modify stop-loss
- `HEDGE_POSITION`: Hedge with opposite side
- `EMERGENCY_EXIT`: Immediate exit (priority 100)
- `DO_NOTHING`: No action needed

### EODAction (Enum)
- `CLOSE_ALL`: Close all positions
- `HEDGE_ALL`: Hedge all positions
- `TIGHTEN_STOPS`: Tighten stop-losses
- `MAINTAIN`: Keep current positions

### PreTradeCheckResult
```python
@dataclass
class PreTradeCheckResult:
    approved: bool                    # Trade approved?
    reason: str                       # Approval/rejection reason
    suggested_stop_loss: Optional[float]  # Suggested SL if missing
```

### EODReport
```python
@dataclass
class EODReport:
    total_pnl: float                  # Daily P&L in dollars
    total_pnl_percent: float          # Daily P&L percentage
    drawdown_percent: float           # Current drawdown
    open_positions_count: int         # Number of open positions
    recommended_action: EODAction     # Recommended action
    should_stop_trading: bool         # Halt tomorrow?
    analysis: str                     # Human-readable analysis
    actions: List[TradingAction]      # Actions to execute
```

## Flash Loss Scenario

**Scenario:** Market drops causing 6% daily drawdown (exceeds 5% limit)

```python
mindset = TradingMindset()
mindset.daily_start_equity = 100000.0

# Flash loss: equity drops to $94k (6% drawdown)
flash_account = {"equity": 94000.0, "balance": 94000.0}
positions = [...]  # Current positions

# Daily mission response
actions = mindset.daily_mission(flash_account, positions, [])

# Results:
# 1. trading_halted = True
# 2. halt_reason = "Daily drawdown limit breached (6.00%)"
# 3. Emergency exit actions for all positions (priority 100)

# Pre-trade check blocks all new orders
order = {...}
result = mindset.pre_trade_check(order, flash_account)
# result.approved = False
# result.reason = "Trading halted: Daily drawdown limit breached..."

# EOD routine recommends closing all
report = mindset.eod_routine(positions, flash_account)
# report.recommended_action = EODAction.CLOSE_ALL
# report.should_stop_trading = True
# report.actions = [emergency_exit_actions...]
```

## Integration Example

```python
from trading.mindset import TradingMindset, ActionType, EODAction

# Initialize mindset
mindset = TradingMindset()

# During trading day
def process_signals(signals, account, positions):
    # Get recommended actions
    actions = mindset.daily_mission(account, positions, signals)
    
    for action in actions:
        if action.action_type == ActionType.EMERGENCY_EXIT:
            # Highest priority - exit immediately
            emergency_close(action.symbol, action.quantity)
        
        elif action.action_type == ActionType.CLOSE_POSITION:
            # Stop-loss hit or risk management
            close_position(action.symbol, action.quantity)
        
        elif action.action_type == ActionType.OPEN_POSITION:
            # New trade with auto stop-loss
            open_trade(action.symbol, action.side, 
                      action.quantity, action.stop_loss)

# Before placing any order
def place_order(order_payload, account):
    # Validate with mindset
    check = mindset.pre_trade_check(order_payload, account)
    
    if not check.approved:
        logger.warning(f"Order rejected: {check.reason}")
        return False
    
    # Execute order
    execute_order(order_payload)
    return True

# After trade closes
def on_trade_closed(trade):
    pnl = trade["realized_pnl"]
    mindset.record_trade_result(pnl)
    
    if pnl < 0:
        logger.warning(
            f"Loss recorded: ${pnl:.2f}, "
            f"consecutive_losses={mindset.consecutive_losses}"
        )

# End of day
def end_of_day_routine(positions, account):
    report = mindset.eod_routine(positions, account)
    
    logger.info(
        f"EOD Report: P&L ${report.total_pnl:.2f} "
        f"({report.total_pnl_percent:.2f}%), "
        f"Action: {report.recommended_action.value}"
    )
    
    # Execute EOD actions
    for action in report.actions:
        execute_action(action)
    
    if report.should_stop_trading:
        logger.error("⚠️ TRADING HALTED - Manual review required")
        send_alert("Trading halted due to drawdown breach")
```

## Test Coverage

**31 tests covering:**
- ✅ Initialization and configuration
- ✅ Pre-trade validation (11 scenarios)
- ✅ Daily mission logic (6 scenarios)
- ✅ EOD routine (5 strategies)
- ✅ Trade result tracking
- ✅ Stop-loss calculations
- ✅ Integration scenarios (flash loss, gradual loss)

**Run tests:**
```bash
pytest tests/test_mindset.py -v
```

## Files Created

```
bagbot/trading/mindset.py          # Core implementation (520 lines)
bagbot/tests/test_mindset.py       # Unit tests (670 lines, 31 tests)
bagbot/trading/__init__.py          # Updated exports
```

## Key Features

✅ **Stop-Loss Enforcement**: Every trade requires stop-loss (0.5% - 10% range)  
✅ **Drawdown Protection**: Emergency halt at 5% daily drawdown  
✅ **Defensive Mode**: Blocks new positions after losses  
✅ **Position Limits**: Max open positions and order size enforcement  
✅ **EOD Actions**: Close/hedge/tighten based on daily P&L  
✅ **Priority System**: Emergency exits (100) > Stop-losses (90) > Adjustments (60-80)  
✅ **Trade Tracking**: Records losses and manages consecutive loss counter  

---

**Status:** ✅ Complete - All tests passing (31/31)
