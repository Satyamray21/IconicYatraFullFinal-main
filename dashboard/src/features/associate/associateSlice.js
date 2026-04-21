import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// Fetch all associates
export const fetchAllAssociates = createAsyncThunk("associate/fetchAll", async () => {
  const res = await axios.get("/associate");
  return res.data;
});

// Fetch single associate by ID
export const fetchAssociateById = createAsyncThunk("associate/fetchById", async (id) => {
  const res = await axios.get(`/associate/${id}`);
  return res.data;
});

// Fetch quotations assigned to a specific associate
export const fetchAssociateQuotations = createAsyncThunk(
  "associate/fetchQuotations",
  async (id) => {
    const res = await axios.get(`/associate/${id}/quotations`);
    return res.data;
  }
);

// Create new associate
export const createAssociate = createAsyncThunk("associate/create", async (associateData) => {
  // Check if qrCode file exists in any nested form data
  const hasFile = associateData.bank?.qrCode instanceof File;

  if (hasFile) {
    const formData = new FormData();
    
    // Convert the entire data structure to FormData
    const convertToFormData = (obj, prefix = "") => {
      for (const key in obj) {
        const value = obj[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value && typeof value === "object" && value.$isDayjsObject) {
          // Handle dayjs objects - convert to ISO date string
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value.toDate().toISOString().split('T')[0]);
        } else if (value instanceof Date) {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value.toISOString());
        } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
          convertToFormData(value, prefix ? `${prefix}.${key}` : key);
        } else if (value !== null && value !== undefined) {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value);
        }
      }
    };

    convertToFormData(associateData);
    const res = await axios.post("/associate", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  } else {
    const res = await axios.post("/associate", associateData);
    return res.data;
  }
});

// Update associate
export const updateAssociate = createAsyncThunk("associate/update", async ({ id, data }) => {
  // Check if qrCode file exists
  const hasFile = data.bank?.qrCode instanceof File;

  if (hasFile) {
    const formData = new FormData();
    
    // Convert the entire data structure to FormData
    const convertToFormData = (obj, prefix = "") => {
      for (const key in obj) {
        const value = obj[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value && typeof value === "object" && value.$isDayjsObject) {
          // Handle dayjs objects - convert to ISO date string
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value.toDate().toISOString().split('T')[0]);
        } else if (value instanceof Date) {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value.toISOString());
        } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
          convertToFormData(value, prefix ? `${prefix}.${key}` : key);
        } else if (value !== null && value !== undefined) {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          formData.append(fieldName, value);
        }
      }
    };

    convertToFormData(data);
    const res = await axios.put(`/associate/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  } else {
    const res = await axios.put(`/associate/${id}`, data);
    return res.data;
  }
});

// Delete associate
export const deleteAssociate = createAsyncThunk("associate/delete", async (id) => {
  await axios.delete(`/associate/${id}`);
  return id;
});

const associateSlice = createSlice({
  name: "associate",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    deleting: false,
    error: null,
    quotations: [],
    quotationsLoading: false,
    quotationsError: null,
    quotationsTotal: 0,
    quotationsForAssociate: null,
  },
  reducers: {
    clearSelectedAssociate: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAssociateQuotations: (state) => {
      state.quotations = [];
      state.quotationsTotal = 0;
      state.quotationsForAssociate = null;
      state.quotationsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all associates
      .addCase(fetchAllAssociates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAssociates.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllAssociates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch associate by ID
      .addCase(fetchAssociateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssociateById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchAssociateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create associate
      .addCase(createAssociate.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // Update associate
      .addCase(updateAssociate.fulfilled, (state, action) => {
        const idx = state.list.findIndex(item => item._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected && state.selected._id === action.payload._id) {
          state.selected = action.payload;
        }
      })
      // Delete associate
      .addCase(deleteAssociate.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteAssociate.fulfilled, (state, action) => {
        state.deleting = false;
        state.list = state.list.filter(item => item._id !== action.payload);
      })
      .addCase(deleteAssociate.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.error.message;
      })
      // Fetch associate quotations
      .addCase(fetchAssociateQuotations.pending, (state, action) => {
        state.quotationsLoading = true;
        state.quotationsError = null;
        state.quotationsForAssociate = action.meta.arg;
      })
      .addCase(fetchAssociateQuotations.fulfilled, (state, action) => {
        state.quotationsLoading = false;
        state.quotations = action.payload?.quotations || [];
        state.quotationsTotal = action.payload?.totalAssignedAmount || 0;
      })
      .addCase(fetchAssociateQuotations.rejected, (state, action) => {
        state.quotationsLoading = false;
        state.quotationsError = action.error.message;
      });
  },
});

export const {
  clearSelectedAssociate,
  clearError,
  clearAssociateQuotations,
} = associateSlice.actions;
export default associateSlice.reducer;