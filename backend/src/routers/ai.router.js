import express from "express";
import { generateItinerary } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/generate-itinerary", generateItinerary);

export default router;
