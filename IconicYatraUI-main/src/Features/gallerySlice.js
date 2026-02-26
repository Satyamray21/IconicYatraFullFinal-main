import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GalleryAxios } from "../Utils/axiosInstance";

// ============================
// 🔹 GET ALL IMAGES
// ============================
export const fetchGallery = createAsyncThunk(
  "gallery/fetchGallery",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await GalleryAxios.get("/gallery");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch gallery"
      );
    }
  }
);

// ============================
// 🔹 UPLOAD IMAGES
// ============================
export const uploadGallery = createAsyncThunk(
  "gallery/uploadGallery",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await GalleryAxios.post("/gallery/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data.data; // returning uploaded images
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Upload failed"
      );
    }
  }
);

// ============================
// 🔹 DELETE IMAGE
// ============================
export const deleteGalleryImage = createAsyncThunk(
  "gallery/deleteGalleryImage",
  async (id, { rejectWithValue }) => {
    try {
      await GalleryAxios.delete(`/gallery/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Delete failed"
      );
    }
  }
);

// ============================
// 🔹 SLICE
// ============================
const gallerySlice = createSlice({
  name: "gallery",
  initialState: {
    images: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPLOAD
      .addCase(uploadGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.images = [...action.payload, ...state.images];
      })
      .addCase(uploadGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteGalleryImage.fulfilled, (state, action) => {
        state.images = state.images.filter(
          (img) => img._id !== action.payload
        );
      });
  },
});

export default gallerySlice.reducer;
