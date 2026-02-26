import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../Utils/axiosInstance";

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/login", credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const sendResetCode = createAsyncThunk(
    "auth/sendResetCode",
    async (email, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/send-reset-code", { email });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const changePassword = createAsyncThunk(
    "auth/changePassword",
    async (data, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/change-password", data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
        resetLoading: false,
        resetError: null,
        resetSuccess: null
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                let user = action.payload.user;

                // Normalize here
                const normalizedUser = {
                    ...user,
                    fullName: user.fullName || user.name,
                    userRole: user.userRole || user.role
                };

                state.user = normalizedUser;
                state.token = action.payload.token;

                localStorage.setItem("token", action.payload.token);
                localStorage.setItem("user", JSON.stringify(normalizedUser));
                localStorage.setItem("userRole", normalizedUser.userRole);
            })


            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Login failed";
            })
            .addCase(sendResetCode.pending, (state) => {
                state.resetLoading = true;
                state.resetError = null;
            })
            .addCase(sendResetCode.fulfilled, (state, action) => {
                state.resetLoading = false;
                state.resetSuccess = action.payload.message;
            })
            .addCase(sendResetCode.rejected, (state, action) => {
                state.resetLoading = false;
                state.resetError = action.payload?.message || "Failed to send OTP";
            })

            .addCase(changePassword.pending, (state) => {
                state.resetLoading = true;
                state.resetError = null;
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                state.resetLoading = false;
                state.resetSuccess = action.payload.message;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.resetLoading = false;
                state.resetError = action.payload?.message || "Password reset failed";
            });

    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
