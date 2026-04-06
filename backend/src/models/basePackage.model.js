import mongoose from "mongoose";
import { DaySchema } from "./day.model.js";

// Stay Locations
const StayLocationSchema = new mongoose.Schema(
    {
        city: { type: String, trim: true },
        nights: { type: Number, min: 1 },
    },
    { _id: false }
);

// Meal Plan
const MealPlanSchema = new mongoose.Schema(
    {
        planType: { type: String, enum: ["AP", "CP", "EP", "MAP"], required: true },
        description: { type: String, default: "" },
    },
    { _id: false }
);

// Hotel Category
const HotelCategorySchema = new mongoose.Schema(
    {
        category: {
            type: String,
            enum: ["standard", "deluxe", "superior"],
            required: true,
        },
        hotelName: { type: String, trim: true, default: "TBD" },
        pricePerPerson: { type: Number, min: 0, required: true },
    },
    { _id: false }
);

// Destination Nights
const DestinationNightSchema = new mongoose.Schema(
    {
        destination: { type: String, trim: true, required: true },
        nights: { type: Number, min: 1, required: true },
        hotels: [HotelCategorySchema],
    },
    { _id: false }
);

// Package Base Schema
const BasePackageSchema = new mongoose.Schema(
    {
        packageId: { type: String, unique: true },
        tourType: {
            type: String,
            enum: ["Domestic", "International"],
            required: true,
        },
        destinationCountry: { type: String, default: "" },
        sector: { type: String, required: true },
        packageSubType: { type: [String], required: true },
        stayLocations: [StayLocationSchema],
        mealPlan: MealPlanSchema,
        destinationNights: [DestinationNightSchema],
        arrivalCity: String,
        departureCity: String,
        title: String,
        notes: String,
        bannerImage: String,
        validFrom: Date,
        validTill: Date,
        days: { type: [DaySchema], default: [] },
        status: {
            type: String,
            enum: ["active", "deactive"],
            default: "deactive",
        },
    },
    { timestamps: true }
);

// -----------------------
// Status Calculation
function calculateStatus(validFrom, validTill) {
    const now = new Date();
    if (validFrom && validTill) {
        return now >= validFrom && now <= validTill ? "active" : "deactive";
    }
    if (validFrom && now >= validFrom) return "active";
    if (validTill && now <= validTill) return "active";
    return "deactive";
}

// -----------------------
// Pre-save hook
BasePackageSchema.pre("save", async function (next) {
    if (this.packageId) return next();

    try {
        const Model = this.constructor; // use the actual model calling save()
        const last = await Model.findOne({}).sort({ createdAt: -1 });

        let nextNumber = 1;
        if (last && last.packageId) {
            const lastNumber = parseInt(last.packageId.split("_").pop());
            nextNumber = lastNumber + 1;
        }

        this.packageId = `IY_PCK_${String(nextNumber).padStart(3, "0")}`;

        if (this.tourType === "Domestic") {
            this.destinationCountry = "India";
        }
        this.status = calculateStatus(this.validFrom, this.validTill);
        next();
    } catch (err) {
        next(err);
    }
});

// -----------------------
// Pre-update hook
BasePackageSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.tourType === "Domestic") {
        update.destinationCountry = "India";
    }
    if (update.validFrom || update.validTill) {
        const validFrom = update.validFrom || this._update.validFrom;
        const validTill = update.validTill || this._update.validTill;
        update.status = calculateStatus(validFrom, validTill);
    }
    next();
});

export { BasePackageSchema, calculateStatus };
