# BAGBOT API Endpoint Mapping
**Complete Backend API Documentation for Frontend Integration**

## Base URLs
- **Production API**: `https://api.thebagbot.trade`
- **Production Frontend**: `https://thebagbot.trade`
- **WebSocket**: `wss://api.thebagbot.trade/ws`

---

## 1. Core System Routes (`/api`)

### Health & Status
- `GET /` → System status
- `GET /api/health` → Health check `{ok: true, status: "healthy", version: "2.0.0"}`

### Worker Control
- `POST /api/worker/start` → Start trading engine loop
- `POST /api/worker/stop` → Stop trading engine
- `GET /api/worker/status` → `{status: "running"/"stopped", thread_id: int}`

---

## 2. Strategy Arsenal Routes (`/api/strategy_arsenal`)
*ICT-based strategies (FVG, OB, Breaker, Kill Zone, etc.)*

- `GET /api/strategy_arsenal/` → List all strategies
- `GET /api/strategy_arsenal/{strategy_id}` → Get strategy details
- `POST /api/strategy_arsenal/{strategy_id}/enable` → Enable strategy
- `POST /api/strategy_arsenal/{strategy_id}/disable` → Disable strategy
- `PUT /api/strategy_arsenal/{strategy_id}/config` → Update strategy config
- `GET /api/strategy_arsenal/{strategy_id}/performance` → Performance metrics
- `GET /api/strategy_arsenal/{strategy_id}/suitability` → Market suitability analysis

---

## 3. Risk Engine Routes (`/api/risk_engine`)
*Real-time risk monitoring and limits*

- `GET /api/risk_engine/metrics` → Current risk metrics
- `GET /api/risk_engine/limits` → Risk limit configuration
- `PUT /api/risk_engine/limits` → Update risk limits
- `GET /api/risk_engine/exposure` → Position exposure analysis
- `GET /api/risk_engine/history` → Risk history timeline
- `GET /api/risk_engine/circuit-breaker` → Circuit breaker status
- `POST /api/risk_engine/circuit-breaker/reset` → Reset circuit breaker
- `GET /api/risk_engine/violations` → Risk violations log

---

## 4. Order Management Routes (`/api/order`)
*Order lifecycle management*

- `POST /api/order/create` → Create new order
  ```json
  {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "order_type": "LIMIT",
    "quantity": 0.1,
    "price": 50000.0,
    "stop_loss": 49000.0,
    "take_profit": 52000.0
  }
  ```
- `GET /api/order/list` → List all orders (with filters)
- `GET /api/order/{order_id}` → Get order details
- `POST /api/order/{order_id}/cancel` → Cancel order

---

## 5. Systems Intelligence Routes (`/api/systems`)
*Market intelligence, knowledge engine, AI chat*

### News Intelligence
- `GET /api/systems/news/briefing` → Daily market briefing
- `GET /api/systems/news/context` → News context for symbols

### Knowledge Engine (PDF Ingestion)
- `GET /api/systems/knowledge/documents` → List uploaded documents
- `POST /api/systems/knowledge/upload` → Upload PDF (multipart/form-data)
- `POST /api/systems/knowledge/search` → Search knowledge base
  ```json
  {
    "query": "What is a fair value gap?",
    "top_k": 5
  }
  ```

### AI Chat Assistant
- `POST /api/systems/chat/query` → Ask AI question
  ```json
  {
    "question": "Should I take this BTCUSDT setup?",
    "context": {"symbol": "BTCUSDT", "price": 50000}
  }
  ```
- `GET /api/systems/chat/history/{session_id}` → Chat history

### Micro-Trend System
- `GET /api/systems/micro-trend/status` → Current micro-trend state
- `GET /api/systems/micro-trend/signals` → Micro-trend signals

### Streak System
- `GET /api/systems/streaks/current` → Current win/loss streaks
- `GET /api/systems/streaks/history` → Streak history

### Strategy Switcher
- `GET /api/systems/switcher/status` → Current active strategy
- `GET /api/systems/switcher/history` → Strategy switch history

### HTM System
- `GET /api/systems/mindset/state` → Current mindset state
- `GET /api/systems/htm/bias` → HTM bias levels

