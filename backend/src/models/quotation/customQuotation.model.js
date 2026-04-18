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
            /** Optional override for the “Destination : …” line on finalize / PDF */
            destinationSummary: { type: String },
            initalNotes: { type: String },
            bannerImage: { type: String },
            transport: { type: String, enum: ["Yes", "No"] },
            validFrom: { type: String },
            validTill: { type: String },
            arrivalDate: { type: String, required: true },
            departureDate: { type: String, required: true },
            /** Optional display overrides edited from CustomFinalize pickup section */
            pickupArrivalNote: { type: String },
            pickupDepartureNote: { type: String },
            vendorDetails: {
                vendorType: { type: String, enum: ["single", "multiple"] },
                hotelVendorName: { type: String },
                vehicleVendorName: { type: String },
            },
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

                mattress: {
                    superiorMattressCost: { type: Number, default: 0 },
                    deluxeMattressCost: { type: Number, default: 0 },
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
                    taxPercent: { type: Number, default: 0 },
                },
                packageCalculations: {
                    standard: packageCalculationSchema,
                    deluxe: packageCalculationSchema,
                    superior: packageCalculationSchema,
                },
                /** Add-on services from finalize (not merged into packageCalculations.finalTotal) */
                additionalServices: [
                    {
                        included: {
                            type: String,
                            enum: ["yes", "no"],
                            default: "no",
                        },
                        particulars: { type: String, default: "" },
                        amount: { type: Number, default: 0 },
                        taxRate: { type: Number, default: 0 },
                        taxAmount: { type: Number, default: 0 },
                        totalAmount: { type: Number, default: 0 },
                        taxLabel: { type: String, default: "" },
                    },
                ],
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

        /** Last completed wizard step (1–6); used to resume from quotation list */
        currentStep: {
            type: Number,
            default: 1,
            min: 1,
            max: 6,
        },

        finalizeStatus: {
            type: String,
            enum: ["draft", "finalized"],
            default: "draft",
        },
        finalizedPackage: {
            type: String,
            enum: ["Standard", "Deluxe", "Superior"],
        },
        finalizedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

export const CustomQuotation = mongoose.model(
    "CustomQuotation",
    customQuotationSchema
);