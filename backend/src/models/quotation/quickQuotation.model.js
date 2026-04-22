import mongoose from "mongoose";
import Package from "../package.model.js";
import { policySchema } from "../../common/policy.js";

const quickQuotationSchema = new mongoose.Schema(
    {
        customerName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        clientLocation: { type: String, trim: true, default: "" },

        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
        },
        quickQuotationId: {
            type: String,
            unique: true,
            trim: true,
        },

        adults: { type: Number, required: true },
        children: { type: Number, default: 0 },
        kids: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },

        message: { type: String },

        transportation: {
            type: String,
            default: "",
        },
        pickupPoint: {
            type: String,
            default: ""
        },
        pickupTime: { type: Date, default: null },

        dropPoint: {
            type: String,
            default: ""
        },
        dropTime: { type: Date, default: null },

        totalCost: {
            type: Number,
            default: 0
        },

        currency: {
            type: String,
            default: "INR"
        },

        packageSnapshot: {
            type: Object,
            default: {},
        },

        policy: {
            type: policySchema,
            default: {},
        },

        finalizeStatus: {
            type: String,
            enum: ["draft", "finalized"],
            default: "draft",
        },
        finalizedAt: { type: Date },
        /** Label chosen at finalize (e.g. "Quick Package"); used for UI preselect */
        finalizedPackage: { type: String, default: "" },
        vendorDetails: {
            vendorType: { type: String, default: "" },
            hotelVendorName: { type: String, default: "" },
            vehicleVendorName: { type: String, default: "" },
        },
        finalizedVendorsWithAmounts: [
            {
                vendorName: { type: String, trim: true, default: "" },
                vendorType: {
                    type: String,
                    enum: ["Hotel", "Vehicle", "Other"],
                    default: "Other",
                },
                amount: { type: Number, default: 0, min: 0 },
                remarks: { type: String, trim: true, default: "" },
            },
        ],
    },
    { timestamps: true }
);

// =============================
// FIXED pre-save hook
// =============================
quickQuotationSchema.pre("save", async function (next) {
    if (this.isNew && !this.quickQuotationId) {
        const lastQuotation = await mongoose
            .model("QuickQuotation")
            .findOne({ quickQuotationId: { $exists: true, $ne: null } })
            .sort({ createdAt: -1 })
            .select("quickQuotationId")
            .lean();

        let nextNumber = 1;
        if (lastQuotation?.quickQuotationId) {
            const m = String(lastQuotation.quickQuotationId).match(
                /^ICYR_Q_(\d+)$/
            );
            if (m) {
                nextNumber = Number(m[1]) + 1;
            }
        }
        this.quickQuotationId = `ICYR_Q_${String(nextNumber).padStart(4, "0")}`;
    }

    if (this.isNew && this.packageId) {
        const pkg = await Package.findById(this.packageId).lean();

        if (pkg) {
            const incomingSnapshot =
                this.packageSnapshot && typeof this.packageSnapshot === "object"
                    ? this.packageSnapshot
                    : {};

            // Merge package snapshot with incoming values from request.
            // Incoming fields (e.g. quotationDetails.arrivalDate/departureDate) must win.
            this.packageSnapshot = {
                ...pkg,
                ...incomingSnapshot,
                quotationDetails: {
                    ...(pkg?.quotationDetails && typeof pkg.quotationDetails === "object"
                        ? pkg.quotationDetails
                        : {}),
                    ...(incomingSnapshot?.quotationDetails &&
                    typeof incomingSnapshot.quotationDetails === "object"
                        ? incomingSnapshot.quotationDetails
                        : {}),
                },
            };

            // Save policies
            this.policy = {
                ...(pkg?.policy && typeof pkg.policy === "object" ? pkg.policy : {}),
                ...(this.policy && typeof this.policy === "object" ? this.policy : {}),
            };

            if (!this.transportation && pkg.transportation) {
                this.transportation = pkg.transportation;
            }

        }
    }
    next();
});

// =============================
// VIRTUAL FIELD
// =============================
quickQuotationSchema.virtual("formattedCost").get(function () {
    if (this.currency === "INR") {
        return `₹${this.totalCost?.toLocaleString("en-IN") || "0"}`;
    }
    return `${this.currency} ${this.totalCost?.toLocaleString() || "0"}`;
});

// =============================
// PRICE CALCULATOR (only when called)
// =============================
quickQuotationSchema.methods.calculateFinalCost = function (taxPercentage = 0) {
    const taxAmount = (this.totalCost * taxPercentage) / 100;
    return this.totalCost + taxAmount;
};

const QuickQuotation = mongoose.model("QuickQuotation", quickQuotationSchema);
export default QuickQuotation;
