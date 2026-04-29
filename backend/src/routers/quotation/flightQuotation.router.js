import express from "express";
import {
    createFlightQuotation,
    getAllFlightQuotations,
    getFlightQuotationById,
    updateFlightQuotationById,
    deleteFlightQuotationById,
    confirmFlightQuotation,
    previewFlightQuotationMail,
    sendFlightQuotationMail,
} from "../../controllers/quotation/flightQuotation.controller.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canCreateBooking"), createFlightQuotation);
router.get("/", requirePermission("canAccessBookings"), getAllFlightQuotations);
router.get("/:flightQuotationId", requirePermission("canAccessBookings"), getFlightQuotationById);
router.put("/:flightQuotationId", requirePermission("canEditBooking"), updateFlightQuotationById);
router.delete("/:flightQuotationId", requirePermission("canDeleteBooking"), deleteFlightQuotationById);
router.patch("/confirm/:flightQuotationId", requirePermission("canEditBooking"), confirmFlightQuotation);
router.get("/email/preview/:flightQuotationId", requirePermission("canEditBooking"), previewFlightQuotationMail);
router.post("/:flightQuotationId/email/send", requirePermission("canEditBooking"), sendFlightQuotationMail);

export default router;