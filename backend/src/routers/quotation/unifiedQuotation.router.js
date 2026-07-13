import { Router } from "express";
import { searchAllQuotations, getUnifiedQuotationStats, getPaymentSummary, getUpcomingStayLocations, previewHotelAvailabilityEmail, sendHotelAvailabilityEmail, saveAvailabilityHotels } from "../../controllers/quotation/unifiedQuotation.controller.js";

const router = Router();

router.get("/search", searchAllQuotations);
router.get("/stats", getUnifiedQuotationStats);
router.get("/payment-summary", getPaymentSummary);

router.get("/stay-locations", getUpcomingStayLocations);
router.post("/stay-locations/save-availability", saveAvailabilityHotels);
router.post("/hotel-availability-email/preview", previewHotelAvailabilityEmail);
router.post("/hotel-availability-email/send", sendHotelAvailabilityEmail);

export default router;
