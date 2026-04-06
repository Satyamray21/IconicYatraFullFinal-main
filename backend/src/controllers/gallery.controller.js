import Gallery from "../models/gallery.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

// ================================
// Upload Images
// ================================
export const uploadGalleryImages = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadedImages = [];

    for (const file of req.files) {

      const result = await uploadOnCloudinary(file.path);

      if (!result) {
        return res.status(500).json({ message: "Cloudinary upload failed" });
      }

      const newImage = await Gallery.create({
        public_id: result.public_id,
        url: result.secure_url,
      });

      uploadedImages.push(newImage);
    }

    res.status(201).json({
      message: "Images uploaded successfully",
      data: uploadedImages,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// ================================
// Get All Images
// ================================
export const getAllGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch images" });
  }
};

// ================================
// Delete Image (FIXED)
// ================================
export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from Cloudinary
    const cloudResponse = await cloudinary.uploader.destroy(
      image.public_id
    );

    if (cloudResponse.result !== "ok") {
      return res.status(400).json({
        message: "Cloudinary delete failed",
        cloudResponse,
      });
    }

    // Delete from DB
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({ message: "Image deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};
