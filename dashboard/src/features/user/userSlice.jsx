import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axios";

// Fetch profile
export const fetchProfile = createAsyncThunk(
    "profile/fetchProfile",
    async (userId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/user/${userId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Update profile
export const updateProfile = createAsyncThunk(
    "profile/updateProfile",
    async ({ userId, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/user/${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createAdmin = createAsyncThunk(
    "profile/createAdmin",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/user/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: "Admin creation failed" });
        }
    }
);

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        user: JSON.parse(localStorage.getItem("user")) || null,
        loading: false,
        error: null,
        adminCreation: { loading: false, error: null, success: false },
    },
    reducers: {
        clearProfile: (state) => {
            state.user = null;
            localStorage.removeItem("user");
        },
        setProfile: (state, action) => {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.loading = false;
                const user = {
                    ...action.payload,
                    fullName: action.payload.fullName || action.payload.name,
                    userRole: action.payload.userRole || action.payload.role
                };
                state.user = user;
                localStorage.setItem("user", JSON.stringify(user));
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || "Failed to fetch profile";
            })
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                localStorage.setItem("user", JSON.stringify(action.payload));
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || "Profile update failed";
            })
            .addCase(createAdmin.pending, (state) => {
                state.adminCreation.loading = true;
                state.adminCreation.error = null;
                state.adminCreation.success = false;
            })
            .addCase(createAdmin.fulfilled, (state, action) => {
                state.adminCreation.loading = false;
                state.adminCreation.success = true;
            })
            .addCase(createAdmin.rejected, (state, action) => {
                state.adminCreation.loading = false;
                state.adminCreation.error = action.payload?.error || "Admin creation failed";
            });
    },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
