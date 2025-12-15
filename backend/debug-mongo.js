const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, "../.env");
console.log(`[Diagnostic] Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(
    `[Diagnostic] ❌ Error loading .env file: ${result.error.message}`
  );
} else {
  console.log(`[Diagnostic] ✅ .env loaded.`);
}

// 2. Check MONGO_URI
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("[Diagnostic] ❌ MONGO_URI is UNDEFINED in .env");
  process.exit(1);
}

// Masked URI for logging
const maskedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
console.log(`[Diagnostic] MONGO_URI found: ${maskedUri}`);

// 3. DNS Lookup (to check network/DNS)
// Extract hostname from URI
const match = uri.match(/@([^/]+)/);
const hostname = match ? match[1] : null;

async function runCallback() {
  if (hostname) {
    console.log(`[Diagnostic] Resolving hostname: ${hostname}`);
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address, family) => {
          if (err) reject(err);
          else {
            console.log(
              `[Diagnostic] ✅ DNS Resolution: ${hostname} -> ${address}`
            );
            resolve();
          }
        });
      });
    } catch (err) {
      console.error(
        `[Diagnostic] ❌ DNS Lookup Failed. Check your internet connection or hostname.`
      );
      console.error(`[Diagnostic] Error: ${err.message}`);
    }
  } else {
    console.log(
      "[Diagnostic] ⚠️ Could not extract hostname from URI for DNS check."
    );
  }

  // 4. Attempt Mongoose Connection
  console.log("[Diagnostic] Attempting Mongoose connection (Timeout: 10s)...");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 if IPv6 is failing (common issue)
    });
    console.log("[Diagnostic] ✅ MongoDB Connected Successfully!");
    process.exit(0);
  } catch (err) {
    console.error(`[Diagnostic] ❌ Mongoose Connection Failed:`);
    console.error(`  Code: ${err.code}`);
    console.error(`  Message: ${err.message}`);
    console.error(`  Name: ${err.name}`);

    if (err.message.includes("bad auth")) {
      console.error(
        "[Diagnostic] 💡 Hint: Check your username and password in MONGO_URI."
      );
    } else if (err.message.includes("querySrv ETIMEOUT")) {
      console.error(
        "[Diagnostic] 💡 Hint: DNS query timed out. Check internet or try using a Standard Connection String instead of SRV (mongodb:// vs mongodb+srv://)."
      );
    } else if (err.message.includes("ETIMEOUT")) {
      console.error(
        "[Diagnostic] 💡 Hint: Connection timed out. \n1. Check your IP is whitelisted in MongoDB Atlas.\n2. Check firewall settings."
      );
    }

    process.exit(1);
  }
}

runCallback();
