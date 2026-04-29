import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { companyUIAxios } from "../Utils/axiosInstance";

// ==========================================
// GET COMPANY (Auto Create If Not Exists)
// ==========================================
export const getCompany = createAsyncThunk(
  "companyUi/getCompany",
  async (_, thunkApi) => {
    try {
      const res = await companyUIAxios.get("/");
      return res.data;
    } catch (err) {
      return thunkApi.rejectWithValue(err?.response?.data?.message);
    }
  },
);

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const companyUISlice = createSlice({
  name: "companyUI",
  initialState,
  reducers: {
    clearCompanyError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= GET =================
      .addCase(getCompany.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(getCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearCompanyError } = companyUISlice.actions;

export default companyUISlice.reducer;
