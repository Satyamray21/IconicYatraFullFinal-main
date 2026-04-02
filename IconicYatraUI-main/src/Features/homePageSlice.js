import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {homePageAxios} from "../Utils/axiosInstance";

// ================= SAVE HOMEPAGE =================
export const saveHomePage = createAsyncThunk(
  "homePage/save",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post("/home/save", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Save failed" }
      );
    }
  }
);

// ================= GET HOMEPAGE =================
export const getHomePage = createAsyncThunk(
  "homePage/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await homePageAxios.get("/get");
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Fetch failed" }
      );
    }
  }
);

// ================= SLICE =================
const homePageSlice = createSlice({
  name: "homePage",
  initialState: {
    data: null,
    status: "idle",
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearHomePageState: (state) => {
    state.status = "idle";
    state.error = null;
  },
  },
  extraReducers: (builder) => {
    builder

      // ===== SAVE =====
      .addCase(saveHomePage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveHomePage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload.data;
      })
      .addCase(saveHomePage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Save failed";
      })

      // ===== GET =====
      .addCase(getHomePage.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(getHomePage.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.data = action.payload.data;
    })
    .addCase(getHomePage.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload?.message || "Fetch failed";
    });
  },
});

export const { clearHomePageState } = homePageSlice.actions;
export default homePageSlice.reducer;
