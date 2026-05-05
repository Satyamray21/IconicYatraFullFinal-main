import mongoose from "mongoose";

const emailAccountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    appPassword: { type: String, required: true },
    displayName: { type: String }, // e.g. "Iconic Travel - Reservations"
    label: { type: String }, // e.g. "Reservations", "Sales", "Support"
    service: { type: String, default: "gmail" }, // e.g. "gmail", "hotmail", or null for custom
    host: { type: String }, // for custom SMTP
    port: { type: Number }, // for custom SMTP
    secure: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // Null means global
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("EmailAccount", emailAccountSchema);
