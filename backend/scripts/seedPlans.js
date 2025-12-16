const mongoose = require("mongoose");
const Plan = require("../models/Plan");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const plans = [
  {
    name: "Starter",
    displayName: "Starter Plan",
    description: "Perfect for getting started with premium features",
    price: 1500, // NGN
    currency: "NGN",
    billingCycle: "monthly",
    maxBots: 3,
    cpuLimit: 30,
    ramLimit: 500,
    diskLimit: 700,
    features: [
      "Up to 3 bots",
      "500 MB RAM per bot",
      "30% CPU allocation",
      "700 MB disk space",
      "Priority support",
      "Auto-updates",
    ],
    isActive: true,
    isRecommended: false,
    sortOrder: 1,
  },
  {
    name: "Pro",
    displayName: "Pro Plan",
    description: "Best for power users and small teams",
    price: 3000, // NGN
    currency: "NGN",
    billingCycle: "monthly",
    maxBots: 3,
    cpuLimit: 40,
    ramLimit: 1024,
    diskLimit: 1200,
    features: [
      "Up to 3 bots",
      "1 GB RAM per bot",
      "40% CPU allocation",
      "1.2 GB disk space",
      "Priority support",
      "Auto-updates",
      "Advanced analytics",
    ],
    isActive: true,
    isRecommended: true,
    sortOrder: 2,
  },
  {
    name: "Max",
    displayName: "Max Plan",
    description: "Maximum performance for demanding workloads",
    price: 5000, // NGN
    currency: "NGN",
    billingCycle: "monthly",
    maxBots: 3,
    cpuLimit: 50,
    ramLimit: 2048,
    diskLimit: 2048,
    features: [
      "Up to 3 bots",
      "2 GB RAM per bot",
      "50% CPU allocation",
      "2 GB disk space (HARD MAX)",
      "Premium support",
      "Auto-updates",
      "Advanced analytics",
      "Custom configurations",
    ],
    isActive: true,
    isRecommended: false,
    sortOrder: 3,
  },
];

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing plans
    await Plan.deleteMany({});
    console.log("🗑️  Cleared existing plans");

    // Insert new plans
    await Plan.insertMany(plans);
    console.log("✅ Seeded plans successfully");

    console.log("\n📊 Plans created:");
    plans.forEach((plan) => {
      console.log(`  - ${plan.displayName}: ₦${plan.price}/month`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
    process.exit(1);
  }
}

seedPlans();
