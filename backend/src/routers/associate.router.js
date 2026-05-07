import express from "express";
import {
  createAssociate,
  getAllAssociates,
  getAssociateById,
  updateAssociate,
  deleteAssociate,
  getAssociateQuotations,
  getAssociateDashboardStats
} from "../controllers/associates.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();


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

router.post("/", requirePermission("canManageAssociates"), upload.single("qrCode"), createAssociate);
router.get("/", requirePermission("canAccessAssociates"), getAllAssociates);
router.get("/stats", requirePermission("canAccessAssociates"), getAssociateDashboardStats);
router.get("/:id", requirePermission("canAccessAssociates"), getAssociateById);
router.get(
  "/:id/quotations",
  requirePermission("canAccessAssociates"),
  getAssociateQuotations
);
router.put("/:id", requirePermission("canManageAssociates"), upload.single("qrCode"), updateAssociate);
router.delete("/:id", requirePermission("canManageAssociates"), deleteAssociate);

export default router;
