# CREDIT-BASED BILLING SYSTEM - IMPLEMENTATION STATUS

## ✅ COMPLETED BACKEND

### **Database Models**
- ✅ User model updated with credits, referralCode, referredBy
- ✅ CreditTransaction model created (tracks all credit movements)
- ✅ Deployment model updated with creationCost, resourceCost, dailyBurn

### **Services**
- ✅ creditService.js - Core credit logic
  - calculateDeploymentCost()
  - calculateDailyBurn()
  - deductCredits() / addCredits()
  - processReferral()
  - processDailyBurn()
  - getCreditHistory()

### **Controllers & Routes**
- ✅ creditsController.js - 8 endpoints
- ✅ credits routes registered in server.js

### **Enforcement**
- ✅ Deploy controller updated with credit checks
- ✅ Resource selection (CPU, RAM, Disk)
- ✅ Cost calculation before deployment
- ✅ Credit deduction on bot creation
- ✅ Daily burn scheduler (cron job)

---

## 📋 REMAINING FRONTEND FILES TO CREATE

### **1. Buy Credits Page** (`frontend/pages/credits/buy.js`)

```javascript
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { FaCoins, FaCheckCircle } from "react-icons/fa";

export default function BuyCredits() {
  const { user } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/packages`);
    const data = await res.json();
    if (data.success) setPackages(data.data);
  };

  const handlePurchase = async (index) => {
    setProcessing(index);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/purchase/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageIndex: index }),
        }
      );

      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.authorizationUrl;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <Head>
        <title>Buy Credits - SAMKIEL BOT</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Buy Credits</h1>
          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg ${
                  pkg.popular ? "border-4 border-indigo-500" : ""
                }`}
              >
                {pkg.popular && (
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    POPULAR
                  </span>
                )}
                <div className="text-center my-6">
                  <FaCoins className="text-6xl text-yellow-500 mx-auto mb-4" />
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {pkg.credits}
                  </div>
                  <div className="text-gray-500">Credits</div>
                </div>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-indigo-600">
                    ₦{pkg.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₦{(pkg.price / pkg.credits).toFixed(2)} per credit
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(index)}
                  disabled={processing === index}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {processing === index ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

### **2. Deploy Page with Resource Selector** (Update `frontend/pages/deploy.js`)

Add resource selection UI with live cost calculation:

```javascript
// Add to deploy.js
const [selectedResources, setSelectedResources] = useState({
  cpu: 25,
  ram: 300,
  disk: 500,
});
const [estimatedCost, setEstimatedCost] = useState(null);

useEffect(() => {
  calculateCost();
}, [selectedResources]);

const calculateCost = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(selectedResources),
  });
  const data = await res.json();
  if (data.success) setEstimatedCost(data.data);
};

// Add resource selector UI before submit button
<div className="mb-6">
  <h3 className="text-xl font-bold mb-4">Select Resources</h3>
  
  {/* CPU Selector */}
  <div className="mb-4">
    <label className="block mb-2">CPU</label>
    <select
      value={selectedResources.cpu}
      onChange={(e) => setSelectedResources({...selectedResources, cpu: parseInt(e.target.value)})}
      className="w-full p-2 border rounded"
    >
      <option value={25}>25% (Included)</option>
      <option value={30}>30% (+5 credits)</option>
      <option value={40}>40% (+10 credits)</option>
      <option value={50}>50% (+20 credits)</option>
    </select>
  </div>

  {/* RAM Selector */}
  <div className="mb-4">
    <label className="block mb-2">RAM</label>
    <select
      value={selectedResources.ram}
      onChange={(e) => setSelectedResources({...selectedResources, ram: parseInt(e.target.value)})}
      className="w-full p-2 border rounded"
    >
      <option value={300}>300 MB (Included)</option>
      <option value={500}>500 MB (+10 credits)</option>
      <option value={1024}>1 GB (+25 credits)</option>
      <option value={2048}>2 GB (+50 credits)</option>
    </select>
  </div>

  {/* Disk Selector */}
  <div className="mb-4">
    <label className="block mb-2">Disk</label>
    <select
      value={selectedResources.disk}
      onChange={(e) => setSelectedResources({...selectedResources, disk: parseInt(e.target.value)})}
      className="w-full p-2 border rounded"
    >
      <option value={500}>500 MB (Included)</option>
      <option value={1024}>1 GB (+10 credits)</option>
      <option value={2048}>2 GB (+20 credits)</option>
    </select>
  </div>

  {/* Cost Breakdown */}
  {estimatedCost && (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
      <div className="flex justify-between mb-2">
        <span>Bot Creation:</span>
        <span className="font-bold">{estimatedCost.creationCost} credits</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Resources:</span>
        <span className="font-bold">{estimatedCost.resourceCost} credits</span>
      </div>
      <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Daily Burn:</span>
        <span>{estimatedCost.dailyBurn} credits/day</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-lg font-bold">
        <span>Total Cost:</span>
        <span className="text-indigo-600">{estimatedCost.totalCost} credits</span>
      </div>
    </div>
  )}
