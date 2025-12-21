# BILLING SYSTEM ARCHITECTURE

## 🏗️ SYSTEM FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

1. NEW USER REGISTRATION
   ┌──────────┐
   │ Register │ → User created with accountType: "FREE"
   └──────────┘   Limits: 1 bot, 300MB RAM, 25% CPU, 500MB disk


2. VIEWING PRICING
   ┌──────────────┐
   │ /pricing     │ → Fetches plans from MongoDB
   │ Landing page │   Shows FREE vs PREMIUM comparison
   └──────────────┘


3. UPGRADE FLOW
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │  User clicks "Upgrade"                                           │
   │         ↓                                                         │
   │  POST /api/billing/subscription/initialize                       │
   │         ↓                                                         │
   │  Backend creates Paystack payment link                           │
   │         ↓                                                         │
   │  User redirected to Paystack                                     │
   │         ↓                                                         │
   │  User completes payment                                          │
   │         ↓                                                         │
   │  Paystack redirects back to /dashboard?payment=success           │
   │         ↓                                                         │
   │  Frontend calls GET /api/billing/subscription/verify/:ref        │
   │         ↓                                                         │
   │  Backend verifies with Paystack                                  │
   │         ↓                                                         │
   │  User upgraded to PREMIUM                                        │
   │         ↓                                                         │
   │  Subscription record created                                     │
   │         ↓                                                         │
   │  Notification sent: "Premium activated 🚀"                       │
   │         ↓                                                         │
   │  Dashboard shows updated limits                                  │
   │                                                                   │
   └──────────────────────────────────────────────────────────────────┘


4. BOT CREATION (WITH ENFORCEMENT)
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │  User clicks "Deploy Bot"                                        │
   │         ↓                                                         │
   │  POST /api/deploy/create                                         │
   │         ↓                                                         │
   │  billingService.canCreateBot(userId)                             │
   │         ↓                                                         │
   │  Check: currentBotCount < maxBots?                               │
   │         ↓                                                         │
   │  ✅ YES → Continue deployment                                    │
   │  ❌ NO  → Return 403 "Bot limit reached"                         │
   │         ↓                                                         │
   │  billingService.getUserLimits(userId)                            │
   │         ↓                                                         │
   │  Create deployment with resource limits                          │
   │         ↓                                                         │
   │  Pass limits to Pterodactyl                                      │
   │         ↓                                                         │
   │  Server created with enforced limits                             │
   │                                                                   │
   └──────────────────────────────────────────────────────────────────┘


5. SUBSCRIPTION EXPIRATION (AUTOMATED)
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │  Daily Cron Job (00:00)                                          │
   │         ↓                                                         │
   │  billingService.checkExpiredSubscriptions()                      │
   │         ↓                                                         │
   │  Find subscriptions where expiresAt < now                        │
   │         ↓                                                         │
   │  For each expired subscription:                                  │
   │    - Mark subscription as "expired"                              │
   │    - billingService.downgradeUserToFree(userId)                  │
   │    - Update user: accountType = "FREE"                           │
   │    - handleExcessBots(userId)                                    │
   │    - Suspend bots beyond limit                                   │
   │    - Send notifications                                          │
   │         ↓                                                         │
   │  Find subscriptions expiring in 7 days                           │
   │         ↓                                                         │
   │  Send warning notifications                                      │
   │                                                                   │
   └──────────────────────────────────────────────────────────────────┘


6. WEBHOOK HANDLING
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │  Paystack sends webhook                                          │
   │         ↓                                                         │
   │  POST /api/billing/webhook/paystack                              │
   │         ↓                                                         │
   │  Validate signature (HMAC SHA512)                                │
   │         ↓                                                         │
   │  ✅ Valid → Process event                                        │
   │  ❌ Invalid → Return 400                                         │
   │         ↓                                                         │
   │  Event: charge.success                                           │
   │    → Add to payment history                                      │
   │         ↓                                                         │
   │  Event: subscription.disable                                     │
   │    → Cancel subscription                                         │
   │    → Downgrade user                                              │
   │                                                                   │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS COLLECTION                             │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                        │
│ username: String                                                     │
│ email: String                                                        │
│ accountType: "FREE" | "PREMIUM"                                      │
│ currentPlan: ObjectId → plans                                        │
│ subscriptionStatus: "active" | "inactive" | "expired"                │
│ subscriptionExpiresAt: Date                                          │
│ paystackCustomerId: String                                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                              │ references
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         PLANS COLLECTION                             │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                        │
│ name: "Starter" | "Pro" | "Max"                                      │
│ displayName: String                                                  │
│ price: Number (in Naira)                                             │
│ maxBots: Number                                                      │
│ cpuLimit: Number (%)                                                 │
│ ramLimit: Number (MB)                                                │
│ diskLimit: Number (MB)                                               │
│ features: [String]                                                   │
│ isRecommended: Boolean                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↑
                              │ referenced by
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTIONS COLLECTION                        │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                        │
│ user: ObjectId → users                                               │
│ plan: ObjectId → plans                                               │
│ paystackReference: String (unique)                                   │
│ status: "active" | "expired" | "cancelled"                           │
│ amount: Number                                                       │
│ startedAt: Date                                                      │
│ expiresAt: Date                                                      │
│ paymentHistory: [                                                    │
│   { reference, amount, status, paidAt }                              │
│ ]                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 LIMIT ENFORCEMENT FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIMIT CALCULATION                                 │
└─────────────────────────────────────────────────────────────────────┘

