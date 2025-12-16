export default async function handler(req, res) {
  try {
    return res
      .status(200)
      .json({ success: true, message: "Test API working!" });
  } catch (error) {
    console.error("Test API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
