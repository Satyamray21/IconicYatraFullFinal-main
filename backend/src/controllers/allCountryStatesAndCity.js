import { Country, State, City } from "country-state-city";
import { getCache, setCache } from "../utils/cache.js";

/**
 * Get all countries
 */
export const getAllCountries = async (req, res) => {
    try {
        const cacheKey = "geo:countries";
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log(`[Cache] All countries fetched from Redis`);
            return res.status(200).json({ fromCache: true, ...cachedData });
        }

        const countries = Country.getAllCountries();
        const response = {
            success: true,
            count: countries.length,
            countries,
        };

        await setCache(cacheKey, response, 2592000); // 30 days
        console.log(`[DB/Lib] All countries fetched from Library`);
        res.status(200).json({ fromCache: false, ...response });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * Get all states by country name
 */
export const getStatesByCountryName = async (req, res) => {
    try {
        const { countryName } = req.params;
        const cacheKey = `geo:states:${countryName.toLowerCase()}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log(`[Cache] States for ${countryName} fetched from Redis`);
            return res.status(200).json({ fromCache: true, ...cachedData });
        }

        // Find the country by name
        const country = Country.getAllCountries().find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );

        if (!country) {
            return res.status(404).json({ message: "Country not found" });
        }

        // Get states of the country
        const states = State.getStatesOfCountry(country.isoCode);
        const response = {
            success: true,
            country: country.name,
            countryCode: country.isoCode,
            states,
        };

        await setCache(cacheKey, response, 2592000); // 30 days
        console.log(`[DB/Lib] States for ${countryName} fetched from Library`);
        res.status(200).json({ fromCache: false, ...response });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * Get all cities by country name and state name
 */
export const getCitiesByStateName = async (req, res) => {
    try {
        const { countryName, stateName } = req.params;
        const cacheKey = `geo:cities:${countryName.toLowerCase()}:${stateName.toLowerCase()}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log(`[Cache] Cities for ${stateName}, ${countryName} fetched from Redis`);
            return res.status(200).json({ fromCache: true, ...cachedData });
        }

        // Find the country by name
        const country = Country.getAllCountries().find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );

        if (!country) {
            return res.status(404).json({ message: "Country not found" });
        }

        // Find the state by name
        const state = State.getStatesOfCountry(country.isoCode).find(
            (s) => s.name.toLowerCase() === stateName.toLowerCase()
        );

        if (!state) {
            return res.status(404).json({ message: "State not found" });
        }

        // Get all cities of that state
        const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
        const response = {
            success: true,
            country: country.name,
            state: state.name,
            cities,
        };

        await setCache(cacheKey, response, 2592000); // 30 days
        console.log(`[DB/Lib] Cities for ${stateName}, ${countryName} fetched from Library`);
        res.status(200).json({ fromCache: false, ...response });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * Get all cities by country name
 */
export const getCitiesByCountryName = async (req, res) => {
    try {
        const { countryName } = req.params;
        const cacheKey = `geo:cities:${countryName.toLowerCase()}:all`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log(`[Cache] All cities for ${countryName} fetched from Redis`);
            return res.status(200).json({ fromCache: true, ...cachedData });
        }

        // Find the country by name
        const country = Country.getAllCountries().find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );

        if (!country) {
            return res.status(404).json({ message: "Country not found" });
        }

        // Get all cities of the country
        const cities = City.getCitiesOfCountry(country.isoCode);
        const response = {
            success: true,
            country: country.name,
            countryCode: country.isoCode,
            cities,
        };

        await setCache(cacheKey, response, 2592000); // 30 days
        console.log(`[DB/Lib] All cities for ${countryName} fetched from Library`);
        res.status(200).json({ fromCache: false, ...response });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};