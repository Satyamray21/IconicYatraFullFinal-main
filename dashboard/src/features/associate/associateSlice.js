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

// Create new associate
export const createAssociate = createAsyncThunk("associate/create", async (associateData) => {
  const res = await axios.post("/associate", associateData);
  return res.data;
});

// Update associate
export const updateAssociate = createAsyncThunk("associate/update", async ({ id, data }) => {
  const res = await axios.put(`/associate/${id}`, data);
  return res.data;
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
  },
  reducers: {
    clearSelectedAssociate: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
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
      });
  },
});

export const { clearSelectedAssociate, clearError } = associateSlice.actions;
export default associateSlice.reducer;