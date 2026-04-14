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

const router = express.Router();

// ✅ Create a new quotation
router.post("/", createQuickQuotation);

// ✅ Get all quotations
router.get("/", getAllQuickQuotations);

router.post(
    "/:id/banner",
    upload.single("bannerImage"),
    uploadQuickQuotationBanner
);
router.post(
    "/:id/day-image",
    upload.single("image"),
    uploadQuickQuotationDayImage
);

// ✅ Get single quotation by ID
router.get("/:id", getQuickQuotationById);

router.patch("/:id/finalize", finalizeQuickQuotation);
router.post("/:id/email/preview", previewQuickQuotationMail);
router.post("/:id/email/send", sendQuickQuotationEmail);

// ✅ Update quotation
router.put("/:id", updateQuickQuotation);

// ✅ Delete quotation
router.delete("/:id", deleteQuickQuotation);

// ✅ Manual email trigger
router.post("/:id/send-mail", sendQuickQuotationMail);

export default router;
