import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import mongoose from "mongoose";
import Invoice from "../src/models/invoice.model.js";
import connectDB from "../src/DB/index.js";

async function run() {
    await connectDB();
    const inv = await Invoice.findById("6a4cf121a6b407ff2f7a6499");
    console.log(`\n======================================`);
    if (inv) {
        console.log("Found invoice:", inv.invoiceNo);
        console.log(JSON.stringify(inv.items, null, 2));
    } else {
        console.log("Invoice 6a4cf121a6b407ff2f7a6499 not found.");
    }
    console.log(`======================================\n`);
    process.exit(0);
}
run();
