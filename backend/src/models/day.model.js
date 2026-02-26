import mongoose from "mongoose";

export const DaySchema = new mongoose.Schema(
    {
        title: { type: String, default: "" },
        notes: { type: String, default: "" },
        aboutCity: { type: String, default: "" },
        dayImage: { type: String, default: "" },
        sightseeing: [{ type: String }],
        selectedSightseeing: [{ type: String }]
    },
    { timestamps: true }
);

// ✅ Create Model
const Day = mongoose.model("Day", DaySchema);

export default Day;
