import mongoose from "mongoose";
import { accommodationPlanSchema } from "./accommodationPlan.js";
export const stayLocationSchema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            required: true, // itinerary order
        },
        nights: {
            type: Number,
            default: 1, // optional, number of nights to stay
        },
        standard: accommodationPlanSchema,
        deluxe: accommodationPlanSchema,
        superior: accommodationPlanSchema,
    },
    { _id: false } // no separate _id for each subdocument if not needed
);
