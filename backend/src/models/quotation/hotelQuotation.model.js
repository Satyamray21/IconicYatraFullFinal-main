import mongoose from "mongoose";
import { stayLocationSchema } from "../../common/stayLocation.js";
import { vehicleDetailsSchema } from "../../common/vehicleDetails.js";
const hotelQuotationSchema = new mongoose.Schema(
    {
        clientDetails: {
            clientName: {
                type: String,
                required: true
            },
            tourType: {
                type: String,
                enum: ["Domestic", "International"],

            },
            sector: {
                type: String,
                required: true
            },
            showCostPerAdult: {
                type: Boolean,
                default: false
            },
            serviceRequired: [String],
            adults: {
                type: String,
            },
            children: {
                type: String,

            },
            infants: {
                type: String,
            },
            kids: {
                type: String,
            },
        },
        accommodationDetails: {
            hotelType: [String],
            mealPlan: {
                type: String,
            },
            transport: {
                type: String,
                enum: ['Yes', 'No'],

            },
            sharingType: {
                type: String,
            },
            noOfRooms: {
                type: String,
            },
            noOfMattress: {
                type: String,
            },

        },
        pickupDrop: {
            arrivalDate: {
                type: Date,
            },
            arrivalCity: {
                type: String,
            },
            arrivalLocation: {
                type: String,
            },
            departureDate: {
                type: Date,
            },
            departureCity: {
                type: String,
            },
            departureLocation: {
                type: String,
            },
            nights: {
                type: Number
            }
        },
        quotationValidity: {
            validFrom: {
                type: Date,
            },
            validTill: {
                type: Date
            }
        },
        quotation: {
            createdBy: {
                type: Boolean,
                default: false
            },
            quotationTitle: {
                type: String,
            },
            initialNotes: {
                type: String,
            },
            selectBannerImage: {
                type: String
            },
        },
        stayLocation: [stayLocationSchema],
        vehicleDetails: vehicleDetailsSchema,
        quotationInclusion: {
            type: String
        },
        quotationExculsion: {
            type: String
        },
        paymentPolicies: {
            type: String
        },
        CancellationRefund: {
            type: String
        },
        termsAndConditions: {
            type: String
        },
        hotelQuotationId: {
            type: String,
            unique: true
        },
        availabilityHotels: [
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
                sharingType: { type: String },
                roomCategory: { type: String },
                adults: { type: Number },
                children: { type: Number },
                kids: { type: Number },
                infants: { type: Number },
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
        finalizeStatus: {
            type: String,
            enum: ["draft", "finalized", "cancelled"],
            default: "draft",
        },
    }, { timestamps: true }
)
export const HotelQuotation = mongoose.model("HotelQuotation", hotelQuotationSchema)