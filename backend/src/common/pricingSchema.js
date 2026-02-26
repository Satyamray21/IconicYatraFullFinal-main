import mongoose from "mongoose";

export const pricingSchema = new mongoose.Schema({
    totals: {
        standard: { type: Number, default: 0 },
        deluxe: { type: Number, default: 0 },
        superior: { type: Number, default: 0 },
    },
    margins: {
        standard: { percent: { type: String, default: "0" }, value: { type: Number, default: 0 } },
        deluxe: { percent: { type: String, default: "0" }, value: { type: Number, default: 0 } },
        superior: { percent: { type: String, default: "0" }, value: { type: Number, default: 0 } },
    },
    discounts: {
        standard: { type: Number, default: 0 },
        deluxe: { type: Number, default: 0 },
        superior: { type: Number, default: 0 },
    },
    taxes: {
        gstOn: { type: String, enum: ["Full", "Margin", "None"], default: "Full" },
        taxPercent: { type: String, default: "18" },
        applyGST: { type: Boolean, default: false },
    },
    contactDetails: { type: String, default: "" },
});