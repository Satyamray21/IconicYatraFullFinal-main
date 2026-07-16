import mongoose from "mongoose";

/** Last issued serial per company + calendar month (YYYY-MM). */
const invoiceSequenceSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        yearMonth: { type: String, required: true },
        lastSerial: { type: Number, default: 0 },
    },
    { timestamps: true }
);

invoiceSequenceSchema.index({ companyId: 1, yearMonth: 1 }, { unique: true });

export default mongoose.model("InvoiceSequence", invoiceSequenceSchema);
