import express from "express";
import {
    createHotelQuotation,
    getAllHotelQuotations,
    getHotelQuotationById,
    deleteHotelQuotation,
} from "../../controllers/quotation/hotelQuotation.controller.js";

const router = express.Router();

router.post("/", createHotelQuotation);
router.get("/", getAllHotelQuotations);
router.get("/:id", getHotelQuotationById);
router.delete("/:id", deleteHotelQuotation);

export default router;