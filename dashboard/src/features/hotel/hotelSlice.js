// src/redux/slices/hotelSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// ----------- Async Thunks -----------

// Step 1: Create Hotel (Basic Details)
export const createHotelStep1 = createAsyncThunk(
    "hotel/createHotelStep1",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await axios.post("/create-hotel", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Step 2: Update Room Details
export const updateHotelStep2 = createAsyncThunk(
    "hotel/updateHotelStep2",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/update-step2/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Step 3: Update Mattress Cost
export const updateHotelStep3 = createAsyncThunk(
    "hotel/updateHotelStep3",
    async ({ id, data, formData }, { rejectWithValue }) => { // ✅ Dono parameters support karo
        try {
            let requestData;
            let headers = {};

            // Agar formData hai toh usko use karo (images ke liye)
            if (formData) {
                requestData = formData;
                headers["Content-Type"] = "multipart/form-data";
            }
            // Agar direct data hai toh usko use karo (JSON ke liye)
            else if (data) {
                requestData = data;
                headers["Content-Type"] = "application/json";
            }
            // Dono nahi hai toh error
            else {
                return rejectWithValue("Either data or formData is required");
            }

            const res = await axios.put(`/update-step3/${id}`, requestData, {
                headers: headers,
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Step 4: Update Peak Cost & Final Submit - UPDATE THIS FUNCTION
export const updateHotelStep4 = createAsyncThunk(
    "hotel/updateHotelStep4",
    async ({ id, data, formData }, { rejectWithValue }) => {
        try {
            let requestData;
            let headers = {};

            // Agar formData hai toh usko use karo
            if (formData) {
                requestData = formData;
                headers["Content-Type"] = "multipart/form-data";
            }
            // Agar direct data hai toh usko use karo (JSON ke liye)
            else if (data) {
                requestData = data;
                headers["Content-Type"] = "application/json";
            }
            // Dono nahi hai toh error
            else {
                return rejectWithValue("Either data or formData is required");
            }

            const res = await axios.put(`/update-step4/${id}`, requestData, {
                headers: headers,
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Get Hotel for Edit (with step tracking)
export const getHotelForEdit = createAsyncThunk(
    "hotel/getHotelForEdit",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/edit/${id}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Fetch All Hotels
export const fetchHotels = createAsyncThunk(
    "hotel/fetchHotels",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get("/all-hotel");
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Fetch Single Hotel by ID
export const fetchHotelById = createAsyncThunk(
    "hotel/fetchHotelById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/${id}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Update Hotel (Original - for backward compatibility)
export const updateHotel = createAsyncThunk(
    "hotel/updateHotel",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/update/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Delete Hotel
export const deleteHotel = createAsyncThunk(
    "hotel/deleteHotel",
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`/delete/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Update Hotel Status
export const updateHotelStatus = createAsyncThunk(
    "hotel/updateHotelStatus",
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const res = await axios.patch(`/${id}/status`, { status });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const filterHotelsByCity = createAsyncThunk(
    "hotel/filterHotelsByCity",
    async (cityName, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const allHotels = state.hotel.hotels;

            if (!cityName || cityName.trim() === "") {
                return allHotels; // Return all hotels if no city specified
            }

            // Case-insensitive search in city name, hotel name, or state
            const filtered = allHotels.filter(hotel => {
                const searchTerm = cityName.toLowerCase().trim();
                return (
                    hotel.location?.city?.toLowerCase().includes(searchTerm) ||
                    hotel.hotelName?.toLowerCase().includes(searchTerm) ||
                    hotel.location?.state?.toLowerCase().includes(searchTerm)
                );
            });

            return filtered;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// ----------- Slice -----------

const hotelSlice = createSlice({
    name: "hotel",
    initialState: {
        hotels: [],
        filteredHotels: [],
        hotel: null,
        loading: false,
        error: null,
        success: null,
        currentStep: 1, // Track current step
        hotelId: null, // Store created hotel ID
    },
    reducers: {
        clearMessages: (state) => {
            state.error = null;
            state.success = null;
        },
        resetHotelState: (state) => {
            state.hotel = null;
            state.error = null;
            state.success = null;
            state.loading = false;
            state.currentStep = 1;
            state.hotelId = null;
            state.filteredHotels = [];
        },
        setCurrentStep: (state, action) => {
            state.currentStep = action.payload;
        },
        setHotelId: (state, action) => {
            state.hotelId = action.payload;
        },
        filterHotelsByCityManual: (state, action) => {
            const cityName = action.payload;
            if (!cityName || cityName.trim() === "") {
                state.filteredHotels = state.hotels;
            } else {
                const searchTerm = cityName.toLowerCase().trim();
                state.filteredHotels = state.hotels.filter(hotel =>
                    hotel.location?.city?.toLowerCase().includes(searchTerm) ||
                    hotel.hotelName?.toLowerCase().includes(searchTerm) ||
                    hotel.location?.state?.toLowerCase().includes(searchTerm)
                );
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // STEP 1: CREATE HOTEL
            .addCase(createHotelStep1.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = null;
            })
            .addCase(createHotelStep1.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Hotel basic details saved successfully";
                state.hotels.push(action.payload);
                state.hotelId = action.payload._id; // Store hotel ID for next steps
                state.currentStep = 2; // Move to step 2
            })
            .addCase(createHotelStep1.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // STEP 2: UPDATE ROOM DETAILS
            .addCase(updateHotelStep2.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHotelStep2.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Room details updated successfully";
                // Update hotel in list
                state.hotels = state.hotels.map((h) =>
                    h._id === action.payload._id ? action.payload : h
                );
                if (state.hotel?._id === action.payload._id) {
                    state.hotel = action.payload;
                }
                state.currentStep = 3; // Move to step 3
            })
            .addCase(updateHotelStep2.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // STEP 3: UPDATE MATTRESS COST
            .addCase(updateHotelStep3.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHotelStep3.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Mattress cost updated successfully";
                state.hotels = state.hotels.map((h) =>
                    h._id === action.payload._id ? action.payload : h
                );
                if (state.hotel?._id === action.payload._id) {
                    state.hotel = action.payload;
                }
                state.currentStep = 4; // Move to step 4
            })
            .addCase(updateHotelStep3.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // STEP 4: UPDATE PEAK COST & FINAL SUBMIT
            .addCase(updateHotelStep4.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHotelStep4.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload.message;
                state.hotels = state.hotels.map((h) =>
                    h._id === action.payload._id ? action.payload : h
                );
                if (state.hotel?._id === action.payload._id) {
                    state.hotel = action.payload;
                }
                // If final submit, mark as completed
                if (action.payload.message.includes("completed")) {
                    state.currentStep = "completed";
                }
            })
            .addCase(updateHotelStep4.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // GET HOTEL FOR EDIT
            .addCase(getHotelForEdit.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getHotelForEdit.fulfilled, (state, action) => {
                state.loading = false;
                state.hotel = action.payload.data;
                state.currentStep = action.payload.currentStep;
                state.hotelId = action.payload.data._id;
            })
            .addCase(getHotelForEdit.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // FETCH ALL HOTELS
            .addCase(fetchHotels.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHotels.fulfilled, (state, action) => {
                state.loading = false;
                state.hotels = action.payload;
                state.filteredHotels = action.payload;
            })
            .addCase(fetchHotels.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // FETCH BY ID
            .addCase(fetchHotelById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHotelById.fulfilled, (state, action) => {
                state.loading = false;
                state.hotel = action.payload;
            })
            .addCase(fetchHotelById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // UPDATE (ORIGINAL)
            .addCase(updateHotel.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHotel.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Hotel updated successfully";
                state.hotels = state.hotels.map((h) =>
                    h._id === action.payload._id ? action.payload : h
                );
                if (state.hotel?._id === action.payload._id) {
                    state.hotel = action.payload;
                }
            })
            .addCase(updateHotel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // DELETE
            .addCase(deleteHotel.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteHotel.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Hotel deleted successfully";
                state.hotels = state.hotels.filter((h) => h._id !== action.payload);
                if (state.hotel?._id === action.payload) {
                    state.hotel = null;
                }
            })
            .addCase(deleteHotel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // UPDATE STATUS
            .addCase(updateHotelStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateHotelStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = "Status updated successfully";
                state.hotels = state.hotels.map((h) =>
                    h._id === action.payload._id ? action.payload : h
                );
                if (state.hotel?._id === action.payload._id) {
                    state.hotel = action.payload;
                }
            })
            .addCase(updateHotelStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(filterHotelsByCity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(filterHotelsByCity.fulfilled, (state, action) => {
                state.loading = false;
                state.filteredHotels = action.payload;
            })
            .addCase(filterHotelsByCity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearMessages,
    resetHotelState,
    setCurrentStep,
    setHotelId,
    filterHotelsByCityManual
} = hotelSlice.actions;
export default hotelSlice.reducer;