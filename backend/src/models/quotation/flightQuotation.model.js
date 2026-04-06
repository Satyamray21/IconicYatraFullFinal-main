import mongoose from "mongoose";
const flightDetailSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    preferredAirline: { type: String, required: true },
    flightNo: { type: String, required: true },
    fare: { type: String, required: true },
    departureDate: { type: String, required: true },
    departureTime: { type: String, required: true },
}, { _id: false });

const flightQuotationSchema = mongoose.Schema({
    tripType: {
        type: String,
        enum: ["oneway", "roundtrip", "multicity"],
        required: true,
    },
    clientDetails: {
        clientName: { type: String, required: true }
    },
    title: { type: String, default: "" },

    flightDetails: {
        type: [flightDetailSchema],
        required: true,
        validate: {
            validator: function (value) {
                if (this.tripType === "oneway") return value.length === 1;
                if (this.tripType === "roundtrip") return value.length === 2;
                if (this.tripType === "multicity") return value.length >= 2;
                return false;
            },
            message: "Invalid number of flight details for the selected trip type"
        }
    },

    adults: { type: String, required: true },
    childs: { type: String },
    infants: { type: String },
    anyMessage: { type: String },

    personalDetails: {
        fullName: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        emailId: { type: String, required: true }
    },

    totalFare: { type: Number, default: 0 },

    pnrList: [{ type: String }],   // ✅ PNR per flight
    finalFareList: [{ type: Number }], // 🆕 NEW: Fare per flight

    finalFare: { type: Number, default: null },

    status: {
        type: String,
        enum: ['In Progress', 'Completed', 'Confirmed', 'New'],
        default: 'New'
    },

    flightQuotationId: {
        type: String,
        unique: true
    },

    Quotation_type: {
        type: String,
        default: 'Flight_Quotation'
    }
}, { timestamps: true });



export const FlightQuotation = mongoose.model("FlightQuotation", flightQuotationSchema);