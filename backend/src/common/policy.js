import mongoose from "mongoose";

export const policySchema = new mongoose.Schema({
    inclusionPolicy: {
        type: [String],
        default: ""
    },
    exclusionPolicy: {
        type: [String],
        default: ""
    },
    paymentPolicy: {
        type: [String],
        default: ""
    },
    cancellationPolicy: {
        type: [String],
        default: ""
    },
    termsAndConditions: {
        type: [String],
        default: ""
    }
}, { _id: false });  