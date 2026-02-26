import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


const API_URL = `${import.meta.env.VITE_BASE_URL}/api/payment`;


// ✅ Async thunk to create Razorpay order
export const createOrder = createAsyncThunk(
    "razorpay/createOrder",
    async (amount, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/create-order`, { amount });
            return response.data.order;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const razorpaySlice = createSlice({
    name: "razorpay",
    initialState: {
        order: null,
        loading: false,
        error: null,
    },
    reducers: {
        resetRazorpayState: (state) => {
            state.order = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.order = action.payload;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetRazorpayState } = razorpaySlice.actions;
export default razorpaySlice.reducer;
