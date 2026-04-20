// invoiceSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axios";

// Async thunks (unchanged)
export const createInvoice = createAsyncThunk(
    "invoice/createInvoice",
    async (invoiceData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/invoice/create`, invoiceData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create invoice");
        }
    }
);

export const getInvoices = createAsyncThunk("invoice/getInvoices", async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/invoice/get`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch invoices");
    }
});

export const getInvoiceById = createAsyncThunk("invoice/getInvoiceById", async (id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/invoice/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Invoice not found");
    }
});

export const updateInvoice = createAsyncThunk(
    "invoice/updateInvoice",
    async ({ id, updatedData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/invoice/${id}`, updatedData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update invoice");
        }
    }
);

export const deleteInvoice = createAsyncThunk(
    "invoice/deleteInvoice",
    async (id, { dispatch, rejectWithValue }) => {
        try {
            await axios.delete(`/invoice/${id}`);

            // 🔁 Refetch latest list
            dispatch(getInvoices());

            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to delete invoice"
            );
        }
    }
);

/** Optional payload: { companyId } to limit repair; omit to repair all companies */
export const renumberCompanyAdvancedReceipts = createAsyncThunk(
    "invoice/renumberCompanyAdvancedReceipts",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/invoice/renumber-company`, payload || {});
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to repair advance receipt numbers"
            );
        }
    }
);


const initialState = {
    invoices: [],
    selectedInvoice: {
        companyId: "",

        accountType: "",
        partyName: "",
        billingName: "",
        billingAddress: "",
        gstin: "",
        invoiceNo: "",
        invoiceDate: null,
        dueDate: null,
        stateOfSupply: "",
        isInternational: false,
        taxType: "withTax",
        items: [
            {
                particulars: "",
                price: 0,
                discountPercent: 0,
                discount: 0,
                taxPercent: 0,
                taxAmount: 0,
                amount: 0,
            },
        ],
        totalAmount: 0,
        receivedAmount: 0,
        balanceAmount: 0,
        paymentMode: "",
        referenceNo: "",
        note: "",
    },
    loading: false,
    error: null,
    successMessage: null,
};

const invoiceSlice = createSlice({
    name: "invoice",
    initialState,
    reducers: {
        clearInvoiceState: (state) => {
            state.error = null;
            state.successMessage = null;
        },

        setSelectedInvoiceField: (state, action) => {
            const { field, value } = action.payload;
            state.selectedInvoice[field] = value;
        },

        addInvoiceItem: (state) => {
            state.selectedInvoice.items.push({
                particulars: "",
                price: 0,
                discountPercent: 0,
                discount: 0,
                taxPercent: 0,
                taxAmount: 0,
                amount: 0,
            });
        },

        removeInvoiceItem: (state, action) => {
            state.selectedInvoice.items.splice(action.payload, 1);
        },

        // Recalculate totals from state.selectedInvoice.items
        recalculateInvoiceTotals: (state) => {
            let totalAmount = 0;
            state.selectedInvoice.items = (state.selectedInvoice.items || []).map((item) => {
                const price = parseFloat(item.price) || 0;
                const discountPercent = parseFloat(item.discountPercent) || 0;
                const taxPercent = parseFloat(item.taxPercent) || 0;

                const discount = (price * discountPercent) / 100;
                const discountedPrice = price - discount;
                const taxAmount = (discountedPrice * taxPercent) / 100;
                const amount = discountedPrice + taxAmount;

                totalAmount += amount;

                return {
                    ...item,
                    price,
                    discountPercent,
                    taxPercent,
                    discount: Number(discount.toFixed(2)),
                    taxAmount: Number(taxAmount.toFixed(2)),
                    amount: Number(amount.toFixed(2)),
                };
            });

            state.selectedInvoice.totalAmount = Number(totalAmount.toFixed(2));
            state.selectedInvoice.balanceAmount = Number(
                (state.selectedInvoice.totalAmount - (parseFloat(state.selectedInvoice.receivedAmount) || 0)).toFixed(2)
            );
        },
    },

    extraReducers: (builder) => {
        builder
            // CREATE
            .addCase(createInvoice.pending, (state) => {
                state.loading = true;
            })
            .addCase(createInvoice.fulfilled, (state, action) => {
                state.loading = false;
                state.invoices.unshift(action.payload);
                state.successMessage = "Invoice created successfully!";
            })
            .addCase(createInvoice.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // GET ALL
            .addCase(getInvoices.pending, (state) => {
                state.loading = true;
            })
            // In your invoiceSlice.js - update this part
            .addCase(getInvoices.fulfilled, (state, action) => {
                state.loading = false;
                console.log("🔄 Redux: getInvoices payload", action.payload);

                if (Array.isArray(action.payload)) {
                    state.invoices = action.payload;
                } else if (action.payload?.data) {
                    state.invoices = Array.isArray(action.payload.data) ? action.payload.data : [action.payload.data];
                } else {
                    state.invoices = [];
                }
                state.error = null;
            })

            .addCase(getInvoices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // GET BY ID
            .addCase(getInvoiceById.fulfilled, (state, action) => {
                state.selectedInvoice = action.payload;
            })

            // UPDATE
            .addCase(updateInvoice.fulfilled, (state, action) => {
                state.successMessage = "Invoice updated successfully!";
                state.invoices = state.invoices.map((invoice) => (invoice._id === action.payload._id ? action.payload : invoice));
            })

            // DELETE
            .addCase(deleteInvoice.pending, (state) => {
                state.loading = true;
            })

            .addCase(deleteInvoice.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = "Invoice deleted successfully!";
                state.invoices = state.invoices.filter(
                    (inv) => inv._id !== action.payload
                );
            })

            .addCase(deleteInvoice.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    },
});

export const { clearInvoiceState, setSelectedInvoiceField, addInvoiceItem, removeInvoiceItem, recalculateInvoiceTotals } =
    invoiceSlice.actions;

export default invoiceSlice.reducer;