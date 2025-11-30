# Risk Manager Quick Reference

## Environment Variables

```bash
# Set in .env file or environment
MAX_ORDER_USD=10000      # Max single order value (default: $10,000)
MAX_POSITION_USD=50000   # Max position size per symbol (default: $50,000)
```

## Basic Usage

```python
from bagbot.trading.risk import check_order_limits, RiskLimitError

# Order payload
order = {
    "symbol": "BTC/USDT",
    "side": "buy",          # "buy" or "sell"
    "amount": 0.1,          # Quantity
    "price": 40000.0,       # Price (optional for market orders)
    "type": "limit"         # "market" or "limit"
}

# Check without account info
try:
    check_order_limits(order)
    print("✅ Order passed")
except RiskLimitError as e:
    print(f"❌ Rejected: {e}")

# Check with account info (includes position check)
account_info = {
    "positions": {
        "BTC/USDT": {"size": 1.0, "side": "long"}
    }
}
check_order_limits(order, account_info)
```

## Risk Checks

1. **Order Value Check**: `order_value = amount × price ≤ MAX_ORDER_USD`
2. **Position Size Check**: `new_position_value ≤ MAX_POSITION_USD`

## Get Current Limits

```python
from bagbot.trading.risk import get_risk_limits

limits = get_risk_limits()
print(f"Max order: ${limits['max_order_usd']:,.2f}")
print(f"Max position: ${limits['max_position_usd']:,.2f}")
```

## Automatic Integration

Risk checks are automatically applied in `order_router`:

```python
from bagbot.trading.order_router import route_order

# Risk checks run automatically
order = await route_order(
    "binance",
    {"symbol": "BTC/USDT", "side": "buy", "amount": 0.1},
    db
)
```

## Run Tests

```bash
pytest bagbot/tests/test_risk.py -v
```

## Files
- `bagbot/trading/risk.py` - Risk management module
- `bagbot/trading/order_router.py` - Integrated with risk checks
- `bagbot/tests/test_risk.py` - 23 comprehensive tests
