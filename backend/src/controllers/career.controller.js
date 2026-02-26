import Career from "../models/career.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";


// =============================
// 1️⃣ Submit Application
// =============================
export const submitApplication = async (req, res) => {
  try {
    const { name, mobile, email, subject } = req.body;

    // Basic validation
    if (!name || !mobile || !email || !subject) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume is required",
      });
    }

    // Upload resume to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

    if (!cloudinaryResponse) {
      return res.status(500).json({
        success: false,
        message: "Resume upload failed",
      });
    }

    const application = await Career.create({
      name,
      mobile,
      email,
      subject,
      resume: {
        url: cloudinaryResponse.secure_url,
        public_id: cloudinaryResponse.public_id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// 2️⃣ Get All Applications
// (With Optional Status Filter)
// =============================
export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = status ? { status } : {};

    const applications = await Career.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// 3️⃣ Get Single Application
// =============================
export const getSingleApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Career.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// 4️⃣ Update Application Status
// =============================
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Applied",
      "Interview Scheduled",
      "Rejected",
      "Selected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updatedApplication = await Career.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updatedApplication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =============================
// 5️⃣ Delete Application
// (Also delete resume from Cloudinary)
// =============================
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Career.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Delete resume from Cloudinary
    if (application.resume?.public_id) {
      await cloudinary.uploader.destroy(application.resume.public_id);
    }

    await Career.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
