import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";


export const createFlightQuotation = createAsyncThunk(
    "flightQuotation/create",
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(`flightQT/`, formData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to create quotation");
        }
    }
);

// Get all flight quotations
export const getAllFlightQuotations = createAsyncThunk(
    "flightQuotation/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`flightQT`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to fetch quotations");
        }
    }
);

// Get flight quotation by ID
export const getFlightQuotationById = createAsyncThunk(
    "flightQuotation/getById",
    async (flightQuotationId, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`flightQT/${flightQuotationId}`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Quotation not found");
        }
    }
);

// Update flight quotation by ID
export const updateFlightQuotationById = createAsyncThunk(
    "flightQuotation/update",
    async ({ flightQuotationId, formData }, { rejectWithValue }) => {
        try {
            const { data } = await axios.put(`flightQT/${flightQuotationId}`, formData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to update quotation");
        }
    }
);

// Delete flight quotation by ID
export const deleteFlightQuotationById = createAsyncThunk(
    "flightQuotation/delete",
    async (flightQuotationId, { rejectWithValue }) => {
        try {
            await axios.delete(`flightQT/${flightQuotationId}`);
            return flightQuotationId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to delete quotation");
        }
    }
);

// Confirm flight quotation (Completed → Confirmed)
export const confirmFlightQuotation = createAsyncThunk(
    "flightQuotation/confirm",
    async ({ flightQuotationId, pnrList, finalFareList, finalFare }, { rejectWithValue }) => {
        try {
            const { data } = await axios.patch(
                `flightQT/confirm/${flightQuotationId}`,
                { pnrList, finalFareList, finalFare } // ✅ Added finalFare to request body
            );
            return data.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Failed to confirm quotation"
            );
        }
    }
);



// =============================
// 📌 Slice
// =============================
const flightQuotationSlice = createSlice({
    name: "flightQuotation",
    initialState: {
        quotations: [],
        quotationDetails: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        clearQuotationState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.quotationDetails = null;
        },
    },
    extraReducers: (builder) => {
        // CREATE
        builder
            .addCase(createFlightQuotation.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createFlightQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.quotations.unshift(action.payload);
            })
            .addCase(createFlightQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // GET ALL
        builder
            .addCase(getAllFlightQuotations.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllFlightQuotations.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations = action.payload;
            })
            .addCase(getAllFlightQuotations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // GET BY ID
        builder
            .addCase(getFlightQuotationById.pending, (state) => {
                state.loading = true;
            })
            .addCase(getFlightQuotationById.fulfilled, (state, action) => {
                state.loading = false;
                state.quotationDetails = action.payload;
            })
            .addCase(getFlightQuotationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // UPDATE
        builder
            .addCase(updateFlightQuotationById.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateFlightQuotationById.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.quotations = state.quotations.map((q) =>
                    q.flightQuotationId === action.payload.flightQuotationId ? action.payload : q
                );
            })
            .addCase(updateFlightQuotationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // DELETE
        builder
            .addCase(deleteFlightQuotationById.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteFlightQuotationById.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations = state.quotations.filter(
                    (q) => q.flightQuotationId !== action.payload
                );
            })
            .addCase(deleteFlightQuotationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // CONFIRM
        builder
            .addCase(confirmFlightQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(confirmFlightQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                // Update quotations list
                state.quotations = state.quotations.map((q) =>
                    q.flightQuotationId === action.payload.flightQuotationId
                        ? action.payload
                        : q
                );

                // ✅ Fix: Update quotationDetails.quotation properly
                if (state.quotationDetails?.quotation?.flightQuotationId === action.payload.flightQuotationId) {
                    state.quotationDetails = {
                        ...state.quotationDetails,
                        quotation: {
                            ...state.quotationDetails.quotation,
                            ...action.payload, // ✅ This keeps status, finalFare, PNR, etc. updated
                        },
                    };
                }
            })

            .addCase(confirmFlightQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    },
});

export const { clearQuotationState } = flightQuotationSlice.actions;
export default flightQuotationSlice.reducer;