### Market Adapters
- `GET /api/systems/market/adapters` → List all adapters (Binance, MT5, TradingView, Oanda, OKX, HTM)
  ```json
  {
    "adapters": [
      {
        "name": "Binance",
        "type": "exchange",
        "enabled": true,
        "connected": true,
        "symbols": ["BTCUSDT", "ETHUSDT"],
        "last_update": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

### System Overview
- `GET /api/systems/overview` → Complete system status dashboard

---

## 6. Subscription & Tier Routes (`/api/subscription`)
*User tiers and API key management*

### API Tokens
- `POST /api/subscription/tokens` → Create new API token
- `GET /api/subscription/tokens/{user_id}` → List user tokens
- `DELETE /api/subscription/tokens/{token_id}` → Delete token
- `PUT /api/subscription/tokens/{token_id}/upgrade` → Upgrade token tier

### Usage & Limits
- `GET /api/subscription/usage/{user_id}` → Usage statistics
- `GET /api/subscription/tiers` → List all tiers (Starter, Pro, Enterprise)
- `GET /api/subscription/tiers/{tier_name}` → Tier details

---

## 7. Backtest Routes (`/api/backtest`)

- `POST /api/backtest/run` → Run backtest
- `GET /api/backtest/results/{backtest_id}` → Get backtest results
- `GET /api/backtest/list` → List all backtests

---

## 8. Optimizer Routes (`/api/optimizer`)

- `POST /api/optimizer/run` → Run genetic optimization
- `GET /api/optimizer/results/{optimization_id}` → Get optimization results
- `GET /api/optimizer/list` → List optimizations

---

## 9. Strategy Routes (`/api/strategy`)

- `GET /api/strategy/list` → List user strategies
- `POST /api/strategy/create` → Create strategy
- `GET /api/strategy/{strategy_id}` → Get strategy
- `PUT /api/strategy/{strategy_id}` → Update strategy
- `DELETE /api/strategy/{strategy_id}` → Delete strategy

---

## 10. Logs Routes (`/api/logs`)

- `GET /api/logs/system` → System logs
- `GET /api/logs/trading` → Trading logs
- `GET /api/logs/errors` → Error logs

---

## 11. Payment Routes (`/api/payment`)
*Stripe integration*

- `POST /api/payment/create-checkout-session` → Create Stripe checkout
- `POST /api/payment/webhook` → Stripe webhook handler
- `GET /api/payment/subscription/{user_id}` → Get subscription status

---

## 12. TradingView Webhook Routes (`/api/tradingview`)

- `POST /api/tradingview/webhook` → Receive TradingView alerts
  ```json
  {
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price": 50000.0,
    "strategy": "FVG_ENTRY",
    "secret": "your_tradingview_secret"
  }
  ```

---

## 13. Admin Routes (`/api/admin`)

- `GET /api/admin/users` → List all users
- `POST /api/admin/pause` → Pause trading globally
- `POST /api/admin/resume` → Resume trading

---

## 14. Artifacts Routes (`/api/artifacts`)

- `GET /api/artifacts/genomes` → List saved genomes
- `GET /api/artifacts/reports` → List backtest reports
- `GET /api/artifacts/download/{artifact_id}` → Download artifact

---

## WebSocket Endpoints

### Real-time Data Streams

#### Market Data
- **Endpoint**: `ws://api.thebagbot.trade/ws/market`
- **Message Format**:
  ```json
  {
    "symbol": "BTCUSDT",
    "price": 50000.0,
    "change": 250.0,
    "changePercent": 0.5,
    "volume": 1000000.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

#### Real-time Signals
- **Endpoint**: `ws://api.thebagbot.trade/ws/signals`
- **Message Format**:
  ```json
  {
    "signal_id": "sig_123",
    "symbol": "BTCUSDT",
    "strategy": "FVG_ENTRY",
    "action": "BUY",
    "confidence": 0.85,
    "entry": 50000.0,
    "stop_loss": 49000.0,
    "take_profit": 52000.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

#### Risk Events
- **Endpoint**: `ws://api.thebagbot.trade/ws/risk`
- **Message Format**:
  ```json
  {
    "event_type": "LIMIT_BREACH",
    "severity": "HIGH",
    "message": "Max drawdown reached: 8.5%",
    "current_value": 8.5,
    "limit_value": 10.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

#### AI Messages
- **Endpoint**: `ws://api.thebagbot.trade/ws/ai`
- **Message Format**:
  ```json
  {
    "message_id": "msg_123",
    "role": "assistant",
    "content": "Detected FVG at 50000 on BTCUSDT. Entry conditions met.",
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

#### News Stream
- **Endpoint**: `ws://api.thebagbot.trade/ws/news`
- **Message Format**:
  ```json
  {
    "news_id": "news_123",
    "headline": "Bitcoin breaks 50k resistance",
    "summary": "Market shows bullish momentum...",
    "sentiment": "BULLISH",
    "impact": "HIGH",
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

#### System Logs
- **Endpoint**: `ws://api.thebagbot.trade/ws/logs`
- **Message Format**:
  ```json
  {
    "log_id": "log_123",
    "level": "INFO",
    "module": "order_router",
    "message": "Order placed successfully",
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

---

## Frontend → Backend Mapping

### Page: AI Command Center (`/dashboard`)
- `GET /api/systems/overview` → System status cards
- `GET /api/worker/status` → Worker control
- `POST /api/worker/start` → Start trading
- `POST /api/worker/stop` → Stop trading
- `ws://api.thebagbot.trade/ws/logs` → Real-time logs
- `ws://api.thebagbot.trade/ws/signals` → Live signals

