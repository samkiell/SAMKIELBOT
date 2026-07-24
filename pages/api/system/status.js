import dbConnect from "@/lib/dbConnect";
import FeatureFlag from "@/models/FeatureFlag";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
    const flag = await FeatureFlag.findOne({ key: "maintenance_mode" });
    const maintenance = !!flag?.isEnabled;

    return res.status(200).json({
      success: true,
      data: {
        maintenance,
        updatedAt: flag?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("[API] System status error:", error);
    return res.status(200).json({
      success: true,
      data: {
        maintenance: false,
        updatedAt: null,
      },
    });
  }
}
