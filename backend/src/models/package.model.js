import mongoose from "mongoose";
import { DaySchema } from "./day.model.js";
import { policySchema } from "../common/policy.js";

// -----------------------
// Stay Locations
const StayLocationSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true, required: true },
    nights: { type: Number, min: 1, required: true },
  },
  { _id: false }
);

// -----------------------
// Meal Plan
const MealPlanSchema = new mongoose.Schema(
  {
    planType: {
      type: String,
      enum: ["AP", "CP", "EP", "MAP"],
      required: true,
    },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// -----------------------
// Hotel Category
const HotelCategorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["standard", "deluxe", "superior"],
      required: true,
    },
    hotelName: { type: String, trim: true, default: "TBD" },
    pricePerPerson: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// -----------------------
// Destination Nights
const DestinationNightSchema = new mongoose.Schema(
  {
    destination: { type: String, trim: true, required: true },
    nights: { type: Number, min: 1, required: true },
    hotels: [HotelCategorySchema],
  },
  { _id: false }
);

// -----------------------
// Package Schema
const PackageSchema = new mongoose.Schema(
  {
    packageId: { type: String, unique: true },

    // ✅ ONLY 2 TYPES NOW
    tourType: {
      type: String,
      enum: ["Domestic", "International"],
      required: true,
    },

    // ✅ NEW FIELD (Theme)
    packageCategory: {
      type: String,
      enum: ["Spiritual", "Holiday", "Latest", "Yatra", "Special"],
      default: "Holiday",
    },

    destinationCountry: { type: String, default: "" },

    sector: { type: String, required: true },

    packageSubType: { type: [String], required: true },

    stayLocations: [StayLocationSchema],

    mealPlan: MealPlanSchema,
    destinationNights: [DestinationNightSchema],

    policy: {
      type: policySchema,
      default: {},
    },

    arrivalCity: { type: String, default: "" },
    departureCity: { type: String, default: "" },
    title: { type: String, default: "" },
    notes: { type: String, default: "" },
    bannerImage: { type: String, default: "" },

    validFrom: { type: Date },
    validTill: { type: Date },

    days: { type: [DaySchema], default: [] },

    status: {
      type: String,
      enum: ["active", "deactive"],
      default: "deactive",
    },
    perPerson: { 
      type: Number, 
      default: 1,
      min: 1
    },
    numberOfRooms: {
      type: Number,
      default: 1,
      min: 1,
    },
    transportationCostPerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportationDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportationTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    hotelTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    standardHotelTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    deluxeHotelTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    superiorHotelTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    calculatedTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalStandardCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalDeluxeCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalSuperiorCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Flat amount added to standard / deluxe / superior final costs (same margin for each tier) */
    manualCostMargin: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// -----------------------
// Status Calculation
// -----------------------
// Status Calculation - FIXED
function calculateStatus(validFrom, validTill) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (validFrom && validTill) {
        const fromDate = new Date(validFrom);
        const tillDate = new Date(validTill);
        
        fromDate.setHours(0, 0, 0, 0);
        tillDate.setHours(0, 0, 0, 0);
        
        return now >= fromDate && now <= tillDate ? "active" : "deactive";
    }
    
    if (validFrom) {
        const fromDate = new Date(validFrom);
        fromDate.setHours(0, 0, 0, 0);
        return now >= fromDate ? "active" : "deactive";
    }
    
    if (validTill) {
        const tillDate = new Date(validTill);
        tillDate.setHours(0, 0, 0, 0);
        return now <= tillDate ? "active" : "deactive";
    }
    
    return "deactive";
}

// -----------------------
// PRE SAVE
PackageSchema.pre("save", async function (next) {
  try {
    // Generate packageId
    if (!this.packageId) {
      const Package = mongoose.model("Package");
      const lastPackage = await Package.findOne({}).sort({ createdAt: -1 });

      let nextNumber = 1;
      if (lastPackage?.packageId) {
        const lastNumber = parseInt(lastPackage.packageId.split("_").pop());
        nextNumber = lastNumber + 1;
      }

      this.packageId = `IY_PCK_${String(nextNumber).padStart(3, "0")}`;
    }

    // ✅ Auto set Domestic / International
    if (this.destinationCountry?.toLowerCase() === "india") {
      this.tourType = "Domestic";
      this.destinationCountry = "India";
    } else {
      this.tourType = "International";
    }

    // Auto status
    this.status = calculateStatus(this.validFrom, this.validTill);

    next();
  } catch (err) {
    next(err);
  }
});

// -----------------------
// PRE UPDATE
PackageSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Auto detect Domestic / International
  if (update.destinationCountry) {
    if (update.destinationCountry.toLowerCase() === "india") {
      update.tourType = "Domestic";
      update.destinationCountry = "India";
    } else {
      update.tourType = "International";
    }
  }

  // Auto status
  if (update.validFrom || update.validTill) {
    update.status = calculateStatus(
      update.validFrom,
      update.validTill
    );
  }

  next();
});

const Package = mongoose.model("Package", PackageSchema);
export default Package;
