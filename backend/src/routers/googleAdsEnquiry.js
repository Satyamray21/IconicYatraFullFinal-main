import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus
} from "../controllers/googleAdsEnquiry.js";

const router = express.Router();

router.post("/", createEnquiry);

router.get("/", getAllEnquiries);

router.patch("/:id/status", updateEnquiryStatus);

export default router;
