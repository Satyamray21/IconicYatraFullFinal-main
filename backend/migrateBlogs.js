import mongoose from "mongoose";
import Blog from "./src/models/Blog.model.js";

const MONGO_URI = "mongodb+srv://satyamray0651:Satyam123@cluster0.y7vezi8.mongodb.net/iconicYatra";



const migrateBlogs = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    const blogs = await Blog.find();

    for (const blog of blogs) {
      let updatedFields = {};

      // ✅ FIX CATEGORY
      if (!["Domestic", "International"].includes(blog.category)) {
        updatedFields.category = "Domestic";
      }

      // ✅ FIX SUBCATEGORY
      if (
        !blog.subCategory ||
        ![
          "Hill Stations",
          "Beach Destinations",
          "Cultural Tours",
          "Adventure Travel",
          "Honeymoon Packages",
          "Family Tours",
          "Luxury Travel",
          "Wildlife Safari",
          "Religious Tours",
        ].includes(blog.subCategory)
      ) {
        // 🔥 If old category was actually subCategory → move it
        if (
          [
            "Hill Stations",
            "Beach Destinations",
            "Cultural Tours",
            "Adventure Travel",
            "Honeymoon Packages",
            "Family Tours",
          ].includes(blog.category)
        ) {
          updatedFields.subCategory = blog.category;
          updatedFields.category = "Domestic";
        } else {
          updatedFields.subCategory = "Hill Stations"; // fallback
        }
      }

      await Blog.updateOne({ _id: blog._id }, { $set: updatedFields });
    }

    console.log("✅ Migration completed successfully");
    process.exit();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrateBlogs();

