import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios.js";

export const addBankDetails = createAsyncThunk(
    "bank/addBankDetails", async (data, thunkApi) => {
        try {
            const res = await axios.post('/bank/addBankDetails', data)
            return res.data;
        }
        catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
)

export const getAllBankDetails = createAsyncThunk(
    "bank/getAllBankDetails", async (data, thunkApi) => {
        try {
            const res = await axios.get('/bank/allBankDetails', data)
            return res.data;
        }
        catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
)

export const getBankDetailsById = createAsyncThunk(
    "bank/getBankDetailsById", (async (id, thunkApi) => {
        try {
            const res = await axios.get(`/bank/viewBankDetails/${id}`);
            return res.data;
        }
        catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    })
)

export const updateBankDetails = createAsyncThunk(
    "bank/updateBankDetails",
    async ({ id, data }, thunkApi) => {
        try {
            const res = await axios.put(`/bank/updateBankDetails/${id}`, data);
            return res.data;
        }
        catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    }
)

export const deleteBankDetails = createAsyncThunk(
    "bank/deleteBankDetails", (async (id, thunkApi) => {
        try {
            const res = await axios.delete(`/bank/deleteBankDetails/${id}`)
            return res.id;
        }
        catch (err) {
            return thunkApi.rejectWithValue(err?.response?.data?.message);
        }
    })
)

const initialState = {
    list: [],
    form: {
        bankName: "",
        branchName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
    },
    status: 'idle',
    error: null,
    viewedBank: null,
}

const bankSlice = createSlice({
    name: "bank",
    initialState,
    reducers: {
        setFormField: (state, action) => {
            const { field, value } = action.payload;
            state.form[field] = value;
        },
        resetForm: (state) => {
            state.form = initialState.form;
        },
        addBank: (state, action) => {
            state.list.push(action.payload);
        },
        setBank: (state, action) => {
            state.list = action.payload
        },
        clearviewedPost: (state) => {
            state.viewedBank = null;
        }
    },
    extraReducers: (builder) => {
        builder

            .addCase(addBankDetails.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addBankDetails.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list.push(action.payload);
            })
            .addCase(addBankDetails.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(getAllBankDetails.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload
            })
            .addCase(getAllBankDetails.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload
            })
            .addCase(updateBankDetails.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateBankDetails.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.error = null;

                const updatedBank = action.payload;
                const index = state.list.findIndex(bank => bank._id === updatedBank._id);
                if (index !== -1) {
                    state.list[index] = updatedBank;
                }
            })
            .addCase(updateBankDetails.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(getBankDetailsById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBankDetailsById.fulfilled, (state, action) => {
                state.loading = false;
                state.viewedRecruiter = action.payload;
                state.form = {
                    ...state.form,
                    ...action.payload
                }
            })
            .addCase(getBankDetailsById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteBankDetails.fulfilled, (state, action) => {
                state.list = state.list.filter(bank => bank._id !== action.payload);
            })
    }
})

export const { setFormField, resetForm, addBank, setBank, clearviewedBank } = bankSlice;
export default bankSlice.reducer;