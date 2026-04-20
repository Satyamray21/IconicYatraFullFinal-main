import express from "express";
import {
    createHotelQuotation,
    getAllHotelQuotations,
    getHotelQuotationById,
    deleteHotelQuotation,
} from "../../controllers/quotation/hotelQuotation.controller.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canCreateBooking"), createHotelQuotation);
router.get("/", requirePermission("canAccessBookings"), getAllHotelQuotations);
router.get("/:id", requirePermission("canAccessBookings"), getHotelQuotationById);
router.delete("/:id", requirePermission("canDeleteBooking"), deleteHotelQuotation);

export default router;