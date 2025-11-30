# CI & Documentation Update - Quick Reference

## CI Test Coverage (77 Tests)

### Test Suites in CI Pipeline

```bash
# 1. All unit tests
pytest tests/ -v --tb=short

# 2. Connector tests (18 tests)
pytest tests/test_binance_connector.py -v

# 3. Order router tests (22 tests)
pytest tests/test_order_router.py -v

# 4. Risk manager tests (23 tests)
pytest tests/test_risk.py -v

# 5. Backtester tests (14 tests)
pytest tests/test_backtester.py -v
```

## Required Secrets for Live Trading

### Production Secrets (Required)

```bash
# Get from: https://www.binance.com/en/my/settings/api-management
BINANCE_API_KEY=your_production_api_key
BINANCE_API_SECRET=your_production_secret
BINANCE_TESTNET=false  # ⚠️ SET TO FALSE FOR LIVE

# Generate with: openssl rand -hex 32
TRADINGVIEW_SECRET=your_webhook_secret
```

### Configuration Secrets (Recommended)

```bash
MAX_ORDER_USD=10000.0      # Max order value per trade
MAX_POSITION_USD=50000.0   # Max position size per symbol
DATABASE_URL=postgresql://user:pass@host/db  # Production database
```

## Enable Live Trading Checklist

- [ ] Test thoroughly on testnet first
- [ ] Get production API keys from Binance
- [ ] Generate TradingView webhook secret
- [ ] Set `BINANCE_TESTNET=false`
- [ ] Configure risk limits
- [ ] Test with small order first
- [ ] Monitor closely
- [ ] Enable IP restrictions on API keys
- [ ] Use PostgreSQL in production
- [ ] Set up monitoring/alerts

## Run Local Tests

```bash
# All tests
pytest bagbot/tests/ -v

# Specific modules
pytest bagbot/tests/test_binance_connector.py -v
pytest bagbot/tests/test_order_router.py -v
pytest bagbot/tests/test_risk.py -v
pytest bagbot/tests/test_backtester.py -v

# With coverage
pytest bagbot/tests/ --cov=bagbot --cov-report=html -v
```

## Files Modified

- `.github/workflows/ci.yml` - Added 4 new test steps
- `README.md` - Added live trading guide, secrets table, enhanced testing section
