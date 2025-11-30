# Bagbot - Institutional-Grade Trading Bot

Bagbot is a production-ready trading bot with automated order execution, risk management, and TradingView integration.

## Features

- 🤖 **Automated Trading**: Execute orders through multiple exchanges (Binance, etc.)
- 📊 **TradingView Integration**: Receive and process webhook signals from TradingView alerts
- 🛡️ **Risk Management**: Configurable limits on order size, value, and position
- 💾 **Database Tracking**: Full audit trail of all orders and transactions
- 🔒 **Secure Authentication**: HMAC-SHA256 signature verification for webhooks
- 📈 **Backtesting**: Test strategies on historical data
- 💳 **Stripe Integration**: Subscription-based payment processing

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/bagbot.git
cd bagbot

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r bagbot/backend/requirements.txt
```

### Configuration

Copy the environment template and configure:

```bash
cp .env.production.example .env
```

Edit `.env` with your credentials:

```bash
# Binance API (get from https://www.binance.com/en/my/settings/api-management)
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=true  # Set to false for live trading

# TradingView Webhook Secret (generate a random string)
TRADINGVIEW_SECRET=your_secret_key_here

# Risk Management Limits
MAX_ORDER_QTY=10.0
MAX_ORDER_VALUE_USD=100000.0
MIN_ORDER_QTY=0.0001

# Database
DATABASE_URL=sqlite:///./bagbot.db
```

### Run Backend

```bash
cd bagbot
source ../.venv/bin/activate
python -m backend.main
```

The API will be available at `http://localhost:8000`

## TradingView Setup

### 1. Generate Webhook Secret

Generate a secure random secret for webhook authentication:

```bash
# On Linux/Mac:
openssl rand -hex 32

# Or use Python:
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Add this to your `.env` file:

```bash
TRADINGVIEW_SECRET=your_generated_secret_here
```

### 2. Configure TradingView Alert

1. Open TradingView and create an alert on your chart
2. In the alert dialog, set the **Webhook URL**:
   ```
   https://your-domain.com/api/tradingview/webhook
   ```
   (For local testing: `http://localhost:8000/api/tradingview/webhook`)

3. Set the **Message** field with JSON payload:
   ```json
   {
       "symbol": "{{ticker}}",
       "side": "buy",
       "qty": 0.001,
       "type": "market",
       "secret": "your_generated_secret_here"
   }
   ```

4. **Alert Actions**: Enable "Webhook URL"

### 3. Signal Format

The webhook endpoint accepts the following JSON payload:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair (e.g., "BTC/USDT") |
| `side` | string | Yes | Order side: "buy" or "sell" |
| `qty` | float | Yes | Order quantity |
| `type` | string | No | Order type: "market" or "limit" (default: "market") |
| `price` | float | No | Limit price (required for limit orders) |
| `secret` | string | No* | Authentication secret (alternative to header) |
| `user_id` | string | No | User identifier (default: "tradingview") |

\* Either `secret` in payload OR `X-TradingView-Sign` header is required

### 4. Authentication Methods

**Method 1: Secret in Payload (Simpler)**

Include the secret in your TradingView alert message:

```json
{
    "symbol": "{{ticker}}",
    "side": "buy",
    "qty": 0.001,
    "secret": "your_secret_here"
}
```

**Method 2: HMAC Signature Header (More Secure)**

If using a custom webhook service, include the `X-TradingView-Sign` header with HMAC-SHA256 signature:

```python
import hmac
import hashlib

def sign_payload(payload: bytes, secret: str) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
```

### 5. Example TradingView Alert Messages

**Market Order:**
```json
{
    "symbol": "BTC/USDT",
    "side": "buy",
    "qty": 0.001,
    "type": "market",
    "secret": "your_secret"
}
```

**Limit Order:**
```json
{
    "symbol": "ETH/USDT",
    "side": "sell",
    "qty": 0.5,
    "type": "limit",
    "price": 3000.0,
    "secret": "your_secret"
}
```

