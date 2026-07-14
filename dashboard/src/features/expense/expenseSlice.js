import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// Fetch all expenses
export const fetchAllExpenses = createAsyncThunk("expense/fetchAll", async () => {
    const res = await axios.get("/expense");
    return res.data.data;
});

// Fetch single expense by ID
export const fetchExpenseById = createAsyncThunk("expense/fetchById", async (id) => {
    const res = await axios.get(`/expense/${id}`);
    return res.data.data;
});

// Create new expense
export const createExpense = createAsyncThunk("expense/create", async (expenseData) => {
    const res = await axios.post("/expense", expenseData);
    return res.data?.data ?? res.data;
});

// Update expense
export const updateExpense = createAsyncThunk("expense/update", async ({ id, data }) => {
    const res = await axios.put(`/expense/${id}`, data);
    return res.data.data;
});

// Delete expense
export const deleteExpense = createAsyncThunk("expense/delete", async (id) => {
    await axios.delete(`/expense/${id}`);
    return id;
});

const expenseSlice = createSlice({
    name: "expense",
    initialState: {
        list: [],
        selected: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearSelectedExpense: (state) => {
            state.selected = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get All
            .addCase(fetchAllExpenses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllExpenses.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchAllExpenses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Get By ID
            .addCase(fetchExpenseById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })

            // Create
            .addCase(createExpense.fulfilled, (state, action) => {
                state.list.unshift(action.payload);
            })

            // Update
            .addCase(updateExpense.fulfilled, (state, action) => {
                const index = state.list.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })

            // Delete
            .addCase(deleteExpense.fulfilled, (state, action) => {
                state.list = state.list.filter(item => item._id !== action.payload);
            });
    },
});

export const { clearSelectedExpense } = expenseSlice.actions;
export default expenseSlice.reducer;
