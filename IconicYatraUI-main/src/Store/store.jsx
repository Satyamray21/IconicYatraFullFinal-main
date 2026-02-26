import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/authSlice";
import inquiryReducer from "../Features/inquirySlice";
import razorpayReducer from "../Features/razorpaySlice";
import packageReducer from "../Features/packageSlice";
import paymentReducer from "../Features/paymentSlice";
import companyUIReducer from "../Features/companyUISlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        inquiry: inquiryReducer,
        razorpay: razorpayReducer,
        packages: packageReducer,
        payment: paymentReducer,
        companyUI:companyUIReducer
    }
});
