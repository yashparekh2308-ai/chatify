import cloudinary from "../lib/cloudinary.js";
import Status from "../models/Status.js";
import User from "../models/User.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const createStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, image } = req.body;

    if (!text?.trim() && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const status = await Status.create({
      userId,
      text: text?.trim() || "",
      image: imageUrl,
      expiresAt: new Date(Date.now() + ONE_DAY_MS),
      viewers: [],
    });

    res.status(201).json(status);
  } catch (error) {
    console.error("Error in createStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStatusFeed = async (req, res) => {
  try {
    const myId = req.user._id;
    const now = new Date();

    // simple MVP: show statuses from all other users (like current contacts list behavior)
    const userIds = (
      await User.find({ _id: { $ne: myId } }).select("_id")
    ).map((u) => u._id);

    const statuses = await Status.find({
      userId: { $in: userIds },
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName profilePic");

    const feed = statuses.map((s) => ({
      _id: s._id,
      text: s.text,
      image: s.image,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      user: s.userId,
      viewed: s.viewers.some((v) => v.toString() === myId.toString()),
      viewersCount: s.viewers.length,
    }));

    res.status(200).json(feed);
  } catch (error) {
    console.error("Error in getStatusFeed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markStatusViewed = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;

    const status = await Status.findById(id);
    if (!status) return res.status(404).json({ message: "Status not found" });
    if (status.expiresAt <= new Date()) return res.status(410).json({ message: "Status expired" });

    const alreadyViewed = status.viewers.some((v) => v.toString() === myId.toString());
    if (!alreadyViewed) {
      status.viewers.push(myId);
      await status.save();
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in markStatusViewed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

