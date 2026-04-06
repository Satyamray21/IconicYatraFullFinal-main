import express from "express";
import resumeUpload from "../middleware/resumeUpload.js";
import { handleMulterError } from "../middleware/fileUpload.js";
import {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
} from "../controllers/career.controller.js";

const router = express.Router();

// Submit Application
router.post(
  "/apply",
  resumeUpload.single("resume"),
  handleMulterError,
  submitApplication
);

// Admin
router.get("/all", getAllApplications);
router.put("/status/:id", updateApplicationStatus);

export default router;
