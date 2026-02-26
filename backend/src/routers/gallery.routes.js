import express from "express";
import {upload} from "../middleware/imageMulter.middleware.js";
import {
  uploadGalleryImages,
  getAllGalleryImages,
  deleteGalleryImage,
} from "../controllers/gallery.controller.js";

const router = express.Router();

router.post("/upload", upload.array("gallery", 50), uploadGalleryImages);
router.get("/", getAllGalleryImages);
router.delete("/:id", deleteGalleryImage);

export default router;