getUserLimits(userId)
    ↓
Find user by ID
    ↓
Check: accountType === "PREMIUM" && subscriptionStatus === "active"?
    ↓
┌───────────────────────────────┬─────────────────────────────────────┐
│ YES (PREMIUM)                 │ NO (FREE)                           │
├───────────────────────────────┼─────────────────────────────────────┤
│ Get user.currentPlan          │ Return FREE_LIMITS:                 │
│     ↓                         │   - maxBots: 1                      │
│ Return plan limits:           │   - cpuLimit: 25                    │
│   - maxBots: 3                │   - ramLimit: 300                   │
│   - cpuLimit: 30-50%          │   - diskLimit: 500                  │
│   - ramLimit: 500-2048 MB     │                                     │
│   - diskLimit: 700-2048 MB    │                                     │
└───────────────────────────────┴─────────────────────────────────────┘
```

---

## 🎯 ENFORCEMENT POINTS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENFORCEMENT LOCATIONS                             │
└─────────────────────────────────────────────────────────────────────┘

1. BOT CREATION
   Location: backend/controllers/deployController.js
   Function: createDeployment()
   
   billingService.canCreateBot(userId)
       ↓
   Count user's active bots
       ↓
   Compare with maxBots limit
       ↓
   Block if exceeded


2. RESOURCE ALLOCATION
   Location: backend/controllers/deployController.js
   Function: processDeployment()
   
   billingService.getUserLimits(userId)
       ↓
   Get CPU, RAM, Disk limits
       ↓
   Pass to pterodactyl.createServer()
       ↓
   Pterodactyl enforces at infrastructure level


3. DOWNGRADE HANDLING
   Location: backend/services/billingService.js
   Function: handleExcessBots()
   
   Get user's current limits
       ↓
   Find all user's bots (sorted by age)
       ↓
   If botCount > maxBots:
       ↓
   Suspend oldest bots
       ↓
   Send notifications
```

---

## 🔔 NOTIFICATION TRIGGERS

```
┌─────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION EVENTS                             │
└─────────────────────────────────────────────────────────────────────┘

1. SUBSCRIPTION ACTIVATED
   Trigger: upgradeUserToPremium()
   Message: "Your premium subscription is active 🚀"
   Type: success

2. SUBSCRIPTION EXPIRING SOON
   Trigger: checkExpiredSubscriptions() [7 days before]
   Message: "Your premium subscription expires in X days ⚠️"
   Type: warning

3. SUBSCRIPTION EXPIRED
   Trigger: checkExpiredSubscriptions()
   Message: "Your premium subscription has expired"
   Type: warning

4. ACCOUNT DOWNGRADED
   Trigger: downgradeUserToFree()
   Message: "Your account has been downgraded to Free"
   Type: warning

5. BOT SUSPENDED
   Trigger: handleExcessBots()
   Message: "Your bot 'X' has been suspended due to account downgrade"
   Type: warning
```

---

## 🛡️ SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                               │
└─────────────────────────────────────────────────────────────────────┘

1. WEBHOOK VALIDATION
   ┌──────────────────────────────────────────────────────────────┐
   │ Paystack sends webhook with X-Paystack-Signature header     │
   │         ↓                                                     │
   │ Backend computes HMAC SHA512 of request body                │
   │         ↓                                                     │
   │ Compare computed hash with signature                         │
   │         ↓                                                     │
   │ ✅ Match → Process webhook                                   │
   │ ❌ Mismatch → Reject (400)                                   │
   └──────────────────────────────────────────────────────────────┘

2. IDEMPOTENT PAYMENT PROCESSING
   ┌──────────────────────────────────────────────────────────────┐
   │ Check if subscription exists with paystackReference          │
   │         ↓                                                     │
   │ ✅ Exists → Return existing subscription                     │
   │ ❌ Not exists → Create new subscription                      │
   └──────────────────────────────────────────────────────────────┘

3. SERVER-SIDE ENFORCEMENT
   ┌──────────────────────────────────────────────────────────────┐
   │ ALL limit checks happen in backend                           │
   │ Frontend only displays limits                                │
   │ No client-side enforcement                                   │
   │ API routes protected with JWT                                │
   └──────────────────────────────────────────────────────────────┘
```

---

## 📈 SCALABILITY

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCALABILITY FEATURES                              │
└─────────────────────────────────────────────────────────────────────┘

✅ Database-Driven Plans
   - No hardcoded limits
   - Easy to add new plans
   - Update prices without code changes

✅ Webhook-Driven Updates
   - Real-time payment processing
   - Automatic subscription management
   - No polling required

✅ Cron-Based Automation
   - Automatic expiration handling
   - Scheduled notifications
   - Background processing

✅ Modular Architecture
   - Separate services for billing, Paystack
   - Easy to extend
   - Testable components
```

This architecture ensures the billing system is production-ready, secure, and scalable! 🚀
