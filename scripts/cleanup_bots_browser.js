/**
 * 🗑️ MASS DELETE BOT SCRIPT (BROWSER CONSOLE)
 *
 * INSTRUCTIONS:
 * 1. Log in to your platform in the browser using an Admin account.
 * 2. Open the Developer Tools (F12) -> Console.
 * 3. Copy and paste ALL the code below into the console and press Enter.
 *
 * ⚠️ WARNING: THIS WILL DELETE ALL BOTS BELONGING TO THE LOGGED-IN USER.
 *    (Or all bots if you modify the script to iterate differently, but standard API behavior limits to owner or admin privileges).
 */

(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found! Please log in first.");
    return;
  }

  console.log("🚀 Starting mass deletion process...");

  // 1. Fetch all deployments
  try {
    const listRes = await fetch("/api/deploy", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();

    let bots = listData.data || [];

    // Choose mode
    const deleteStressOnly = window.confirm(
      "Filter deletion to 'StressBot_' only?\n\nOK = Yes, delete only test bots.\nCancel = No, I want to delete EVERYTHING."
    );

    if (deleteStressOnly) {
      bots = bots.filter((b) => b.botName.startsWith("StressBot_"));
      if (bots.length === 0) {
        console.log("ℹ️ No 'StressBot_' bots found.");
        return;
      }
    } else {
      const confirmAll = window.confirm(
        `⚠️ DANGER: You are about to delete ALL ${bots.length} active bots.\n\nAre you absolutely sure?`
      );
      if (!confirmAll) return;
    }

    console.log(`🗑️ Found ${bots.length} bots to delete.`);

    let deletedCount = 0;
    for (const bot of bots) {
      try {
        console.log(`⏳ Deleting ${bot.botName} (${bot._id})...`);
        const delRes = await fetch(`/api/deploy/${bot._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (delRes.ok) {
          console.log(`✅ Deleted: ${bot.botName}`);
          deletedCount++;
        } else {
          console.error(`❌ Failed to delete ${bot.botName}: ${delRes.status}`);
        }
      } catch (err) {
        console.error(`❌ Error deleting ${bot.botName}:`, err);
      }
      // Small delay to be gentle
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(
      `🏁 Cleanup complete. Deleted ${deletedCount}/${bots.length} bots.`
    );

    // Refresh page to see changes
    if (deletedCount > 0) window.location.reload();
  } catch (e) {
    console.error("❌ Critical Error fetching bot list:", e);
  }
})();
