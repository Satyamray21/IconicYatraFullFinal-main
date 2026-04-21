import mongoose from "mongoose"
import { policySchema } from "../../common/policy.js";

const vehicleSchema = mongoose.Schema({
    basicsDetails: {
        clientName: {
            type: String,
            required: true,
        },
        vehicleType: {
            type: String,
            required: true,
        },
        tripType: {
            type: String,
            enum: ['One Way', 'Round Trip'],
            required: true
        },
        noOfDays: {
            type: String,
            required: true
        },
        perDayCost: {
            type: String,
            required: true
        }

    },
    costDetails: {
        totalCost: {
            type: String,
            required: true
        }
    },
    pickupDropDetails: {
        pickupDate: {
            type: String,
            required: true
        },
        pickupTime: {
            type: String,
            required: true
        },
        pickupLocation: {
            type: String,
            required: true
        },
        dropDate: {
            type: String,
            required: true
        },
        dropTime: {
            type: String,
            required: true
        },
        dropLocation: {
            type: String,
            required: true
        },
        /** Optional display overrides edited from VehicleFinalize pickup section */
        pickupArrivalNote: { type: String },
        pickupDepartureNote: { type: String },
    },
    discount: {
        type: String,
        required: true

    },
    tax: {
        gstOn: {
            type: String,
            enum: ['Full', 'None'],
            required: true
        },
        applyGst: {
            type: String,
            required: true
        },
    },
    signatureDetails: {
        contactDetails: {
            type: String
        }
    },
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
    additionalServices: [
        {
            included: { type: String, enum: ["yes", "no"], default: "yes" },
            particulars: { type: String, trim: true, default: "" },
            amount: { type: Number, default: 0, min: 0 },
            taxType: { type: String, trim: true, default: "" },
            taxRate: { type: Number, default: 0, min: 0 },
            taxAmount: { type: Number, default: 0, min: 0 },
            totalAmount: { type: Number, default: 0, min: 0 },
            taxLabel: { type: String, trim: true, default: "" },
        },
    ],
    policies: policySchema,
    itinerary: [
        {
            title: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                default: "",
            },
        },
    ],
    vehicleQuotationId: {
        type: String,
        unique: true
    },
    /** Finalization status */
    finalizeStatus: {
        type: String,
        enum: ["draft", "finalized"],
        default: "draft",
    },
    finalizedAt: {
        type: Date,
    },
    quotationTitle: { type: String },
    destinationSummary: { type: String },
}, {
    timestamps: true
})

export const Vehicle = new mongoose.model("Vehicle", vehicleSchema);