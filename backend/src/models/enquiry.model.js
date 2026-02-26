import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    persons: {
      type: Number,
      required: true,
      min: 1,
    },
    destination: {
      type: String,
      trim: true,
    },
    travelDate: {
      type: Date,
    },

    // 🔥 CRM Fields
    talkStatus: {
      type: String,
      enum: ["pending", "connected"],
      default: "pending",
    },

    remarks: {
      type: String,
      trim: true,
    },

    talkedAt: {
      type: Date,
    },

    talkedBy: {
      type: String,
    },

  },
  { timestamps: true }
);

export default mongoose.model("Enquiry", enquirySchema);