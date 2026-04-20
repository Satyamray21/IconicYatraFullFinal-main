import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    staffId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Login Successful", "Login Failed"],
      required: true,
    },
    dateTime: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    isp: {
      type: String,
    },
    city: {
      type: String,
    },
    region: {
      type: String,
    },
    country: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
loginHistorySchema.index({ userId: 1, timestamp: -1 });
loginHistorySchema.index({ staffId: 1, timestamp: -1 });

export const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);
