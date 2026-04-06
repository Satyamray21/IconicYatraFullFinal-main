import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

/* =========================================================
   GET ALL LANDING PAGES
========================================================= */

export const fetchLandingPages = createAsyncThunk(
  "landingPages/fetchLandingPages",
  async (_, { rejectWithValue }) => {
    try {

      const res = await axios.get("/landing-pages");

      return res.data.data;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch landing pages"
      );
    }
  }
);


/* =========================================================
   GET LANDING PAGE BY SLUG
========================================================= */

export const fetchLandingPageBySlug = createAsyncThunk(
  "landingPages/fetchLandingPageBySlug",
  async (slug, { rejectWithValue }) => {
    try {

      const res = await axios.get(`/landing-pages/slug/${slug}`);

      return res.data.data;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message || "Landing page not found"
      );
    }
  }
);

export const fetchLandingPageById = createAsyncThunk(
  "landingPages/fetchLandingPageById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/landing-pages/${id}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch landing page"
      );
    }
  }
);

/* =========================================================
   CREATE LANDING PAGE
========================================================= */

export const createLandingPage = createAsyncThunk(
  "landingPages/createLandingPage",
  async (formData, { rejectWithValue }) => {
    try {

      const res = await axios.post("/landing-pages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data.data;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message || "Failed to create landing page"
      );
    }
  }
);


/* =========================================================
   UPDATE LANDING PAGE
========================================================= */

export const updateLandingPage = createAsyncThunk(
  "landingPages/updateLandingPage",
  async ({ id, formData }, { rejectWithValue }) => {
    try {

      const res = await axios.put(`/landing-pages/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data.data;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message || "Failed to update landing page"
      );
    }
  }
);


/* =========================================================
   DELETE LANDING PAGE
========================================================= */

export const deleteLandingPage = createAsyncThunk(
  "landingPages/deleteLandingPage",
  async (id, { rejectWithValue }) => {
    try {

      await axios.delete(`/landing-pages/${id}`);

      return id;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message || "Failed to delete landing page"
      );
    }
  }
);



/* =========================================================
   INITIAL STATE
========================================================= */

const initialState = {

  pages: [],
  page: null,

  loading: false,
  error: null,

  createSuccess: false,
  updateSuccess: false,
  deleteSuccess: false,
};



/* =========================================================
   SLICE
========================================================= */

const landingPageSlice = createSlice({
  name: "landingPages",
  initialState,
  reducers: {

    clearLandingState: (state) => {
      state.error = null;
      state.createSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
    },

    clearCurrentPage: (state) => {
      state.page = null;
    },

  },

  extraReducers: (builder) => {

    /* ---------- FETCH ALL ---------- */

    builder
      .addCase(fetchLandingPages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLandingPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = action.payload;
      })
      .addCase(fetchLandingPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });



    /* ---------- FETCH BY SLUG ---------- */

    builder
      .addCase(fetchLandingPageBySlug.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLandingPageBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload;
      })
      .addCase(fetchLandingPageBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });



    /* ---------- CREATE ---------- */

    builder
      .addCase(createLandingPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLandingPage.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.pages.unshift(action.payload);
      })
      .addCase(createLandingPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });



    /* ---------- UPDATE ---------- */

    builder
      .addCase(updateLandingPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLandingPage.fulfilled, (state, action) => {

        state.loading = false;
        state.updateSuccess = true;

        const index = state.pages.findIndex(
          (p) => p._id === action.payload._id
        );

        if (index !== -1) {
          state.pages[index] = action.payload;
        }

        state.page = action.payload;
      })
      .addCase(updateLandingPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });



    /* ---------- DELETE ---------- */

    builder
      .addCase(deleteLandingPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteLandingPage.fulfilled, (state, action) => {

        state.loading = false;
        state.deleteSuccess = true;

        state.pages = state.pages.filter(
          (p) => p._id !== action.payload
        );
      })
      .addCase(deleteLandingPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      builder
  .addCase(fetchLandingPageById.pending, (state) => {
    state.loading = true;
  })
  .addCase(fetchLandingPageById.fulfilled, (state, action) => {
    state.loading = false;
    state.page = action.payload;
  })
  .addCase(fetchLandingPageById.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });


  },
});


export const { clearLandingState, clearCurrentPage } =
  landingPageSlice.actions;

export default landingPageSlice.reducer;
