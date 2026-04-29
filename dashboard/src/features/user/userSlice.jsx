import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axios";

function readUserFromStorage() {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** Staff dashboard login: business id ICYR_ST… or normalized accountType. */
export function isStaffSession(u) {
    if (!u) return false;
    if (u.accountType === "staff") return true;
    const uid = u.userId;
    return typeof uid === "string" && uid.startsWith("ICYR_ST");
}

/** ApiResponse { data } from GET /staff/… */
export function staffApiDocToProfile(data, roleHint) {
    const p = data.personalDetails || {};
    return {
        ...data,
        accountType: "staff",
        fullName: p.fullName,
        name: p.fullName,
        email: p.email,
        mobileNumber: p.mobileNumber,
        userId: data.staffId,
        userRole: roleHint ?? p.userRole,
        profileImg: p.staffPhoto?.url || "",
        country: data.staffLocation?.country,
        state: data.staffLocation?.state,
        city: data.staffLocation?.city,
        address: data.address,
    };
}

// Fetch profile — staff uses Staff controller (/staff/me); User model uses /user/me.
export const fetchProfile = createAsyncThunk(
    "profile/fetchProfile",
    async (userId, { getState, rejectWithValue }) => {
        const explicitId = userId && String(userId).trim();
        const stored = readUserFromStorage();
        const fromState = getState().profile?.user;
        const session = fromState || stored;

        if (isStaffSession(session) && !explicitId) {
            try {
                const r = await axiosInstance.get("/staff/me");
                const raw =
                    r.data?.data !== undefined ? r.data.data : r.data;
                return staffApiDocToProfile(raw, session?.userRole);
            } catch (error) {
                return rejectWithValue(
                    error.response?.data || { error: "Failed to fetch profile" }
                );
            }
        }

        try {
            const path = explicitId
                ? `/user/${encodeURIComponent(String(userId).trim())}`
                : `/user/me`;
            const response = await axiosInstance.get(path);
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 404 && !explicitId) {
                const fallback =
                    stored?.userId ||
                    (stored?.id != null ? String(stored.id) : "");
                if (fallback) {
                    try {
                        const r2 = await axiosInstance.get(
                            `/user/${encodeURIComponent(String(fallback).trim())}`
                        );
                        return r2.data;
                    } catch {
                        /* fall through */
                    }
                }
            }
            return rejectWithValue(
                error.response?.data || { error: "Failed to fetch profile" }
            );
        }
    }
);

// Update profile — staff → PUT /staff/me (Staff controller); user → /user/me.
export const updateProfile = createAsyncThunk(
    "profile/updateProfile",
    async ({ formData }, { getState, rejectWithValue }) => {
        const user = getState().profile.user;

        if (isStaffSession(user)) {
            try {
                const p = user.personalDetails || {};
                const loc = user.staffLocation || {};
                const addr = user.address || {};
                let addrPatch = {};
                try {
                    addrPatch = JSON.parse(formData.get("address") || "{}");
                } catch {
                    addrPatch = {};
                }
                const personalDetails = {
                    ...p,
                    fullName: formData.get("fullName") ?? p.fullName,
                    mobileNumber: formData.get("mobileNumber") ?? p.mobileNumber,
                    email: formData.get("email") ?? p.email,
                };
                const staffLocation = {
                    country: formData.get("country") || loc.country,
                    state: formData.get("state") || loc.state,
                    city: formData.get("city") || loc.city,
                };
                const address = { ...addr, ...addrPatch };
                const fd = new FormData();
                fd.append("personalDetails", JSON.stringify(personalDetails));
                fd.append("staffLocation", JSON.stringify(staffLocation));
                fd.append("address", JSON.stringify(address));
                const img = formData.get("profileImg");
                if (img && typeof img !== "string") {
                    fd.append("staffPhoto", img);
                }
                const r = await axiosInstance.put("/staff/me", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const raw =
                    r.data?.data !== undefined ? r.data.data : r.data;
                return staffApiDocToProfile(raw, user.userRole);
            } catch (error) {
                return rejectWithValue(
                    error.response?.data || { error: "Profile update failed" }
                );
            }
        }

        try {
            const path =
                user?.userId &&
                String(user.userId).trim() &&
                !String(user.userId).startsWith("ICYR_ST")
                    ? `/user/${encodeURIComponent(String(user.userId).trim())}`
                    : `/user/me`;
            const response = await axiosInstance.put(path, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { error: "Profile update failed" }
            );
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
            return rejectWithValue(
                error.response?.data || { error: "Admin creation failed" }
            );
        }
    }
);

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        user: readUserFromStorage(),
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
                    userRole:
                        action.payload.userRole || action.payload.role,
                };
                state.user = user;
                localStorage.setItem("user", JSON.stringify(user));
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload?.error ||
                    action.payload?.message ||
                    "Failed to fetch profile";
                if (!state.user) {
                    state.user = readUserFromStorage();
                }
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
                state.error =
                    action.payload?.error || "Profile update failed";
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
                state.adminCreation.error =
                    action.payload?.error || "Admin creation failed";
            });
    },
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
