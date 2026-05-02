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

router.post("/", requirePermission("canCreateQuotation"), createFlightQuotation);
router.get("/", requirePermission("canAccessQuotations"), getAllFlightQuotations);
router.get("/:flightQuotationId", requirePermission("canAccessQuotations"), getFlightQuotationById);
router.put("/:flightQuotationId", requirePermission("canEditQuotation"), updateFlightQuotationById);
router.delete("/:flightQuotationId", requirePermission("canDeleteQuotation"), deleteFlightQuotationById);
router.patch("/confirm/:flightQuotationId", requirePermission("canEditQuotation"), confirmFlightQuotation);
router.get("/email/preview/:flightQuotationId", requirePermission("canEditQuotation"), previewFlightQuotationMail);
router.post("/:flightQuotationId/email/send", requirePermission("canEditQuotation"), sendFlightQuotationMail);

export default router;