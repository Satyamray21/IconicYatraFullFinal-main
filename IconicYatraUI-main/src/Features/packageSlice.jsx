// src/features/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { packagesAxios } from "../Utils/axiosInstance";

// ✅ Fetch all packages
export const fetchPackages = createAsyncThunk(
    "packages/fetchPackages",
    async (_, { rejectWithValue }) => {
        try {
            const res = await packagesAxios.get("/");
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// ✅ Fetch domestic packages
export const fetchDomesticPackages = createAsyncThunk(
  "packages/fetchDomesticPackages",
  async ({ page = 1, limit = 9 }, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get(
        `/tour-type/domestic?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


// ✅ Fetch international packages
export const fetchInternationalPackages = createAsyncThunk(
    "packages/fetchInternationalPackages",
    async (_, { rejectWithValue }) => {
        try {
            const res = await packagesAxios.get("/tour-type/international");
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// ✅ Fetch yatra packages
// ✅ Fetch Yatra packages (by packageCategory)
export const fetchYatraPackages = createAsyncThunk(
  "packages/fetchYatraPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/category/yatra");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Fetch Holiday packages
export const fetchHolidayPackages = createAsyncThunk(
  "packages/fetchHolidayPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/category/holiday");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Fetch Special packages
export const fetchSpecialPackages = createAsyncThunk(
  "packages/fetchSpecialPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/category/special");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Fetch Latest packages
export const fetchLatestPackages = createAsyncThunk(
  "packages/fetchLatestPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/category/latest");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


// ✅ Fetch single package
export const fetchPackageById = createAsyncThunk(
    "packages/fetchPackageById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await packagesAxios.get(`/${id}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// ✅ Generic tour type fetcher (optional - for dynamic tour types)
export const fetchPackagesByTourType = createAsyncThunk(
    "packages/fetchPackagesByTourType",
    async (tourType, { rejectWithValue }) => {
        try {
            const res = await packagesAxios.get(`/tour-type/${tourType}`);
            return { tourType, data: res.data };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);
// ✅ Fetch popular tours (only sector)
export const fetchPopularTours = createAsyncThunk(
    "packages/fetchPopularTours",
    async (_, { rejectWithValue }) => {
        try {
            const res = await packagesAxios.get("/popular");
            return res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || err.message
            );
        }
    }
);

const packageSlice = createSlice({
    name: "packages",
   
        initialState: {
    items: [],
    domestic: [],
    international: [],
    yatra: [],
    holiday: [],
    special: [],
    popular: [],
    latest: [],
    totalPackages: 0,
    totalPages: 1,
    page: 1,
    limit: 9,

    },
    reducers: {
        clearSelected: (state) => {
            state.selected = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        clearAllPackages: (state) => {
            state.items = [];
            state.domestic = [];
            state.international = [];
            state.yatra = [];
            state.holiday = [];
            state.special = [];
            state.latest = [];
            state.popular = [];
            state.total = 0;
            state.page = 1;
        }
    },
    extraReducers: (builder) => {
        builder
            // All packages
            .addCase(fetchPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.limit = action.payload.limit;
            })
            .addCase(fetchPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Domestic packages
            .addCase(fetchDomesticPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
           .addCase(fetchDomesticPackages.fulfilled, (state, action) => {
  state.loading = false;
  state.domestic = action.payload.packages || [];
  state.page = action.payload.currentPage || 1;
  state.totalPages = action.payload.totalPages || 1;
  state.totalPackages = action.payload.totalPackages || 0;
})


            .addCase(fetchDomesticPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // International packages
            .addCase(fetchInternationalPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
           .addCase(fetchInternationalPackages.fulfilled, (state, action) => {
    state.loading = false;
    state.international = action.payload.packages || [];
})

            .addCase(fetchInternationalPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Yatra packages
            .addCase(fetchYatraPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchYatraPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.yatra = action.payload.items;
            })
            .addCase(fetchYatraPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Holiday packages
            .addCase(fetchHolidayPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchHolidayPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.holiday = action.payload.items;
            })
            .addCase(fetchHolidayPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Special packages
            .addCase(fetchSpecialPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSpecialPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.special = action.payload.items;
            })
            .addCase(fetchSpecialPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Latest packages
            .addCase(fetchLatestPackages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLatestPackages.fulfilled, (state, action) => {
                state.loading = false;
                state.latest = action.payload.items;
            })
            .addCase(fetchLatestPackages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Single package
            .addCase(fetchPackageById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPackageById.fulfilled, (state, action) => {
                state.loading = false;
                state.selected = action.payload;
            })
            .addCase(fetchPackageById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Generic tour type fetcher
            .addCase(fetchPackagesByTourType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPackagesByTourType.fulfilled, (state, action) => {
                state.loading = false;
                const { tourType, data } = action.payload;
                // Dynamically set the state based on tourType
                state[tourType.toLowerCase()] = data.items;
            })
            .addCase(fetchPackagesByTourType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Popular Tours
.addCase(fetchPopularTours.pending, (state) => {
    state.loading = true;
    state.error = null;
})
.addCase(fetchPopularTours.fulfilled, (state, action) => {
    state.loading = false;
    state.popular = action.payload.items;
})
.addCase(fetchPopularTours.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
})

    },
});

export const {
    clearSelected,
    clearError,
    setLoading,
    clearAllPackages
} = packageSlice.actions;

export default packageSlice.reducer;