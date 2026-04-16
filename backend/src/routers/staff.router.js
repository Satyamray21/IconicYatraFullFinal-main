import express from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} from "../controllers/staff.controller.js";
import {upload} from "../middleware/imageMulter.middleware.js";
const router = express.Router();

router.post(
  "/", 
  upload.fields([
    { name: 'staffPhoto', maxCount: 1 },
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 }
  ]), 
  createStaff
);
router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.put(
  "/:id",
  upload.fields([
    { name: 'staffPhoto', maxCount: 1 },
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 }
  ]), 
  updateStaff
);
router.delete("/:id", deleteStaff);

export default router;
