import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axios";

export const fetchUnifiedQuotationStats = createAsyncThunk(
  "unifiedQuotation/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/quotations/stats");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load stats");
    }
  }
);

const unifiedQuotationSlice = createSlice({
  name: "unifiedQuotation",
  initialState: {
    stats: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnifiedQuotationStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnifiedQuotationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUnifiedQuotationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default unifiedQuotationSlice.reducer;
