import mongoose from "mongoose";

const receivedVoucherSchema = new mongoose.Schema({

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    paymentType: {
        type: String,
        enum: ["Receive Voucher", "Payment Voucher"],
        default: "Receive Voucher",
    },
    date: {
        type: Date,
        required: true,
    },
    paymentScreenshot: {
        type: String, // URL or path to uploaded file
    },
    accountType: {
        type: String,
        required: true,
    },
    partyName: {
        type: String,
        required: true,
    },
    paymentMode: {
        type: String,
        required: true,

    },
    referenceNumber: {
        type: String,
    },
    particulars: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    invoice: {
        type: String,
        unique: true
    },

    // 👇 New field added for Dr/Cr based on paymentType
    drCr: {
        type: String,
        enum: ["Dr", "Cr"],
    },
    receiptNumber: {
        type: Number,
        required: true,
        unique: true,
    },

    invoiceId: {
        type: String,
        required: true,
        unique: true,
    },


}, {
    timestamps: true,
});

// 👇 Automatically set drCr based on paymentType
receivedVoucherSchema.pre("save", function (next) {
    if (this.paymentType === "Receive Voucher") {
        this.drCr = "Cr";
    } else if (this.paymentType === "Payment Voucher") {
        this.drCr = "Dr";
    }
    next();
});

const ReceivedVoucher = mongoose.model("ReceivedVoucher", receivedVoucherSchema);
export default ReceivedVoucher;