# Brain Architecture Blueprint

## Overview
High-level blueprint for the trading brain components.

## Core Components
### 1. TradingBrain
Coordinates market data, routing, and execution.

### 2. StrategyRouter
Routes signals to registered strategies.

### 3. MarketState
Maintains latest market context for decisions.

### 4. Strategy Registry
Stores available strategies and metadata.

## Event Processing Flow
1. Ingest market event
2. Update `worker/brain/market_state.py`
3. Route via `worker/brain/strategy_router.py`
4. Execute through `worker/brain/brain.py`

## Strategy Interface
Strategies expose `generate_signals(state)` and risk hooks.

## Logging & Observability
Logs emitted from brain and router; metrics exported for monitoring.

## Error Handling
Defensive guards around strategy execution and connector calls.

## Determinism Guarantees
Deterministic processing through ordered event handling and idempotent jobs.

## Integration Points
- Worker control API
- Exchange connectors
- Strategy registry

## Testing Strategy
Unit tests for router/brain, integration tests for worker control.

## Performance Characteristics
Lightweight routing, minimal allocation; batch operations when possible.

## References
- worker/brain/brain.py
- worker/brain/strategy_router.py
- worker/brain/market_state.py
- worker/strategies/registry.py
