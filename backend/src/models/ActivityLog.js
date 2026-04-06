
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    action: { type: String, enum: ["CREATE", "UPDATE", "DELETE", "Status Changed"], required: true },
    model: { type: String, required: true },
    refId: { type: String },
    user: { type: String },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);