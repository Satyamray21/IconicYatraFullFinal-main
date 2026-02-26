import mongoose from "mongoose"
export const vehicleDetailsSchema = new mongoose.Schema({
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
            enum: ["One Way", "Round Trip"],
            required: true
        },
        noOfDays: {
            type: String,
            required: true
        },
        perDayCost: {
            type: String,
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
    }
}, { _id: false }
)