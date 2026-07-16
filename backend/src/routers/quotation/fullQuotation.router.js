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
    updateFullQuotation,
} from "../../controllers/quotation/fullQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";
const router = express.Router();
router.post("/step1", requirePermission("canCreateQuotation"), upload.single("bannerImage"), createOrResumeStep1);
router.put("/step2/:quotationId", requirePermission("canEditQuotation"), updateStep2);
router.put("/step3/:quotationId", requirePermission("canEditQuotation"), upload.array("images"), updateStep3);
router.put("/step4/:quotationId", requirePermission("canEditQuotation"), updateStep4);
router.put("/step5/:quotationId", requirePermission("canEditQuotation"), updateStep5);
router.put("/step6/:quotationId", requirePermission("canEditQuotation"), updateStep6);
router.put("/finalize/:quotationId", requirePermission("canEditQuotation"), finalizeQuotation);
router.get("/:quotationId", requirePermission("canAccessQuotations"), getQuotationById);
router.put("/:quotationId", requirePermission("canEditQuotation"), updateFullQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllQuotations);
export default router;