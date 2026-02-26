import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    persons: { type: Number, required: true },
    destination: { type: String, required: true },
    date: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model("Inquiry", inquirySchema);
