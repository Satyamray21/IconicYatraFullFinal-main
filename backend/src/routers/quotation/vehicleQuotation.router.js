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

import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

// ========== PUT THE GET ROUTE FIRST (NOT POST) ==========
router.get(
  "/email/preview/:vehicleQuotationId",
  requirePermission("canEditQuotation"),
  previewVehicleQuotationMail,
);

router.post(
  "/email/preview/:vehicleQuotationId",
  requirePermission("canEditQuotation"),
  previewVehicleQuotationMail,
);

// ========== CREATE + LIST ==========
router.post("/", requirePermission("canCreateQuotation"), createVehicle);
router.get("/", requirePermission("canAccessQuotations"), getAllVehicles);

// ========== EMAIL SEND ==========
router.post(
  "/:vehicleQuotationId/email/send",
  requirePermission("canEditQuotation"),
  sendVehicleQuotationMail,
);

// ========== FINALIZE ==========
router.post(
  "/:vehicleQuotationId/finalize",
  requirePermission("canEditQuotation"),
  finalizeVehicleQuotation,
);

// ========== ITINERARY ROUTES ==========
router.post(
  "/:vehicleQuotationId/itinerary",
  requirePermission("canEditQuotation"),
  addItinerary,
);

router.get(
  "/:vehicleQuotationId/itinerary",
  requirePermission("canAccessQuotations"),
  viewItinerary,
);

router.put(
  "/:vehicleQuotationId/itinerary/:itineraryId",
  requirePermission("canEditQuotation"),
  editItinerary,
);

// ========== UPDATE / PATCH ==========
router.patch(
  "/:vehicleQuotationId",
  requirePermission("canEditQuotation"),
  updateVehicleQuotationByQuotationId,
);

router.put(
  "/:vehicleQuotationId",
  requirePermission("canEditQuotation"),
  updateVehicle,
);

// ========== GET SINGLE (KEEP NEAR END) ==========
router.get(
  "/:vehicleQuotationId",
  requirePermission("canAccessQuotations"),
  getVehicleById,
);

// ========== DELETE LAST ==========
router.delete(
  "/:vehicleQuotationId",
  requirePermission("canDeleteQuotation"),
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