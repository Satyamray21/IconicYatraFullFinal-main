import express from "express";
import {
    createFlightQuotation,
    getAllFlightQuotations,
    getFlightQuotationById,
    updateFlightQuotationById,
    deleteFlightQuotationById,
    confirmFlightQuotation,
} from "../../controllers/quotation/flightQuotation.controller.js";

const router = express.Router();


router.post("/", createFlightQuotation);

// Get all
router.get("/", getAllFlightQuotations);

// Get by ID
router.get("/:flightQuotationId", getFlightQuotationById);

// Update by ID
router.put("/:flightQuotationId", updateFlightQuotationById);

// Delete by ID
router.delete("/:flightQuotationId", deleteFlightQuotationById);

router.patch("/confirm/:flightQuotationId", confirmFlightQuotation);

export default router;