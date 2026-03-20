import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["missed", "completed", "rejected"],
      required: true,
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
  },
  { timestamps: true }
);

const CallHistory = mongoose.model("CallHistory", callHistorySchema);

export default CallHistory;
