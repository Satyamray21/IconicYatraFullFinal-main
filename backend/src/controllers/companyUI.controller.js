import CompanyUI from "../models/companyUI.model.js";
import Company from "../models/company.model.js";
import Bank from "../models/bankDetails.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { getCache, setCache, deleteCache } from "../utils/cache.js";

import { tenantContext } from "../utils/tenantContext.js";

// We no longer use a hardcoded COMPANY_ID, we fetch for the specific tenant!

// ============================================
// GET COMPANY
// ============================================
export const getCompany = async (req, res) => {
  try {
    const companyId = tenantContext.getStore();
    const cacheKey = `company:ui:data:${companyId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Cache Hit] Company UI data fetched from Redis: ${cacheKey}`);
      return res.json({ fromCache: true, ...cachedData });
    }

    console.log(`[Cache Miss] Company UI data fetched from MongoDB: ${cacheKey}`);
    // tenantIsolationPlugin will automatically filter by companyId
    const company = await CompanyUI.findOne();

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // tenantIsolationPlugin automatically filters Banks by companyId
    const bankDetails = await Bank.find();

    const baseCompany = await Company.findById(companyId);

    const responseData = {
      company,
      baseCompany,
      bankDetails,
    };

    await setCache(cacheKey, responseData, 1296000); // Cache for 15 days
    res.json({ fromCache: false, ...responseData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPSERT COMPANY
// ============================================
export const upsertCompany = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // =====================================
    // FIRST, GET THE EXISTING COMPANY DATA
    // =====================================
    // tenantIsolationPlugin will automatically filter by companyId
    const existingCompany = await CompanyUI.findOne();

    // =====================================
    // SINGLE IMAGE UPLOADS
    // =====================================

    if (req.files?.headerLogo) {
      const result = await uploadOnCloudinary(req.files.headerLogo[0].path);
      updateData.headerLogo = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    if (req.files?.footerLogo) {
      const result = await uploadOnCloudinary(req.files.footerLogo[0].path);
      updateData.footerLogo = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    if (req.files?.signature) {
      const result = await uploadOnCloudinary(req.files.signature[0].path);
      updateData.signature = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    // =====================================
    // MULTIPLE QR UPLOAD (APPEND MODE)
    // =====================================

    if (req.files?.qrCodes) {
      const existingQrs = existingCompany?.qrCodes || [];
      const newQrs = [];

      for (let i = 0; i < req.files.qrCodes.length; i++) {
        const file = req.files.qrCodes[i];
        const result = await uploadOnCloudinary(file.path);

        newQrs.push({
          name: req.body.qrNames?.[i] || "QR Code",
          color: req.body.qrColors?.[i] || "#000000",
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      updateData.qrCodes = [...existingQrs, ...newQrs];
    }

    // =====================================
    // TESTIMONIAL UPLOAD (APPEND MODE)
    // =====================================

    if (req.files?.testimonialPhotos) {
      const existingTestimonials = existingCompany?.testimonials || [];
      const newTestimonials = [];

      for (let i = 0; i < req.files.testimonialPhotos.length; i++) {
        const file = req.files.testimonialPhotos[i];
        const result = await uploadOnCloudinary(file.path);

        newTestimonials.push({
          name: req.body.testimonialNames?.[i] || "Customer",
          address: req.body.testimonialAddresses?.[i] || "",
          words: req.body.testimonialWords?.[i] || "",
          photo: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        });
      }

      updateData.testimonials = [
        ...existingTestimonials,
        ...newTestimonials,
      ];
    }

    // =====================================
    // OUR TEAM UPLOAD (APPEND MODE)
    // =====================================

    if (req.files?.teamPhotos) {
      const existingTeam = existingCompany?.ourTeam || [];
      const newTeamMembers = [];

      for (let i = 0; i < req.files.teamPhotos.length; i++) {
        const file = req.files.teamPhotos[i];
        const result = await uploadOnCloudinary(file.path);

        newTeamMembers.push({
          name: req.body.teamNames?.[i] || "Team Member",
          designation: req.body.teamDesignations?.[i] || "",
          description: req.body.teamDescriptions?.[i] || "",
          photo: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        });
      }

      updateData.ourTeam = [...existingTeam, ...newTeamMembers];
    }

    // =====================================
    // PARSE JSON STRINGS (IF SENT FROM FRONTEND)
    // =====================================

    if (req.body.testimonials && typeof req.body.testimonials === "string") {
      try {
        updateData.testimonials = JSON.parse(req.body.testimonials);
      } catch {
        return res.status(400).json({
          message: "Invalid testimonials JSON format",
        });
      }
    }

    if (req.body.ourTeam && typeof req.body.ourTeam === "string") {
      try {
        updateData.ourTeam = JSON.parse(req.body.ourTeam);
      } catch {
        return res.status(400).json({
          message: "Invalid ourTeam JSON format",
        });
      }
    }

    // =====================================
    // CRITICAL: PRESERVE EXISTING ABOUT US DATA
    // =====================================
    
    // Start with existing aboutUs data
    if (existingCompany?.aboutUs) {
      updateData.aboutUs = { ...existingCompany.aboutUs };
    } else {
      updateData.aboutUs = {};
    }

    // Handle aboutUs fields from frontend (aboutUs[title] format)
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('aboutUs[')) {
        const matches = key.match(/aboutUs\[(.*?)\]/);
        if (matches && matches[1]) {
          const fieldName = matches[1];
          
          // Map frontend field names to backend schema field names
          let backendFieldName = fieldName;
          
          // Map the field names if needed
          if (fieldName === 'bannerTitle') {
            backendFieldName = 'bannerImageTitle';
          } else if (fieldName === 'bannerDescription') {
            backendFieldName = 'bannerImageDescription';
          } else if (fieldName === 'visionTitle') {
            backendFieldName = 'ourVisionImageTitle';
          }
          
          updateData.aboutUs[backendFieldName] = req.body[key];
        }
      }
    });

    // Handle legacy aboutUs text fields
    if (req.body.aboutUsTitle) {
      updateData.aboutUs.title = req.body.aboutUsTitle;
    }

    // Handle direct field names from frontend
    if (req.body.bannerTitle) {
      updateData.aboutUs.bannerImageTitle = req.body.bannerTitle;
    }

    if (req.body.bannerDescription) {
      updateData.aboutUs.bannerImageDescription = req.body.bannerDescription;
    }

    if (req.body.visionTitle) {
      updateData.aboutUs.ourVisionImageTitle = req.body.visionTitle;
    }

    // =====================================
    // ABOUT US IMAGE UPLOADS
    // =====================================
    
    if (req.files?.aboutUsImage) {
      const result = await uploadOnCloudinary(req.files.aboutUsImage[0].path);
      updateData.aboutUs.aboutUsImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    if (req.files?.bannerImage) {
      const result = await uploadOnCloudinary(req.files.bannerImage[0].path);
      updateData.aboutUs.bannerImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    if (req.files?.ourVisionImage) {
      const result = await uploadOnCloudinary(req.files.ourVisionImage[0].path);
      updateData.aboutUs.ourVisionImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    // =====================================
    // VISION & MISSION
    // =====================================

    if (req.body.ourVision) {
      updateData.ourVision = req.body.ourVision;
    }

    if (req.body.ourMission) {
      updateData.ourMission = req.body.ourMission;
    }

    // =====================================
    // REMOVE ANY UNDEFINED FIELDS
    // =====================================
    
    // Clean up undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // =====================================
    // UPSERT COMPANY
    // =====================================

    const companyId = tenantContext.getStore();
    const company = await CompanyUI.findOneAndUpdate(
      { companyId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    await deleteCache(`company:ui:data:${companyId}`);
    res.json(company);
  } catch (error) {
    console.error("Error upserting company UI:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ============================================
// UPDATE SEO SETTINGS
// ============================================
export const updateSeoSettings = async (req, res) => {
  try {
    const companyId = tenantContext.getStore();
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized tenant" });

    const { seoTitle, seoDescription, seoKeywords } = req.body;
    let updateData = { seoTitle, seoDescription, seoKeywords };

    if (req.files?.favicon) {
      const result = await uploadOnCloudinary(req.files.favicon[0].path);
      if (result) {
        updateData.faviconUrl = result.secure_url;
      }
    }

    if (req.files?.ogImage) {
      const result = await uploadOnCloudinary(req.files.ogImage[0].path);
      if (result) {
        updateData.ogImageUrl = result.secure_url;
      }
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true }
    );

    await deleteCache(`company:ui:data:${companyId}`);

    res.status(200).json({
      success: true,
      message: "SEO Settings updated successfully",
      company
    });

  } catch (error) {
    console.error("Error updating SEO settings:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};