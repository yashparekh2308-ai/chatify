import CallHistory from "../models/CallHistory.js";

export const getCallHistory = async (req, res) => {
  try {
    const myId = req.user._id;

    const history = await CallHistory.find({
      $or: [{ callerId: myId }, { receiverId: myId }],
    })
      .populate("callerId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 for performance

    res.status(200).json(history);
  } catch (error) {
    console.error("Error in getCallHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
