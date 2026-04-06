// features/quotation/fullQuotationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// ================== Async Thunks ================== //

// Step 1: Create or resume quotation
export const step1CreateOrResume = createAsyncThunk(
    "quotation/step1CreateOrResume",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post("/fullQT/step1", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Step 2
export const step2Update = createAsyncThunk(
    "fullQuotation/step2Update",
    async ({ quotationId, stayLocation }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/fullQT/step2/${quotationId}`, { stayLocation });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Step 3
// Step 3
export const step3Update = createAsyncThunk(
    "fullQuotation/step3Update",
    async ({ quotationId, days }, { rejectWithValue }) => {
        try {
            const formData = new FormData();

            // Append itinerary as JSON string
            const itineraryPayload = days.map((day) => ({
                arrivalAt: day.arrivalAt || "", // Only for day 1
                driveTo: day.driveTo || "", // Only for day 1
                distance: day.distance || "", // Only for day 1
                duration: day.duration || "", // Only for day 1
                dayTitle: day.title,
                dayNote: day.itineraryDetails,
                aboutCity: day.aboutCity,
                image: typeof day.dayImage === 'string' ? day.dayImage : null, // keep existing URL
            }));

            formData.append("itinerary", JSON.stringify(itineraryPayload));

            // Append image files
            days.forEach((day, index) => {
                if (day.dayImage instanceof File) {
                    formData.append("images", day.dayImage);
                }
            });

            const res = await axios.put(`/fullQT/step3/${quotationId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


// Step 4
export const step4Update = createAsyncThunk(
    "fullQuotation/step4Update",
    async ({ quotationId, stayLocation }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/fullQT/step4/${quotationId}`, { stayLocation });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);
export const step5Update = createAsyncThunk(
    "fullQuotation/step5Update",
    async ({ quotationId, vehicleDetails }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/fullQT/step5/${quotationId}`, { vehicleDetails });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);
// Step 5
export const step6Update = createAsyncThunk(
    "fullQuotation/step6Update",
    async ({ quotationId, pricing }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/fullQT/step6/${quotationId}`, { pricing });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Finalize
export const finalizeQuotationApi = createAsyncThunk(
    "fullQuotation/finalize",
    async ({ quotationId }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/fullQT/finalize/${quotationId}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Get by ID
export const getQuotationById = createAsyncThunk(
    "fullQuotation/getById",
    async ({ quotationId }, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/fullQT/${quotationId}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Get all
export const getAllQuotations = createAsyncThunk(
    "fullQuotation/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/fullQT/`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ================== Slice ================== //
const initialState = {
    quotation: null,
    quotationsList: [],
    loading: false,          // used for saving/updating
    fetchLoading: false,     // used for fetching quotation
    error: null,
    quotationId: null,
};

const fullQuotationSlice = createSlice({
    name: "fullQuotation",
    initialState,
    reducers: {
        resetQuotation: (state) => {
            state.quotation = null;
            state.loading = false;
            state.fetchLoading = false;
            state.error = null;
            state.quotationId = null;
        },
    },
    extraReducers: (builder) => {
        const handlePending = (state) => { state.loading = true; state.error = null; };
        const handleFulfilled = (state, action) => {
            state.loading = false;
            state.quotation = action.payload;
            state.quotationId = action.payload?.quotationId;
        };
        const handleRejected = (state, action) => { state.loading = false; state.error = action.payload; };

        // Step 1–5 and finalize (saving)
        [step1CreateOrResume, step2Update, step3Update, step4Update, step5Update, step6Update, finalizeQuotationApi].forEach((thunk) => {
            builder
                .addCase(thunk.pending, handlePending)
                .addCase(thunk.fulfilled, handleFulfilled)
                .addCase(thunk.rejected, handleRejected);
        });

        // Get quotation by ID (fetch)
        builder
            .addCase(getQuotationById.pending, (state) => {
                state.fetchLoading = true;
                state.error = null;
            })
            .addCase(getQuotationById.fulfilled, (state, action) => {
                state.fetchLoading = false;
                state.quotation = action.payload;
                state.quotationId = action.payload?.quotationId;
            })
            .addCase(getQuotationById.rejected, (state, action) => {
                state.fetchLoading = false;
                state.error = action.payload;
            });

        // Get all
        builder
            .addCase(getAllQuotations.pending, (state) => { state.fetchLoading = true; state.error = null; })
            .addCase(getAllQuotations.fulfilled, (state, action) => {
                state.fetchLoading = false;
                state.quotationsList = action.payload.data;
            })
            .addCase(getAllQuotations.rejected, (state, action) => {
                state.fetchLoading = false;
                state.error = action.payload;
            });
    },
});

export const { resetQuotation } = fullQuotationSlice.actions;
export default fullQuotationSlice.reducer;