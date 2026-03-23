import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, folder = 'travel-blogs') => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            console.log("No file found at:", localFilePath);
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: folder,
            resource_type: "auto",
            transformation: [
                { quality: "auto" },
                { fetch_format: "auto" }
            ]
        });

        // Delete local file after upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return {
            url: response.secure_url,
            publicId: response.public_id
        };

    } catch (error) {
        console.error("Cloudinary upload error:", error.message);

        // Clean up local file if upload fails
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error.message);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };