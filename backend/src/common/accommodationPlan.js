import mongoose from "mongoose";
export const accommodationPlanSchema = new mongoose.Schema(
    {
        hotelType: { type: String }, // Standard / Deluxe / Superior
        hotelName: { type: String },
        roomType: { type: String },
        mealPlan: { type: String },

        noNights: { type: Number, default: 1 },
        noOfRooms: { type: Number, default: 1 },

        mattressForAdult: { type: Boolean, default: false },
        adultExBed: { type: Boolean, default: false },
        mattressForChildren: { type: Boolean, default: false },

        adultExMattress: { type: Number },
        adultExCost: { type: Number },
        childrenExMattress: { type: Number },
        childrenExCost: { type: Number },

        withoutMattress: { type: Boolean, default: false },
        withoutBedCost: { type: Number },

        roomNight: { type: Number },
        costNight: { type: Number },
        totalCost: { type: Number }
    },
    { _id: false }
);