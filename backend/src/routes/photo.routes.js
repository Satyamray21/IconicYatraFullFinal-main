import { Router } from "express";
import { fetchPhoto } from "../controllers/photo.controller.js";

const router = Router();

// Route to fetch a photo by query
router.get("/search", fetchPhoto);

export default router;
