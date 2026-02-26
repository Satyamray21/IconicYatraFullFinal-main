
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";



export const createHotelQuotation = createAsyncThunk(
    "hotelQuotation/create",
    async (data, { rejectWithValue }) => {
        try {
            const res = await axios.post('/hotelQT', data);
            return res.data.data; // ApiResponse -> { statusCode, data, message }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Error creating quotation");
        }
    }
);


export const fetchHotelQuotations = createAsyncThunk(
    "hotelQuotation/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get('/hotelQT');
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Error fetching quotations");
        }
    }
);

export const fetchHotelQuotationById = createAsyncThunk(
    "hotelQuotation/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.get(`/hotelQT/${id}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Quotation not found");
        }
    }
);


export const deleteHotelQuotation = createAsyncThunk(
    "hotelQuotation/delete",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.delete(`/hotelQT/${id}`);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Error deleting quotation");
        }
    }
);

const hotelQuotationSlice = createSlice({
    name: "hotelQuotation",
    initialState: {
        quotations: [],
        quotation: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearQuotation: (state) => {
            state.quotation = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // 📌 Create
            .addCase(createHotelQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(createHotelQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations.unshift(action.payload); // add new on top
            })
            .addCase(createHotelQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 Fetch All
            .addCase(fetchHotelQuotations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchHotelQuotations.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations = action.payload;
            })
            .addCase(fetchHotelQuotations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 Fetch By ID
            .addCase(fetchHotelQuotationById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchHotelQuotationById.fulfilled, (state, action) => {
                state.loading = false;
                state.quotation = action.payload;
            })
            .addCase(fetchHotelQuotationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 Delete
            .addCase(deleteHotelQuotation.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteHotelQuotation.fulfilled, (state, action) => {
                state.loading = false;
                state.quotations = state.quotations.filter(
                    (q) => q.hotelQuotationId !== action.payload.hotelQuotationId
                );
            })
            .addCase(deleteHotelQuotation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearQuotation, clearError } = hotelQuotationSlice.actions;
export default hotelQuotationSlice.reducer;