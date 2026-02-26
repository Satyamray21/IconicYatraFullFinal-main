import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { inquiryAxios } from "../Utils/axiosInstance";

export const createInquiry = createAsyncThunk(
    "inquiry/create",
    async (formData, { rejectWithValue }) => {
        try {
            const res = await inquiryAxios.post("/inquiries", formData);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const inquirySlice = createSlice({
    name: "inquiry",
    initialState: {
        loading: false,
        success: false,
        error: null,
    },
    reducers: {
        resetInquiryState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createInquiry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createInquiry.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(createInquiry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetInquiryState } = inquirySlice.actions;
export default inquirySlice.reducer;
