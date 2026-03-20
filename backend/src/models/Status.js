import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

statusSchema.index({ userId: 1, expiresAt: -1 });

const Status = mongoose.model("Status", statusSchema);

export default Status;

