# UI-API Mapping Document

## Overview

This document maps frontend UI components to backend API endpoints, defining the data flow between the React frontend and FastAPI backend.

## Architecture Summary

```
Frontend (Next.js/React)
    ↓ HTTP/WebSocket
Backend (FastAPI)
    ↓ Queue/Events
Worker (TradingBrain)
    ↓ Exchange API
Exchange (Binance/etc)
```

## API Base URLs

- **Production:** `https://bagbot2-backend.onrender.com`
- **Development:** `http://localhost:8000`

## Endpoint Mappings

### 1. Health & Status

#### GET `/` and GET `/api/health`
**Frontend Components:** 
- App initialization
- StatusIndicator component
- Health check utilities

**Purpose:** Verify backend connectivity

**Response:**
```json
{
  "status": "ok",
  "service": "bagbot backend"
}
```

**Frontend Usage:**
```typescript
// app/page.tsx or layout.tsx
const checkHealth = async () => {
  const res = await fetch('/api/health');
  const data = await res.json();
  return data.status === 'api healthy';
};
```

---

### 2. Worker Control

#### GET `/api/worker/status`
**Frontend Components:**
- WorkerStatusCard
- Dashboard main view
- Control panel

**Purpose:** Get current worker status

**Response:**
```json
{
  "status": "running" | "stopped",
  "thread_id": 123456,
  "uptime": "2h 15m"
}
```

**Frontend Usage:**
```typescript
// components/WorkerControl.tsx
const fetchWorkerStatus = async () => {
  const res = await fetch('/api/worker/status');
  return await res.json();
};
```

---

#### POST `/api/worker/start`
**Frontend Components:**
- StartButton component
- WorkerControlPanel

**Purpose:** Start the trading worker

**Request:** No body required

**Response:**
```json
{
  "status": "started",
  "thread_id": 123456,
  "message": "Worker started successfully"
}
```

**Frontend Usage:**
```typescript
// components/WorkerControl.tsx
const startWorker = async () => {
  const res = await fetch('/api/worker/start', {
    method: 'POST',
  });
  return await res.json();
};
```

---

#### POST `/api/worker/stop`
**Frontend Components:**
- StopButton component
- WorkerControlPanel

**Purpose:** Stop the trading worker

**Request:** No body required

**Response:**
```json
{
  "status": "stopped",
  "message": "Worker stopped successfully"
}
```

**Frontend Usage:**
```typescript
// components/WorkerControl.tsx
const stopWorker = async () => {
  const res = await fetch('/api/worker/stop', {
    method: 'POST',
  });
  return await res.json();
};
```

---

### 3. Trading Operations

#### POST `/api/trade`
**Frontend Components:**
- TradeExecutionPanel
- ManualTradeForm
- QuickTradeButtons

**Purpose:** Execute a manual trade

**Request:**
```json
{
  "symbol": "BTCUSDT",
  "side": "BUY" | "SELL",
  "quantity": 0.001,
  "price": 45000.00,
  "type": "LIMIT" | "MARKET"
}
```

**Response:**
```json
{
  "order_id": "abc123",
  "status": "filled" | "pending",
  "executed_price": 45000.00,
  "executed_quantity": 0.001
}
```

**Frontend Usage:**
```typescript
// components/TradePanel.tsx
const executeTrade = async (order: Order) => {
  const res = await fetch('/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return await res.json();
};
```

---

### 4. Market Data

#### GET `/api/market/price?symbol=BTCUSDT`
**Frontend Components:**
- PriceTickerCard
- TradingChart
- PriceDisplay

**Purpose:** Get current market price