### Page: Trading Terminal (`/dashboard/trading`)
- `POST /api/order/create` → Place orders
- `GET /api/order/list` → Order history
- `POST /api/order/{id}/cancel` → Cancel orders
- `GET /api/strategy_arsenal/` → Active strategies
- `ws://api.thebagbot.trade/ws/market` → Price updates

### Page: Market Adapters (`/dashboard/adapters`)
- `GET /api/systems/market/adapters` → Adapter status
- Enable/disable adapters (implementation needed)

### Page: Strategy Arsenal (`/dashboard/strategy-arsenal`)
- `GET /api/strategy_arsenal/` → List strategies
- `GET /api/strategy_arsenal/{id}` → Strategy details
- `POST /api/strategy_arsenal/{id}/enable` → Enable
- `POST /api/strategy_arsenal/{id}/disable` → Disable
- `PUT /api/strategy_arsenal/{id}/config` → Update config

### Page: Portfolio Analytics (`/dashboard/analytics/portfolio`)
- `GET /api/order/list` → Position history
- `GET /api/risk_engine/metrics` → P&L metrics
- `GET /api/systems/streaks/current` → Win/loss streaks

### Page: Risk Analytics (`/dashboard/analytics/risk`)
- `GET /api/risk_engine/metrics` → Current metrics
- `GET /api/risk_engine/exposure` → Exposure analysis
- `GET /api/risk_engine/history` → Risk timeline
- `GET /api/risk_engine/violations` → Violations log
- `ws://api.thebagbot.trade/ws/risk` → Real-time alerts

### Page: Market Intelligence (`/dashboard/analytics/market`)
- `GET /api/systems/news/briefing` → Market briefing
- `GET /api/systems/micro-trend/signals` → Trend signals
- `GET /api/systems/htm/bias` → HTM bias
- `ws://api.thebagbot.trade/ws/news` → News stream

### Page: Knowledge Intelligence (`/dashboard/analytics/knowledge`)
- `GET /api/systems/knowledge/documents` → Document list
- `POST /api/systems/knowledge/upload` → Upload PDF
- `POST /api/systems/knowledge/search` → Search knowledge

### Page: AI Helper (`/dashboard/ai`)
- `POST /api/systems/chat/query` → Ask questions
- `GET /api/systems/chat/history/{session_id}` → Chat history
- `ws://api.thebagbot.trade/ws/ai` → Real-time responses

### Page: Settings (`/dashboard/settings`)
- `GET /api/subscription/usage/{user_id}` → Usage stats
- `GET /api/subscription/tokens/{user_id}` → API tokens
- `POST /api/subscription/tokens` → Create token
- `DELETE /api/subscription/tokens/{id}` → Delete token
- `GET /api/risk_engine/limits` → Risk limits
- `PUT /api/risk_engine/limits` → Update limits

### Page: Logs (`/dashboard/logs`)
- `GET /api/logs/system` → System logs
- `GET /api/logs/trading` → Trading logs
- `GET /api/logs/errors` → Error logs
- `ws://api.thebagbot.trade/ws/logs` → Live logs

### Page: Authentication (`/login`, `/signup`, `/reset-password`)
- `POST /api/auth/login` → Login (needs implementation)
- `POST /api/auth/signup` → Signup (needs implementation)
- `POST /api/auth/reset-password` → Reset (needs implementation)
- `POST /api/auth/logout` → Logout (needs implementation)

---

## Authentication Flow (To Be Implemented)

### JWT Token-based Authentication
1. User submits credentials → `POST /api/auth/login`
2. Backend validates → Returns JWT token
3. Frontend stores token in localStorage/cookies
4. All subsequent requests include: `Authorization: Bearer <token>`
5. Backend validates token on each request

### Required Auth Endpoints (Not Yet Implemented)
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` → Current user profile

---

## Error Response Format

All endpoints return consistent error format:
```json
{
  "ok": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common HTTP Status Codes**:
- `200 OK` → Success
- `201 Created` → Resource created
- `400 Bad Request` → Invalid input
- `401 Unauthorized` → Missing/invalid auth
- `403 Forbidden` → Insufficient permissions
- `404 Not Found` → Resource not found
- `429 Too Many Requests` → Rate limit exceeded
- `500 Internal Server Error` → Server error

---

## Rate Limiting

**Nginx Configuration**: 10 req/s with 20 burst

**Per-endpoint limits** (if configured):
- Health check: Unlimited
- WebSocket: 1000 concurrent connections
- File upload: 50MB max

---

## Next Steps for Frontend Integration

1. ✅ **API Client Updated**: Base URL configured for production
2. ⏳ **Replace Mock Data**: Connect all 12 pages to real endpoints
3. ⏳ **WebSocket Integration**: Update 6 hooks with production URLs
4. ⏳ **Authentication**: Implement JWT flow + protected routes
5. ⏳ **Error Handling**: Add toast notifications for API errors
6. ⏳ **Loading States**: Add skeletons for async operations
7. ⏳ **Real-time Updates**: Verify WebSocket reconnection logic

