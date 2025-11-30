# Brain Architecture Blueprint

## Overview

The TradingBrain is the central decision-making component of BAGBOT, orchestrating strategy execution, market state management, and trade execution. It operates deterministically with full event routing and structured logging.

## Core Components

### 1. TradingBrain (`bagbot/worker/brain/brain.py`)

**Purpose:** Main orchestrator that processes market events and routes them to appropriate strategies.

**Key Methods:**
- `__init__(job_queue: Optional[object] = None)` - Initialize brain with optional job queue
- `process(job_type: Union[str, JobType], payload: Dict[str, Any]) -> Optional[Dict[str, Any]]` - Process events (PRICE_UPDATE, SIGNAL_CHECK)
- `get_indicator_value(name: str, data: Any) -> Optional[Any]` - Safe indicator value retrieval
- `process_next_job() -> Optional[Any]` - Compatibility wrapper for job queue processing

**State:**
- `market_state: MarketState` - Current market conditions
- `router: StrategyRouter` - Routes events to strategies
- `strategy: Optional[StrategyBase]` - Main ai_fusion strategy instance
- `master: Optional[MasterStrategy]` - Master plugin strategy
- `executor: Optional[VirtualExecutor]` - Order execution
- `indicators: Optional[IndicatorEngine]` - Technical indicators
- `execution_router: ExecutionRouter` - Execution routing

**Event Flow:**
```
Market Event → process() → Route to Strategies → Execute Decisions
```

### 2. StrategyRouter (`bagbot/worker/brain/strategy_router.py`)

**Purpose:** Routes job types to appropriate strategy handlers.

**Key Methods:**
- `handle(job_type, payload)` - Main routing entry point
- `_handle_signal_check(payload)` - Process signal check events
- `_handle_execute_trade(payload)` - Process trade execution
- `get_strategy(name: str)` - Retrieve strategy from registry

**Routing Logic:**
- `PRICE_UPDATE` → Update market state, call all registered strategies
- `SIGNAL_CHECK` → Call strategy signal check methods
- `EXECUTE_TRADE` → Route to execution engine

### 3. MarketState (`bagbot/worker/brain/market_state.py`)

**Purpose:** Maintains current market conditions and indicators.

**Key Methods:**
- `update_from_payload(payload)` - Update state from price data
- `get_snapshot()` - Return current state snapshot
- `get_indicator(name: str)` - Retrieve indicator value

**State Data:**
- Current price, timestamp, volume
- Cached indicator values
- Historical price buffers

### 4. Strategy Registry (`bagbot/worker/strategies/registry.py`)

**Purpose:** Central registry for all trading strategies.

**Key Functions:**
- `register_strategy(name, strategy)` - Register strategy instance or class
- `unregister_all_strategies()` - Clear registry (test utility)
- `get_strategy(name: str)` - Retrieve strategy by name

**Built-in Strategies:**
- `ai_fusion` - AIFusionStrategy (main trading logic)
- `example` - ExampleStrategy (reference implementation)

## Event Processing Flow

### Price Update Flow
```
1. External System → brain.process("PRICE_UPDATE", payload)
2. Brain updates MarketState
3. Brain logs ROUTE_START event
4. Brain calls all registered strategies' on_price_update()
5. Strategies return decisions (or None)
6. Brain logs ROUTE_SUCCESS/ROUTE_FAIL
7. Brain calls master.evaluate_on_price() if present
8. Brain calls executor.update_equity()
```

### Signal Check Flow
```
1. External System → brain.process("SIGNAL_CHECK", payload)
2. Brain logs ROUTE_START event
3. Brain calls all registered strategies' on_signal_check()
4. Strategies return decisions (or None)
5. Brain logs ROUTE_SUCCESS/ROUTE_FAIL
6. Brain calls master.evaluate_on_signal_check() if present
```

## Strategy Interface

All strategies must implement `StrategyBase`:

```python
class StrategyBase:
    def on_price_update(self, payload: dict) -> Optional[dict]:
        """Process price update. Return decision dict or None."""
        raise NotImplementedError
    
    def on_signal_check(self, payload: dict) -> Optional[dict]:
        """Process signal check. Return decision dict or None."""
        raise NotImplementedError
```

**Decision Format:**
```python
{
    "type": "EXECUTE_ORDER",
    "symbol": "BTCUSDT",
    "side": "LONG" | "SHORT",
    "size": 1.0,
    "price": 100.0,
    "order": {
        "symbol": "BTCUSDT",
        "side": "BUY" | "SELL",
        "size": 1.0,
        "price": 100.0
    }
}
```

## Logging & Observability

### Structured Event Logging
Brain emits JSON-like structured logs for all routing events:

```python
{
    "evt": "ROUTE_START" | "ROUTE_SUCCESS" | "ROUTE_FAIL",
    "strategy": "ai_fusion",
    "type": "price_update" | "signal_check",
    "id": "2b884211",  # Job ID
    "duration_ms": 0.17,  # Optional
    "error": "exception message"  # Optional
}
```

**Log Levels:**
- `INFO` - ROUTE_START, ROUTE_SUCCESS
- `ERROR` - ROUTE_FAIL, initialization errors

## Error Handling

Brain is defensive and never raises exceptions to caller:

1. **Strategy Initialization:** Logs error, sets `_init_error` state
2. **Strategy Execution:** Catches exceptions, logs ROUTE_FAIL
3. **Indicator Access:** Returns None on error
4. **Job Queue Processing:** Returns None on any error

## Determinism Guarantees

Brain ensures deterministic behavior:

1. **Fixed Random Seeds:** All randomness is seeded
2. **Sequential Processing:** Events processed in order
3. **No Threading:** Single-threaded execution
4. **Reproducible State:** Same inputs → same outputs

## Integration Points

### Backtest Integration
```python
from bagbot.worker.brain.brain import TradingBrain
from bagbot.backtest.replay import ReplayEngine

brain = TradingBrain()

def callback(candle):
    brain.process("PRICE_UPDATE", {
        "symbol": candle["symbol"],
        "price": candle["close"],
        "timestamp": candle["timestamp"]
    })

replay = ReplayEngine(candles, tick_callback=callback)
replay.run()
```

### Live Trading Integration
```python
from bagbot.worker.brain.brain import TradingBrain
from bagbot.worker.queue import JobQueue

queue = JobQueue()
brain = TradingBrain(job_queue=queue)

# Producer adds jobs
queue.push(("PRICE_UPDATE", {"symbol": "BTCUSDT", "price": 100.0}))

# Brain processes
while True:
    brain.process_next_job()
```

## Testing Strategy

Brain includes comprehensive test coverage:

1. **Unit Tests:** Individual method testing
2. **Integration Tests:** Full event flow testing
3. **Routing Tests:** Strategy registration and routing
4. **Determinism Tests:** Reproducibility validation
5. **Error Handling Tests:** Exception safety

## Performance Characteristics

- **Latency:** <1ms per event (typical)
- **Throughput:** 1000+ events/sec (single-threaded)
- **Memory:** O(n) where n = number of registered strategies
- **Deterministic:** 100% reproducible with same seed

## Future Enhancements

1. **Async Support:** Optional async/await for network calls
2. **Multi-Strategy Voting:** Consensus mechanisms
3. **Risk Management:** Position size limits, stop-loss automation
4. **Performance Metrics:** Built-in latency tracking
5. **Event Replay:** Record/replay for debugging

## References

- Source: `bagbot/worker/brain/`
- Tests: `bagbot/tests/test_brain_*.py`
- Documentation: `docs/api_contracts.json`
- Examples: `bagbot/tests/test_brain_integration.py`
