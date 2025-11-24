# Stripe Integration Quick Reference

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   pip install stripe sqlalchemy aiosqlite
   ```

2. **Set environment variables:**
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...
   export STRIPE_WEBHOOK_SECRET=whsec_...
   export STRIPE_PRICE_ID_PRO=price_...
   ```

3. **Test webhook locally:**
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook
   ```

## 📡 API Endpoints

### Create Checkout Session
```bash
POST /api/payments/create-checkout-session
{
  "plan": "pro",
  "user_id": "user_123",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

### Webhook (Stripe calls this)
```bash
POST /api/payments/webhook
Headers: Stripe-Signature
```

## 🗄️ Database

**Table:** `subscriptions`

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| user_id | String | User identifier (unique) |
| stripe_customer_id | String | Stripe customer ID |
| stripe_subscription_id | String | Stripe subscription ID (unique) |
| plan | String | basic/pro/enterprise |
| status | String | active/past_due/canceled |
| current_period_end | DateTime | Subscription expiry |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

## 🛡️ Using Middleware

### Option 1: HTTP Middleware (Global)
```python
from backend.middleware import require_active_subscription

app.middleware("http")(require_active_subscription)
```

### Option 2: Route Dependency (Specific routes)
```python
from fastapi import Depends
from backend.middleware import check_subscription

@app.get("/premium-feature")
async def premium(subscription = Depends(check_subscription)):
    return {"plan": subscription.plan}
```

## 🧪 Testing

```bash
# Run all payment tests
pytest bagbot/tests/test_payments.py -v

# Run specific test
pytest bagbot/tests/test_payments.py::TestWebhook::test_webhook_checkout_completed -v
```

## 🔑 Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0027 6000 3184 | 3D Secure |

Use any future expiry and any CVC.

## 🎭 Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription |
| `customer.subscription.updated` | Update status/plan |
| `customer.subscription.deleted` | Cancel subscription |
| `invoice.payment_failed` | Mark as past_due |

## 📊 Subscription Plans

| Plan | Monthly Price | Features |
|------|---------------|----------|
| Basic | $9.99 | Basic features |
| Pro | $29.99 | Advanced + priority support |
| Enterprise | $99.99 | All features + dedicated support |

## 🚨 Troubleshooting

**Webhook not working?**
- Check URL is publicly accessible
- Verify webhook secret matches
- Use Stripe CLI for local testing

**Invalid signature?**
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Don't modify the raw request body

**Subscription not creating?**
- Check backend logs
- Verify Price IDs are correct
- Ensure database is initialized

## 📚 Full Documentation

See `docs/STRIPE_SETUP.md` for complete setup guide.
