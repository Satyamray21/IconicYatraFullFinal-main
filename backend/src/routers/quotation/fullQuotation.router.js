import express from "express";
import multer from "multer";
import {
    createOrResumeStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    updateStep5,
    updateStep6,
    finalizeQuotation,
    getQuotationById,
    getAllQuotations,
} from "../../controllers/quotation/fullQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";
const router = express.Router();
router.post("/step1", requirePermission("canCreateBooking"), upload.single("bannerImage"), createOrResumeStep1);
router.put("/step2/:quotationId", requirePermission("canEditBooking"), updateStep2);
router.put("/step3/:quotationId", requirePermission("canEditBooking"), upload.array("images"), updateStep3);
router.put("/step4/:quotationId", requirePermission("canEditBooking"), updateStep4);
router.put("/step5/:quotationId", requirePermission("canEditBooking"), updateStep5);
router.put("/step6/:quotationId", requirePermission("canEditBooking"), updateStep6);
router.put("/finalize/:quotationId", requirePermission("canEditBooking"), finalizeQuotation);
router.get("/:quotationId", requirePermission("canAccessBookings"), getQuotationById);
router.get("/", requirePermission("canAccessBookings"), getAllQuotations);
export default router;