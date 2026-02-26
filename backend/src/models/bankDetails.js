import mongoose from "mongoose";

export const bankSchema = mongoose.Schema({
    bankName: {
        type: String,
        required: true,
    },
    branchName: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true,
    },
    ifscCode: {
        type: String,
        required: true,
        trim: true,
    }
}, { timestamps: true })

const Bank = mongoose.model("Bank", bankSchema);
export default Bank;
