import mongoose from "mongoose";

const globalSettingsSchema = new mongoose.Schema(
  {
    inclusions: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    paymentPolicy: {
      type: String,
      default: ""
    },
    cancellationPolicy: {
      type: String,
      default: ""
    },
    termsAndConditions: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("GlobalSettings", globalSettingsSchema);
