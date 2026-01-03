/**
 * 🚀 PLATFORM STRESS TEST SCRIPT
 *
 * INSTRUCTIONS:
 * 1. Log in to your platform in the browser using an Admin account.
 * 2. Open the Developer Tools (F12) -> Console.
 * 3. Copy and paste ALL the code below into the console and press Enter.
 *
 * This script will sequentially deploy 20 bots with random configurations.
 */

(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found! Please log in first.");
    return;
  }

  const deployUrl = "/api/deploy/create";
  const totalBots = 20;

  console.log(`🚀 Starting stress test: Creating ${totalBots} bots...`);
  console.log(
    "ℹ️ Ensure you have enough Pterodactyl resources/nodes allocated!"
  );

  for (let i = 1; i <= totalBots; i++) {
    // Generate random bot identifiers
    const randId = Math.floor(Math.random() * 10000);
    const botName = `StressBot_${i}_${randId}`;
    // Random 13-digit number (e.g., 2348012345678)
    const botNumber =
      "2348" + Math.floor(100000000 + Math.random() * 900000000);

    const payload = {
      botName: botName,
      botNumber: botNumber,
      prefix: ".",
      packName: "Stress Test Pack",
      ownerName: "Stress Tester",
      ownerNumber: botNumber,
      // Minimal lightweight config
      featureToggles: {
        AUTO_STATUS_VIEW: "off",
        SEND_READ: true,
        ALWAYS_ONLINE: true,
        REJECT_CALL: true,
        COMMAND_MODE: "private",
        ANTI_DELETE: false,
        ANTI_DELETE_TYPE: "all",
        AUTO_REACTION: false,
        PACKNAME: "Stress Test Pack",
        PERSONAL_MESSAGE: false,
        DISABLE_START_MESSAGE: true,
        RANKING: false,
        STATUS_VIEW_EMOJI: "👀",
      },
    };

    try {
      console.log(`⏳ [${i}/${totalBots}] Deploying ${botName}...`);
      const startTime = Date.now();

      const res = await fetch(deployUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (res.ok) {
        const data = await res.json();
        console.log(
          `✅ [${i}/${totalBots}] Success (${duration}s) | ID: ${
            data?.server?._id || data?.data?._id || "Unknown"
          }`
        );
      } else {
        const errText = await res.text();
        console.error(
          `❌ [${i}/${totalBots}] Failed (${duration}s): ${res.status}`,
          errText.substring(0, 100)
        );
      }
    } catch (e) {
      console.error(`❌ [${i}/${totalBots}] Network Error:`, e);
    }

    // 1-second delay between requests to be gentle on the local dev server
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("🏁 Stress test execution complete!");
})();
