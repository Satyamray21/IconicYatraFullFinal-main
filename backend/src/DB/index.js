import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { tenantIsolationPlugin } from "../plugins/tenant.plugin.js";

// Register the global SaaS Tenant Isolation Plugin!
mongoose.plugin(tenantIsolationPlugin);

const connectDB = async () => {
    try {
        const connectionInstances = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`DB IS CONNECTED ${connectionInstances.connection.host}`);
        
        // --- MULTI-TENANT AUTO MIGRATION ---
        // Ensure the Master Superadmin Tenant exists in the database
        const { default: Company } = await import("../models/company.model.js");
        const existingCompanies = await Company.find({});
        if (existingCompanies.length > 0) {
            const hasMaster = existingCompanies.some(c => c.domain === "iconicyatra.com");
            if (!hasMaster) {
                console.log("Upgrading existing primary company to Master Tenant (iconicyatra.com)...");
                const primaryCompany = existingCompanies[0];
                primaryCompany.domain = "iconicyatra.com";
                await primaryCompany.save();
            }
        } else {
            console.log("No companies found. Creating Master Tenant (iconicyatra.com)...");
            await Company.create({
                companyName: "Iconic Yatra",
                domain: "iconicyatra.com",
                address: "HQ"
            });
        }
        // ------------------------------------

        // Drop stale unique index on "name" in counters collection if it exists.
        // This index causes E11000 "Name already exists" during bookingId generation
        // when multiple counter docs have name=null.
        try {
            const countersCol = connectionInstances.connection.collection("counters");
            const indexes = await countersCol.indexes();
            const staleIdx = indexes.find(
                (idx) => idx.key && idx.key.name !== undefined && idx.unique
            );
            if (staleIdx) {
                await countersCol.dropIndex(staleIdx.name);
                console.log(`Dropped stale unique index "${staleIdx.name}" on counters.name`);
            }
        } catch (idxErr) {
            // Silently ignore – index may not exist or collection may not exist yet
            if (idxErr.codeName !== "NamespaceNotFound" && idxErr.codeName !== "IndexNotFound") {
                console.warn("Could not check/drop counters.name index:", idxErr.message);
            }
        }
    }
    catch (err) {
        console.log('DB connection failed ', err.message);
        process.exit(1);
    }
}
export default connectDB;