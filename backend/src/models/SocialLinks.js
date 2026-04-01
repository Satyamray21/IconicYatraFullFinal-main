import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    youtube: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SocialLinks", socialLinksSchema);
