import mongoose from "mongoose";

const googleAdsenquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true
    },

    timeframe: {
      type: String,
      enum: ["1month", "3month", "6month"],
      default: null
    },

    adult: {
      type: Number,
      default: 0
    },

    child: {
      type: Number,
      default: 0
    },

    infant: {
      type: Number,
      default: 0
    },

    inclusion: {
      type: String,
      enum: ["hotel", "flight", "sightseeing"],
      default: null
    },

    notes: String,

    /* =====================
       MARKETING TRACKING
    ====================== */

    source: {
      type: String,
      default: "Google Ads"
    },

    gclid: String,
    fbclid: String,

    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_term: String,
    utm_content: String,

    campaign: String,
    keyword: String,
    adGroup: String,

    landingPage: String,
    device: String,

    /* =====================
       CRM SYSTEM
    ====================== */

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Follow Up",
        "Quoted",
        "Converted",
        "Closed",
        "Spam"
      ],
      default: "New"
    },

    leadScore: {
      type: Number,
      default: 0
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    /* =====================
       ANALYTICS
    ====================== */

    ipAddress: String,
    city: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model("GoogleAdsEnquiry", googleAdsenquirySchema);
