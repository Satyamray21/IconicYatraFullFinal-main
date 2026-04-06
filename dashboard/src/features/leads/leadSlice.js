import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios"

export const createLead = createAsyncThunk(
  'lead/createLead',
  async (data, thunkApi) => {
    try {
      const res = await axios.post('/lead/create', data);
      return res.data.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err?.response?.data?.message || 'Failed to create Lead'
      );
    }
  }
);

export const getAllLeads = createAsyncThunk(
  'lead/getAllLeads',
  async (_, thunkApi) => {
    try {
      const res = await axios.get('/lead/getAllLead');
      return res.data.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err?.response?.data?.message || 'Failed to view Lead'
      );
    }
  }
);

export const fetchLeadsReports = createAsyncThunk(
  "leadsReport/fetchLeadsReports",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/lead/get-Count");
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch lead reports");
    }
  }
);

export const changeLeadStatus = createAsyncThunk(
  'leads/changeLeadStatus',
  async ({ leadId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/lead/change-status/${leadId}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update lead status'
      );
    }
  }
);

export const getLeadOptions = createAsyncThunk(
  "lead/getLeadOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/lead/options");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lead options"
      );
    }
  }
);

export const addLeadOption = createAsyncThunk(
  "lead/addLeadOption",
  async ({ fieldName, value }, { rejectWithValue, dispatch }) => {
    try {
      // Save new option in DB
      const res = await axios.post("/lead/options/add", { fieldName, value });

      // After adding successfully → fetch latest options again
      dispatch(getLeadOptions());

      return res.data.data; // response contains {fieldName, value}
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add new option"
      );
    }
  }
);

// DELETE LEAD ASYNC THUNK
export const deleteLead = createAsyncThunk(
  'lead/deleteLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/lead/delete-Lead/${leadId}`);
      return response.data.data; // Returns the deleted lead data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete lead'
      );
    }
  }
);

// VIEW LEAD BY ID ASYNC THUNK
export const viewLeadById = createAsyncThunk(
  'lead/viewLeadById',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/lead/viewLeadById/${leadId}`);
      return response.data.data; // Returns the lead data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch lead'
      );
    }
  }
);

// UPDATE LEAD ASYNC THUNK
export const updateLead = createAsyncThunk(
  'lead/updateLead',
  async ({ leadId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/lead/update-Lead/${leadId}`, updateData);
      return response.data.data; // Returns the updated lead data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update lead'
      );
    }
  }
);
export const deleteLeadOption = createAsyncThunk(

  "lead/deleteLeadOption",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const res = await axios.delete(`/lead-options/${id}`);

      // Refresh lead options after deletion
      dispatch(getLeadOptions());

      return res.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete lead option"
      );
    }
  }
);
const initialState = {
  list: [],
  options: [],
  form: {
    fullName: "",
    mobile: "",
    alternateNumber: "",
    email: "",
    title: "",
    dob: null,
    country: "India",
    state: "",
    city: "",
    address1: "",
    address2: "",
    address3: "",
    pincode: "",
    businessType: "B2B",
    priority: "",
    source: "",
    referralBy: "",
    agentName: "",
    assignedTo: "",
    note: "",
  },
  status: 'idle',
  loading: false,
  success: false,
  error: null,
  updatedLead: null,
  message: '',
  viewedLead: null,
  deleteLoading: false, // Separate loading state for delete operation
  deleteError: null,    // Separate error state for delete operation
  viewLoading: false,   // Loading state for view lead by ID
  viewError: null,      // Error state for view lead by ID
  updateLoading: false, // Loading state for update lead
  updateError: null,    // Error state for update lead
};

export const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm: (state) => {
      state.form = initialState.form;
    },
    addLeads: (state, action) => {
      state.list.push(action.payload);
    },
    setLeads: (state, action) => {
      state.list = action.payload;
    },
    clearViewedLeads: (state) => {
      state.viewedDriver = null;
    },
    resetLeadStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.updatedLead = null;
      state.message = '';
    },
    // Reset delete specific states
    resetDeleteStatus: (state) => {
      state.deleteLoading = false;
      state.deleteError = null;
    },
    // Reset view specific states
    resetViewStatus: (state) => {
      state.viewLoading = false;
      state.viewError = null;
      state.viewedLead = null;
    },
    // Reset update specific states
    resetUpdateStatus: (state) => {
      state.updateLoading = false;
      state.updateError = null;
    },
    // Remove lead from list immediately (optimistic update)
    removeLeadFromList: (state, action) => {
      const leadId = action.payload;
      state.list = state.list.filter(lead => lead.leadId !== leadId);
    }
  },

  extraReducers: (builder) => {
    builder
      // Create Lead
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optionally add the new lead to the list
        state.list.push(action.payload);
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get All Leads
      .addCase(getAllLeads.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getAllLeads.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(getAllLeads.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Fetch Lead Reports
      .addCase(fetchLeadsReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadsReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchLeadsReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change Lead Status
      .addCase(changeLeadStatus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.message = '';
      })
      .addCase(changeLeadStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.updatedLead = action.payload.data;
        state.message = action.payload.message;

        // Update the lead in the list
        if (state.updatedLead) {
          const index = state.list.findIndex(lead => lead.leadId === state.updatedLead.leadId);
          if (index !== -1) {
            state.list[index] = state.updatedLead;
          }
        }
      })
      .addCase(changeLeadStatus.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.message = '';
      })

      // Get Lead Options
      .addCase(getLeadOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeadOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.options = action.payload;
      })
      .addCase(getLeadOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Lead Option
      .addCase(addLeadOption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addLeadOption.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update state.options immediately
        if (action.payload) {
          state.options = [...state.options, action.payload];
        }
      })
      .addCase(addLeadOption.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // DELETE LEAD
      .addCase(deleteLead.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = null;

        // Remove the deleted lead from the list using leadId
        const deletedLeadId = action.payload?.leadId;
        if (deletedLeadId) {
          state.list = state.list.filter(lead => lead.leadId !== deletedLeadId);
        }

        state.message = 'Lead deleted successfully';
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })

      // VIEW LEAD BY ID
      .addCase(viewLeadById.pending, (state) => {
        state.viewLoading = true;
        state.viewError = null;
        state.viewedLead = null;
      })
      .addCase(viewLeadById.fulfilled, (state, action) => {
        state.viewLoading = false;
        state.viewError = null;
        state.viewedLead = action.payload;
      })
      .addCase(viewLeadById.rejected, (state, action) => {
        state.viewLoading = false;
        state.viewError = action.payload;
        state.viewedLead = null;
      })

      // UPDATE LEAD
      .addCase(updateLead.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;

        const updatedLead = action.payload;

        // Update the lead in the list
        if (updatedLead) {
          const index = state.list.findIndex(lead => lead.leadId === updatedLead.leadId);
          if (index !== -1) {
            state.list[index] = updatedLead;
          }
        }

        // Also update viewedLead if it's the same lead
        if (state.viewedLead && state.viewedLead.leadId === updatedLead.leadId) {
          state.viewedLead = updatedLead;
        }

        state.message = 'Lead updated successfully';
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })


      .addCase(deleteLeadOption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLeadOption.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload;
      })
      .addCase(deleteLeadOption.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  }
});

export const {
  setFormField,
  resetForm,
  addLeads,
  setLeads,
  clearViewedLeads,
  resetLeadStatus,
  resetDeleteStatus,
  resetViewStatus,
  resetUpdateStatus,
  removeLeadFromList
} = leadSlice.actions;

export default leadSlice.reducer;