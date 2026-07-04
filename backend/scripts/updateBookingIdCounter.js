import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "../src/DB/index.js";
import { Counter } from "../src/models/Counter.js";

const run = async () => {
    try {
        await connectDB();
        console.log("Connected to database");

        // Set sequence to 19672 for bookingId_ITRK
        const counter = await Counter.findOneAndUpdate(
            { id: "bookingId_ITRK" },
            { $set: { seq: 19672 } },
            { upsert: true, new: true }
        );

        console.log(`\n✅ Updated counter sequence for bookingId_ITRK. Current seq: ${counter.seq}`);
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
};

run();
