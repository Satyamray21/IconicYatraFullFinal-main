import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "../src/DB/index.js";
import { CustomQuotation } from "../src/models/quotation/customQuotation.model.js";
import QuickQuotation from "../src/models/quotation/quickQuotation.model.js";
import { FlightQuotation } from "../src/models/quotation/flightQuotation.model.js";
import { Vehicle } from "../src/models/quotation/vehicle.model.js";

const run = async () => {
    try {
        await connectDB();
        
        const models = [
            { name: "CustomQuotation", model: CustomQuotation },
            { name: "QuickQuotation", model: QuickQuotation },
            { name: "FlightQuotation", model: FlightQuotation },
            { name: "Vehicle", model: Vehicle }
        ];

        console.log("Searching for booking IDs containing 'ITRK'...");
        for (const { name, model } of models) {
            const records = await model.find({ bookingId: /ITRK/i }).lean();
            if (records.length > 0) {
                console.log(`\n--- ${name} ---`);
                records.forEach(r => {
                    console.log(`- Booking ID: ${r.bookingId} (ID: ${r._id})`);
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
