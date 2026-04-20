import express from "express";
import { calculateAccommodationController } from "../controllers/calculateAccommodation.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/calculate-accommodation", requirePermission("canEditPackage"), calculateAccommodationController);

export default router;