**Using TradingView Variables:**
```json
{
    "symbol": "{{ticker}}",
    "side": "{{strategy.order.action}}",
    "qty": {{strategy.order.contracts}},
    "type": "market",
    "secret": "your_secret"
}
```

### 6. Testing the Webhook

Test your webhook configuration:

```bash
curl -X POST http://localhost:8000/api/tradingview/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "side": "buy",
    "qty": 0.001,
    "type": "market",
    "secret": "your_secret"
  }'
```

Expected response:
```json
{
    "success": true,
    "message": "Order created: buy 0.001 BTC/USDT",
    "order_id": 123,
    "external_id": "12345"
}
```

### 7. Webhook Health Check

Check webhook status:

```bash
curl http://localhost:8000/api/tradingview/health
```

Response:
```json
{
    "status": "operational",
    "webhook_url": "/api/tradingview/webhook",
    "authentication": "enabled",
    "connector": "binance",
    "testnet": true
}
```

## Risk Management

Orders are automatically validated against configurable limits:

```bash
# Environment Variables
MAX_ORDER_QTY=10.0              # Maximum quantity per order
MAX_ORDER_VALUE_USD=100000.0    # Maximum order value in USD
MIN_ORDER_QTY=0.0001            # Minimum quantity per order
```

Orders exceeding these limits will be rejected with a clear error message.

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database

All orders are stored in the database for audit trail:

```sql
-- Query recent orders
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check order status
SELECT status, COUNT(*) 
FROM orders 
GROUP BY status;
```

## How to Enable Live Trading

### ⚠️ IMPORTANT: Test Thoroughly First

Before enabling live trading, ensure you have:
1. Tested extensively on Binance Testnet (`BINANCE_TESTNET=true`)
2. Verified all order routing and risk checks work correctly
3. Confirmed TradingView webhooks are received properly
4. Reviewed all risk management limits
5. Set up proper monitoring and alerts

### Step 1: Get Production API Keys

