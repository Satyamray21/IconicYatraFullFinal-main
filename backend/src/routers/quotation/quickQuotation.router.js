import express from "express";
import {
    createQuickQuotation,
    getAllQuickQuotations,
    getQuickQuotationById,
    updateQuickQuotation,
    deleteQuickQuotation,
    sendQuickQuotationMail,
    finalizeQuickQuotation,
    previewQuickQuotationMail,
    sendQuickQuotationEmail,
    uploadQuickQuotationBanner,
    uploadQuickQuotationDayImage,
} from "../../controllers/quotation/quickQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canCreateBooking"), createQuickQuotation);
router.get("/", requirePermission("canAccessBookings"), getAllQuickQuotations);

router.post(
    "/:id/banner",
    requirePermission("canEditBooking"),
    upload.single("bannerImage"),
    uploadQuickQuotationBanner
);
router.post(
    "/:id/day-image",
    requirePermission("canEditBooking"),
    upload.single("image"),
    uploadQuickQuotationDayImage
);

router.get("/:id", requirePermission("canAccessBookings"), getQuickQuotationById);

router.patch("/:id/finalize", requirePermission("canEditBooking"), finalizeQuickQuotation);
router.post("/:id/email/preview", requirePermission("canEditBooking"), previewQuickQuotationMail);
router.post("/:id/email/send", requirePermission("canEditBooking"), sendQuickQuotationEmail);

router.put("/:id", requirePermission("canEditBooking"), updateQuickQuotation);

router.delete("/:id", requirePermission("canDeleteBooking"), deleteQuickQuotation);

router.post("/:id/send-mail", requirePermission("canEditBooking"), sendQuickQuotationMail);

export default router;
