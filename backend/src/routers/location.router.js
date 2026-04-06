
import express from "express";
import {
    getAllCountries,
    getStatesByCountry,
} from "../controllers/location.controller.js";

const router = express.Router();

// ✅ Get all countries
router.get("/countries", getAllCountries);

// ✅ Get states by country name
router.get("/states/:country", getStatesByCountry);

export default router;