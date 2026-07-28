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
    const invoices = await Invoice.find({});
    
    let fixedCount = 0;

    for (let inv of invoices) {
        let isCorrupted = false;
        if (!inv.items || inv.items.length === 0) continue;
        
        for (let item of inv.items) {
            let expectedBasePrice = 0;
            const withTax = inv.withTax !== undefined ? inv.withTax : true; 
            
            if (withTax) {
                expectedBasePrice = Number(((item.amount || 0) - (item.taxAmount || 0)).toFixed(2));
            } else {
                expectedBasePrice = Number(((item.price || 0) - (item.discount || 0)).toFixed(2));
            }
            
            const actualBasePrice = Number(item.basePrice || 0);
            if (Math.abs(actualBasePrice - expectedBasePrice) > 0.05) {
                isCorrupted = true;
                item.basePrice = expectedBasePrice; // <--- FIX APPLIED HERE
            }
        }
        
        if (isCorrupted) {
            // Recalculate invoiceValuePurchase (sum of basePrices)
            let newInvoiceValuePurchase = 0;
            for (let item of inv.items) {
                newInvoiceValuePurchase += Number(item.basePrice || 0);
            }
            inv.invoiceValuePurchase = Number(newInvoiceValuePurchase.toFixed(2));
            
            await inv.save();
            fixedCount++;
            console.log(`✅ Fixed Invoice: ${inv.invoiceNo}`);
        }
    }
    
    console.log(`\n======================================`);
    console.log(`Successfully fixed ${fixedCount} invoices in the database!`);
    console.log(`======================================\n`);
    process.exit(0);
}
run();
