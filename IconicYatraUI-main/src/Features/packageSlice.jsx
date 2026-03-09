// src/features/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { packagesAxios } from "../Utils/axiosInstance";

// 🔧 Normalize API response (items or packages)
const normalizeArray = (payload) => {
  return payload?.items || payload?.packages || [];
};

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

// ✅ Fetch holiday packages
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

// ✅ Fetch special packages
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

// ✅ Fetch latest packages
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

// ✅ Fetch popular tours
export const fetchPopularTours = createAsyncThunk(
  "packages/fetchPopularTours",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/popular");
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

// ✅ Generic tour type fetch
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

const packageSlice = createSlice({
  name: "packages",

  initialState: {
    items: [],
    domestic: [],
    international: [],
    yatra: [],
    holiday: [],
    special: [],
    latest: [],
    popular: [],
    selected: null,
    loading: false,
    error: null,
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
      state.page = 1;
    },
  },

  extraReducers: (builder) => {
    builder

      // All packages
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = normalizeArray(action.payload);
        state.total = action.payload?.total || 0;
        state.page = action.payload?.page || 1;
        state.limit = action.payload?.limit || 9;
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Domestic
      .addCase(fetchDomesticPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.domestic = normalizeArray(action.payload);
        state.page = action.payload?.currentPage || 1;
        state.totalPages = action.payload?.totalPages || 1;
        state.totalPackages = action.payload?.totalPackages || 0;
      })

      // International
      .addCase(fetchInternationalPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.international = normalizeArray(action.payload);
      })

      // Yatra
      .addCase(fetchYatraPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.yatra = normalizeArray(action.payload);
      })

      // Holiday
      .addCase(fetchHolidayPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.holiday = normalizeArray(action.payload);
      })

      // Special
      .addCase(fetchSpecialPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.special = normalizeArray(action.payload);
      })

      // Latest
      .addCase(fetchLatestPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.latest = normalizeArray(action.payload);
      })

      // Popular
      .addCase(fetchPopularTours.fulfilled, (state, action) => {
        state.loading = false;
        state.popular = normalizeArray(action.payload);
      })

      // Single package
      .addCase(fetchPackageById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload || null;
      })

      // Dynamic tour type
      .addCase(fetchPackagesByTourType.fulfilled, (state, action) => {
        state.loading = false;
        const { tourType, data } = action.payload;
        state[tourType.toLowerCase()] = normalizeArray(data);
      });
  },
});

export const {
  clearSelected,
  clearError,
  setLoading,
  clearAllPackages,
} = packageSlice.actions;

export default packageSlice.reducer;
