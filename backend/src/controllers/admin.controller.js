import User from "../models/User.js";
import Message from "../models/Message.js";
import CallHistory from "../models/CallHistory.js";
import Conversation from "../models/Conversation.js";
import Status from "../models/Status.js";
import bcrypt from "bcryptjs";
import { generateAdminToken } from "../lib/utils.js";
import { ENV } from "../lib/env.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalCalls = await CallHistory.countDocuments();
    const totalGroups = await Conversation.countDocuments({ isGroup: true });
    const totalStatuses = await Status.countDocuments();

    res.status(200).json({
      totalUsers,
      totalMessages,
      totalCalls,
      totalGroups,
      totalStatuses,
    });
  } catch (error) {
    console.log("Error in getDashboardStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Exclude passwords
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Also delete user's messages/calls, or leave them (orphaned). Let's leave for now or we could delete.
    // await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
    // await CallHistory.deleteMany({ $or: [{ callerId: id }, { receiverId: id }] });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    generateAdminToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in adminLogin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminMe = async (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    profilePic: req.user.profilePic,
    role: req.user.role,
  });
};

export const adminLogout = async (req, res) => {
  res.cookie("admin_jwt", "", { 
    maxAge: 0, 
    httpOnly: true, 
    sameSite: ENV.NODE_ENV === "development" ? "strict" : "none",
    secure: ENV.NODE_ENV === "development" ? false : true,
  });
  res.status(200).json({ ok: true });
};

export const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Cannot ban an admin" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({ message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`, isBanned: user.isBanned });
  } catch (error) {
    console.log("Error in toggleUserBan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ isGroup: true })
      .populate("members", "fullName email profilePic")
      .sort({ createdAt: -1 });
    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getAllGroups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Conversation.findByIdAndDelete(id);

    if (!deletedGroup) return res.status(404).json({ message: "Group not found" });

    // Also delete messages associated with this group
    await Message.deleteMany({ conversationId: id });

    res.status(200).json({ message: "Group and its messages deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCalls = async (req, res) => {
  try {
    const calls = await CallHistory.find()
      .sort({ createdAt: -1 })
      .populate("callerId", "fullName email profilePic")
      .populate("receiverId", "fullName email profilePic");
    res.status(200).json(calls);
  } catch (error) {
    console.log("Error in getAllCalls:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email profilePic");
    res.status(200).json(statuses);
  } catch (error) {
    console.log("Error in getAllStatuses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Status.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Status not found" });
    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    console.log("Error in deleteStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
