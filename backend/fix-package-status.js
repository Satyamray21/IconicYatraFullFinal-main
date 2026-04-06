// fix-package-status.js
import mongoose from "mongoose";
import Package from "./src/models/package.model.js";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = "mongodb+srv://satyamray0651:Satyam123@cluster0.y7vezi8.mongodb.net/iconicYatra";
async function fixPackageStatus() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Get all packages
        const packages = await Package.find({});
        console.log(`Found ${packages.length} packages to check`);

        let updated = 0;

        for (const pkg of packages) {
            let correctStatus = "deactive";
            
            if (pkg.validFrom && pkg.validTill) {
                const fromDate = new Date(pkg.validFrom);
                const tillDate = new Date(pkg.validTill);
                
                fromDate.setHours(0, 0, 0, 0);
                tillDate.setHours(0, 0, 0, 0);
                
                correctStatus = (now >= fromDate && now <= tillDate) ? "active" : "deactive";
            } else if (pkg.validFrom) {
                const fromDate = new Date(pkg.validFrom);
                fromDate.setHours(0, 0, 0, 0);
                correctStatus = now >= fromDate ? "active" : "deactive";
            } else if (pkg.validTill) {
                const tillDate = new Date(pkg.validTill);
                tillDate.setHours(0, 0, 0, 0);
                correctStatus = now <= tillDate ? "active" : "deactive";
            }

            // Update if status is wrong
            if (pkg.status !== correctStatus) {
                pkg.status = correctStatus;
                await pkg.save();
                updated++;
                console.log(`Updated package ${pkg.packageId}: ${pkg.status}`);
            }
        }

        console.log(`\n✅ Updated ${updated} packages with correct status`);
        console.log(`Current date: ${now.toDateString()}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

fixPackageStatus();