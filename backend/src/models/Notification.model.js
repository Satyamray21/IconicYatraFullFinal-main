import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
    recipient: {
        type: String, // Staff Name or Staff ID
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    refId: {
        type: String, // Lead ID
    },
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
