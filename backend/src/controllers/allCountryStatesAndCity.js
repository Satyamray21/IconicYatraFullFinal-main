import { Country, State, City } from "country-state-city";

/**
 * Get all countries
 */
export const getAllCountries = (req, res) => {
    try {
        const countries = Country.getAllCountries();

        res.status(200).json({
            success: true,
            count: countries.length,
            countries,
        });
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
export const getStatesByCountryName = (req, res) => {
    try {
        const { countryName } = req.params;

        // Find the country by name
        const country = Country.getAllCountries().find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );

        if (!country) {
            return res.status(404).json({ message: "Country not found" });
        }

        // Get states of the country
        const states = State.getStatesOfCountry(country.isoCode);

        res.status(200).json({
            success: true,
            country: country.name,
            countryCode: country.isoCode,
            states,
        });
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
export const getCitiesByStateName = (req, res) => {
    try {
        const { countryName, stateName } = req.params;

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

        res.status(200).json({
            success: true,
            country: country.name,
            state: state.name,
            cities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};