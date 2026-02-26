import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axios";

// ✅ Fetch all cities
export const fetchCities = createAsyncThunk("cities/fetchAll", async () => {
    const response = await api.get("/cities");
    return response.data;
});

// ✅ Search city by name
export const searchCity = createAsyncThunk("cities/search", async (name) => {
    const response = await api.get(`/cities/${name}`);
    return response.data;
});

const citySlice = createSlice({
    name: "cities",
    initialState: {
        cities: [],
        searchResults: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearSearch: (state) => {
            state.searchResults = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // ✅ fetchCities
            .addCase(fetchCities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // ✅ searchCity
            .addCase(searchCity.pending, (state) => {
                state.loading = true;
            })
            .addCase(searchCity.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchCity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { clearSearch } = citySlice.actions;
export default citySlice.reducer;
