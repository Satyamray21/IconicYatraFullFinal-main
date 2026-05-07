import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { 
        type: String, 
        enum: ["reminder", "appointment", "task", "event", "other"], 
        default: "reminder" 
    },
    priority: { 
        type: String, 
        enum: ["low", "medium", "high"], 
        default: "medium" 
    },
    dateTime: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ["pending", "completed", "cancelled"], 
        default: "pending" 
    },
    relatedTo: {
        model: { type: String },
        id: { type: mongoose.Schema.Types.ObjectId }
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }
}, { timestamps: true });

export const Reminder = mongoose.model("Reminder", reminderSchema);
