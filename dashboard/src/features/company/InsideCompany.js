// features/company/InsideCompany.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Log the environment variable to see what's available

// Use the environment variable from your .env file
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/company`
  



const initialState = {

  companies: [],
  company: null,
  loading: false,
  error: null,
  success: false,
};

//
// ✅ CREATE COMPANY
//
export const createCompany = createAsyncThunk(
  "company/create",
  async (formData, { rejectWithValue }) => {
    try {
      console.log("🚀 Making POST request to:", BASE_URL);
      console.log("📦 FormData entries:", Object.fromEntries(formData));
      
      // Log the full URL being called
      console.log("Full URL being called:", BASE_URL);
      
      const { data } = await axios.post(BASE_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      
      });
      
      console.log("✅ API Response:", data);
      return data.data;
    } catch (error) {
      console.error("❌ API Error Details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        }
      });
      
      return rejectWithValue(
        error.response?.data?.message || error.message || "Something went wrong"
      );
    }
  }
);

//
// ✅ GET ALL COMPANIES
//
export const fetchCompanies = createAsyncThunk(
  "company/getAll",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🚀 Making GET request to:", BASE_URL);
      const { data } = await axios.get(BASE_URL);
      console.log("✅ GET Response:", data);
      return data.data;
    } catch (error) {
      console.error("❌ Fetch Error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch companies"
      );
    }
  }
);

//
// ✅ GET COMPANY BY ID
//
export const getCompanyById = createAsyncThunk(
  "company/getById",
  async (id, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}/${id}`;
      console.log("Making GET request to:", url);
      const { data } = await axios.get(url);
      return data.data;
    } catch (error) {
      console.error("Get By ID Error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || "Company not found"
      );
    }
  }
);

//
// ✅ UPDATE COMPANY
//
export const updateCompany = createAsyncThunk(
  "company/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}/${id}`;
      console.log("Making PUT request to:", url);
      const { data } = await axios.put(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (error) {
      console.error("Update Error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

//
// ✅ DELETE COMPANY
//
export const deleteCompany = createAsyncThunk(
  "company/delete",
  async (id, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}/${id}`;
      console.log("Making DELETE request to:", url);
      await axios.delete(url);
      return id;
    } catch (error) {
      console.error("Delete Error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || "Delete failed"
      );
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompanyData: (state) => {
      state.company = null;
      state.error = null;
      state.success = false;
    },
    resetSuccess: (state) => {
      state.success = false;
    },
    clearCompany: (state) => {
  state.company = null;
},

  },
  extraReducers: (builder) => {
    builder

      // CREATE
      .addCase(createCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies.unshift(action.payload);
        state.company = action.payload;
        state.success = true;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // GET ALL
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET BY ID
      .addCase(getCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.company = action.payload;
      })
      .addCase(getCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = state.companies.map((company) =>
          company._id === action.payload._id ? action.payload : company
        );
        if (state.company?._id === action.payload._id) {
          state.company = action.payload;
        }
        state.success = true;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // DELETE
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = state.companies.filter(
          (company) => company._id !== action.payload
        );
        if (state.company?._id === action.payload) {
          state.company = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCompanyData,clearCompany, resetSuccess } = companySlice.actions;
export default companySlice.reducer;