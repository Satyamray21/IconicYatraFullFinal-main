// src/features/quotation/quickQuotationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axios";

// ✅ Create quotation
export const createQuickQuotation = createAsyncThunk(
    "quickQuotation/create",
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/quickQT", formData);
            return data.quotation;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to create quotation");
        }
    }
);

// ✅ Get all quotations
export const fetchQuickQuotations = createAsyncThunk(
    "quickQuotation/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/quickQT");
            return data.quotations;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to load quotations");
        }
    }
);

// ✅ Get single quotation by ID
export const fetchQuickQuotationById = createAsyncThunk(
    "quickQuotation/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/quickQT/${id}`);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to load quotation");
        }
    }
);

// ✅ Update quotation
export const updateQuickQuotation = createAsyncThunk(
    "quickQuotation/update",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/quickQT/${id}`, formData);
            return data.quotation;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to update quotation");
        }
    }
);

// ✅ Delete quotation
export const deleteQuickQuotation = createAsyncThunk(
    "quickQuotation/delete",
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/quickQT/${id}`);
            return id; // Return the ID to remove from state
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to delete quotation");
        }
    }
);

// ✅ Send mail
export const sendQuickQuotationMail = createAsyncThunk(
    "quickQuotation/sendMail",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/quickQT/${id}/send-mail`);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to send mail");
        }
    }
);

const quickQuotationSlice = createSlice({
    name: "quickQuotation",
    initialState: {
        quotations: [],
        currentQuotation: null,
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearStatus: (state) => {
            state.error = null;
            state.successMessage = null;
        },
        clearCurrentQuotation: (state) => {
            state.currentQuotation = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Quotation
            .addCase(createQuickQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(createQuickQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Quotation created successfully!";
                state.quotations.unshift(action.payload);
            })
            .addCase(createQuickQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch All Quotations
            .addCase(fetchQuickQuotations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchQuickQuotations.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations = action.payload;
            })
            .addCase(fetchQuickQuotations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Quotation by ID
            .addCase(fetchQuickQuotationById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchQuickQuotationById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentQuotation = action.payload;
            })
            .addCase(fetchQuickQuotationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Quotation
            .addCase(updateQuickQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateQuickQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Quotation updated successfully!";
                const index = state.quotations.findIndex(q => q._id === action.payload._id);
                if (index !== -1) {
                    state.quotations[index] = action.payload;
                }
                state.currentQuotation = action.payload;
            })
            .addCase(updateQuickQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete Quotation
            .addCase(deleteQuickQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteQuickQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Quotation deleted successfully!";
                state.quotations = state.quotations.filter(q => q._id !== action.payload);
                state.currentQuotation = null;
            })
            .addCase(deleteQuickQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Send Mail
            .addCase(sendQuickQuotationMail.fulfilled, (state, action) => {
                state.successMessage = action.payload.message;
            })
            .addCase(sendQuickQuotationMail.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearStatus, clearCurrentQuotation } = quickQuotationSlice.actions;
export default quickQuotationSlice.reducer;