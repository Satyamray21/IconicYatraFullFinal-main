import { Router } from "express";
import {
    createCustomQuotation,
    getAllCustomQuotations,
    getCustomQuotationById,
    updateCustomQuotation,
    updateCustomQuotationByQuotationId,
    deleteCustomQuotation,
    updateQuotationStep,
    finalizeCustomQuotation,
    updatePackageCalculations,
    previewCustomQuotationMail,
    sendCustomQuotationMail,
} from "../../controllers/quotation/customQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = Router();

router.post("/", requirePermission("canCreateQuotation"), createCustomQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllCustomQuotations);

router.post(
    "/update-step",
    requirePermission("canEditQuotation"),
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "itineraryImages", maxCount: 20 },
    ]),
    updateQuotationStep
);

router.patch("/:quotationId/finalize", requirePermission("canEditQuotation"), finalizeCustomQuotation);
router.patch("/:quotationId/package-calculations", requirePermission("canEditQuotation"), updatePackageCalculations);
router.post("/:quotationId/email/preview", requirePermission("canEditQuotation"), previewCustomQuotationMail);
router.post("/:quotationId/email/send", requirePermission("canEditQuotation"), sendCustomQuotationMail);
router.get("/:quotationId", requirePermission("canAccessQuotations"), getCustomQuotationById);
router.put("/quotation/:quotationId", requirePermission("canEditQuotation"), updateCustomQuotationByQuotationId);
router.put("/:id", requirePermission("canEditQuotation"), updateCustomQuotation);
router.delete("/:id", requirePermission("canDeleteQuotation"), deleteCustomQuotation);

export default router;