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

const router = express.Router();

router.post("/", createVehicle);
router.get("/", getAllVehicles);
router.get("/:vehicleQuotationId", getVehicleById);
router.put("/:vehicleQuotationId", updateVehicle);
router.delete("/:vehicleQuotationId", deleteVehicle);
router.post("/:vehicleQuotationId/itinerary", addItinerary);
router.put("/:vehicleQuotationId/itinerary/:itineraryId", editItinerary);
router.get("/:vehicleQuotationId/itinerary", viewItinerary);

export default router;