import express from "express";
import {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    addItinerary,
    editItinerary,
    viewItinerary
} from "../../controllers/quotation/vechicleQuotation.controller.js";
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canCreateBooking"), createVehicle);
router.get("/", requirePermission("canAccessBookings"), getAllVehicles);
router.get("/:vehicleQuotationId", requirePermission("canAccessBookings"), getVehicleById);
router.put("/:vehicleQuotationId", requirePermission("canEditBooking"), updateVehicle);
router.delete("/:vehicleQuotationId", requirePermission("canDeleteBooking"), deleteVehicle);
router.post("/:vehicleQuotationId/itinerary", requirePermission("canEditBooking"), addItinerary);
router.put("/:vehicleQuotationId/itinerary/:itineraryId", requirePermission("canEditBooking"), editItinerary);
router.get("/:vehicleQuotationId/itinerary", requirePermission("canAccessBookings"), viewItinerary);

export default router;