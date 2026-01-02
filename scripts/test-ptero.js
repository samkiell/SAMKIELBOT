const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const PTERODACTYL_DOMAIN =
  process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev";
const PTERODACTYL_API_KEY =
  process.env.PTERODACTYL_APP_KEY || process.env.PTERODACTYL_API_KEY;

const clientApi = axios.create({
  baseURL: `${PTERODACTYL_DOMAIN}/api/client`,
  headers: {
    Authorization: `Bearer ${
      process.env.PTERODACTYL_CLIENT_KEY || PTERODACTYL_API_KEY
    }`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

async function testPtero() {
  try {
    const serversRes = await clientApi.get("/");
    console.log("--- CLIENT SERVERS ---");
    const servers = serversRes.data.data;

    for (const s of servers) {
      console.log(`Server: ${s.attributes.name} (${s.attributes.uuid})`);
      try {
        const stats = await clientApi.get(
          `/servers/${s.attributes.uuid}/resources`
        );
        console.log(`  State: ${stats.data.attributes.current_state}`);
        console.log(
          `  Resources:`,
          JSON.stringify(stats.data.attributes.resources, null, 2)
        );
      } catch (err) {
        console.log(`  Resources Error: ${err.message}`);
      }
      console.log("---");
    }
  } catch (err) {
    console.error("Ptero Test Error:", err.response?.data || err.message);
  }
}

testPtero();
