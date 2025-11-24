# Setting up Stripe for Bagbot

This guide explains how to integrate Stripe subscription payments with Bagbot.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Test mode API keys for development
- Live mode API keys for production

## Required Stripe Secrets

Add these environment variables to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

## Step 1: Create Stripe Products and Prices

1. **Log into Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/products

2. **Create Products**
   
   **Basic Plan:**
   - Name: Bagbot Basic
   - Billing: Recurring
   - Price: $9.99/month (or your price)
   - Copy the Price ID (starts with `price_...`)
   
   **Pro Plan:**
   - Name: Bagbot Pro
   - Billing: Recurring
   - Price: $29.99/month
   - Copy the Price ID
   
   **Enterprise Plan:**
   - Name: Bagbot Enterprise
   - Billing: Recurring
   - Price: $99.99/month
   - Copy the Price ID

3. **Update `.env` file with Price IDs**

## Step 2: Get API Keys

1. **Navigate to API Keys**
   - Go to: https://dashboard.stripe.com/test/apikeys

2. **Copy Secret Key**
   - Click "Reveal test key"
   - Copy the key starting with `sk_test_...`
   - Add to `.env` as `STRIPE_SECRET_KEY`

## Step 3: Set Up Webhook Endpoint

1. **Navigate to Webhooks**
   - Go to: https://dashboard.stripe.com/test/webhooks

2. **Add Endpoint**
   - Click "+ Add endpoint"
   - Endpoint URL: `https://api.thebagbot.trade/api/payments/webhook`
   - Description: Bagbot subscription events
   
3. **Select Events**
   Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. **Get Webhook Secret**
   - After creating, click on the webhook
   - Click "Reveal" under "Signing secret"
   - Copy the secret starting with `whsec_...`
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test Locally with Stripe CLI

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms
# https://stripe.com/docs/stripe-cli
```

### Forward Webhooks to Local Development

```bash
# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/payments/webhook

# This will output a webhook signing secret like: whsec_...
# Use this for local development
```

### Test Subscription Flow

```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

## Step 5: Test Integration

### Test Checkout Session Creation

```bash
curl -X POST http://localhost:8000/api/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "user_id": "test_user_123",
    "success_url": "https://thebagbot.trade/success",
    "cancel_url": "https://thebagbot.trade/cancel"
  }'
```

Response:
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_..."
}
```

### Use Test Cards

Stripe provides test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiry date and any CVC.

## Step 6: Configure GitHub Secrets (Production)

Add these secrets to your GitHub repository for production deployment:

```bash
# Using GitHub CLI
gh secret set STRIPE_SECRET_KEY --body "sk_live_..."
gh secret set STRIPE_WEBHOOK_SECRET --body "whsec_..."
gh secret set STRIPE_PRICE_ID_BASIC --body "price_..."
gh secret set STRIPE_PRICE_ID_PRO --body "price_..."
gh secret set STRIPE_PRICE_ID_ENTERPRISE --body "price_..."
```

Or manually:
1. Go to: https://github.com/sxygnfdq46-cell/BAGBOT2/settings/secrets/actions
2. Add each secret with "New repository secret"

## Step 7: Update Production Environment

Add to `.env` on your VPS (`/srv/bagbot/.env`):

```bash
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id
```

## API Endpoints

### Create Checkout Session

```http
POST /api/payments/create-checkout-session
Content-Type: application/json

{
  "plan": "basic" | "pro" | "enterprise",
  "user_id": "user_123",
  "success_url": "https://thebagbot.trade/success",
  "cancel_url": "https://thebagbot.trade/cancel"
}
```

### Webhook Endpoint

```http
POST /api/payments/webhook
Stripe-Signature: t=...,v1=...
```

This endpoint is called automatically by Stripe - do not call directly.

## Database Schema

The `subscriptions` table stores subscription data:

```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR UNIQUE NOT NULL,
    plan VARCHAR NOT NULL,  -- 'basic', 'pro', 'enterprise'
    status VARCHAR NOT NULL,  -- 'active', 'past_due', 'canceled', etc.
    current_period_end DATETIME NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
);
```

## Subscription Middleware

To protect endpoints with subscription requirements:

```python
from fastapi import Depends
from backend.middleware import check_subscription
from backend.models import Subscription

@app.get("/api/premium-feature")
async def premium_endpoint(
    subscription: Subscription = Depends(check_subscription)
):
    return {"plan": subscription.plan}
```

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription record in database |
| `customer.subscription.updated` | Update subscription status and renewal date |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.payment_failed` | Update status to `past_due` |

## Testing

Run payment tests:

```bash
cd bagbot
pytest tests/test_payments.py -v
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is publicly accessible
2. Verify webhook secret matches `.env` file
3. Check Stripe Dashboard → Webhooks → Event Attempts

### Invalid Signature Error

- Webhook secret mismatch
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- Use Stripe CLI for local testing

### Subscription Not Creating

- Check backend logs: `docker compose logs backend`
- Verify Price IDs are correct in `.env`
- Ensure database is initialized: `docker compose restart backend`

## Security Best Practices

1. **Never commit secrets** - use `.env` files (already in `.gitignore`)
2. **Use test mode** during development - switch to live mode only in production
3. **Validate webhook signatures** - already implemented in code
4. **Use HTTPS** in production - required by Stripe
5. **Monitor failed payments** - set up Stripe email notifications

## Going Live

Before switching to production:

1. ✅ Test all subscription flows in test mode
2. ✅ Switch from test keys to live keys
3. ✅ Update webhook endpoint to production URL
4. ✅ Configure live mode products and prices
5. ✅ Test with real credit card (then refund)
6. ✅ Set up Stripe email notifications
7. ✅ Configure tax collection (if applicable)

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing

## Pricing Plans

Customize these plans in `api/payment_routes.py`:

- **Basic**: $9.99/month - Basic trading features
- **Pro**: $29.99/month - Advanced features + priority support
- **Enterprise**: $99.99/month - All features + dedicated support
