// controllers/homePage.controller.js
import HomePage from "../models/homePage.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

export const saveHomePage = async (req, res) => {
  try {
    console.log("Files received:", req.files); // Debug log
    console.log("Body data:", req.body.data); // Debug log

    const body = JSON.parse(req.body.data);

    // ================= Upload Hero Images =================
    const slides = await Promise.all(
      body.heroSlider.slides.map(async (slide, index) => {
        let uploadedImage = null;
        
        // Find the file for this slide
        const fileField = `slide_${index}`;
        const file = req.files?.find(f => f.fieldname === fileField);
        
        if (file) {
          try {
            console.log(`Uploading slide ${index} image:`, file.originalname);
            const uploadRes = await uploadOnCloudinary(file.path, file.mimetype);
            uploadedImage = uploadRes?.secure_url;
            console.log(`Upload successful: ${uploadedImage}`);
            
            // Clean up temp file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (uploadError) {
            console.error(`Failed to upload slide ${index}:`, uploadError);
          }
        }

        return {
          image: uploadedImage || slide.image,
          imageName: slide.imageName,
          title: slide.content.title,
          duration: slide.content.duration,
          buttonText: slide.content.buttonText,
        };
      })
    );

    // ================= Upload Feature Icons =================
    const features = await Promise.all(
      body.whyChooseUs.features.map(async (feature, index) => {
        let uploadedIcon = null;
        
        const fileField = `feature_${index}`;
        const file = req.files?.find(f => f.fieldname === fileField);
        
        if (file) {
          try {
            console.log(`Uploading feature ${index} icon:`, file.originalname);
            const uploadRes = await uploadOnCloudinary(file.path, file.mimetype);
            uploadedIcon = uploadRes?.secure_url;
            
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (uploadError) {
            console.error(`Failed to upload feature ${index}:`, uploadError);
          }
        }

        return {
          title: feature.title,
          description: feature.description,
          icon: uploadedIcon || feature.icon,
          iconName: feature.iconName,
        };
      })
    );

    // ================= Upload Achievement Icons =================
    const achievements = await Promise.all(
      body.achievements.achievements.map(async (ach, index) => {
        let uploadedIcon = null;
        
        const fileField = `achievement_${index}`;
        const file = req.files?.find(f => f.fieldname === fileField);
        
        if (file) {
          try {
            console.log(`Uploading achievement ${index} icon:`, file.originalname);
            const uploadRes = await uploadOnCloudinary(file.path, file.mimetype);
            uploadedIcon = uploadRes?.secure_url;
            
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (uploadError) {
            console.error(`Failed to upload achievement ${index}:`, uploadError);
          }
        }

        return {
          value: ach.value,
          label: ach.label,
          icon: uploadedIcon || ach.icon,
          iconName: ach.iconName,
        };
      })
    );

    // ================= Save in DB =================
    const saved = await HomePage.findOneAndUpdate(
      {},
      {
        heroSlider: { slides },
        whyChooseUs: {
          mainDescription: body.whyChooseUs.mainDescription,
          features,
        },
        trustedAgency: {
          heading: "Most Trusted Travel Agency",
          description: body.trustedAgency.description,
        },
        achievements: {
          title: "Our Achievements",
          achievements,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Homepage saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
};

// ================= GET =================
export const getHomePage = async (req, res) => {
  try {
    const data = await HomePage.findOne();
    if (!data) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: "No data found" 
      });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};