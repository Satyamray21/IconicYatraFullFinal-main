import express from "express";
import { calculateAccommodationController } from "../controllers/calculateAccommodation.controller.js"

const router = express.Router();

router.post("/calculate-accommodation", calculateAccommodationController);

export default router;