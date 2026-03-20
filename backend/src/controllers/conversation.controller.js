import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import GroupInvite from "../models/GroupInvite.js";

export const createGroupConversation = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { name, memberIds = [], groupPic } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const uniqueMemberIds = Array.from(
      new Set([creatorId.toString(), ...(memberIds || []).map((id) => id.toString())])
    );

    if (uniqueMemberIds.length < 3) {
      return res.status(400).json({ message: "Group must have at least 3 members" });
    }

    const membersExist = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (membersExist !== uniqueMemberIds.length) {
      return res.status(400).json({ message: "One or more members are invalid" });
    }

    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const conversation = await Conversation.create({
      isGroup: true,
      name: name.trim(),
      groupPic: groupPicUrl,
      members: uniqueMemberIds,
      admins: [creatorId],
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error in createGroupConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    const conversations = await Conversation.find({ members: myId }).sort({ updatedAt: -1 });

    // For now we only return group conversations here; DMs still use /messages/chats.
    const result = await Promise.all(
      conversations
        .filter((c) => c.isGroup)
        .map(async (c) => {
          const lastMessage = await Message.findOne({ conversationId: c._id })
            .sort({ createdAt: -1 })
            .select("text image createdAt senderId");

          const unreadCount = await Message.countDocuments({
            conversationId: c._id,
            senderId: { $ne: myId },
            seen: false,
          });

          return {
            _id: c._id,
            isGroup: true,
            name: c.name,
            groupPic: c.groupPic,
            memberCount: c.members.length,
            unreadCount,
            lastMessageText: lastMessage?.text,
            lastMessageImage: lastMessage?.image,
            lastMessageAt: lastMessage?.createdAt,
          };
        })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMyConversations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const messages = await Message.find({ conversationId }).populate("replyTo");

    // mark messages not sent by me as seen (simple group read state)
    await Message.updateMany(
      { conversationId, senderId: { $ne: myId }, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );

    // notify all other members that I saw messages
    conversation.members
      .map((m) => m.toString())
      .filter((id) => id !== myId.toString())
      .forEach((memberId) => {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) io.to(socketId).emit("messagesSeen", { userId: myId.toString() });
      });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getConversationMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendConversationMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id: conversationId } = req.params;
    const { text, image, replyTo } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const me = await User.findById(senderId).select("blockedUsers");
    const blockedSet = new Set((me?.blockedUsers || []).map((id) => id.toString()));
    if (blockedSet.size > 0) {
      // simple safety: prevent sending to a group if it contains a blocked user
      const hasBlockedMember = conversation.members.some((m) => blockedSet.has(m.toString()));
      if (hasBlockedMember) {
        return res.status(403).json({ message: "You cannot message this group" });
      }
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId: null,
      text,
      image: imageUrl,
      replyTo: replyTo || null,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate("replyTo");

    // bump conversation updatedAt
    conversation.updatedAt = new Date();
    await conversation.save();

    // broadcast to all members including sender
    conversation.members
      .map((m) => m.toString())
      .forEach((memberId) => {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) io.to(socketId).emit("newMessage", populatedMessage);
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendConversationMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: conversationId } = req.params;
    const { memberIds = [] } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "Not a group" });
    const isAdmin = conversation.admins.some((a) => a.toString() === myId.toString());
    if (!isAdmin) return res.status(403).json({ message: "Admins only" });

    const toAdd = Array.from(new Set(memberIds.map((id) => id.toString()))).filter(Boolean);
    if (toAdd.length === 0) return res.status(400).json({ message: "No members provided" });

    const existing = new Set(conversation.members.map((m) => m.toString()));
    toAdd.forEach((id) => existing.add(id));
    conversation.members = Array.from(existing);

    await conversation.save();
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in addGroupMembers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: conversationId, memberId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "Not a group" });
    const isAdmin = conversation.admins.some((a) => a.toString() === myId.toString());
    if (!isAdmin) return res.status(403).json({ message: "Admins only" });

    conversation.members = conversation.members.filter((m) => m.toString() !== memberId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== memberId);

    // if last admin removed, keep creator/admin fallback
    if (conversation.admins.length === 0 && conversation.members.length > 0) {
      conversation.admins = [conversation.members[0]];
    }

    await conversation.save();
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in removeGroupMember:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupInvite = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: conversationId } = req.params;
    const { toUserId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "Not a group" });

    const isAdmin = conversation.admins.some((a) => a.toString() === myId.toString());
    if (!isAdmin) return res.status(403).json({ message: "Admins only" });

    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });
    if (conversation.members.some((m) => m.toString() === toUserId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const existing = await GroupInvite.findOne({
      conversationId,
      toUser: toUserId,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    const invite = await GroupInvite.create({
      conversationId,
      fromUser: myId,
      toUser: toUserId,
      status: "pending",
    });

    res.status(201).json(invite);
  } catch (error) {
    console.error("Error in sendGroupInvite:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyGroupInvites = async (req, res) => {
  try {
    const myId = req.user._id;

    const invites = await GroupInvite.find({
      toUser: myId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate("conversationId", "name groupPic")
      .populate("fromUser", "fullName profilePic");

    const result = invites.map((inv) => ({
      _id: inv._id,
      conversationId: inv.conversationId?._id,
      groupName: inv.conversationId?.name,
      groupPic: inv.conversationId?.groupPic,
      fromUser: inv.fromUser,
      createdAt: inv.createdAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMyGroupInvites:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const respondToGroupInvite = async (req, res) => {
  try {
    const myId = req.user._id;
    const { inviteId } = req.params;
    const { action } = req.body; // "accept" or "decline"

    const invite = await GroupInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    if (invite.toUser.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Invite already handled" });
    }

    if (action === "decline") {
      invite.status = "declined";
      await invite.save();
      return res.status(200).json({ status: "declined" });
    }

    if (action !== "accept") {
      return res.status(400).json({ message: "Invalid action" });
    }

    // accept: add user to conversation members
    const conversation = await Conversation.findById(invite.conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!conversation.members.some((m) => m.toString() === myId.toString())) {
      conversation.members.push(myId);
      await conversation.save();
    }

    invite.status = "accepted";
    await invite.save();

    res.status(200).json({ status: "accepted" });
  } catch (error) {
    console.error("Error in respondToGroupInvite:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

