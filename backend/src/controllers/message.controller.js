import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const me = await User.findById(loggedInUserId).select("blockedUsers");
    const blocked = me?.blockedUsers || [];

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId, $nin: blocked },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // upsert reaction for this user
    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex >= 0) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    // notify both participants
    [receiverSocketId, senderSocketId]
      .filter(Boolean)
      .forEach((socketId) => io.to(socketId).emit("messageReactionUpdated", message));

    const populated = await Message.findById(message._id).populate("replyTo");
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in reactToMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeReactionFromMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    [receiverSocketId, senderSocketId]
      .filter(Boolean)
      .forEach((socketId) => io.to(socketId).emit("messageReactionUpdated", message));

    const populated = await Message.findById(message._id).populate("replyTo");
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in removeReactionFromMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ]
        },
        { deletedFor: { $ne: myId } }
      ]
    })
      .sort({ createdAt: -1 }) // Sort descending to get latest first
      .skip(skip)
      .limit(limit)
      .populate("replyTo");

    // Reverse the messages so they are in chronological order for the frontend
    messages.reverse();

    // mark all messages sent TO me in this conversation as seen
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        seen: false,
      },
      {
        $set: { seen: true, seenAt: new Date() },
      }
    );

    // notify the other user that their messages have been seen
    const receiverSocketId = getReceiverSocketId(userToChatId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesSeen", { userId: myId.toString() });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio) {
      return res.status(400).json({ message: "Text, image, or audio is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    const [me, receiver] = await Promise.all([
      User.findById(senderId).select("blockedUsers"),
      User.findById(receiverId).select("blockedUsers"),
    ]);
    const senderBlockedReceiver = me?.blockedUsers?.some((id) => id.toString() === receiverId);
    const receiverBlockedSender = receiver?.blockedUsers?.some((id) => id.toString() === senderId.toString());
    if (senderBlockedReceiver || receiverBlockedSender) {
      return res.status(403).json({ message: "You cannot message this user" });
    }

    let imageUrl;
    let audioUrl;
    
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (audio) {
      // Upload base64 audio to cloudinary
      // Cloudinary expects resource_type: "video" for audio files
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
      });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      conversationId: null,
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate("replyTo");

    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    const senderSocketId = getReceiverSocketId(senderId.toString());

    [receiverSocketId, senderSocketId]
      .filter(Boolean)
      .forEach((socketId) => io.to(socketId).emit("newMessage", populatedMessage));

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (deleteForEveryone) {
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone" });
      }
      await message.deleteOne();
    } else {
      // Delete for me only
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    const targetUserIds = new Set();
    // DM
    if (message.receiverId) {
      targetUserIds.add(message.receiverId.toString());
      targetUserIds.add(message.senderId.toString());
    }
    // Group
    if (message.conversationId) {
      const conversation = await Conversation.findById(message.conversationId).select("members");
      conversation?.members.forEach((m) => targetUserIds.add(m.toString()));
    }

    // Note: If it's a "Delete for Me" request, we technically only need to 
    // notify the user who deleted it, but we can notify everyone who might 
    // be looking, and let the frontend logic decide to only remove if it's 
    // for them or for everyone. We will send a flag.
    Array.from(targetUserIds).forEach((uid) => {
      const socketId = getReceiverSocketId(uid);
      if (socketId) {
        io.to(socketId).emit("messageDeleted", { messageId, deleteForEveryone, deletedForUserId: !deleteForEveryone ? userId.toString() : null });
      }
    });

    res.status(200).json({ messageId, deleteForEveryone });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: otherUserIdOrGroupId } = req.params;

    // determine if it's a DM or a group based on whether a conversation exists with this ID
    let deleteQuery;
    let targetUserIds = new Set([userId.toString()]);
    
    const isGroup = await Conversation.exists({ _id: otherUserIdOrGroupId });
    
    if (isGroup) {
      const conversation = await Conversation.findById(otherUserIdOrGroupId).select("members");
      if (!conversation.members.some((m) => m.toString() === userId.toString())) {
        return res.status(403).json({ message: "Not a member of this group" });
      }
      deleteQuery = { conversationId: otherUserIdOrGroupId };
      conversation.members.forEach((m) => targetUserIds.add(m.toString()));
    } else {
      targetUserIds.add(otherUserIdOrGroupId); // other user in DM
      deleteQuery = {
        $or: [
          { senderId: userId, receiverId: otherUserIdOrGroupId },
          { senderId: otherUserIdOrGroupId, receiverId: userId },
        ],
      };
    }

    await Message.deleteMany(deleteQuery);

    Array.from(targetUserIds).forEach((uid) => {
      const socketId = getReceiverSocketId(uid);
      if (socketId) {
        io.to(socketId).emit("chatCleared", { chatId: otherUserIdOrGroupId });
      }
    });

    res.status(200).json({ message: "Chat cleared successfully", chatId: otherUserIdOrGroupId });
  } catch (error) {
    console.error("Error in clearChatMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // aggregate messages into conversation summaries (last message + unread count)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        },
      },
      {
        $addFields: {
          chatPartnerId: {
            $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"],
          },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$chatPartnerId",
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", loggedInUserId] },
                    { $eq: ["$seen", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const partnerIds = conversations.map((c) => c._id);
    const users = await User.find({ _id: { $in: partnerIds } }).select("-password");

    const usersById = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const result = conversations
      .map((conv) => {
        const user = usersById[conv._id.toString()];
        if (!user) return null;

        return {
          _id: user._id,
          fullName: user.fullName,
          profilePic: user.profilePic,
          email: user.email,
          lastSeenAt: user.lastSeenAt,
          unreadCount: conv.unreadCount,
          lastMessageText: conv.lastMessage.text,
          lastMessageImage: conv.lastMessage.image,
          lastMessageAt: conv.lastMessage.createdAt,
        };
      })
      .filter(Boolean);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
