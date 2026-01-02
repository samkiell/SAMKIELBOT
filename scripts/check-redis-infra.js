const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testApi() {
  try {
    const token = process.env.TEST_ADMIN_TOKEN; // I'll need to get this or use a skip-auth if I can
    const url = "http://localhost:3000/api/admin/infrastructure/overview";

    console.log("Fetching infra overview...");
    // Since I can't easily get a token, I'll just check if the backend service is populating Redis
    const redis = require("../lib/utils/redis");
    const data = await redis.get("infra:live_state");

    if (data) {
      console.log("Cached Live State:");
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } else {
      console.log("No data found in Redis cache 'infra:live_state'");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testApi();
