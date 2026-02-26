import mongoose from "mongoose"

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
        }
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
    }
}, {
    timestamps: true
})

export const Vehicle = new mongoose.model("Vehicle", vehicleSchema);