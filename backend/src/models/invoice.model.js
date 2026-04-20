import mongoose from "mongoose";
import {
    allocateNextInvoiceSerial,
    getFinancialYearFromDate,
    getCalendarMonthKey,
    monthNameUtcLong,
} from "../utils/invoiceSerial.utils.js";

const itemSchema = new mongoose.Schema({
    particulars: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    basePrice: { type: Number, default: 0 },
});

const invoiceSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        description: { type: String },
        advancedReceiptNo: { type: String },
        financialYear: { type: String },
        accountType: { type: String, required: true },
        mobile: { type: String, required: true },
        billingName: { type: String, required: true },
        billingAddress: { type: String },
        gstin: { type: String },
        invoiceNo: { type: String, unique: true, required: true },
        invoiceDate: { type: Date, required: true },
        dueDate: { type: Date },
        stateOfSupply: { type: String, required: true },
        isInternational: { type: Boolean, default: false },
        withTax: { type: Boolean, default: true },
        items: [itemSchema],
        totalAmount: { type: Number, required: true },
        /** Sum of taxable base amounts (pre-GST) across line items */
        invoiceValuePurchase: { type: Number, default: 0 },
        receivedAmount: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },
        paymentMode: { type: String, required: true },
        referenceNo: { type: String },
        additionalNote: { type: String },
        bookingId: { type: String },
        startDate: { type: Date },
        returnDate: { type: Date },
        noOfPax: { type: String },
        cabType: { type: String },
        tourType: { type: String },
        startingPoint: { type: String },
        dropPoint: { type: String }
    },
    { timestamps: true }
);

/* ✅ Auto-calculate basePrice for each item */
invoiceSchema.pre("save", function (next) {
    if (this.items && this.items.length > 0) {
        this.items = this.items.map((item) => {
            const itemObj = item.toObject ? item.toObject() : item;
            let basePrice = 0;

            if (this.withTax) {
                // For withTax: basePrice = amount - taxAmount
                basePrice = Number((itemObj.amount - itemObj.taxAmount).toFixed(2));
            } else {
                // For withoutTax: basePrice = price - discount
                const discount = itemObj.discount || 0;
                basePrice = Number((itemObj.price - discount).toFixed(2));
            }

            return { ...itemObj, basePrice };
        });
    }
    next();
});

/* ✅ Auto-generate financialYear, advancedReceiptNo, invoiceNo — new invoices only (monotonic serial / FY) */
invoiceSchema.pre("save", async function (next) {
    try {
        if (!this.isNew) {
            return next();
        }

        const refDate = this.invoiceDate ? new Date(this.invoiceDate) : new Date();
        const fyString = getFinancialYearFromDate(refDate);
        this.financialYear = fyString;

        const Company = mongoose.model("Company");
        const company = await Company.findById(this.companyId);

        if (!company) {
            return next(new Error("Company not found"));
        }

        const shortName = company.companyName
            ? company.companyName.split(" ").map(w => w[0].toUpperCase()).join("").substring(0, 2)
            : "CO";

        const monthName = monthNameUtcLong(refDate);

        if (!this.advancedReceiptNo || !this.invoiceNo) {
            const serialNum = await allocateNextInvoiceSerial(this.companyId, refDate);
            const serial = String(serialNum).padStart(3, "0");
            const yyyymm = getCalendarMonthKey(refDate).replace("-", "");
            if (!this.advancedReceiptNo) {
                this.advancedReceiptNo = `AR-${shortName}-${monthName}-${serial}`;
            }
            if (!this.invoiceNo) {
                this.invoiceNo = `${shortName}-${fyString}/${yyyymm}-${serial}`;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model("Invoice", invoiceSchema);