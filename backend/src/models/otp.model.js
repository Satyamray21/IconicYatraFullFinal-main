import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

export const OTP = mongoose.model("OTP", otpSchema);
