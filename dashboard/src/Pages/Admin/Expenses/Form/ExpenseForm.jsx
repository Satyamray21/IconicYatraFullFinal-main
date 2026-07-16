import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Grid,
    MenuItem,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Avatar,
    Stack,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createExpense, updateExpense, fetchExpenseById, clearSelectedExpense } from "../../../../features/expense/expenseSlice";
import axios from "../../../../utils/axios";
import { getAllBankDetails } from "../../../../features/bank/bankSlice";

const categories = ["Travel", "Meals", "Office Supplies", "Utilities", "Salary", "Other"];

const ExpenseForm = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { list: banks } = useSelector((state) => state.bank);
    const { selected: selectedExpense } = useSelector((state) => state.expense);
    const [companies, setCompanies] = useState([]);
    
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    useEffect(() => {
        dispatch(getAllBankDetails());
        const fetchCompanies = async () => {
            try {
                const { data } = await axios.get("/company");
                setCompanies(data?.data || data);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();

        if (isEditMode) {
            dispatch(fetchExpenseById(id));
        } else {
            dispatch(clearSelectedExpense());
        }
    }, [dispatch, id, isEditMode]);

    const initialValues = useMemo(() => ({
        companyId: selectedExpense?.companyId?._id || selectedExpense?.companyId || "",
        date: selectedExpense?.date ? new Date(selectedExpense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        category: selectedExpense?.category || "",
        paymentMode: selectedExpense?.paymentMode || "",
        amount: selectedExpense?.amount || "",
        particulars: selectedExpense?.particulars || "",
    }), [selectedExpense]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema: Yup.object({
            companyId: Yup.string().required("Select a company"),
            date: Yup.string().required("Date is required"),
            category: Yup.string().required("Select an expense category"),
            paymentMode: Yup.string().required("Select payment mode"),
            amount: Yup.number().typeError("Amount must be a number").required("Enter amount").min(1, "Amount must be greater than 0"),
            particulars: Yup.string(),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = {
                    ...values,
                    // If you have image upload implemented for expense, you would handle the file upload here first 
                    // and pass the receiptImage URL to payload
                };

                if (isEditMode) {
                    await dispatch(updateExpense({ id, data: payload })).unwrap();
                    toast.success("Expense updated successfully!");
                } else {
                    await dispatch(createExpense(payload)).unwrap();
                    toast.success("Expense created successfully!");
                }
                
                navigate("/expenses");
                resetForm();
            } catch (err) {
                console.error(err);
                toast.error(isEditMode ? "Failed to update expense!" : "Failed to create expense!");
            }
        }
    });

    return (
        <Paper
            elevation={5}
            sx={{
                p: 4,
                borderRadius: 4,
                maxWidth: 900,
                mx: "auto",
                mt: 5,
                bgcolor: "#f5f7fb",
            }}
        >
            <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                    {isEditMode ? "Edit Daily Expense" : "Add Daily Expense"}
                </Typography>
            </Box>

            <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
                <Grid container spacing={3}>
                    <Grid size={{xs:12,md:6}}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Date"
                            name="date"
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.date}
                            onChange={formik.handleChange}
                            error={formik.touched.date && Boolean(formik.errors.date)}
                            helperText={formik.touched.date && formik.errors.date}
                            sx={{ bgcolor: "white" }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Company"
                            name="companyId"
                            value={formik.values.companyId}
                            onChange={formik.handleChange}
                            error={formik.touched.companyId && Boolean(formik.errors.companyId)}
                            helperText={formik.touched.companyId && formik.errors.companyId}
                            sx={{ bgcolor: "white" }}
                        >
                            {companies.map((company) => (
                                <MenuItem key={company._id} value={company._id}>
                                    {company.companyName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl
                            fullWidth
                            error={formik.touched.category && Boolean(formik.errors.category)}
                        >
                            <InputLabel>Expense Category</InputLabel>
                            <Select
                                name="category"
                                value={formik.values.category}
                                onChange={formik.handleChange}
                                label="Expense Category"
                                sx={{ bgcolor: "white" }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl
                            fullWidth
                            error={formik.touched.paymentMode && Boolean(formik.errors.paymentMode)}
                        >
                            <InputLabel>Payment Mode (Bank/Cash)</InputLabel>
                            <Select
                                name="paymentMode"
                                value={formik.values.paymentMode}
                                onChange={formik.handleChange}
                                label="Payment Mode (Bank/Cash)"
                                sx={{ bgcolor: "white" }}
                            >
                                <MenuItem value="Cash">Cash</MenuItem>
                                {banks?.map((bank) => (
                                    <MenuItem key={bank._id} value={bank.bankName}>
                                        {bank.bankName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Amount (₹)"
                            name="amount"
                            type="number"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            error={formik.touched.amount && Boolean(formik.errors.amount)}
                            helperText={formik.touched.amount && formik.errors.amount}
                            sx={{ bgcolor: "white" }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Button variant="contained" component="label" fullWidth color="secondary" sx={{ height: '56px' }}>
                            Upload Receipt (Optional)
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.currentTarget.files[0];
                                    setUploadFile(file);
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setPreviewImage(reader.result);
                                        reader.readAsDataURL(file);
                                    } else {
                                        setPreviewImage(null);
                                    }
                                }}
                            />
                        </Button>
                        {previewImage && (
                            <Box mt={1}>
                                <Avatar
                                    src={previewImage}
                                    variant="rounded"
                                    sx={{ width: 60, height: 60 }}
                                />
                            </Box>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Particulars / Description"
                            name="particulars"
                            multiline
                            rows={2}
                            value={formik.values.particulars}
                            onChange={formik.handleChange}
                            sx={{ bgcolor: "white" }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                            <Button type="submit" variant="contained" color="primary" size="large">
                                {isEditMode ? "Update" : "Submit"}
                            </Button>
                            <Button type="reset" variant="outlined" color="error" size="large" onClick={() => navigate("/expenses")}>
                                Cancel
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default ExpenseForm;
