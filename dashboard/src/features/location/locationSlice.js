import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";
import { Country, City } from "country-state-city";

/* ===========================================================
   ========== BACKEND-BASED FETCHES (optional) ================
   =========================================================== */

/**
 * Fetch all countries
 */
export const fetchCountries = createAsyncThunk(
    "countryStateAndCity/fetchCountries",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`countryStateAndCity/countries`);
            return data.countries;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Fetch states by country name
 */
export const fetchStatesByCountry = createAsyncThunk(
    "countryStateAndCity/fetchStatesByCountry",
    async (countryName, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`countryStateAndCity/states/${countryName}`);
            return data.states;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * Fetch cities by country name and state name
 */
export const fetchCitiesByState = createAsyncThunk(
    "countryStateAndCity/fetchCitiesByState",
    async ({ countryName, stateName }, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`countryStateAndCity/cities/${countryName}/${stateName}`);
            return data.cities;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * For domestic cities (India specific, via backend)
 */
export const fetchDomesticCities = createAsyncThunk(
    "countryStateAndCity/fetchDomesticCities",
    async (stateName, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`countryStateAndCity/cities/india/${stateName}`);
            return data.cities;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/**
 * For international cities (via backend)
 */
export const fetchInternationalCities = createAsyncThunk(
    "countryStateAndCity/fetchInternationalCities",
    async ({ countryName, stateName }, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`countryStateAndCity/cities/${countryName}/${stateName}`);
            return data.cities;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/* ===========================================================
   ========== LOCAL FETCHES (using country-state-city) ========
   =========================================================== */

/**
 * ✅ Fetch ALL cities of India
 */
export const fetchAllIndianCities = createAsyncThunk(
    "countryStateAndCity/fetchAllIndianCities",
    async (_, { rejectWithValue }) => {
        try {
            const allCities = City.getCitiesOfCountry("IN");
            return allCities.map((city) => city.name);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * ✅ Fetch all cities of selected international country
 */
export const fetchAllCitiesByCountry = createAsyncThunk(
    "countryStateAndCity/fetchAllCitiesByCountry",
    async (countryName, { rejectWithValue }) => {
        try {
            const country = Country.getAllCountries().find(
                (c) => c.name.toLowerCase() === countryName.toLowerCase()
            );
            if (!country) throw new Error(`Country not found: ${countryName}`);

            const cities = City.getCitiesOfCountry(country.isoCode);
            return cities.map((city) => city.name);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/* ===========================================================
   ========== SLICE ===========================================
   =========================================================== */

const countryStateAndCitySlice = createSlice({
    name: "countryStateAndCity",
    initialState: {
        countries: [],
        states: [],
        cities: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearStates: (state) => {
            state.states = [];
        },
        clearCities: (state) => {
            state.cities = [];
        },
    },
    extraReducers: (builder) => {
        builder
            /* ===== Countries ===== */
            .addCase(fetchCountries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCountries.fulfilled, (state, action) => {
                state.loading = false;
                state.countries = action.payload;
            })
            .addCase(fetchCountries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== States ===== */
            .addCase(fetchStatesByCountry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStatesByCountry.fulfilled, (state, action) => {
                state.loading = false;
                state.states = action.payload;
            })
            .addCase(fetchStatesByCountry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== Cities (by backend) ===== */
            .addCase(fetchCitiesByState.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCitiesByState.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchCitiesByState.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== Domestic Cities (backend) ===== */
            .addCase(fetchDomesticCities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDomesticCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchDomesticCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== International Cities (backend) ===== */
            .addCase(fetchInternationalCities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInternationalCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchInternationalCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== All Indian Cities (local) ===== */
            .addCase(fetchAllIndianCities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllIndianCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchAllIndianCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ===== All Cities by Country (local) ===== */
            .addCase(fetchAllCitiesByCountry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllCitiesByCountry.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchAllCitiesByCountry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearStates, clearCities } = countryStateAndCitySlice.actions;
export default countryStateAndCitySlice.reducer;