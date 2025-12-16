# 🚀 BILLING SYSTEM - QUICK START GUIDE

## ⚡ IMMEDIATE NEXT STEPS

### 1. Add Paystack Keys to `.env`

Add these lines to your root `.env` file:

```env
# Paystack Configuration (REQUIRED for billing)
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**Get your keys from:** https://dashboard.paystack.com/#/settings/developers

---

### 2. Restart Your Server

The server is currently running. After adding Paystack keys, restart it:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

### 3. Test the Billing System

#### **A. View Pricing Page**
Navigate to: `http://localhost:3000/pricing`

You should see:
- FREE plan (₦0)
- Starter plan (₦1,500)
- Pro plan (₦3,000) - RECOMMENDED
- Max plan (₦5,000)

#### **B. Check Dashboard**
Navigate to: `http://localhost:3000/dashboard`

You should see a new **Subscription Card** showing:
- Account Type: FREE
- Your current limits (1 bot, 300 MB RAM, 25% CPU, 500 MB disk)
- "Upgrade to Premium" button

#### **C. Test Payment Flow** (After adding Paystack keys)

1. Click "Upgrade to Premium" on any plan
2. You'll be redirected to Paystack payment page
3. Use these **test credentials**:
   - **Card Number:** 4084 0840 8408 4081
   - **CVV:** 408
   - **Expiry:** Any future date (e.g., 12/25)
   - **PIN:** 0000
   - **OTP:** 123456

4. After payment, you'll be redirected back to dashboard
5. Your subscription card should now show:
   - Account Type: PREMIUM
   - Plan name (Starter/Pro/Max)
   - Updated limits
   - Expiration date

---

## 🎯 KEY FEATURES TO TEST

### 1. **Bot Creation Limits**
- **FREE users:** Try creating a 2nd bot → Should be blocked
- **PREMIUM users:** Can create up to 3 bots

### 2. **Resource Limits**
- Check your deployed bots
- They should have resource limits based on your plan
- FREE: 300 MB RAM, 25% CPU
- PREMIUM: Varies by plan (500 MB - 2 GB RAM)

### 3. **Subscription Expiration**
- Subscriptions expire after 30 days
- Daily cron job checks for expirations
- Users are automatically downgraded to FREE
- Excess bots are suspended

### 4. **Notifications**
Check your notification center for:
- "Your premium subscription is active 🚀"
- Expiration warnings (7 days before)
- Downgrade notifications

---

## 📍 NEW ROUTES AVAILABLE

### Frontend:
- `/pricing` - Full pricing page
- `/dashboard` - Now includes subscription card

### API:
- `GET /api/billing/plans` - Get all plans
- `GET /api/billing/subscription/status` - Your subscription
- `POST /api/billing/subscription/initialize` - Start payment
- `GET /api/billing/subscription/verify/:ref` - Verify payment
- `POST /api/billing/subscription/cancel` - Cancel subscription

---

## 🔧 TROUBLESHOOTING

### "Payment initialization failed"
- ✅ Check if PAYSTACK_SECRET_KEY is set in `.env`
- ✅ Restart the server after adding keys

### "Plans not showing on pricing page"
- ✅ Run: `node backend/scripts/seedPlans.js`
- ✅ Check MongoDB connection

### "Bot limit not enforcing"
- ✅ Check user's accountType in database
- ✅ Verify billing service is imported in deployController

### "Subscription not activating after payment"
- ✅ Check backend logs for errors
- ✅ Verify payment with Paystack dashboard
- ✅ Check subscription record in database

---

## 📊 DATABASE COLLECTIONS

New collections created:
- `plans` - Premium plans (3 documents)
- `subscriptions` - User subscriptions

Updated collection:
- `users` - Now includes billing fields

---

## 🎨 UI COMPONENTS

### New Components:
- `SubscriptionCard.js` - Dashboard subscription display

### Updated Pages:
- `index.js` - Landing page with pricing preview
- `pricing.js` - Full pricing page
- `dashboard.js` - Includes subscription card

---

## 🔐 SECURITY NOTES

- ✅ All limits enforced SERVER-SIDE
- ✅ Webhook signatures validated
- ✅ Payments verified before activation
- ✅ Duplicate payments prevented
- ✅ Protected API routes (JWT required)

---

## 🚀 PRODUCTION DEPLOYMENT

Before going live:

1. **Switch to Live Keys:**
   ```env
   PAYSTACK_SECRET_KEY=sk_live_your_live_key
   PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
   ```

2. **Configure Webhook:**
   - URL: `https://yourdomain.com/api/billing/webhook/paystack`
   - Events: `charge.success`, `subscription.disable`, `subscription.not_renew`

3. **Update Frontend URL:**
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Test End-to-End:**
   - Complete a real payment
   - Verify subscription activation
   - Test webhook delivery
   - Check cron job execution

---

## 📞 SUPPORT

For issues:
1. Check `BILLING_SETUP.md` for detailed setup
2. Check `BILLING_IMPLEMENTATION_SUMMARY.md` for architecture
3. Review backend logs for errors
4. Verify Paystack dashboard for payment status

---

## ✅ CHECKLIST

- [ ] Paystack keys added to `.env`
- [ ] Server restarted
- [ ] Plans seeded (already done ✅)
- [ ] Pricing page accessible
- [ ] Dashboard shows subscription card
- [ ] Test payment completed
- [ ] Bot limits enforced
- [ ] Notifications working

---

**You now have a FULL production-grade billing system! 🎉**