1. Log in to [Binance](https://www.binance.com)
2. Go to **API Management** in your account settings
3. Click **Create API**
4. Complete security verification (2FA)
5. **Enable trading permissions** (Spot & Margin Trading)
6. Restrict API access by IP (highly recommended)
7. Save your API Key and Secret securely

### Step 2: Required Secrets

Add these to your `.env` file or deployment secrets:

```bash
# Binance Live Trading (get from https://www.binance.com/en/my/settings/api-management)
BINANCE_API_KEY=your_production_api_key_here
BINANCE_API_SECRET=your_production_api_secret_here
BINANCE_TESTNET=false  # ⚠️ SET TO FALSE FOR LIVE TRADING

# TradingView Webhook (generate with: openssl rand -hex 32)
TRADINGVIEW_SECRET=your_secure_random_secret_here

# Risk Limits (adjust based on your risk tolerance)
MAX_ORDER_USD=10000.0        # Maximum order value per trade
MAX_POSITION_USD=50000.0     # Maximum position size per symbol
MAX_ORDER_QTY=10.0           # Maximum quantity per order
MIN_ORDER_QTY=0.0001         # Minimum quantity per order
MAX_ORDER_VALUE_USD=100000.0 # Legacy limit (prefer MAX_ORDER_USD)

# Database
DATABASE_URL=postgresql://user:pass@host:5432/bagbot  # Use PostgreSQL in production
```

### Step 3: Enable Live Trading

1. **Update environment configuration:**
   ```bash
   # In .env file
   BINANCE_TESTNET=false
   ```

2. **Verify configuration:**
   ```bash
   cd bagbot
   source ../.venv/bin/activate
   python -c "import os; print(f'Testnet: {os.getenv(\"BINANCE_TESTNET\", \"true\")}')"
   ```

3. **Restart the application:**
   ```bash
   # Development
   python -m backend.main
   
   # Production (with Docker)
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Test with small order first:**
   ```bash
   # Send test webhook with minimal quantity
   curl -X POST https://your-domain.com/api/tradingview/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "symbol": "BTC/USDT",
       "side": "buy",
       "qty": 0.0001,
       "type": "market",
       "secret": "your_secret"
     }'
   ```

5. **Monitor closely:**
   - Check order execution in logs
   - Verify orders appear on Binance
   - Monitor balance changes
   - Watch for any errors

### Required Secrets Summary

| Secret | Required | Where to Get | Description |
|--------|----------|--------------|-------------|
| `BINANCE_API_KEY` | ✅ Yes | [Binance API Management](https://www.binance.com/en/my/settings/api-management) | Production API key with trading enabled |
| `BINANCE_API_SECRET` | ✅ Yes | Binance API Management | Production API secret (keep secure!) |
| `TRADINGVIEW_SECRET` | ✅ Yes | Generate: `openssl rand -hex 32` | Webhook authentication secret |
| `DATABASE_URL` | ⚠️ Recommended | Your database provider | PostgreSQL connection string |
| `MAX_ORDER_USD` | ⚠️ Recommended | Set based on risk | Maximum order value limit |
| `MAX_POSITION_USD` | ⚠️ Recommended | Set based on risk | Maximum position size limit |

### Production Deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

### Security Checklist

- [ ] Generate strong `TRADINGVIEW_SECRET` (32+ characters)
- [ ] Use HTTPS in production (not HTTP)
- [ ] Set `BINANCE_TESTNET=false` only after thorough testing
- [ ] Configure appropriate risk limits (`MAX_ORDER_USD`, `MAX_POSITION_USD`)
- [ ] Enable IP restrictions on Binance API keys
- [ ] Use PostgreSQL instead of SQLite in production
- [ ] Enable logging and monitoring
- [ ] Set up alerts for failed orders or errors
- [ ] Regularly review order history
- [ ] Keep API keys secure (never commit to git)
- [ ] Back up database regularly
- [ ] Test disaster recovery procedures

## Testing

Run the complete test suite:

```bash
cd bagbot
source ../.venv/bin/activate

# Run all tests
pytest tests/ -v

# Run specific test suites
pytest tests/test_binance_connector.py -v      # Exchange connector tests
pytest tests/test_order_router.py -v           # Order routing tests
pytest tests/test_risk.py -v                   # Risk management tests
pytest tests/test_backtester.py -v             # Backtesting engine tests
pytest tests/test_tradingview_routes.py -v     # TradingView webhook tests

# Run with coverage
pytest tests/ --cov=bagbot --cov-report=html -v
```

### Test Coverage

Current test coverage:
- **Connectors**: 18 tests (mocked exchange interactions)
- **Order Router**: 22 tests (risk checks, order placement, DB persistence)
- **Risk Manager**: 23 tests (order/position limits, edge cases)
- **Backtester**: 14 tests (strategy execution, performance metrics)
- **TradingView**: 18 tests (webhook authentication, signal parsing)

Total: **95+ tests** covering all critical paths

## Troubleshooting

### Webhook Returns 401 Unauthorized

- Verify `TRADINGVIEW_SECRET` matches in both `.env` and TradingView alert
- Check secret is correctly included in payload or header
- Ensure no extra whitespace in secret

### Order Rejected by Risk Checks

- Check `MAX_ORDER_QTY` and `MAX_ORDER_VALUE_USD` limits
- Verify order quantity and price are within bounds
- Review logs: `tail -f logs/bagbot.log`

### Exchange Connection Errors

- Verify `BINANCE_API_KEY` and `BINANCE_API_SECRET` are correct
- Ensure testnet keys for `BINANCE_TESTNET=true`
- Check API key permissions include trading

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/bagbot/issues
- Documentation: https://github.com/yourusername/bagbot/docs

## License

[Your License Here]
