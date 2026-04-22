import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  deleteMultipleEnquiries,
} from "../controllers/googleAdsEnquiry.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/", createEnquiry);

/* ================= GET ================= */
router.get("/", getAllEnquiries);

/* ================= UPDATE STATUS ================= */
router.patch("/:id/status", updateEnquiryStatus);

/* ================= DELETE SINGLE ================= */
router.delete("/:id", deleteEnquiry);

/* ================= DELETE MULTIPLE ================= */
router.post("/delete-multiple", deleteMultipleEnquiries);

export default router;
