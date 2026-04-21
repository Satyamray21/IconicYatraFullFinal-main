import express from "express";
import {
  getCompany,
  upsertCompany,
} from "../controllers/companyUI.controller.js";
import { upload } from "../middleware/imageMulter.middleware.js";

const router = express.Router();

router.get("/", getCompany);

router.put(
  "/",
  upload.fields([
    { name: "headerLogo", maxCount: 1 },
    { name: "footerLogo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "qrCodes", maxCount: 10 },
    { name: "aboutUsImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "ourVisionImage", maxCount: 1 },
    { name: "testimonialPhotos", maxCount: 10 },
    { name: "teamPhotos", maxCount: 10 }, // ✅ multiple QR
  ]),
  upsertCompany,
);

export default router;
