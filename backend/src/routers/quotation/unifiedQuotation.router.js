import { Router } from "express";
import { searchAllQuotations, getUnifiedQuotationStats, getPaymentSummary } from "../../controllers/quotation/unifiedQuotation.controller.js";

const router = Router();

router.get("/search", searchAllQuotations);
router.get("/stats", getUnifiedQuotationStats);
router.get("/payment-summary", getPaymentSummary);

export default router;
