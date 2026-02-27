import CompanyUI from "../models/companyUI.model.js";
import Bank from "../models/bankDetails.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const COMPANY_ID = new mongoose.Types.ObjectId(
  "000000000000000000000001"
);

// ============================================
// GET COMPANY
// ============================================
export const getCompany = async (req, res) => {
  try {
    const company = await CompanyUI.findById(COMPANY_ID);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const bankDetails = await Bank.find({
      accountHolderName: { $regex: "^Iconic Yatra$", $options: "i" },
    });

    res.json({
      company,
      bankDetails,
    });
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
      const company = await CompanyUI.findById(COMPANY_ID);
      const existingQrs = company?.qrCodes || [];
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
      const company = await CompanyUI.findById(COMPANY_ID);
      const existingTestimonials = company?.testimonials || [];
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
      const company = await CompanyUI.findById(COMPANY_ID);
      const existingTeam = company?.ourTeam || [];
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
    // VISION & MISSION
    // =====================================

    if (req.body.ourVision) {
      updateData.ourVision = req.body.ourVision;
    }

    if (req.body.ourMission) {
      updateData.ourMission = req.body.ourMission;
    }

    // =====================================
    // UPSERT COMPANY
    // =====================================

    const company = await CompanyUI.findByIdAndUpdate(
      COMPANY_ID,
      { $set: updateData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
