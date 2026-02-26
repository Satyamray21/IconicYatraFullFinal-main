import mongoose from "mongoose";

export const firmSchema = mongoose.Schema({
    firmType: {
        type: String,
        required: true
    },
    gstin: {  // Changed from gstIn to gstin
        type: String,
    },
    cin: {
        type: String,
    },
    pan: {
        type: String,
    },
    turnover: {  // Changed from existingTurnOver to turnover
        type: String,
    },
    firmName: {
        type: String,
        required: true
    },
    firmDescription: {
        type: String,
    },
    sameAsContact: {
        type: Boolean,
        default: false
    },
    address1: {
        type: String
    },
    address2: {
        type: String
    },
    address3: {
        type: String
    },
    supportingDocs: {
        type: String // or Buffer for file storage
    }
}, { _id: false })