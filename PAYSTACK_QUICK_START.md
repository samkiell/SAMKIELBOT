# Paystack Payment Integration - Quick Start

## 🚀 What Was Implemented

A complete **one-time payment system** for credit purchases using Paystack.

## 📁 Files Created

### Backend
1. **`models/PaymentTransaction.js`** - Tracks all payments
2. **`models/WebhookEvent.js`** - Logs webhook events
3. **`controllers/paymentController.js`** - Payment logic
4. **`controllers/webhookController.js`** - Webhook handler
5. **`routes/payments.js`** - Payment routes

### Frontend
1. **`components/BuyCreditsModal.js`** - Purchase UI component

### Documentation
1. **`PAYSTACK_IMPLEMENTATION.md`** - Full documentation

## 🔑 Environment Variables

Ensure these are set in your `.env` files:

```env
# Backend (.env or backend/.env)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### New Payment Endpoints (Recommended)
- `POST /api/payments/init` - Initialize payment
- `GET /api/payments/verify?reference=xxx` - Verify payment
- `GET /api/payments/packages` - Get credit packages
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/webhook` - Paystack webhook

### Old Credit Endpoints (Still Work)
- `POST /api/credits/purchase/initialize` - DEPRECATED
- `GET /api/credits/purchase/verify/:reference` - DEPRECATED

## 🎨 Frontend Usage

### Example: Add to Dashboard

```javascript
import { useState } from "react";
import BuyCreditsModal from "../components/BuyCreditsModal";

export default function Dashboard() {
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  return (
    <div>
      <button onClick={() => setShowBuyCredits(true)}>
        💳 Buy Credits
      </button>

      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={() => {
          // Refresh user data
          console.log("Payment successful!");
        }}
      />
    </div>
  );
}
```

## 💰 Credit Packages

Server-side packages (ID-based):

| ID | Credits | Price | Rate |
|----|---------|-------|------|
| 1  | 50      | ₦500  | ₦10/credit |
| 2  | 120     | ₦1,000 | ₦8.33/credit |
| 3  | 260     | ₦2,000 | ₦7.69/credit |
| 4  | 700     | ₦5,000 | ₦7.14/credit |

## 🔐 Security Features

✅ **Server-side validation** - All amounts validated on backend  
✅ **Webhook signature verification** - HMAC SHA512  
✅ **Idempotency** - Prevents double-crediting  
✅ **Reference uniqueness** - No duplicate transactions  
✅ **No secret exposure** - Secret key never sent to frontend  

## 🔄 Payment Flow

1. User clicks "Buy Credits"
2. Selects package → Frontend calls `/api/payments/init`
3. Backend validates → Creates pending transaction
4. Paystack initialized → Returns checkout URL
5. User redirected → Completes payment on Paystack
6. Paystack redirects back → Frontend calls `/api/payments/verify`
7. Backend verifies → Grants credits
8. Webhook received → Double-checks transaction
9. User notified → Credits added to balance

## 🪝 Webhook Setup

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL:
   ```
   https://yourdomain.com/api/payments/webhook
   ```
3. Subscribe to events:
   - `charge.success`

## 🧪 Testing

### Test Cards (Paystack Test Mode)

**Successful Payment:**
```
Card: 5531886652142950
CVV: 564
Expiry: Any future date
PIN: 3310
OTP: 123456
```

**Failed Payment:**
```
Card: 5060666666666666666
CVV: Any
Expiry: Any future date
```

### Test Flow
1. Use test keys in `.env`
2. Select a package
3. Use test card above
4. Complete payment
5. Verify credits added

## 📊 Monitoring

### Check Payment Status
```javascript
// In MongoDB
db.paymenttransactions.find({ user: ObjectId("...") })
```

### Check Webhook Logs
```javascript
// Admin endpoint
GET /api/payments/webhook/logs?limit=50
```

### Check Credit Transactions
```javascript
db.credittransactions.find({ 
  type: "purchase",
  paystackReference: { $exists: true }
})
```

## 🐛 Troubleshooting

### Credits not added?
1. Check PaymentTransaction status
2. Verify webhook was received
3. Check for duplicate reference
4. Review server logs

### Webhook not working?
1. Verify signature validation
2. Check Paystack dashboard for delivery status
3. Review WebhookEvent logs
4. Ensure webhook URL is accessible

### Amount mismatch error?
- Backend expects amount in Naira
- Paystack sends amount in kobo (x100)
- Validation checks: `amount * 100 === paystackAmount`

## 📝 Next Steps

1. **Test the flow** with test cards
2. **Configure webhook** in Paystack dashboard
3. **Replace test keys** with live keys for production
4. **Add BuyCreditsModal** to your dashboard
5. **Monitor transactions** in admin panel

## 🎯 Production Checklist

- [ ] Live Paystack keys configured
- [ ] Webhook URL set in Paystack dashboard
- [ ] Webhook signature validation working
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test idempotency (pay twice with same reference)
- [ ] Verify webhook logs
- [ ] Test amount validation
- [ ] Monitor first real transaction

## 📚 Documentation

See `PAYSTACK_IMPLEMENTATION.md` for complete documentation.

## 🆘 Support

If you encounter issues:
1. Check server logs
2. Review PaymentTransaction collection
3. Check WebhookEvent logs
4. Verify Paystack dashboard
5. Test with Paystack test cards
