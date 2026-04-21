import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// -------------------- Thunks --------------------

// Create new quotation
export const createCustomQuotation = createAsyncThunk(
    "customQuotation/create",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await axios.post("/customQT/", formData);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Create failed");
        }
    }
);

// Get all quotations
export const getAllCustomQuotations = createAsyncThunk(
    "customQuotation/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get("/customQT");
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Fetch failed");
        }
    }
);

// Get single quotation by ID
export const getCustomQuotationById = createAsyncThunk(
    "customQuotation/getById",
    async (quotationId, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/customQT/${quotationId}`);
            return res.data?.data ?? res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Fetch failed");
        }
    }
);

// Update full quotation — use quotationId (e.g. ICYR_CQ_0001) from URL, or Mongo _id as id
export const updateCustomQuotation = createAsyncThunk(
    "customQuotation/update",
    async ({ id, quotationId, formData }, { rejectWithValue }) => {
        try {
            const url = quotationId
                ? `/customQT/quotation/${encodeURIComponent(quotationId)}`
                : `/customQT/${id}`;
            const res = await axios.put(url, formData);
            const payload = res.data?.data ?? res.data;
            return payload;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Update failed");
        }
    }
);

// -------------------- New Step-wise Update --------------------
// customQuotationSlice.js - Update the updateQuotationStep thunk
// -------------------- New Step-wise Update --------------------
// In your customQuotationSlice.js - Update the updateQuotationStep thunk
export const updateQuotationStep = createAsyncThunk(
    "customQuotation/updateStep",
    async ({ quotationId, stepNumber, stepData }, { rejectWithValue }) => {
        try {
            console.log("🔄 Redux: Preparing step update", {
                quotationId,
                stepNumber,
                isFormData: stepData instanceof FormData
            });

            let requestData;
            let config = {};

            if (stepData instanceof FormData) {
                // For FormData (Step 4) - append fields properly
                stepData.append('quotationId', quotationId);
                stepData.append('stepNumber', stepNumber.toString());

                // Log FormData contents for debugging
                console.log("📦 FormData contents:");
                for (let [key, value] of stepData.entries()) {
                    console.log(`   ${key}:`, key === 'itineraryImages' ? `File (${value.name})` : value);
                }

                requestData = stepData;
                config.headers = {
                    'Content-Type': 'multipart/form-data',
                };
            } else {
                // For regular JSON data
                requestData = {
                    quotationId,
                    stepNumber: Number(stepNumber),
                    stepData
                };
                console.log("📦 JSON data:", requestData);
            }

            const res = await axios.post("/customQT/update-step", requestData, config);
            console.log("✅ Redux: Step update successful");
            return res.data.data;
        } catch (err) {
            console.error("❌ Redux: Step update failed:", err);
            console.error("❌ Error details:", err.response?.data);
            return rejectWithValue(err.response?.data?.message || "Step update failed");
        }
    }
);

// Update costing: packageCalculations, companyMargin, discount
export const updateCustomQuotationCosting = createAsyncThunk(
    "customQuotation/updateCosting",
    async ({ quotationId, body }, { rejectWithValue }) => {
        try {
            const res = await axios.patch(
                `/customQT/${encodeURIComponent(quotationId)}/package-calculations`,
                body
            );
            return res.data?.data ?? res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Costing update failed"
            );
        }
    }
);

// Finalize custom quotation (Standard / Deluxe / Superior)
export const finalizeCustomQuotation = createAsyncThunk(
    "customQuotation/finalize",
    async (
        { quotationId, finalizedPackage, finalizedPackages, finalizedVendorsWithAmounts },
        { rejectWithValue, getState }
    ) => {
        try {
            const payload = {};
            const selectedQuotation = getState()?.customQuotation?.selectedQuotation;
            const existingPackage =
                selectedQuotation?.finalizedPackages?.[0] ||
                selectedQuotation?.finalizedPackage;
            
            // Prioritize multiple packages if available
            if (Array.isArray(finalizedPackages) && finalizedPackages.length > 0) {
                payload.finalizedPackages = finalizedPackages;
                payload.finalizedPackage = finalizedPackages[0];
            } else if (finalizedPackage && String(finalizedPackage).trim()) {
                payload.finalizedPackage = finalizedPackage;
            } else if (
                Array.isArray(finalizedVendorsWithAmounts) &&
                finalizedVendorsWithAmounts.length > 0 &&
                existingPackage
            ) {
                // Backend currently requires a valid package even for vendor-only updates.
                payload.finalizedPackage = existingPackage;
            }
            
            // Add vendor amounts if provided
            if (Array.isArray(finalizedVendorsWithAmounts) && finalizedVendorsWithAmounts.length > 0) {
                payload.finalizedVendorsWithAmounts = finalizedVendorsWithAmounts;
            }
            
            const res = await axios.patch(`/customQT/${quotationId}/finalize`, payload);
            return res.data?.data ?? res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Finalize failed"
            );
        }
    }
);

// Delete quotation
export const deleteCustomQuotation = createAsyncThunk(
    "customQuotation/delete",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.delete(`/customQT/${id}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Delete failed");
        }
    }
);

