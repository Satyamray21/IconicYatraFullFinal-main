import express from "express";
import indianCities from "indian-cities-database";
import { Country, State, City } from "country-state-city";

const router = express.Router();
const cities = indianCities.cities;

// ✅ Get all cities (domestic or international based on query)
router.get("/", (req, res) => {
    const { type, countryCode, stateCode } = req.query;

    if (type === "international") {
        if (!countryCode || !stateCode) {
            return res.status(400).json({
                error: "countryCode and stateCode are required for international cities",
            });
        }

        const citiesList = City.getCitiesOfState(countryCode, stateCode);
        return res.json(citiesList); // International cities
    }

    // Domestic cities by default
    res.json(cities);
});

// ✅ Search by city name
router.get("/:name", (req, res) => {
    const { type, countryCode, stateCode } = req.query;
    const name = req.params.name.toLowerCase();

    if (type === "international") {
        if (!countryCode || !stateCode) {
            return res.status(400).json({
                error: "countryCode and stateCode are required for international cities search",
            });
        }

        const citiesList = City.getCitiesOfState(countryCode, stateCode);
        const result = citiesList.filter(city =>
            city.name.toLowerCase().includes(name)
        );
        return res.json(result);
    }

    // Domestic search
    const result = cities.filter(city =>
        city.city.toLowerCase().includes(name)
    );
    res.json(result);
});

export default router;
