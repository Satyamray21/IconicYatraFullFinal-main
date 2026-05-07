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
    saveConfirmedHotels,
    sendHotelConfirmationMail,
    previewHotelConfirmation,
    getQuotationList,
} from "../../controllers/quotation/customQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = Router();

router.post("/", requirePermission("canCreateQuotation"), createCustomQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllCustomQuotations);
router.get("/list/search", requirePermission("canAccessQuotations"), getQuotationList);

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
router.post("/:id/save-confirmed-hotels", requirePermission("canEditQuotation"), saveConfirmedHotels);
router.post("/:id/email/hotel-confirmation", requirePermission("canEditQuotation"), sendHotelConfirmationMail);
router.post("/:id/email/hotel-confirmation/preview", requirePermission("canEditQuotation"), previewHotelConfirmation);
router.post("/:quotationId/email/preview", requirePermission("canEditQuotation"), previewCustomQuotationMail);
router.post("/:quotationId/email/send", requirePermission("canEditQuotation"), sendCustomQuotationMail);
router.get("/:quotationId", requirePermission("canAccessQuotations"), getCustomQuotationById);
router.put("/quotation/:quotationId", requirePermission("canEditQuotation"), updateCustomQuotationByQuotationId);
router.put("/:id", requirePermission("canEditQuotation"), updateCustomQuotation);
router.delete("/:id", requirePermission("canDeleteQuotation"), deleteCustomQuotation);

export default router;