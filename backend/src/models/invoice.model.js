import mongoose from "mongoose";

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

/** Indian FY (April–March) and label string e.g. "2024-25" from a calendar date */
function getFinancialYearFromDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const financialYearStart = m >= 3 ? y : y - 1;
    const financialYearEnd = financialYearStart + 1;
    return `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;
}

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

/* ✅ Auto-generate financialYear and advancedReceiptNo */
invoiceSchema.pre("save", async function (next) {
    try {
        // Only generate if not already set
        if (this.advancedReceiptNo && this.financialYear) {
            return next();
        }

        // Align FY, receipt month label, and serial scope with invoice date (backdated invoices)
        const refDate = this.invoiceDate ? new Date(this.invoiceDate) : new Date();
        const fyString = getFinancialYearFromDate(refDate);

        this.financialYear = fyString;

        // Fetch company details
        const Company = mongoose.model("Company");
        const company = await Company.findById(this.companyId);

        if (!company) {
            return next(new Error("Company not found"));
        }

        const shortName = company.companyName
            ? company.companyName.split(" ").map(w => w[0].toUpperCase()).join("").substring(0, 2)
            : "CO";

        // Sequential number within company + FY (exclude this doc on updates)
        const countQuery = {
            companyId: this.companyId,
            financialYear: fyString,
        };
        if (!this.isNew) {
            countQuery._id = { $ne: this._id };
        }
        const countForFY = await mongoose.model("Invoice").countDocuments(countQuery);

        const serial = String(countForFY + 1).padStart(3, "0");
        const monthName = refDate.toLocaleString("en-US", { month: "long" });

        // Generate advancedReceiptNo only if not provided
        if (!this.advancedReceiptNo) {
            this.advancedReceiptNo = `AR-${shortName}-${monthName}-${serial}`;
        }

        // Generate invoiceNo only if not provided
        if (!this.invoiceNo) {
            this.invoiceNo = `${shortName}-${fyString}/${serial}`;
        }

        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model("Invoice", invoiceSchema);