**Query Parameters:**
- `symbol` (required): Trading pair symbol

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "price": 45000.00,
  "timestamp": "2025-11-23T17:30:00Z",
  "volume_24h": 1234.56
}
```

**Frontend Usage:**
```typescript
// components/PriceTicker.tsx
const getPrice = async (symbol: string) => {
  const res = await fetch(`/api/market/price?symbol=${symbol}`);
  return await res.json();
};
```

---

#### GET `/api/market/candles?symbol=BTCUSDT&interval=1h&limit=100`
**Frontend Components:**
- TradingViewChart
- CandlestickChart
- HistoricalDataView

**Purpose:** Get historical candle data

**Query Parameters:**
- `symbol` (required): Trading pair
- `interval` (optional): 1m, 5m, 15m, 1h, 4h, 1d (default: 1h)
- `limit` (optional): Number of candles (default: 100)

**Response:**
```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "candles": [
    {
      "timestamp": "2025-11-23T17:00:00Z",
      "open": 45000.00,
      "high": 45100.00,
      "low": 44900.00,
      "close": 45050.00,
      "volume": 123.45
    }
  ]
}
```

**Frontend Usage:**
```typescript
// components/Chart.tsx
const getCandles = async (symbol: string, interval: string) => {
  const res = await fetch(
    `/api/market/candles?symbol=${symbol}&interval=${interval}&limit=100`
  );
  return await res.json();
};
```

---

### 5. Account & Portfolio

#### GET `/api/account/balance`
**Frontend Components:**
- BalanceCard
- PortfolioSummary
- Dashboard overview

**Purpose:** Get account balance

**Response:**
```json
{
  "total_balance": 10000.00,
  "available_balance": 8500.00,
  "locked_balance": 1500.00,
  "currency": "USDT"
}
```

**Frontend Usage:**
```typescript
// components/BalanceCard.tsx
const getBalance = async () => {
  const res = await fetch('/api/account/balance');
  return await res.json();
};
```

---

#### GET `/api/account/positions`
**Frontend Components:**
- PositionsTable
- OpenPositionsCard
- PortfolioView

**Purpose:** Get open positions

**Response:**
```json
{
  "positions": [
    {
      "symbol": "BTCUSDT",
      "side": "LONG",
      "size": 0.001,
      "entry_price": 45000.00,
      "current_price": 45500.00,
      "unrealized_pnl": 0.50,
      "realized_pnl": 0.00
    }
  ]
}
```

**Frontend Usage:**
```typescript
// components/PositionsTable.tsx
const getPositions = async () => {
  const res = await fetch('/api/account/positions');
  return await res.json();
};
```

---

### 6. Orders Management

#### GET `/api/orders/history?limit=50`
**Frontend Components:**
- OrderHistoryTable
- TradeHistoryView
- ActivityLog

**Purpose:** Get order history

**Query Parameters:**
- `limit` (optional): Number of orders (default: 50)
- `symbol` (optional): Filter by symbol

**Response:**
```json
{
  "orders": [
    {
      "order_id": "abc123",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "type": "LIMIT",
      "quantity": 0.001,
      "price": 45000.00,
      "status": "filled",
      "filled_quantity": 0.001,
      "timestamp": "2025-11-23T17:00:00Z"
    }
  ],
  "total": 150
}
```

**Frontend Usage:**
```typescript
// components/OrderHistory.tsx
const getOrderHistory = async (limit: number = 50) => {
  const res = await fetch(`/api/orders/history?limit=${limit}`);
  return await res.json();
};
```

---

#### DELETE `/api/orders/{order_id}`
**Frontend Components:**
- OrderRow cancel button
- OrderManagement panel

**Purpose:** Cancel an open order

**Response:**
```json
{
  "order_id": "abc123",
  "status": "cancelled",
  "message": "Order cancelled successfully"
}
```

**Frontend Usage:**
```typescript
// components/OrderRow.tsx
const cancelOrder = async (orderId: string) => {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'DELETE'
  });
  return await res.json();
};
```

---

### 7. Strategy & Optimization

#### GET `/api/strategy/config`
**Frontend Components:**
- StrategyConfigPanel
- ParametersEditor
- SettingsView

**Purpose:** Get current strategy configuration

**Response:**
```json
{
  "strategy": "ai_fusion",
  "parameters": {
    "sma_short": 10,
    "sma_long": 30,
    "rsi_period": 14,
    "risk_per_trade_pct": 1.0
  }
}
```

---

#### PUT `/api/strategy/config`
**Frontend Components:**
- StrategyConfigForm
- ParametersEditor

**Purpose:** Update strategy configuration

**Request:**
```json
{
  "strategy": "ai_fusion",
  "parameters": {
    "sma_short": 10,
    "sma_long": 30
  }
}
```

**Response:**
```json
{
  "status": "updated",
  "message": "Strategy configuration updated"
}
```

---

#### POST `/api/backtest/run`
**Frontend Components:**
- BacktestPanel
- BacktestRunner
- OptimizationView

**Purpose:** Run backtest with given parameters

**Request:**
```json
{
  "strategy": "ai_fusion",
  "parameters": { "sma_short": 10 },
  "start_date": "2025-01-01",
  "end_date": "2025-11-23",
  "initial_balance": 10000.00
}
```

**Response:**
```json
{
  "backtest_id": "xyz789",
  "status": "completed",
  "results": {
    "final_balance": 12345.00,
    "total_return": 0.2345,
    "sharpe_ratio": 1.5,
    "max_drawdown": 0.15,
    "num_trades": 45,
    "win_rate": 0.62
  }
}
```

---

### 8. Logs & Monitoring

#### GET `/api/logs?limit=100`
**Frontend Components:**
- LogViewer
- ActivityFeed
- DebugConsole

**Purpose:** Get recent log entries

**Query Parameters:**
- `limit` (optional): Number of logs (default: 100)
- `level` (optional): Filter by level (INFO, ERROR, etc.)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-11-23T17:00:00Z",
      "level": "INFO",
      "message": "Brain routing event: {'evt': 'ROUTE_SUCCESS'}",
      "source": "brain.py:95"
    }
  ]
}
```

