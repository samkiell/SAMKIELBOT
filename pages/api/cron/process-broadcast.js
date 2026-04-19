import connectDB from "../../../lib/dbConnect";
import { processNextBatch } from "../../../lib/services/broadcastWorker";

export default async function handler(req, res) {
  // Optional: Add simple security check (e.g., CRON_SECRET)
  // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end();
  // }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    console.log("[Cron] Starting broadcast batch processing...");
    const result = await processNextBatch(25);
    
    return res.status(200).json({
      success: true,
      message: "Batch processed successfully",
      ...result
    });
  } catch (error) {
    console.error("[Cron] Broadcast processing failed:", error);
    return res.status(500).json({
      success: false,
      message: "Processing failed",
      error: error.message
    });
  }
}
