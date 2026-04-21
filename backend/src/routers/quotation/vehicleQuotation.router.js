import express from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  addItinerary,
  editItinerary,
  viewItinerary,
  updateVehicleQuotationByQuotationId,
  finalizeVehicleQuotation,
  previewVehicleQuotationMail,
  sendVehicleQuotationMail,
} from "../../controllers/quotation/vechicleQuotation.controller.js";

const router = express.Router();

// ========== PUT THE GET ROUTE FIRST (NOT POST) ==========
router.get(
  "/email/preview/:vehicleQuotationId",
  previewVehicleQuotationMail,
);

router.post(
  "/email/preview/:vehicleQuotationId",
  previewVehicleQuotationMail,
);

// ========== CREATE + LIST ==========
router.post("/", createVehicle);
router.get("/", getAllVehicles);

// ========== EMAIL SEND ==========
router.post(
  "/:vehicleQuotationId/email/send",
  sendVehicleQuotationMail,
);

// ========== FINALIZE ==========
router.post(
  "/:vehicleQuotationId/finalize",
  finalizeVehicleQuotation,
);

// ========== ITINERARY ROUTES ==========
router.post(
  "/:vehicleQuotationId/itinerary",
  addItinerary,
);

router.get(
  "/:vehicleQuotationId/itinerary",
  viewItinerary,
);

router.put(
  "/:vehicleQuotationId/itinerary/:itineraryId",
  editItinerary,
);

// ========== UPDATE / PATCH ==========
router.patch(
  "/:vehicleQuotationId",
  updateVehicleQuotationByQuotationId,
);

router.put(
  "/:vehicleQuotationId",
  updateVehicle,
);

// ========== GET SINGLE (KEEP NEAR END) ==========
router.get(
  "/:vehicleQuotationId",
  getVehicleById,
);

// ========== DELETE LAST ==========
router.delete(
  "/:vehicleQuotationId",
  deleteVehicle,
);

// Debug log
console.log("✅ Vehicle Quotation Routes Loaded:");
router.stack.forEach((r) => {
  if (r.route) {
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

export default router;