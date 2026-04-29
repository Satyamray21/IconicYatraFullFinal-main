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

router.post("/", requirePermission("canCreateQuotation"), createQuickQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllQuickQuotations);

router.post(
    "/:id/banner",
    requirePermission("canEditQuotation"),
    upload.single("bannerImage"),
    uploadQuickQuotationBanner
);
router.post(
    "/:id/day-image",
    requirePermission("canEditQuotation"),
    upload.single("image"),
    uploadQuickQuotationDayImage
);

router.get("/:id", requirePermission("canAccessQuotations"), getQuickQuotationById);

router.patch("/:id/finalize", requirePermission("canEditQuotation"), finalizeQuickQuotation);
router.post("/:id/email/preview", requirePermission("canEditQuotation"), previewQuickQuotationMail);
router.post("/:id/email/send", requirePermission("canEditQuotation"), sendQuickQuotationEmail);

router.put("/:id", requirePermission("canEditQuotation"), updateQuickQuotation);

router.delete("/:id", requirePermission("canDeleteQuotation"), deleteQuickQuotation);

router.post("/:id/send-mail", requirePermission("canEditQuotation"), sendQuickQuotationMail);

export default router;
