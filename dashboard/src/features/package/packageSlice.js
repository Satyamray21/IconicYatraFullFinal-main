import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// Create package
export const createPackage = createAsyncThunk(
    "packages/createPackage",
    async (data, { rejectWithValue }) => {
        try {
            const res = await axios.post("/packages", data);
            return res.data.package || res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch all packages
export const fetchPackages = createAsyncThunk(
  "packages/fetchPackages",
  async (params = {}, { rejectWithValue }) => {
    try {

      const res = await axios.get("/packages", {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status || "",
          tourType: params.tourType || "",
          search: params.search || ""
        }
      });

      return res.data;

    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ NEW: Fetch packages by tour type
export const fetchPackagesByTourType = createAsyncThunk(
    "packages/fetchPackagesByTourType",
    async ({ tourType, params = {} }, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/packages/tour-type/${tourType}`, { params });
            return { ...res.data, tourType };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// ✅ NEW: Fetch specific tour type packages (convenience functions)
export const fetchDomesticPackages = createAsyncThunk(
    "packages/fetchDomesticPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/domestic", { params });
            return { ...res.data, tourType: "Domestic" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchInternationalPackages = createAsyncThunk(
    "packages/fetchInternationalPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/international", { params });
            return { ...res.data, tourType: "International" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchYatraPackages = createAsyncThunk(
    "packages/fetchYatraPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/yatra", { params });
            return { ...res.data, tourType: "Yatra" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchHolidayPackages = createAsyncThunk(
    "packages/fetchHolidayPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/holiday", { params });
            return { ...res.data, tourType: "Holiday" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchSpecialPackages = createAsyncThunk(
    "packages/fetchSpecialPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/special", { params });
            return { ...res.data, tourType: "Special" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchLatestPackages = createAsyncThunk(
    "packages/fetchLatestPackages",
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await axios.get("/packages/tour-type/latest", { params });
            return { ...res.data, tourType: "Latest" };
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch package by ID
export const fetchPackageById = createAsyncThunk(
    "packages/fetchPackageById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/packages/${id}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Update Step 1 (Package Info)
export const updatePackageStep1 = createAsyncThunk(
    "packages/updateStep1",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/packages/${id}/step1`, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Update Step 2 (Tour Details)
export const updatePackageTourDetails = createAsyncThunk(
    "packages/updateTourDetails",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`/packages/${id}/tour-details`, data, {
                headers: { "Content-Type": "application/json" },
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Delete package
export const deletePackage = createAsyncThunk(
    "packages/deletePackage",
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`/packages/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Upload banner
export const uploadPackageBanner = createAsyncThunk(
    "packages/uploadBanner",
    async ({ id, file }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("banner", file); // 👈 backend me field name 'banner'

            const res = await axios.post(`/packages/${id}/banner`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data; // updated package return karega
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Upload day image
export const uploadPackageDayImage = createAsyncThunk(
    "packages/uploadDayImage",
    async ({ id, dayIndex, file }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("dayImage", file); // 👈 backend me field name 'dayImage'

            const res = await axios.post(`/packages/${id}/days/${dayIndex}/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            return res.data; // updated package return karega
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Slice
const packageSlice = createSlice({
    name: "packages",
    initialState: {
        items: [],
        total: 0,
        current: null,
        loading: false,
        error: null,
        // ✅ NEW: Separate state for different tour types
        tourTypePackages: {
            domestic: { items: [], total: 0 },
            international: { items: [], total: 0 },
            yatra: { items: [], total: 0 },
            holiday: { items: [], total: 0 },
            special: { items: [], total: 0 },
            latest: { items: [], total: 0 }
        },
        tourTypeLoading: false,
        tourTypeError: null
    },
    reducers: {
        clearCurrent: (state) => {
            state.current = null;
        },
        // ✅ NEW: Clear specific tour type data
        clearTourTypePackages: (state, action) => {
            const tourType = action.payload;
            if (tourType && state.tourTypePackages[tourType.toLowerCase()]) {
                state.tourTypePackages[tourType.toLowerCase()] = { items: [], total: 0 };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createPackage.pending, (state) => { state.loading = true; })
            .addCase(createPackage.fulfilled, (state, action) => {
                state.loading = false;

                // ✅ FIX: Handle the response structure correctly
                let pkg;
                if (action.payload.package) {
                    // Response: { message: "...", package: {...} }
                    pkg = action.payload.package;
                } else if (action.payload._id) {
                    // Response: package object directly
                    pkg = action.payload;
                } else {
                    console.error("Invalid package response:", action.payload);
                    return;
                }

                state.items.unshift(pkg);
                state.current = pkg;

                // ✅ Also add to respective tour type
                if (pkg.tourType && state.tourTypePackages[pkg.tourType.toLowerCase()]) {
                    state.tourTypePackages[pkg.tourType.toLowerCase()].items.unshift(pkg);
                    state.tourTypePackages[pkg.tourType.toLowerCase()].total += 1;
                }
            })
            .addCase(createPackage.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Fetch all
            .addCase(fetchPackages.pending, (state) => { state.loading = true; })
            .addCase(fetchPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.total = action.payload.total;
            })
            .addCase(fetchPackages.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // ✅ NEW: Fetch packages by tour type (dynamic)
            .addCase(fetchPackagesByTourType.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchPackagesByTourType.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                const { tourType, items, total } = action.payload;
                if (tourType && state.tourTypePackages[tourType.toLowerCase()]) {
                    state.tourTypePackages[tourType.toLowerCase()] = { items, total };
                }
            })
            .addCase(fetchPackagesByTourType.rejected, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypeError = action.payload;
            })

            // ✅ NEW: Specific tour type packages
            .addCase(fetchDomesticPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchDomesticPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.domestic = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })
            .addCase(fetchDomesticPackages.rejected, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypeError = action.payload;
            })

            .addCase(fetchInternationalPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchInternationalPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.international = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })

            .addCase(fetchYatraPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchYatraPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.yatra = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })

            .addCase(fetchHolidayPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchHolidayPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.holiday = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })

            .addCase(fetchSpecialPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchSpecialPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.special = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })

            .addCase(fetchLatestPackages.pending, (state) => { state.tourTypeLoading = true; })
            .addCase(fetchLatestPackages.fulfilled, (state, action) => {
                state.tourTypeLoading = false;
                state.tourTypePackages.latest = {
                    items: action.payload.items,
                    total: action.payload.total
                };
            })

            // Fetch by ID
            .addCase(fetchPackageById.pending, (state) => { state.loading = true; })
            .addCase(fetchPackageById.fulfilled, (state, action) => {
                state.loading = false;
                state.current = action.payload;
            })
            .addCase(fetchPackageById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updatePackageStep1.fulfilled, (state, action) => {
                const pkg = action.payload.package || action.payload;
                state.current = pkg;
                state.items = state.items.map(p => p._id === pkg._id ? pkg : p);

                // ✅ NEW: Update in tour type packages as well
                if (pkg.tourType && state.tourTypePackages[pkg.tourType.toLowerCase()]) {
                    state.tourTypePackages[pkg.tourType.toLowerCase()].items =
                        state.tourTypePackages[pkg.tourType.toLowerCase()].items.map(p =>
                            p._id === pkg._id ? pkg : p
                        );
                }
            })

            .addCase(updatePackageTourDetails.fulfilled, (state, action) => {
                const pkg = action.payload.package || action.payload;
                state.current = pkg;
                state.items = state.items.map(p => p._id === pkg._id ? pkg : p);

                // ✅ NEW: Update in tour type packages as well
                if (pkg.tourType && state.tourTypePackages[pkg.tourType.toLowerCase()]) {
                    state.tourTypePackages[pkg.tourType.toLowerCase()].items =
                        state.tourTypePackages[pkg.tourType.toLowerCase()].items.map(p =>
                            p._id === pkg._id ? pkg : p
                        );
                }
            })

            // Delete
            .addCase(deletePackage.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.items = state.items.filter(p => p._id !== deletedId);
                if (state.current?._id === deletedId) state.current = null;

                // ✅ NEW: Remove from all tour type packages
                Object.keys(state.tourTypePackages).forEach(tourType => {
                    state.tourTypePackages[tourType].items =
                        state.tourTypePackages[tourType].items.filter(p => p._id !== deletedId);
                    state.tourTypePackages[tourType].total =
                        state.tourTypePackages[tourType].items.length;
                });
            })
            .addCase(uploadPackageBanner.fulfilled, (state, action) => {
                const pkg = action.payload.package || action.payload;
                state.current = pkg;
                state.items = state.items.map(p => p._id === pkg._id ? pkg : p);
            })
            .addCase(uploadPackageDayImage.fulfilled, (state, action) => {
                const pkg = action.payload.package || action.payload;
                state.current = pkg;
                state.items = state.items.map(p => p._id === pkg._id ? pkg : p);
            });

    }
});

export const { clearCurrent, clearTourTypePackages } = packageSlice.actions;
export default packageSlice.reducer;