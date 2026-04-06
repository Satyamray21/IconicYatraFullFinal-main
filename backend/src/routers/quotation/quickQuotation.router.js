import express from "express";
import {
    createQuickQuotation,
    getAllQuickQuotations,
    getQuickQuotationById,
    updateQuickQuotation,
    deleteQuickQuotation,
    sendQuickQuotationMail,
} from "../../controllers/quotation/quickQuotation.controller.js";

const router = express.Router();

// ✅ Create a new quotation
router.post("/", createQuickQuotation);

// ✅ Get all quotations
router.get("/", getAllQuickQuotations);

// ✅ Get single quotation by ID
router.get("/:id", getQuickQuotationById);

// ✅ Update quotation
router.put("/:id", updateQuickQuotation);

// ✅ Delete quotation
router.delete("/:id", deleteQuickQuotation);

// ✅ Manual email trigger
router.post("/:id/send-mail", sendQuickQuotationMail);

export default router;
