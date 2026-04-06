import countriesAndStates from "../data/allCountryAndStates.js";

// ✅ Get all countries
export const getAllCountries = (req, res) => {
    try {
        const countries = countriesAndStates.data.map((c) => c.name);
        return res.status(200).json({ success: true, countries });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Get states of a specific country
export const getStatesByCountry = (req, res) => {
    try {
        const { country } = req.params;

        const countryData = countriesAndStates.data.find(
            (c) => c.name.toLowerCase() === country.toLowerCase()
        );

        if (!countryData) {
            return res.status(404).json({ success: false, message: "Country not found" });
        }

        return res.status(200).json({ success: true, states: countryData.states });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};