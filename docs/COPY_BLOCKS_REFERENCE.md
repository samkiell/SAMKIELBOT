# 📋 QUICK REFERENCE: COPY BLOCKS & PLACEMENTS

This document provides exact UI copy and placement suggestions for immediate use.

---

## 🎯 EMPTY STATE COPY BLOCKS

### **A. No Credits State**

**Placement**: 
- Dashboard (when credits === 0)
- Deploy page (before deployment attempt)
- Any page requiring credits

**Heading**:
```
You're out of credits
```

**Body Copy**:
```
Credits power your bot operations. They enable bot runtime, resource 
allocation, and continuous uptime so your WhatsApp bot stays online 24/7.
```

**Benefits Grid** (3 cards):

**Card 1 - Bot Runtime**:
```
Keep your bot active and responding to messages
```

**Card 2 - Resource Allocation**:
```
CPU, RAM, and storage for smooth performance
```

**Card 3 - Continuous Uptime**:
```
24/7 availability without interruptions
```

**Primary CTA**:
```
Get Credits
```

**Secondary CTA**:
```
Claim Daily Bonus
```

**Footer Text**:
```
Need help? Contact support
```

---

### **B. No Activity State**

**Placement**:
- Dashboard (when deployments.length === 0)
- Activity logs page (when no logs exist)
- Bot management page (when no bots)

**Heading**:
```
No activity yet
```

**Body Copy**:
```
Once you deploy your first bot, you'll see all your activity here including:
```

**Activity List** (4 items):
```
• Deployments: Track when your bots go live
• Restarts: Monitor bot health and uptime
• Credit Usage: See how credits are consumed
• Errors & Logs: Debug issues quickly
```

**Primary CTA**:
```
Deploy Your First Bot
```

**Footer Text**:
```
New to SAMKIEL BOT? Check our getting started guide
```

---

### **C. Low Credits Warning**

**Placement**:
- Dashboard banner (when credits < 50)
- Before deployment (when credits < estimated cost)

**Heading**:
```
Credits running low
```

**Body Copy**:
```
You have {X} credits remaining. Top up now to avoid service interruptions.
```

**CTA**:
```
Add credits now →
```

---

## 📚 DOCUMENTATION COPY BLOCKS

### **Getting Started Section**

**Heading**:
```
Welcome to SAMKIEL BOT
```

**Intro**:
```
SAMKIEL BOT is a WhatsApp bot deployment platform that lets you run 
your own bot 24/7 without managing servers. Here's how to get started:
```

**Steps**:
```
1. Create an account – Sign up with your email and WhatsApp number
2. Verify your email – Check your inbox for the verification code
3. Get free credits – New users receive 25 credits to start
4. Deploy your bot – Follow the deployment guide below
```

---

### **Deploying a Bot Section**

**Heading**:
```
How to Deploy Your Bot
```

**Intro**:
```
Deploying a bot takes 2-5 minutes. Follow these steps:
```

**Step 1**:
```
Navigate to Deploy
Click the "Deploy" button in your dashboard or navigation menu.
```

**Step 2**:
```
Provide GitHub Repository
Enter your bot's GitHub repository URL. The repository must be public 
or you must provide access credentials.

Example: https://github.com/username/bot-repo
```

**Step 3**:
```
Select Resources
Choose CPU, RAM, and disk space. Higher resources cost more credits per day.
```

**Step 4**:
```
Confirm & Deploy
Review the estimated daily cost and click "Deploy Bot". Credits will 
be deducted upfront.
```

**Step 5**:
```
Wait for Deployment
The system will provision your bot. This takes 2-5 minutes. You'll see 
a pairing code once ready.
```

---

### **Pairing WhatsApp Section**

**Heading**:
```
How to Pair Your WhatsApp Number
```

**Intro**:
```
After deployment, you'll receive an 8-character pairing code. Use it 
to connect your WhatsApp number:
```

**Steps**:
```
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices → Link a Device
3. Tap "Link with phone number instead"
4. Enter the 8-character pairing code shown on your dashboard
5. Wait for confirmation – Your bot will go online within 30 seconds
```

**Note**:
```
Note: Pairing codes expire after 5 minutes. If it expires, restart 
your bot to generate a new code.
```

---

### **Credits Explanation Section**

**Heading**:
```
How Credits Work
```

**Intro**:
```
SAMKIEL BOT uses a credit-based billing system. Credits power your 
bot's runtime and resources.
```

**How to Get Credits**:
```
• Signup Bonus: 25 credits (one-time)
• Daily Claim: 5 credits every 24 hours
• Referrals: 10 credits per successful referral
• Purchase: Buy credits via Paystack
```

**How Credits Are Used**:
```
• Bot Creation: One-time cost based on resources
• Daily Burn: Credits consumed every 24 hours while bot runs
• Suspension: Bots pause when credits reach zero
```

**Estimated Costs**:
```
Daily credit consumption depends on your bot's resources:

• Basic (512MB RAM, 50% CPU): ~2-3 credits/day
• Standard (1GB RAM, 100% CPU): ~5-7 credits/day
• Premium (2GB RAM, 200% CPU): ~10-15 credits/day
```

---

### **Common Errors Section**

**Error 1: Bot Not Connecting**

