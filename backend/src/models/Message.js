import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    audio: {
      type: String, // Cloudinary URL for voice notes
    },
    video: {
      type: String, // Cloudinary URL for videos
    },
    document: {
      url: { type: String }, // Cloudinary URL for documents
      name: { type: String },
      size: { type: Number },
      format: { type: String },
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          maxlength: 8,
        },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
