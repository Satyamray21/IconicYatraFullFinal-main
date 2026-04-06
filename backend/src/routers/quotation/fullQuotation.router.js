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
const router = express.Router();
router.post("/step1", upload.single("bannerImage"), createOrResumeStep1);
router.put("/step2/:quotationId", updateStep2);
router.put("/step3/:quotationId", upload.array("images"), updateStep3);
router.put("/step4/:quotationId", updateStep4);
router.put("/step5/:quotationId", updateStep5);
router.put("/step6/:quotationId", updateStep6);
router.put("/finalize/:quotationId", finalizeQuotation);
router.get("/:quotationId", getQuotationById);
router.get("/", getAllQuotations);
export default router;