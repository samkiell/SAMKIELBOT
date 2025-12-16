# SAMKIEL BOT - Billing System Setup Guide

## Environment Variables

Add the following to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Frontend URL (for payment callbacks)
FRONTEND_URL=http://localhost:3000
```

## Database Setup

### 1. Seed Premium Plans

Run the seed script to populate the database with premium plans:

```bash
cd backend
node scripts/seedPlans.js
```

This will create three premium plans:
- **Starter Plan**: ₦1,500/month - 3 bots, 500 MB RAM, 30% CPU
- **Pro Plan**: ₦3,000/month - 3 bots, 1 GB RAM, 40% CPU (RECOMMENDED)
- **Max Plan**: ₦5,000/month - 3 bots, 2 GB RAM, 50% CPU

## Paystack Setup

### 1. Create Paystack Account
- Sign up at https://paystack.com
- Get your API keys from Settings > API Keys & Webhooks

### 2. Configure Webhook
- In Paystack Dashboard, go to Settings > API Keys & Webhooks
- Add webhook URL: `https://your-domain.com/api/billing/webhook/paystack`
- Select events:
  - `charge.success`
  - `subscription.disable`
  - `subscription.not_renew`

### 3. Test Mode
- Use test keys (starting with `sk_test_` and `pk_test_`) for development
- Use live keys for production

## Features Implemented

### Backend
- ✅ Plan model with resource limits
- ✅ Subscription model with Paystack integration
- ✅ User model extended with billing fields
- ✅ Paystack service for payments
- ✅ Billing service for limit enforcement
- ✅ Billing controller with payment flow
- ✅ Webhook handler for payment events
- ✅ Daily cron job for subscription expiration
- ✅ Bot creation limit enforcement
- ✅ Resource limit enforcement
- ✅ Automatic downgrade on expiration
- ✅ Notification system integration

### Frontend
- ✅ Pricing page with all plans
- ✅ Landing page pricing section
- ✅ Subscription dashboard card
- ✅ Payment initialization
- ✅ Upgrade/downgrade flows
- ✅ Subscription status display

## API Endpoints

### Public
- `GET /api/billing/plans` - Get all active plans

### Protected (Requires Authentication)
- `GET /api/billing/subscription/status` - Get user's subscription status
- `POST /api/billing/subscription/initialize` - Initialize payment
- `GET /api/billing/subscription/verify/:reference` - Verify payment
- `POST /api/billing/subscription/cancel` - Cancel subscription
- `GET /api/billing/subscription/history` - Get subscription history

### Webhook
- `POST /api/billing/webhook/paystack` - Paystack webhook handler

## Limits Enforcement

### FREE Account
- Max bots: 1
- CPU: 25%
- RAM: 300 MB
- Disk: 500 MB

### PREMIUM Plans
Limits are dynamically loaded from the database based on the user's active plan.

### Enforcement Points
1. **Bot Creation**: Checked before creating a new deployment
2. **Resource Allocation**: Applied when provisioning Pterodactyl server
3. **Downgrade**: Excess bots are suspended when user downgrades

## Notifications

Users receive notifications for:
- ✅ Subscription activated
- ⚠️ Subscription expiring soon (7 days)
- ⚠️ Subscription expired
- ⚠️ Account downgraded
- ⚠️ Bot suspended due to downgrade

## Security

- ✅ Webhook signature validation
- ✅ Idempotent payment processing
- ✅ Server-side limit enforcement
- ✅ Audit trail in subscription model

## Testing

### Test Payment Flow
1. Navigate to `/pricing`
2. Click "Upgrade to Premium" on any plan
3. Complete payment with Paystack test card:
   - Card: 4084 0840 8408 4081
   - CVV: 408
   - Expiry: Any future date
   - PIN: 0000
   - OTP: 123456

### Test Downgrade
1. Wait for subscription to expire (or manually update in DB)
2. Cron job will automatically downgrade user
3. Check notifications for downgrade message

## Troubleshooting

### Payment not completing
- Check Paystack webhook is configured
- Verify webhook signature validation
- Check backend logs for errors

### Limits not enforcing
- Ensure billing service is imported in deploy controller
- Check user's accountType and currentPlan in database
- Verify resource limits are passed to Pterodactyl

### Subscription not activating
- Check payment verification endpoint
- Ensure subscription record is created
- Verify user fields are updated

## Production Checklist

- [ ] Switch to Paystack live keys
- [ ] Update webhook URL to production domain
- [ ] Test payment flow end-to-end
- [ ] Verify cron job is running
- [ ] Monitor webhook events
- [ ] Set up error alerting
- [ ] Test downgrade flow
- [ ] Verify notification delivery
