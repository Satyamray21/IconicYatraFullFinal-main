import express from "express";
import {
    createHotelQuotation,
    getAllHotelQuotations,
    getHotelQuotationById,
    deleteHotelQuotation,
    finalizeHotelQuotation,
    updateHotelQuotation,
} from "../../controllers/quotation/hotelQuotation.controller.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canCreateQuotation"), createHotelQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllHotelQuotations);
router.get("/:id", requirePermission("canAccessQuotations"), getHotelQuotationById);
router.put("/:id", requirePermission("canCreateQuotation"), updateHotelQuotation);
router.delete("/:id", requirePermission("canDeleteQuotation"), deleteHotelQuotation);
router.post("/finalize/:id", requirePermission("canCreateQuotation"), finalizeHotelQuotation);

export default router;