// backend/controllers/userStatusController.js


export const updateLastSeen = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.user.lastSeen = new Date();
    await req.user.save();

    res.json({ message: "Last seen updated" });
  } catch (error) {
    console.error("Update lastSeen error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