---

## WebSocket Connections

### Real-Time Price Updates
**Endpoint:** `ws://localhost:8000/ws/prices`

**Frontend Usage:**
```typescript
// hooks/useWebSocket.ts
const ws = new WebSocket('ws://localhost:8000/ws/prices');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updatePrice(data.symbol, data.price);
};
```

**Message Format:**
```json
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "price": 45000.00,
  "timestamp": "2025-11-23T17:00:00Z"
}
```

---

## Error Handling

All endpoints follow consistent error format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Frontend State Management

Recommended React Query patterns:

```typescript
// hooks/useWorkerStatus.ts
export const useWorkerStatus = () => {
  return useQuery(['worker', 'status'], 
    () => fetch('/api/worker/status').then(r => r.json()),
    { refetchInterval: 5000 }
  );
};

// hooks/useBalance.ts
export const useBalance = () => {
  return useQuery(['account', 'balance'],
    () => fetch('/api/account/balance').then(r => r.json())
  );
};
```

---

## Testing Endpoints

Use `curl` or `httpie` for testing:

```bash
# Health check
curl http://localhost:8000/api/health

# Start worker
curl -X POST http://localhost:8000/api/worker/start

# Get balance
curl http://localhost:8000/api/account/balance

# Execute trade
curl -X POST http://localhost:8000/api/trade \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"BUY","quantity":0.001}'
```

---

## Security Considerations

1. **Authentication:** API keys in headers (future enhancement)
2. **CORS:** Configured for frontend domain
3. **Rate Limiting:** 100 requests/minute per IP
4. **Input Validation:** All inputs validated server-side
5. **HTTPS:** Required in production

---

## References

- API Contract: `docs/api_contracts.json`
- Backend Source: `bagbot/backend/`
- Frontend Source: `bagbot/frontend/`
- Brain Architecture: `docs/brain_blueprint.md`
