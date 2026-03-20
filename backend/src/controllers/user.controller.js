import User from "../models/User.js";

export const blockUser = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;

    if (myId.toString() === id) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const exists = await User.exists({ _id: id });
    if (!exists) return res.status(404).json({ message: "User not found" });

    await User.updateOne({ _id: myId }, { $addToSet: { blockedUsers: id } });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;

    await User.updateOne({ _id: myId }, { $pull: { blockedUsers: id } });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in unblockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const myId = req.user._id;

    const me = await User.findById(myId).select("blockedUsers").populate("blockedUsers", "-password");
    res.status(200).json(me?.blockedUsers || []);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

