import express from "express";
import {
  addDestination,
  getDestinations,
  getAvailableDestinations,
  syncDestinationsFromPackages,
  updateDescription
} from "../controllers/destination.controller.js";

const router = express.Router();

router.post("/add", addDestination);
router.get("/", getDestinations);

// 🔥 MAIN ROUTE
router.get("/available", getAvailableDestinations);
router.post("/sync-from-packages", syncDestinationsFromPackages);

router.put("/update/:id", updateDescription);


export default router;
