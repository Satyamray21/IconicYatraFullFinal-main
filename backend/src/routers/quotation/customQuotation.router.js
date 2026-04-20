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

router.post("/", requirePermission("canCreateBooking"), createCustomQuotation);
router.get("/", requirePermission("canAccessBookings"), getAllCustomQuotations);

router.post(
    "/update-step",
    requirePermission("canEditBooking"),
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "itineraryImages", maxCount: 20 },
    ]),
    updateQuotationStep
);

router.patch("/:quotationId/finalize", requirePermission("canEditBooking"), finalizeCustomQuotation);
router.patch("/:quotationId/package-calculations", requirePermission("canEditBooking"), updatePackageCalculations);
router.post("/:quotationId/email/preview", requirePermission("canEditBooking"), previewCustomQuotationMail);
router.post("/:quotationId/email/send", requirePermission("canEditBooking"), sendCustomQuotationMail);
router.get("/:quotationId", requirePermission("canAccessBookings"), getCustomQuotationById);
router.put("/quotation/:quotationId", requirePermission("canEditBooking"), updateCustomQuotationByQuotationId);
router.put("/:id", requirePermission("canEditBooking"), updateCustomQuotation);
router.delete("/:id", requirePermission("canDeleteBooking"), deleteCustomQuotation);

export default router;