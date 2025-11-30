# Order Router Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER ROUTING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │  API Request │
                          │ or Strategy  │
                          └──────┬───────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   route_order()        │
                    │ trading/order_router.py│
                    └────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │ Step 1: Risk    │
                    │ check_risk_     │
                    │ limits()        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────┐
                    │ 5 Risk Checks:      │
                    │ • Max quantity      │
                    │ • Max value         │
                    │ • Min quantity      │
                    │ • Valid side        │
                    │ • Valid symbol      │
                    └────────┬────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Step 2: Load      │
                   │ Connector         │
                   │ load_connector()  │
                   └─────────┬─────────┘
                             │
              ┌──────────────▼──────────────┐
              │   Connector Registry        │
              │ ┌─────────┬─────────┬────┐ │
              │ │ binance │ coinbase│ ...│ │
              │ └─────────┴─────────┴────┘ │
              └──────────────┬──────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Step 3: Execute   │
                   │ connector.create_ │
                   │ order()           │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │  Exchange API     │
                   │  (Binance, etc.)  │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Exchange Response │
                   │ {                 │
                   │   id: "12345",    │
                   │   status: "open", │
                   │   ...             │
                   │ }                 │
                   └─────────┬─────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Step 4: Persist   │
                   │ Create Order      │
                   │ record in DB      │
                   └─────────┬─────────┘
                             │
              ┌──────────────▼──────────────┐
              │    Database: orders table    │
              │ ┌──────────────────────────┐ │
              │ │ id, user_id, symbol,     │ │
              │ │ qty, price, side, status,│ │
              │ │ external_id, timestamps  │ │
              │ └──────────────────────────┘ │
              └──────────────┬───────────────┘
                             │
                   ┌─────────▼─────────┐
                   │ Return Order      │
                   │ object to caller  │
                   └───────────────────┘

═══════════════════════════════════════════════════════════════════

ERROR HANDLING:

┌──────────────────┐      ┌──────────────────┐
│ RiskCheckError   │      │ Exchange Error   │
│ (Step 1)         │      │ (Step 3)         │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └─────────┬───────────────┘
                   │
         ┌─────────▼─────────┐
         │ Create Order with │
         │ status="rejected" │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ Save to Database  │
         │ (audit trail)     │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ Re-raise exception│
         │ to caller         │
         └───────────────────┘

═══════════════════════════════════════════════════════════════════

DATABASE SCHEMA:

┌─────────────────────────────────────────────┐
│ TABLE: orders                               │
├──────────────┬──────────┬──────────────────┤
│ Column       │ Type     │ Constraints      │
├──────────────┼──────────┼──────────────────┤
│ id           │ INTEGER  │ PRIMARY KEY      │
│ user_id      │ VARCHAR  │ NOT NULL, INDEX  │
│ symbol       │ VARCHAR  │ NOT NULL, INDEX  │
│ qty          │ FLOAT    │ NOT NULL         │
│ price        │ FLOAT    │ NULL (market)    │
│ side         │ VARCHAR  │ NOT NULL         │
│ status       │ VARCHAR  │ NOT NULL         │
│ external_id  │ VARCHAR  │ INDEX            │
│ created_at   │ DATETIME │ INDEX, DEFAULT   │
│ updated_at   │ DATETIME │ DEFAULT          │
└──────────────┴──────────┴──────────────────┘

═══════════════════════════════════════════════════════════════════

RISK CHECK CONFIGURATION:

Environment Variable     Default    Description
─────────────────────   ────────   ─────────────────────────
MAX_ORDER_QTY           10.0       Max quantity per order
MAX_ORDER_VALUE_USD     100000.0   Max order value ($)
MIN_ORDER_QTY           0.0001     Min quantity per order

═══════════════════════════════════════════════════════════════════

TEST COVERAGE (22 tests):

Category              Tests  Status
──────────────────   ─────  ──────
Connector Loading       3    ✅ Pass
Risk Checks             6    ✅ Pass
Order Routing           5    ✅ Pass
Query/Update            8    ✅ Pass
──────────────────   ─────  ──────
TOTAL                  22    ✅ Pass
```

## Key Components

### 1. route_order() Function
- **Location**: `bagbot/trading/order_router.py`
- **Purpose**: Main entry point for order routing
- **Parameters**:
  - `connector_name`: Exchange name (e.g., "binance")
  - `order_payload`: Order details dict
  - `db`: Database session
  - `user_id`: User identifier
  - `testnet`: Safety flag (default True)
- **Returns**: Order object with external_id

### 2. Risk Checks
- **5 Validations**: Quantity, value, minimums, side, symbol
- **Configurable**: Via environment variables
- **Fail-Safe**: Creates rejected order record on failure

### 3. Connector Registry
- **Extensible**: Easy to add new exchanges
- **Current**: Binance connector
- **Future**: Coinbase, Kraken, etc.

### 4. Database Persistence
- **Always Saves**: Even on failure (audit trail)
- **Indexed Columns**: Fast queries on user_id, symbol, created_at
- **Status Tracking**: Maps exchange status to internal states

## Usage Example

```python
from trading.order_router import route_order
from backend.models import get_db

async def place_order():
    db = next(get_db())
    
    order = await route_order(
        "binance",
        {
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "amount": 0.001
        },
        db,
        user_id="trader123",
        testnet=True
    )
    
    print(f"Order {order.id} created with external_id: {order.external_id}")
    return order
```
