import express from "express";
import {
  createAssociate,
  getAllAssociates,
  getAssociateById,
  updateAssociate,
  deleteAssociate,
} from "../controllers/associates.controller.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer config for QR code upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "qr-" + uniqueSuffix + fileExtension);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post("/", upload.single("qrCode"), createAssociate);
router.get("/", getAllAssociates);
router.get("/:id", getAssociateById);
router.put("/:id", upload.single("qrCode"), updateAssociate);
router.delete("/:id", deleteAssociate);

export default router;
