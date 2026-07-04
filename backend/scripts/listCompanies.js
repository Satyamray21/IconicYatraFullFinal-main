import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "../src/DB/index.js";

const run = async () => {
    try {
        await connectDB();
        const companies = await mongoose.connection.collection("companies").find().toArray();
        console.log("Companies found in database:");
        companies.forEach(c => {
            console.log(`- Name: "${c.companyName}" (ID: ${c._id})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
