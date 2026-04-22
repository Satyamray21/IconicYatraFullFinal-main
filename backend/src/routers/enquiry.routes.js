import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  deleteMultipleEnquiries,
} from "../controllers/enquiry.controller.js";

const router = express.Router();

router.post("/create", createEnquiry);
router.get("/admin/enquiries", getAllEnquiries);
router.patch("/admin/enquiry/:id", updateEnquiryStatus);
router.delete("/enquiry/:id", deleteEnquiry);
router.post("/enquiry/delete-multiple", deleteMultipleEnquiries);

export default router;
