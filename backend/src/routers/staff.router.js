import express from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} from "../controllers/staff.controller.js";
import {upload} from "../middleware/imageMulter.middleware.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

const staffUploadFields = upload.fields([
  { name: "staffPhoto", maxCount: 1 },
  { name: "aadharPhoto", maxCount: 1 },
  { name: "panPhoto", maxCount: 1 },
]);

router.post(
  "/",
  requirePermission("canManageStaff"),
  staffUploadFields,
  createStaff
);
router.get("/", requirePermission("canAccessStaff"), getAllStaff);
router.get("/:id", requirePermission("canAccessStaff"), getStaffById);
router.put(
  "/:id",
  requirePermission("canManageStaff"),
  staffUploadFields,
  updateStaff
);
router.delete("/:id", requirePermission("canManageStaff"), deleteStaff);

export default router;
