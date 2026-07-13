import mongoose from "mongoose";

const globalSettingsSchema = new mongoose.Schema(
  {
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
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
