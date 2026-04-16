import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

export const fetchAllStaff = createAsyncThunk("staff/fetchAll", async () => {
  const res = await axios.get("/staff");
  return res.data.data;
});

export const fetchStaffById = createAsyncThunk("staff/fetchById", async (id) => {
  const res = await axios.get(`/staff/${id}`);
  return res.data.data;
});

export const createStaff = createAsyncThunk("staff/create", async (staffData) => {
  const res = await axios.post("/staff", staffData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data;
});

export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, data }) => {
    let payload = data;
    
    if (!(data instanceof FormData)) {
      payload = {
        personalDetails: {
          title: data.title,
          fullName: data.fullName,
          mobileNumber: data.mobile,
          alternateContact: data.alternateContact,
          designation: data.designation,
          userRole: data.userRole,
          email: data.email,
          dob: data.dob,
          aadharNumber: data.aadharNumber,
          panNumber: data.panNumber,
        },
        staffLocation: {
          country: data.country,
          state: data.state,
          city: data.city,
        },
        address: {
          addressLine1: data.address1,
          addressLine2: data.address2,
          addressLine3: data.address3,
          pincode: data.pincode,
        },
        bank: {
          bankName: data.bankName,
          branchName: data.branchName,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
        },
      };
    }
    
    const res = await axios.put(`/staff/${id}`, payload, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data.data;
  }
);

export const deleteStaff = createAsyncThunk("staff/delete", async (id) => {
  await axios.delete(`/staff/${id}`);
  return id;
});

const staffSlice = createSlice({
  name: "staff",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearSelectedStaff: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(fetchStaffById.pending, (state) => {
        state.loading = true;
        state.selected = null;
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;

        // Flatten nested object structure for the form
        state.selected = {
          _id: data._id,
          staffId: data.staffId,

          // Personal Details
          title: data.personalDetails?.title || "",
          fullName: data.personalDetails?.fullName || "",
          mobile: data.personalDetails?.mobileNumber || "",
          alternateContact: data.personalDetails?.alternateContact || "",
          designation: data.personalDetails?.designation || "",
          userRole: data.personalDetails?.userRole || "",
          email: data.personalDetails?.email || "",
          dob: data.personalDetails?.dob || null,
          aadharNumber: data.personalDetails?.aadharNumber || "",
          panNumber: data.personalDetails?.panNumber || "",
          
          // Photo URLs
          staffPhotoUrl: data.personalDetails?.staffPhoto?.url || null,
          aadharPhotoUrl: data.personalDetails?.aadharPhoto?.url || null,
          panPhotoUrl: data.personalDetails?.panPhoto?.url || null,
          
          staffPhoto: null,
          aadharPhoto: null,
          panPhoto: null,

          // Location - IMPORTANT: Map from staffLocation
          country: data.staffLocation?.country || "",
          state: data.staffLocation?.state || "",
          city: data.staffLocation?.city || "",

          // Address
          address1: data.address?.addressLine1 || "",
          address2: data.address?.addressLine2 || "",
          address3: data.address?.addressLine3 || "",
          pincode: data.address?.pincode || "",

          // Bank
          bankName: data.bank?.bankName || "",
          branchName: data.bank?.branchName || "",
          accountHolderName: data.bank?.accountHolderName || "",
          accountNumber: data.bank?.accountNumber || "",
          ifscCode: data.bank?.ifscCode || "",
        };
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateStaff.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.updating = false;
        const idx = state.list.findIndex(staff => staff._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        
        // Update selected if it's the same staff
        if (state.selected?._id === action.payload._id) {
          state.selected = {
            ...state.selected,
            _id: action.payload._id,
            staffId: action.payload.staffId,
            title: action.payload.personalDetails?.title || "",
            fullName: action.payload.personalDetails?.fullName || "",
            mobile: action.payload.personalDetails?.mobileNumber || "",
            alternateContact: action.payload.personalDetails?.alternateContact || "",
            designation: action.payload.personalDetails?.designation || "",
            userRole: action.payload.personalDetails?.userRole || "",
            email: action.payload.personalDetails?.email || "",
            dob: action.payload.personalDetails?.dob || null,
            aadharNumber: action.payload.personalDetails?.aadharNumber || "",
            panNumber: action.payload.personalDetails?.panNumber || "",
            staffPhotoUrl: action.payload.personalDetails?.staffPhoto?.url || null,
            aadharPhotoUrl: action.payload.personalDetails?.aadharPhoto?.url || null,
            panPhotoUrl: action.payload.personalDetails?.panPhoto?.url || null,
            country: action.payload.staffLocation?.country || "",
            state: action.payload.staffLocation?.state || "",
            city: action.payload.staffLocation?.city || "",
            address1: action.payload.address?.addressLine1 || "",
            address2: action.payload.address?.addressLine2 || "",
            address3: action.payload.address?.addressLine3 || "",
            pincode: action.payload.address?.pincode || "",
            bankName: action.payload.bank?.bankName || "",
            branchName: action.payload.bank?.branchName || "",
            accountHolderName: action.payload.bank?.accountHolderName || "",
            accountNumber: action.payload.bank?.accountNumber || "",
            ifscCode: action.payload.bank?.ifscCode || "",
          };
        }
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message;
      })

      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.list = state.list.filter(staff => staff._id !== action.payload);
      });
  },
});

export const { clearSelectedStaff } = staffSlice.actions;
export default staffSlice.reducer;