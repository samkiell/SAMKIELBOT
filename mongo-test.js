const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

console.log("Testing connection to:", uri.split("@")[1] || "URL WITHOUT AUTH");

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ Connection successful!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:");
    console.error(err);
    process.exit(1);
  });
