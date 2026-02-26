import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentAxios } from "../../src/Utils/axiosInstance";

// 🔹 INITIATE PAYMENT
export const initiatePayment = createAsyncThunk(
    "payment/initiate",
    async (paymentData, { rejectWithValue }) => {
        try {
            const res = await paymentAxios.post("/initiate", paymentData);
            return res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.error || "Payment initiation failed"
            );
        }
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        loading: false,
        paymentUrl: null,
        error: null,
    },
    reducers: {
        resetPayment: (state) => {
            state.loading = false;
            state.paymentUrl = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initiatePayment.fulfilled, (state, action) => {
                state.loading = false;

                if (
                    action.payload &&
                    action.payload.status === 1 &&
                    typeof action.payload.data === "string"
                ) {
                    state.paymentUrl = action.payload.data;
                    state.error = null;
                } else {
                    state.paymentUrl = null;
                    state.error =
                        action.payload?.error ||
                        "Easebuzz payment initiation failed";
                }
            })
    },
});

export const { resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
