// src/features/packageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { packagesAxios } from "../Utils/axiosInstance";

// 🔧 Normalize API response (items or packages)
const normalizeArray = (payload) => {
  return payload?.items || payload?.packages || [];
};

const filterByCategory = (items, category) =>
  (items || []).filter(
    (pkg) =>
      String(pkg?.packageCategory || "").toLowerCase() ===
      String(category).toLowerCase(),
  );

const fetchActivePackagesByCategory = async (category, limit = 50) => {
  const res = await packagesAxios.get("/", {
    params: {
      page: 1,
      limit: 100,
      status: "active",
    },
  });
  const items = res.data?.items || res.data?.packages || [];
  const packages = filterByCategory(items, category).slice(0, limit);
  return {
    packages,
    totalPackages: packages.length,
    filters: { packageCategory: category, status: "active" },
  };
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
  async ({ page = 1, limit = 9 } = {}, { rejectWithValue }) => {
    try {
      // Use list endpoint (avoids stale empty Redis cache on /tour-type/domestic)
      const res = await packagesAxios.get("/", {
        params: {
          page,
          limit,
          tourType: "Domestic",
          status: "active",
        },
      });
      const data = res.data || {};
      return {
        packages: data.items || data.packages || [],
        totalPackages: data.total ?? data.totalPackages ?? 0,
        totalPages: data.totalPages || 0,
        currentPage: data.page || page,
        filters: { tourType: "Domestic", status: "active" },
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    // Prevent empty-result / remount loops from firing the same request repeatedly
    condition: ({ page = 1, limit = 9 } = {}, { getState }) => {
      const { packages } = getState();
      const queryKey = `${page}:${limit}`;
      if (packages.domesticStatus === "loading") return false;
      if (
        packages.domesticStatus === "succeeded" &&
        packages.domesticQueryKey === queryKey &&
        packages.domestic.length > 0
      ) {
        return false;
      }
      // Allow one retry if previous result was empty (stale/wrong cache)
      if (
        packages.domesticStatus === "succeeded" &&
        packages.domesticQueryKey === queryKey &&
        packages.domestic.length === 0
      ) {
        return packages.domesticEmptyRetries < 1;
      }
      return true;
    },
  }
);

// ✅ Fetch international packages
export const fetchInternationalPackages = createAsyncThunk(
  "packages/fetchInternationalPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await packagesAxios.get("/", {
        params: {
          page: 1,
          limit: 50,
          tourType: "International",
          status: "active",
        },
      });
      const data = res.data || {};
      return {
        packages: data.items || data.packages || [],
        totalPackages: data.total ?? data.totalPackages ?? 0,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      if (packages.internationalStatus === "loading") return false;
      if (
        packages.internationalStatus === "succeeded" &&
        packages.international.length > 0
      ) {
        return false;
      }
      if (
        packages.internationalStatus === "succeeded" &&
        packages.international.length === 0
      ) {
        return packages.internationalEmptyRetries < 1;
      }
      return true;
    },
  }
);

// ✅ Fetch yatra packages
export const fetchYatraPackages = createAsyncThunk(
  "packages/fetchYatraPackages",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchActivePackagesByCategory("Yatra");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      if (packages.yatraStatus === "loading") return false;
      if (packages.yatraStatus === "succeeded" && packages.yatra.length > 0) {
        return false;
      }
      return true;
    },
  }
);

// ✅ Fetch holiday packages
export const fetchHolidayPackages = createAsyncThunk(
  "packages/fetchHolidayPackages",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchActivePackagesByCategory("Holiday");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      if (packages.holidayStatus === "loading") return false;
      if (packages.holidayStatus === "succeeded" && packages.holiday.length > 0) {
        return false;
      }
      return true;
    },
  }
);

// ✅ Fetch special packages
export const fetchSpecialPackages = createAsyncThunk(
  "packages/fetchSpecialPackages",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchActivePackagesByCategory("Special");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      if (packages.specialStatus === "loading") return false;
      if (packages.specialStatus === "succeeded" && packages.special.length > 0) {
        return false;
      }
      return true;
    },
  }
);

