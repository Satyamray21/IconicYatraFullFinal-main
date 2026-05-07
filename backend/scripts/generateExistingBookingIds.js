import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "../src/DB/index.js";
import { generateBookingId } from "../src/utils/bookingIdGenerator.js";
import { CustomQuotation } from "../src/models/quotation/customQuotation.model.js";
import QuickQuotation from "../src/models/quotation/quickQuotation.model.js";
import { FlightQuotation } from "../src/models/quotation/flightQuotation.model.js";
import { Vehicle } from "../src/models/quotation/vehicle.model.js";

/**
 * Migration script to generate bookingId for existing confirmed/finalized quotations.
 */
const migrate = async () => {
    try {
        await connectDB();
        console.log("Connected to database");

        const models = [
            { 
                name: "CustomQuotation", 
                model: CustomQuotation, 
                query: { finalizeStatus: "finalized", bookingId: { $not: { $type: "string" } } } 
            },
            { 
                name: "QuickQuotation", 
                model: QuickQuotation, 
                query: { finalizeStatus: "finalized", bookingId: { $not: { $type: "string" } } } 
            },
            { 
                name: "FlightQuotation", 
                model: FlightQuotation, 
                query: { status: "Confirmed", bookingId: { $not: { $type: "string" } } } 
            },
            { 
                name: "Vehicle", 
                model: Vehicle, 
                query: { finalizeStatus: "finalized", bookingId: { $not: { $type: "string" } } } 
            }
        ];

        for (const { name, model, query } of models) {
            const records = await model.find(query).sort({ createdAt: 1 });
            console.log(`\nProcessing ${records.length} ${name} records...`);

            for (const record of records) {
                // Get company name - default to Iconic Travel if missing
                const companyName = record.companyName || "Iconic Travel";
                const bookingId = await generateBookingId(companyName);
                
                // Direct update to avoid potential validation issues on old records
                await model.updateOne({ _id: record._id }, { $set: { bookingId: bookingId } });
                
                console.log(`✅ Generated ${bookingId} for ${name} (ID: ${record._id})`);
            }
        }

        console.log("\n✨ Migration completed successfully");
    } catch (error) {
        console.error("\n❌ Migration failed", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database");
        process.exit(0);
    }
};

migrate();