// -------------------- Slice --------------------
const customQuotationSlice = createSlice({
    name: "customQuotation",
    initialState: {
        quotations: [],
        selectedQuotation: null,
        loading: false,
        error: null,
        searchResult: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSearchResult: (state) => {
            state.searchResult = null;
        },
    },
    extraReducers: (builder) => {
        // Create
        builder.addCase(createCustomQuotation.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(createCustomQuotation.fulfilled, (state, action) => {
            state.loading = false;
            state.quotations.push(action.payload);
        });
        builder.addCase(createCustomQuotation.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Get All
        builder.addCase(getAllCustomQuotations.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getAllCustomQuotations.fulfilled, (state, action) => {
            state.loading = false;
            state.quotations = action.payload;
        });
        builder.addCase(getAllCustomQuotations.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Get By Id
        builder.addCase(getCustomQuotationById.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getCustomQuotationById.fulfilled, (state, action) => {
            state.loading = false;
            state.selectedQuotation = action.payload;
        });
        builder.addCase(getCustomQuotationById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Full Update
        builder.addCase(updateCustomQuotation.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateCustomQuotation.fulfilled, (state, action) => {
            state.loading = false;
            const idx = state.quotations.findIndex(
                (q) => q._id === action.payload._id
            );
            if (idx !== -1) state.quotations[idx] = action.payload;
            if (state.selectedQuotation?._id === action.payload._id) {
                state.selectedQuotation = action.payload;
            }
        });
        builder.addCase(updateCustomQuotation.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Step-wise Update
        builder.addCase(updateQuotationStep.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateQuotationStep.fulfilled, (state, action) => {
            state.loading = false;
            const idx = state.quotations.findIndex(
                (q) => q._id === action.payload._id
            );
            if (idx !== -1) state.quotations[idx] = action.payload;
            if (state.selectedQuotation?._id === action.payload._id) {
                state.selectedQuotation = action.payload;
            }
        });
        builder.addCase(updateQuotationStep.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        builder.addCase(updateCustomQuotationCosting.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateCustomQuotationCosting.fulfilled, (state, action) => {
            state.loading = false;
            const idx = state.quotations.findIndex(
                (q) => q._id === action.payload._id
            );
            if (idx !== -1) state.quotations[idx] = action.payload;
            if (
                state.selectedQuotation?._id === action.payload._id ||
                state.selectedQuotation?.quotationId ===
                    action.payload.quotationId
            ) {
                state.selectedQuotation = action.payload;
            }
        });
        builder.addCase(updateCustomQuotationCosting.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        builder.addCase(finalizeCustomQuotation.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(finalizeCustomQuotation.fulfilled, (state, action) => {
            state.loading = false;
            const idx = state.quotations.findIndex(
                (q) => q._id === action.payload._id
            );
            if (idx !== -1) state.quotations[idx] = action.payload;
            if (state.selectedQuotation?._id === action.payload._id) {
                state.selectedQuotation = action.payload;
            }
        });
        builder.addCase(finalizeCustomQuotation.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Delete
        builder.addCase(deleteCustomQuotation.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(deleteCustomQuotation.fulfilled, (state, action) => {
            state.loading = false;
            state.quotations = state.quotations.filter(
                (q) => q._id !== action.payload._id
            );
            if (state.selectedQuotation?._id === action.payload._id) {
                state.selectedQuotation = null;
            }
        });
        builder.addCase(deleteCustomQuotation.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const { clearError, clearSearchResult } = customQuotationSlice.actions;
export default customQuotationSlice.reducer;