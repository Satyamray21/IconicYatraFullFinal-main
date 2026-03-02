import mongoose from "mongoose";
import Package from "../src/models/package.model.js";

const MONGO_URI = "mongodb+srv://satyamray0651:Satyam123@cluster0.y7vezi8.mongodb.net/iconicYatra";

const updatePackages = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    // 🔍 STEP 1: Check existing tourType values
    const existing = await Package.find({}, { tourType: 1 });
    console.log("Existing tourType values:");
    console.log(existing);
    const count = await Package.countDocuments();
console.log("Total packages in DB:", count);

    // 🔥 STEP 2: Run update
    const result = await Package.updateMany(
      { tourType: { $in: ["Yatra", "Holiday", "Special", "Latest"] } },
      [
        {
          $set: {
            packageCategory: "$tourType",
            tourType: "Domestic",
            destinationCountry: "India",
          },
        },
      ]
    );

    console.log("Updated:", result.modifiedCount);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updatePackages();
