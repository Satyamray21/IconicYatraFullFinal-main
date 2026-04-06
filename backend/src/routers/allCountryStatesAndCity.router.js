import express from "express";
import {
    getStatesByCountryName,
    getCitiesByStateName,
    getAllCountries,
} from "../controllers/allCountryStatesAndCity.js";

const router = express.Router();
router.get("/countries", getAllCountries);
// Get all states by country name
router.get("/states/:countryName", getStatesByCountryName);

// Get all cities by state name
router.get("/cities/:countryName/:stateName", getCitiesByStateName);

export default router;