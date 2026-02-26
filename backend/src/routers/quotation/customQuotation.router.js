import { Router } from "express";
import {
    createCustomQuotation,
    getAllCustomQuotations,
    getCustomQuotationById,
    updateCustomQuotation,
    deleteCustomQuotation,
    updateQuotationStep
} from "../../controllers/quotation/customQuotation.controller.js";
import { upload } from "../../middleware/imageMulter.middleware.js";

const router = Router();

// CRUD routes
router.post("/", createCustomQuotation);
router.get("/", getAllCustomQuotations);

// ✅ Handles both single (bannerImage) and multiple (itineraryImages)
router.post(
    "/update-step",
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "itineraryImages", maxCount: 20 },
    ]),
    updateQuotationStep
);

router.get("/:quotationId", getCustomQuotationById);
router.put("/:id", updateCustomQuotation);
router.delete("/:id", deleteCustomQuotation);

export default router;