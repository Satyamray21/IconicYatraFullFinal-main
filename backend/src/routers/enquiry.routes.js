import express from "express";
import { createEnquiry,getAllEnquiries,updateEnquiryStatus } from "../controllers/enquiry.controller.js";

const router = express.Router();

router.post("/create", createEnquiry);
router.get("/admin/enquiries", getAllEnquiries);
router.patch("/admin/enquiry/:id", updateEnquiryStatus);

export default router;