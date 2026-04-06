import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, mimetype) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.log("No file found at:", localFilePath);
      return null;
    }

    const resourceType = mimetype === "application/pdf" ? "raw" : "image";

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
    });

    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    console.error("Upload error:", error.message);

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};



export { uploadOnCloudinary };