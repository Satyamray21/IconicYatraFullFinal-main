import mongoose from "mongoose";
import { itinerarySchema } from "../../common/dayWise.js";
import { stayLocationSchema } from "../../common/stayLocation.js";
import { vehicleDetailsSchema } from "../../common/vehicleDetails.js";
import { policySchema } from "../../common/policy.js";
import { pricingSchema } from "../../common/pricingSchema.js"
const fullQuotationSchema = new mongoose.Schema({
    clientDetails: {
        clientName: { type: String, required: true },
        tourType: { type: String, enum: ["Domestic", "International"] },
        sector: { type: String, required: true },
        showCostPerAdult: {
            type: Boolean,
            default: true
        },
        servicesRequired: [String],
        members: {
            adults: Number,
            children: Number,
            kidsWithoutMattress: Number,
            infants: Number,
        },

    },
    accommodation: {
        hotelType: [String],
        mealPlan: String,
        transport: Boolean,
        sharingType: String,
        noOfRooms: Number,
        noOfMattress: Number,
        noOfNights: Number,
        requirementNote: String,
    },
    pickupDrop: {
        arrivalDate: Date,
        arrivalCity: String,
        arrivalLocation: String,
        departureDate: Date,
        departureCity: String,
        departureLocation: String,
    },
    quotationValidity: {
        validFrom: {
            type: String,
        },
        validTill: {
            type: String
        }
    },
    quotation: {
        createBy: {
            type: "String",
            default: "New Quotation"
        },
        quotationTitle: { type: String, required: true },
        initalNotes: { type: String },
        bannerImage: { type: String },
    },
    stayLocation: [stayLocationSchema],
    itinerary: [itinerarySchema],
    vehicleDetails: vehicleDetailsSchema,
    policies: policySchema,
    pricing: pricingSchema,

    quotationId: { type: String, unique: true },
    isDraft: { type: Boolean, default: true },
    isFinalized: { type: Boolean, default: false },
    currentStep: { type: Number, default: 1 },
},
    { timestamps: true })

export const fullQuotation = mongoose.model("fullQuotation", fullQuotationSchema);