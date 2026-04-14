import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
    stateCode: { type: String },
    logo: { type: String },
    authorizedSignatory: {
      name: { type: String },
      designation: { type: String },
      signatureImage: { type: String },
    },
    termsConditions: { type: String },
    cancellationPolicy: { type: String },
    paymentPolicy: { type: String },
    paymentLink: { type: String },
    companyWebsite: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Company", companySchema);