**Title**:
```
Bot Not Connecting / Staying Offline
```

**Possible Causes**:
```
• WhatsApp session expired
• Pairing code not entered correctly
• Bot crashed due to code errors
```

**Solution**:
```
Delete the deployment and create a fresh one. Check the status page 
for server issues.
```

---

**Error 2: Credits Not Reflecting**

**Title**:
```
Credits Not Reflecting After Purchase
```

**Possible Causes**:
```
• Payment still processing
• Webhook delivery delay
```

**Solution**:
```
Wait 5 minutes. If credits don't appear, email support@samkielbot.app 
with your payment reference.
```

---

**Error 3: Deployment Stuck**

**Title**:
```
Deployment Stuck on "Initializing"
```

**Possible Causes**:
```
• High server load
• Network lag
• Invalid GitHub repository
```

**Solution**:
```
Wait 10 minutes. If still stuck, refresh your dashboard or try 
redeploying. Contact support if the issue persists.
```

---

**Error 4: Bot Suspended**

**Title**:
```
Bot Suspended Due to Low Credits
```

**What Happened**:
```
Your credit balance reached zero, so the bot was automatically paused.
```

**Solution**:
```
Add credits via purchase or daily claim. Your bot will resume automatically.
```

---

### **View Once Feature Section**

**Heading**:
```
What is View Once?
```

**Intro**:
```
The View Once feature allows your bot to automatically save media sent 
as "View Once" messages on WhatsApp. This is useful for archiving or 
backup purposes.
```

**How It Works**:
```
1. Someone sends a View Once photo/video to your bot
2. The bot intercepts and saves the media before it disappears
3. Media is stored in your bot's designated folder
4. You can access saved media via bot commands or file manager
```

**Enabling Instructions**:
```
This feature is usually enabled by default in most bot templates. To verify:

• Check your bot's configuration file
• Look for viewOnce: true
• Restart your bot after making changes
```

**Privacy Note**:
```
Privacy Note: Use this feature responsibly. Respect user privacy and 
comply with local laws regarding media storage.
```

---

## 🔗 REFERRAL SYSTEM COPY

### **Referral Card (Dashboard)**

**Heading**:
```
Refer & Earn
```

**Subheading**:
```
Invite friends and earn credits
```

**Input Label**:
```
Your Referral Link
```

**Button**:
```
Copy
```

**Stats Labels**:
```
Referrals
Credits Earned
Per Referral
```

**How It Works**:
```
How it works:
• Share your referral link with friends
• They sign up and get +35 credits (25 signup + 10 bonus)
• You earn +10 credits for each successful referral
```

---

### **Referral Registration Page**

**Banner**:
```
🎉 You've been invited by {username}
```

**Bonus Breakdown**:
```
Sign up now and receive:
✓ 25 credits – Signup bonus
✓ 10 credits – Referral bonus
━━━━━━━━━━━━━━━━━━━━━
Total: 35 credits
```

**CTA**:
```
Create Your Account
```

---

## 📊 STATUS PAGE COPY

### **Overall Status Banner**

**Operational**:
```
All Systems Operational
All services are running smoothly
```

**Degraded**:
```
Experiencing Issues
Some services are experiencing degraded performance
```

**Down**:
```
Service Disruption
Critical services are currently unavailable
```

---

### **Component Descriptions**

**Website / Dashboard**:
```
Main application interface and user dashboard
```

**Bot Deployment Service**:
```
Bot creation and provisioning system
```

**Bot Runtime**:
```
Active bot instances and execution environment
```

**WhatsApp Connectivity**:
```
WhatsApp API and messaging services
```

**Billing & Credits**:
```
Payment processing and credit management
```

---

### **Status Indicators**

```
Operational
Degraded Performance
Service Down
```

---

### **Support CTA**

**Heading**:
```
Still experiencing issues?
```

**Body**:
```
If you're encountering problems not reflected here, our support team 
is ready to help.
```

**Button**:
```
Contact Support
```

---

## 🎨 TONE GUIDELINES

### **Empty States**
- **Tone**: Calm, helpful, encouraging
- **Voice**: Friendly but professional
- **Action**: Always provide clear next steps

### **Documentation**
- **Tone**: Educational, patient, thorough
- **Voice**: Expert but approachable
- **Action**: Step-by-step instructions

### **Errors**
- **Tone**: Reassuring, solution-focused
- **Voice**: Empathetic but efficient
- **Action**: Clear resolution path

### **Status Page**
- **Tone**: Transparent, factual, trustworthy
- **Voice**: Professional, concise
- **Action**: Link to support when needed

### **Referral System**
- **Tone**: Exciting, rewarding, social
- **Voice**: Enthusiastic but not pushy
- **Action**: Easy sharing, clear benefits

---

## ✅ USAGE CHECKLIST

When implementing copy:
- [ ] Match existing design system (colors, fonts, spacing)
- [ ] Ensure mobile responsiveness
- [ ] Support dark mode
- [ ] Include proper CTAs
- [ ] Link to relevant pages (support, docs, status)
- [ ] Use consistent terminology
- [ ] Keep sentences concise
- [ ] Highlight key information
- [ ] Provide actionable next steps
- [ ] Test with real users

---

**Last Updated**: December 21, 2025  
**Status**: Ready for Implementation
