import express from "express";
import {
  addDestination,
  getDestinations,
  getAvailableDestinations,
  syncDestinationsFromPackages,
  updateDescription,
  upsertTourTypeDescription
} from "../controllers/destination.controller.js";

import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/add", requirePermission("canManageDestinations"), addDestination);
router.get("/", getDestinations); // Website uses this

// 🔥 MAIN ROUTE
router.get("/available", getAvailableDestinations); // Website uses this
router.post("/sync-from-packages", requirePermission("canManageDestinations"), syncDestinationsFromPackages);

router.put("/update/:id", requirePermission("canManageDestinations"), updateDescription);
router.put("/tour-type-description", requirePermission("canManageDestinations"), upsertTourTypeDescription);


export default router;