</div>
```

### **3. Update Dashboard** (Add to `frontend/pages/dashboard.js`)

Replace SubscriptionCard import with CreditBalance:

```javascript
import CreditBalance from "../components/CreditBalance";

// In the JSX, replace subscription card with:
<div className="mt-8 flex justify-between items-center">
  <CreditBalance />
</div>
```

### **4. Pricing Page** (Update `frontend/pages/pricing.js`)

Replace subscription pricing with credit system explanation:

```javascript
// Replace entire pricing page content with credit-based explanation
<section className="px-6 py-16">
  <h1 className="text-5xl font-bold text-center mb-6">Simple Credit-Based Pricing</h1>
  <p className="text-xl text-center mb-12">
    Pay only for what you use. No subscriptions, no hidden fees.
  </p>

  {/* How It Works */}
  <div className="max-w-4xl mx-auto mb-16">
    <h2 className="text-3xl font-bold mb-6">How It Works</h2>
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">1. Get Free Credits</h3>
        <p>New users receive 25 credits on signup. Use referrals to earn more!</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">2. Deploy Bots</h3>
        <p>Creating a bot costs 50 credits + resource upgrades. Choose your CPU, RAM, and disk.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">3. Daily Usage</h3>
        <p>Active bots consume 2-5 credits per day based on resources.</p>
      </div>
    </div>
  </div>

  {/* Credit Packages */}
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Buy Credits</h2>
    {/* Show credit packages here */}
  </div>
</section>
```

---

## 🔧 TESTING CHECKLIST

### Backend Tests:
- [ ] User gets 25 credits on signup
- [ ] Referral code generated automatically
- [ ] Referral rewards both users (+10 each)
- [ ] Bot creation deducts correct credits
- [ ] Resource selection affects cost
- [ ] Daily burn runs and suspends bots
- [ ] Credit purchase via Paystack works
- [ ] Transaction history recorded

### Frontend Tests:
- [ ] Credit balance displays correctly
- [ ] Resource selector shows live cost
- [ ] Buy credits page works
- [ ] Payment flow completes
- [ ] Insufficient credits blocks deployment
- [ ] Notifications appear

---

## 🚀 DEPLOYMENT STEPS

1. **Restart Server** (to load new models and routes)
2. **Test Referral System**
3. **Test Bot Deployment with Resources**
4. **Test Credit Purchase**
5. **Run Daily Burn Manually** (for testing)

---

## 📊 CREDIT PRICING SUMMARY

### Bot Creation:
- Base cost: 50 credits
- CPU upgrade: +5 to +20 credits
- RAM upgrade: +10 to +50 credits
- Disk upgrade: +10 to +20 credits

### Daily Burn:
- Base: 2 credits/day
- CPU extra: +1 to +2 credits/day
- RAM extra: +1 to +2 credits/day

### Credit Packages:
- ₦500 → 50 credits
- ₦1,000 → 120 credits (POPULAR)
- ₦2,000 → 260 credits
- ₦5,000 → 700 credits

### Referral Rewards:
- Referrer: +10 credits
- New user: +10 credits (bonus on top of 25 signup credits)

---

**System is 85% complete. Remaining: Frontend pages for buy credits, resource selector in deploy page, and pricing page update.**
