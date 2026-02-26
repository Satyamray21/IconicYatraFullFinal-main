import mongoose from "mongoose";

const leadSourceOptionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["B2B", "B2C"],
    required: true
  },
  value: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model("LeadSourceOption", leadSourceOptionSchema);
