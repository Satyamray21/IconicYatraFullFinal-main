import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios.js";


// ==========================================
// GET COMPANY (Auto Create If Not Exists)
// ==========================================
export const getCompany = createAsyncThunk(
  "companyUi/getCompany",
  async (_, thunkApi) => {
    try {
      const res = await axios.get("/companyUi");
      return res.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err?.response?.data?.message
      );
    }
  }
);


// ==========================================
// UPSERT COMPANY (Create + Update)
// ==========================================
export const upsertCompany = createAsyncThunk(
  "companyUi/upsertCompany",
  async (data, thunkApi) => {
    try {
      const res = await axios.put("/companyUi", data); // data = FormData
      return res.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err?.response?.data?.message
      );
    }
  }
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
      })

      // ================= UPSERT =================
      .addCase(upsertCompany.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(upsertCompany.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(upsertCompany.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});


export const { clearCompanyError } = companyUISlice.actions;

export default companyUISlice.reducer;
