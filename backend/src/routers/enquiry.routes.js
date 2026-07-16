import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  deleteMultipleEnquiries,
} from "../controllers/enquiry.controller.js";

import { requirePermission } from "../middleware/staffPermission.middleware.js";
import { verifyToken } from "../middleware/user.middleware.js";

const router = express.Router();

router.post("/create", createEnquiry);

// Admin routes (Protected)
router.get("/admin/enquiries", verifyToken, requirePermission("canAccessEnquiries"), getAllEnquiries);
router.patch("/admin/enquiry/:id", verifyToken, requirePermission("canManageEnquiries"), updateEnquiryStatus);
router.delete("/enquiry/:id", verifyToken, requirePermission("canManageEnquiries"), deleteEnquiry);
router.post("/enquiry/delete-multiple", verifyToken, requirePermission("canManageEnquiries"), deleteMultipleEnquiries);

export default router;
