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
  const res = await axios.post("/staff", staffData);
  return res.data.data;
});

export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, data }) => {
    // Map form data back into backend structure
    const payload = {
      personalDetails: {
        title: data.title,
        fullName: data.fullName,
        mobileNumber: data.mobile,
        alternateContact: data.alternateContact,
        designation: data.designation,
        userRole: data.userRole,
        email: data.email,
        dob: data.dob,
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
      firm: {
        firmType: data.firmType,
        cin: data.cin,
        pan: data.pan,
        gstin: data.gstin,
        turnover: data.turnover,
        firmName: data.firmName,
        firmDescription: data.firmDescription,
      },
      bank: {
        bankName: data.bankName,
        branchName: data.branchName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
      },
    };

    const res = await axios.put(`/staff/${id}`, payload);
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
    }
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
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        const data = action.payload;

        // Flatten nested object structure for the form
        state.selected = {
          _id: data._id,
          staffId: data.staffId,

          // Personal
          title: data.personalDetails?.title || "",
          fullName: data.personalDetails?.fullName || "",
          mobile: data.personalDetails?.mobileNumber || "",
          alternateContact: data.personalDetails?.alternateContact || "",
          designation: data.personalDetails?.designation || "",
          userRole: data.personalDetails?.userRole || "",
          email: data.personalDetails?.email || "",
          dob: data.personalDetails?.dob || null,

          // Location
          country: data.staffLocation?.country || "",
          state: data.staffLocation?.state || "",
          city: data.staffLocation?.city || "",

          // Address
          address1: data.address?.addressLine1 || "",
          address2: data.address?.addressLine2 || "",
          address3: data.address?.addressLine3 || "",
          pincode: data.address?.pincode || "",

          // Firm
          firmType: data.firm?.firmType || "",
          cin: data.firm?.cin || "",
          pan: data.firm?.pan || "",
          gstin: data.firm?.gstin || "",
          firmName: data.firm?.firmName || "",
          turnover: data.firm?.turnover || "",
          firmDescription: data.firm?.firmDescription || "",

          // Bank
          bankName: data.bank?.bankName || "",
          branchName: data.bank?.branchName || "",
          accountHolderName: data.bank?.accountHolderName || "",
          accountNumber: data.bank?.accountNumber || "",
          ifscCode: data.bank?.ifscCode || "",
        };
      })

      .addCase(createStaff.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateStaff.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.updating = false;
        const idx = state.list.findIndex(staff => staff._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message;
      })

      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.list = state.list.filter(staff => staff._id !== action.payload);
      });
  }
});

export const { clearSelectedStaff } = staffSlice.actions;
export default staffSlice.reducer;