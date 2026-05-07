import { Router } from "express";
import { searchAllQuotations, getUnifiedQuotationStats } from "../../controllers/quotation/unifiedQuotation.controller.js";

const router = Router();

router.get("/search", searchAllQuotations);
router.get("/stats", getUnifiedQuotationStats);

export default router;
