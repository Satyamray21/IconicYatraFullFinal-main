import mongoose from "mongoose";
import { itinerarySchema } from "../../common/dayWise.js";
import { vehicleDetailsSchema } from "../../common/vehicleDetails.js";
import { policySchema } from "../../common/policy.js";
const packageCalculationSchema = new mongoose.Schema({
    baseCost: { type: Number, default: 0 },
    afterMargin: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 }
});
const customQuotationSchema = new mongoose.Schema(
    {
        clientDetails: {
            clientName: { type: String, required: true },
            tourType: { type: String, enum: ["Domestic", "International"] },
            sector: { type: String, required: true },
        },

        pickupDrop: [
            {
                cityName: { type: String, required: true },
                nights: { type: Number, required: true },
            },
        ],

        tourDetails: {
            arrivalCity: { type: String, required: true },
            departureCity: { type: String, required: true },
            quotationTitle: { type: String, required: true },
            initalNotes: { type: String },
            bannerImage: { type: String },
            transport: { type: String, enum: ["Yes", "No"] },
            validFrom: { type: String },
            validTill: { type: String },
            arrivalDate: { type: String, required: true },
            departureDate: { type: String, required: true },
            itinerary: [itinerarySchema],
            vehicleDetails: vehicleDetailsSchema,
            policies: policySchema,
            quotationDetails: {
                adults: { type: Number, required: true },
                children: { type: Number, default: 0 },
                kids: { type: Number, default: 0 },
                infants: { type: Number, default: 0 },
                mealPlan: { type: String, required: true },

                destinations: [
                    {
                        cityName: { type: String, required: true },
                        nights: { type: Number, required: true },
                        standardHotels: [{ type: String }],
                        deluxeHotels: [{ type: String }],
                        superiorHotels: [{ type: String }],
                        totalCost: { type: Number },
                        prices: {
                            standard: { type: Number },
                            deluxe: { type: Number },
                            superior: { type: Number },
                        },
                    },
                ],

                rooms: {
                    numberOfRooms: { type: Number, required: true },
                    roomType: { type: String, required: true },
                    sharingType: { type: String, required: true },
                    showCostPerAdult: { type: Boolean, default: false },
                    mattress: { type: Number, default: 0 },

                },

                companyMargin: {
                    marginPercent: { type: Number, default: 0 },
                    marginAmount: { type: Number, default: 0 },
                },

                discount: { type: Number, default: 0 },

                taxes: {
                    gstOn: {
                        type: String,
                        enum: ["Full", "Margin", "None"],
                        default: "None",
                    },
                    applyGST: { type: Boolean, default: false },
                },
                packageCalculations: {
                    standard: packageCalculationSchema,
                    deluxe: packageCalculationSchema,
                    superior: packageCalculationSchema,
                },
                signatureDetails: {
                    regardsText: { type: String, default: "Best Regards" },
                    signedBy: { type: String },
                },
            },
        },

        quotationId: {
            type: String,
            unique: true,
        },
    },
    { timestamps: true }
);

export const CustomQuotation = mongoose.model(
    "CustomQuotation",
    customQuotationSchema
);