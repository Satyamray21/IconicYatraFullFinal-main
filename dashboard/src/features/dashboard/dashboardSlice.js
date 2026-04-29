import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchDashboardStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { activityDate } = params;
      const url = activityDate 
        ? `/dashboard/stats?activityDate=${activityDate}` 
        : "/dashboard/stats";
      const response = await axios.get(url);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const createReminder = createAsyncThunk(
  "dashboard/createReminder",
  async (reminderData, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post("/reminders", reminderData);
      dispatch(fetchDashboardStats());
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create reminder"
      );
    }
  }
);

export const updateReminderStatus = createAsyncThunk(
  "dashboard/updateReminderStatus",
  async ({ id, status }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.patch(`/reminders/${id}`, { status });
      dispatch(fetchDashboardStats());
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update status"
      );
    }
  }
);

const initialState = {
  stats: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardStats: (state) => {
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
