import express from "express";
import {upload} from "../middleware/imageMulter.middleware.js";
import {
  uploadGalleryImages,
  getAllGalleryImages,
  deleteGalleryImage,
} from "../controllers/gallery.controller.js";
import { verifyToken } from "../middleware/user.middleware.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/upload", verifyToken, requirePermission("canEditGallery"), upload.array("gallery", 50), uploadGalleryImages);
router.get("/", getAllGalleryImages);
router.delete("/:id", verifyToken, requirePermission("canEditGallery"), deleteGalleryImage);

export default router;
