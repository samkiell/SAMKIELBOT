# Paystack One-Time Payment Implementation

## Overview
This implementation provides a complete Paystack integration for one-time credit purchases in the SAMKIEL BOT platform.

## Features Implemented

### 1. Payment Initialization
- **Endpoint**: `POST /api/payments/init`
- Server-side package validation
- Unique reference generation
- Paystack transaction initialization
- Metadata includes userId and creditsToGrant

### 2. Payment Verification
- **Endpoint**: `GET /api/payments/verify?reference=xxx`
- Server-side Paystack verification
- Amount validation (kobo conversion)
- Idempotency checks
- Automatic credit granting
- Transaction logging

### 3. Webhook Handler
- **Endpoint**: `POST /api/payments/webhook`
- Signature validation
- Event logging
- Idempotent credit granting
- Handles `charge.success` events
- Final source of truth for payments

### 4. Credit Packages
Server-side packages (cannot be modified by frontend):
- ₦500 → 50 credits
- ₦1,000 → 120 credits (Popular)
- ₦2,000 → 260 credits
- ₦5,000 → 700 credits

### 5. Database Models

#### PaymentTransaction
- Tracks all payment transactions
- Fields: user, reference, amount, creditsGranted, status, provider
- Webhook processing flags
- Verification timestamps

#### WebhookEvent
- Logs all webhook events
- Signature validation tracking
- Processing status
- Error logging

#### CreditTransaction (Updated)
- Already supports `paystackReference` field
- Links to payment transactions

## Security Features

✅ **Server-side validation**
- Package IDs validated on backend
- Amount verification in kobo
- Reference uniqueness enforced

✅ **Webhook signature validation**
- HMAC SHA512 verification
- Invalid signatures rejected

✅ **Idempotency**
- Double-credit prevention
- Reference-based deduplication
- Webhook and verification both check

✅ **No secret exposure**
- PAYSTACK_SECRET_KEY never sent to frontend
- Public key optional (redirect flow used)

## API Endpoints

### Payment Initialization
```javascript
POST /api/payments/init
Body: { packageId: 1 }
Response: {
  authorization_url: "https://checkout.paystack.com/...",
  reference: "PAY_1234567890_ABCD1234",
  credits: 50,
  amount: 500
}
```

### Payment Verification
```javascript
GET /api/payments/verify?reference=PAY_1234567890_ABCD1234
Response: {
  success: true,
  message: "Payment verified and credits added",
  data: {
    credits: 50,
    balance: 175,
    status: "success"
  }
}
```

### Get Packages
```javascript
GET /api/payments/packages
Response: {
  success: true,
  data: [
    { id: 1, credits: 50, price: 500, popular: false },
    { id: 2, credits: 120, price: 1000, popular: true },
    ...
  ]
}
```

### Payment History
```javascript
GET /api/payments/history?limit=50
Response: {
  success: true,
  data: [...]
}
```

### Webhook (Paystack calls this)
```javascript
POST /api/payments/webhook
Headers: { "x-paystack-signature": "..." }
Body: { event: "charge.success", data: {...} }
```

## Frontend Integration

### BuyCreditsModal Component
- Displays credit packages
- Initiates payment flow
- Redirects to Paystack checkout
- Handles payment verification on return
- Premium UI design

### Usage Example
```javascript
import BuyCreditsModal from "../components/BuyCreditsModal";

function Dashboard() {
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  return (
    <>
      <button onClick={() => setShowBuyCredits(true)}>
        Buy Credits
      </button>

      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={() => {
          // Refresh credits balance
          fetchUserData();
        }}
      />
    </>
  );
}
```

## Payment Flow

1. **User selects package** → Frontend calls `/api/payments/init`
2. **Backend validates** → Creates PaymentTransaction (pending)
3. **Paystack initialized** → Returns authorization_url
4. **User redirected** → Paystack checkout page
5. **User completes payment** → Paystack redirects back
6. **Frontend verifies** → Calls `/api/payments/verify`
7. **Backend verifies with Paystack** → Validates amount, status
8. **Credits granted** → CreditTransaction created
9. **Webhook received** → Double-checks and logs event
10. **Notification sent** → User notified of success

## Webhook Setup

Configure Paystack webhook URL in your Paystack dashboard:
```
https://yourdomain.com/api/payments/webhook
```

Events to subscribe to:
- `charge.success`

## Environment Variables Required

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx (optional)
FRONTEND_URL=http://localhost:3000
```

## Testing

### Test Mode
Use Paystack test keys for development:
- Test cards: https://paystack.com/docs/payments/test-payments

### Test Card
```
Card Number: 5531886652142950
CVV: 564
Expiry: Any future date
PIN: 3310
OTP: 123456
```

## Error Handling

- Invalid package ID → 400 Bad Request
- Payment verification failed → 400 Bad Request
- Amount mismatch → 400 Bad Request, transaction marked failed
- Duplicate reference → Returns existing transaction
- Invalid webhook signature → 400 Bad Request, logged
- Network errors → Proper error messages

## Logging

All payment operations are logged:
- Payment initialization
- Verification attempts
- Webhook events
- Credit grants
- Errors and failures

## Admin Features

View webhook logs:
```javascript
GET /api/payments/webhook/logs?limit=50
```
(Admin authentication required)

## Production Checklist

- [ ] Replace test keys with live Paystack keys
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test webhook delivery
- [ ] Monitor webhook logs
- [ ] Set up alerts for failed payments
- [ ] Test idempotency
- [ ] Verify amount calculations
- [ ] Test all error scenarios

## Support

For issues:
1. Check webhook logs
2. Verify Paystack dashboard
3. Check PaymentTransaction status
4. Review server logs
5. Test with Paystack test cards

## Files Created/Modified

### Backend
- `models/PaymentTransaction.js` - Payment tracking
- `models/WebhookEvent.js` - Webhook logging
- `controllers/paymentController.js` - Payment logic
- `controllers/webhookController.js` - Webhook handling
- `routes/payments.js` - Payment routes
- `server.js` - Route registration

### Frontend
- `components/BuyCreditsModal.js` - Purchase UI
- `lib/api.js` - Payment API methods

## Notes

- Webhook is the final source of truth
- All amounts validated server-side
- Idempotency prevents double-crediting
- Reference must be unique
- Signature validation is mandatory
- Credits granted only on success status