// ✅ Fetch latest packages
export const fetchLatestPackages = createAsyncThunk(
  "packages/fetchLatestPackages",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchActivePackagesByCategory("Latest");
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      if (packages.latestStatus === "loading") return false;
      if (packages.latestStatus === "succeeded" && packages.latest.length > 0) {
        return false;
      }
      return true;
    },
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
  },
  {
    condition: (_, { getState }) => {
      const { packages } = getState();
      return (
        packages.popularStatus !== "loading" &&
        packages.popularStatus !== "succeeded"
      );
    },
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
    currentSector: "All",
    domesticStatus: "idle",
    domesticQueryKey: null,
    domesticEmptyRetries: 0,
    internationalStatus: "idle",
    internationalEmptyRetries: 0,
    yatraStatus: "idle",
    holidayStatus: "idle",
    specialStatus: "idle",
    latestStatus: "idle",
    popularStatus: "idle",
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
      state.currentSector = "All";
      state.domesticStatus = "idle";
      state.domesticQueryKey = null;
      state.domesticEmptyRetries = 0;
      state.internationalStatus = "idle";
      state.internationalEmptyRetries = 0;
      state.yatraStatus = "idle";
      state.holidayStatus = "idle";
      state.specialStatus = "idle";
      state.latestStatus = "idle";
      state.popularStatus = "idle";
    },
    // Allow forced refetch (e.g. pagination / manual refresh)
    invalidateDomesticPackages: (state) => {
      state.domesticStatus = "idle";
      state.domesticQueryKey = null;
    },
    setCurrentSector: (state, action) => {
      state.currentSector = action.payload;
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
      .addCase(fetchDomesticPackages.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.domesticStatus = "loading";
        const { page = 1, limit = 9 } = action.meta.arg || {};
        state.domesticQueryKey = `${page}:${limit}`;
      })
      .addCase(fetchDomesticPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.domesticStatus = "succeeded";
        state.domestic = normalizeArray(action.payload);
        state.page = action.payload?.currentPage || 1;
        state.totalPages = Number(action.payload?.totalPages) || 0;
        state.totalPackages = Number(action.payload?.totalPackages) || 0;
        const { page = 1, limit = 9 } = action.meta.arg || {};
        state.domesticQueryKey = `${page}:${limit}`;
        if (state.domestic.length === 0) {
          state.domesticEmptyRetries += 1;
        } else {
          state.domesticEmptyRetries = 0;
        }
      })
      .addCase(fetchDomesticPackages.rejected, (state, action) => {
        state.loading = false;
        state.domesticStatus = "failed";
        state.error = action.payload;
      })

      // International
      .addCase(fetchInternationalPackages.pending, (state) => {
        state.internationalStatus = "loading";
      })
      .addCase(fetchInternationalPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.internationalStatus = "succeeded";
        state.international = normalizeArray(action.payload);
        if (state.international.length === 0) {
          state.internationalEmptyRetries += 1;
        } else {
          state.internationalEmptyRetries = 0;
        }
      })
      .addCase(fetchInternationalPackages.rejected, (state, action) => {
        state.internationalStatus = "failed";
        state.error = action.payload;
      })

      // Yatra
      .addCase(fetchYatraPackages.pending, (state) => {
        state.yatraStatus = "loading";
      })
      .addCase(fetchYatraPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.yatraStatus = "succeeded";
        state.yatra = normalizeArray(action.payload);
      })
      .addCase(fetchYatraPackages.rejected, (state, action) => {
        state.yatraStatus = "failed";
        state.error = action.payload;
      })

      // Holiday
      .addCase(fetchHolidayPackages.pending, (state) => {
        state.holidayStatus = "loading";
      })
      .addCase(fetchHolidayPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.holidayStatus = "succeeded";
        state.holiday = normalizeArray(action.payload);
      })
      .addCase(fetchHolidayPackages.rejected, (state, action) => {
        state.holidayStatus = "failed";
        state.error = action.payload;
      })

      // Special
      .addCase(fetchSpecialPackages.pending, (state) => {
        state.specialStatus = "loading";
      })
      .addCase(fetchSpecialPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.specialStatus = "succeeded";
        state.special = normalizeArray(action.payload);
      })
      .addCase(fetchSpecialPackages.rejected, (state, action) => {
        state.specialStatus = "failed";
        state.error = action.payload;
      })

      // Latest
      .addCase(fetchLatestPackages.pending, (state) => {
        state.latestStatus = "loading";
      })
      .addCase(fetchLatestPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.latestStatus = "succeeded";
        state.latest = normalizeArray(action.payload);
      })
      .addCase(fetchLatestPackages.rejected, (state, action) => {
        state.latestStatus = "failed";
        state.error = action.payload;
      })

      // Popular
      .addCase(fetchPopularTours.pending, (state) => {
        state.popularStatus = "loading";
      })
      .addCase(fetchPopularTours.fulfilled, (state, action) => {
        state.loading = false;
        state.popularStatus = "succeeded";
        state.popular = normalizeArray(action.payload);
      })
      .addCase(fetchPopularTours.rejected, (state, action) => {
        state.popularStatus = "failed";
        state.error = action.payload;
      })

      // Single package
      .addCase(fetchPackageById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackageById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload || null;
      })
      .addCase(fetchPackageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
  invalidateDomesticPackages,
  setCurrentSector,
} = packageSlice.actions;

export default packageSlice.reducer;
