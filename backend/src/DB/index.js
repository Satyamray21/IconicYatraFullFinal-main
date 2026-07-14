import mongoose from "mongoose";
import { tenantIsolationPlugin } from "../plugins/tenant.plugin.js";

// Register the global SaaS Tenant Isolation Plugin!
mongoose.plugin(tenantIsolationPlugin);

const connectDB = async () => {
    try {
        // Connect exactly to the URL in .env, allowing you to easily change databases!
        const connectionInstances = await mongoose.connect(process.env.MONGODB_URL)
        console.log(`DB IS CONNECTED to Host: ${connectionInstances.connection.host}, Database Name: [${connectionInstances.connection.name}]`);
        
        // --- MULTI-TENANT AUTO MIGRATION ---
        // Ensure the Master Superadmin Tenant exists in the database
        const { default: Company } = await import("../models/company.model.js");
        const existingCompanies = await Company.find({});
        let masterCompany;
        
        if (existingCompanies.length > 0) {
            masterCompany = existingCompanies.find(c => c.domain === "iconicyatra.com");
            if (!masterCompany) {
                console.log("Upgrading existing primary company to Master Tenant (iconicyatra.com)...");
                masterCompany = existingCompanies[0];
                masterCompany.domain = "iconicyatra.com";
                await masterCompany.save();
            }
        } else {
            console.log("No companies found. Creating Master Tenant (iconicyatra.com)...");
            masterCompany = await Company.create({
                companyName: "Iconic Yatra",
                domain: "iconicyatra.com",
                address: "HQ"
            });
        }
        
        // Migrate ALL historical data to the Master Tenant
        if (masterCompany) {
            for (const modelName in mongoose.models) {
                const Model = mongoose.models[modelName];
                if (Model.schema.path('companyId')) {
                    try {
                        const result = await Model.updateMany(
                            { companyId: { $exists: false } },
                            { $set: { companyId: masterCompany._id } }
                        );
                        if (result.modifiedCount > 0) {
                            console.log(`Migrated ${result.modifiedCount} historical records in ${modelName} to Master Tenant`);
                        }
                    } catch (e) {
                        console.error(`Error migrating ${modelName}:`, e.message);
                    }
                }
            }
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