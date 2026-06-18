import mongoose from "mongoose";
import Package from "../package.model.js";
import { policySchema } from "../../common/policy.js";

const quickQuotationSchema = new mongoose.Schema(
    {
        customerName: { type: String, required: true, trim: true },
        title: {
            type: String,
            enum: ["Mr", "Mrs", "Ms"],
            default: "Mr",
            trim: true,
        },
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
        noOfRooms: { type: Number, default: 0 },
        noOfMattress: { type: Number, default: 0 },
        roomType: { type: String, default: "" },
        noOfVehicles: { type: Number, default: 0 },
        vehiclesSameOrDifferent: { type: String, enum: ["Same", "Different"], default: "Same" },
        multipleVehicles: [
            {
                vehicleType: { type: String, default: "" },
                tripType: { type: String, default: "" },
                noOfDays: { type: Number, default: 0 },
                perDayCost: { type: Number, default: 0 },
                totalCost: { type: Number, default: 0 }
            }
        ],

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

        perPersonAdultCost: {
            type: Number,
            default: 0
        },

        perPersonChildCost: {
            type: Number,
            default: 0
        },

        perPersonMattressCost: {
            type: Number,
            default: 0
        },

        standardAdultCost: { type: Number, default: 0 },
        standardChildCost: { type: Number, default: 0 },
        standardMattressCost: { type: Number, default: 0 },

        deluxeAdultCost: { type: Number, default: 0 },
        deluxeChildCost: { type: Number, default: 0 },
        deluxeMattressCost: { type: Number, default: 0 },

        superiorAdultCost: { type: Number, default: 0 },
        superiorChildCost: { type: Number, default: 0 },
        superiorMattressCost: { type: Number, default: 0 },

        calculationMethod: {
            type: String,
            enum: ["package", "perPerson"],
            default: "package"
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
            enum: ["draft", "finalized", "cancelled"],
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
        /** Confirmed hotel details for the hotel confirmation mailer */
        confirmedHotels: [
            {
                hotelName: { type: String },
                hotelAddress: { type: String },
                city: { type: String },
                nights: { type: Number },
                roomType: { type: String },
                noOfRooms: { type: String },
                checkInDate: { type: String },
                checkInTime: { type: String },
                checkOutDate: { type: String },
                checkOutTime: { type: String },
                mealPlan: { type: String },
                contactNo: { type: String },
                bookingPnr: { type: String },
            }
        ],
        bookingId: {
            type: String,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
        },
        companyName: {
            type: String,
        },
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

    // Always ensure top-level values win or are synced into packageSnapshot.quotationDetails
    if (this.packageSnapshot && typeof this.packageSnapshot === "object") {
        if (!this.packageSnapshot.quotationDetails || typeof this.packageSnapshot.quotationDetails !== "object") {
            this.packageSnapshot.quotationDetails = {};
        }
        this.packageSnapshot.quotationDetails.noOfRooms = Number(this.noOfRooms) || Number(this.packageSnapshot.quotationDetails.noOfRooms) || 0;
        this.packageSnapshot.quotationDetails.noOfMattress = Number(this.noOfMattress) || Number(this.packageSnapshot.quotationDetails.noOfMattress) || 0;
        this.packageSnapshot.quotationDetails.roomType = this.roomType || this.packageSnapshot.quotationDetails.roomType || "";

        // Also sync into rooms object for custom quotation parity
        if (!this.packageSnapshot.quotationDetails.rooms || typeof this.packageSnapshot.quotationDetails.rooms !== "object") {
            this.packageSnapshot.quotationDetails.rooms = {};
        }
        this.packageSnapshot.quotationDetails.rooms.numberOfRooms = this.packageSnapshot.quotationDetails.noOfRooms;
        this.packageSnapshot.quotationDetails.rooms.roomType = this.packageSnapshot.quotationDetails.roomType;
        this.packageSnapshot.quotationDetails.rooms.sharingType = this.packageSnapshot.quotationDetails.roomType;
        this.packageSnapshot.quotationDetails.rooms.mattress = this.packageSnapshot.quotationDetails.noOfMattress;
        
        // Let's also sync kids and infants inside quotationDetails
        this.packageSnapshot.quotationDetails.kids = Number(this.kids) || Number(this.packageSnapshot.quotationDetails.kids) || 0;
        this.packageSnapshot.quotationDetails.infants = Number(this.infants) || Number(this.packageSnapshot.quotationDetails.infants) || 0;
        this.packageSnapshot.quotationDetails.adults = Number(this.adults) || Number(this.packageSnapshot.quotationDetails.adults) || 0;
        this.packageSnapshot.quotationDetails.children = Number(this.children) || Number(this.packageSnapshot.quotationDetails.children) || 0;
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
                    noOfRooms: Number(this.noOfRooms) || Number(incomingSnapshot?.quotationDetails?.noOfRooms) || 0,
                    noOfMattress: Number(this.noOfMattress) || Number(incomingSnapshot?.quotationDetails?.noOfMattress) || 0,
                    roomType: this.roomType || incomingSnapshot?.quotationDetails?.roomType || "",
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
