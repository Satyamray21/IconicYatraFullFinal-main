import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
    hotelId: { type: String, unique: true },

    // Step 1 - Basic Details
    hotelName: { type: String, required: true },
    hotelType: { type: [String] },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Inactive",
    },

    // Step 1 - Contact Details
    contactDetails: {
        email: { type: String },
        mobile: { type: String },
        alternateContact: { type: String },
        designation: { type: String },
        contactPerson: { type: String },
    },
    description: { type: String },
    cancellationPolicy: { type: String },

    // Step 1 - Facilities & Images
    facilities: [{ type: String }],
    mainImage: { type: String },

    // Step 1 - Location
    location: {
        country: { type: String, default: "India" },
        state: { type: String },
        city: { type: String },
        address: { type: String },
        pincode: { type: String },
    },

    // Step 1 - Social Media
    socialMedia: {
        googleLink: { type: String },
    },
    policy: { type: String },

    // Step 2 - Room Details (Temporary storage during form filling)
    tempRoomDetails: [{
        seasonType: { type: String },
        validFrom: { type: Date },
        validTill: { type: Date },
        roomDetails: [{
            roomType: { type: String }, // Single type for now
            ep: { type: Number },
            cp: { type: Number },
            map: { type: Number },
            ap: { type: Number },
            images: [{ type: String }]
        }]
    }],

    // Step 3 - Mattress Cost (Temporary)
    tempMattressCost: [{
        roomType: { type: String },
        mealPlan: { type: String, enum: ["EP", "CP", "MAP", "AP"] },
        adult: { type: Number },
        children: { type: Number },
        kidWithoutMattress: { type: Number },
    }],

    // Step 4 - Peak Cost (Temporary)
    tempPeakCost: [{
        roomType: { type: String },
        title: { type: String },
        validFrom: { type: Date },
        validTill: { type: Date },
        surcharge: { type: Number },
        note: { type: String },
    }],

    // Final rooms structure after all steps completed
    rooms: [{
        seasonType: { type: String },
        validFrom: { type: Date },
        validTill: { type: Date },
        roomDetails: [{
            roomType: { type: String },
            mealPlan: { type: String, enum: ["EP", "CP", "MAP", "AP"] },
            images: [{ type: String }],
            mattressCost: {
                mealPlan: { type: String, enum: ["EP", "CP", "MAP", "AP"] },
                adult: { type: Number },
                children: { type: Number },
                kidWithoutMattress: { type: Number },
            },
            peakCost: [{
                title: { type: String },
                validFrom: { type: Date },
                validTill: { type: Date },
                surcharge: { type: Number },
                note: { type: String },
            }],
        }],
    }],

    // Track form completion
    formCompleted: { type: Boolean, default: false }
});

// 🔹 Auto-generate hotelId before saving
hotelSchema.pre("save", async function (next) {
    if (this.isNew) {
        const lastHotel = await mongoose.model("Hotel").findOne().sort({ hotelId: -1 });
        let nextNumber = 1;
        if (lastHotel && lastHotel.hotelId) {
            const lastNumber = parseInt(lastHotel.hotelId.replace("ICYR_HT", ""));
            nextNumber = lastNumber + 1;
        }
        this.hotelId = `ICYR_HT${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

export default mongoose.model("Hotel", hotelSchema);