import { Router } from "express";
import { searchAllQuotations } from "../../controllers/quotation/unifiedQuotation.controller.js";
import { verifyToken } from "../../middleware/user.middleware.js";

const router = Router();

router.get("/search", verifyToken, searchAllQuotations);

export default router;
