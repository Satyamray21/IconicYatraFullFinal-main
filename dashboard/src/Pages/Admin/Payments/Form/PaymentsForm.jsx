import React, { useState, useEffect } from "react";
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
    Radio,
    RadioGroup,
    FormControlLabel,
    Link,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createVoucher } from "../../../../features/payment/paymentSlice";
import axios from "../../../../utils/axios";
import PartySelector from "./PartySelector"

const paymentModes = ["Cash", "Yes Bank", "Kotak Bank", "Indusind Bank", "ICICI Bank"];
const paymentLink = "https://iconicyatra.com/payment";

const PaymentsForm = () => {
    const dispatch = useDispatch();
    const [voucherType, setVoucherType] = useState("");
    const navigate = useNavigate(); // ✅ Corrected spelling
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [companies, setCompanies] = useState([]);

    const formik = useFormik({
        initialValues: {
            companyId: "",
            date: "",
            accountType: "",
            partyName: "",
            paymentMode: "",
            reference: "",
            particulars: "",
            amount: "",
            paymentLinkUsed: false,
        },
        validationSchema: Yup.object({
            date: Yup.string().required("Date is required"),
            accountType: Yup.string().required("Select account type"),
            partyName: Yup.string().required("Select party name"),
            paymentMode: Yup.string().required("Select payment mode"),
            reference: Yup.string().when("voucherType", {
                is: "receive",
                then: (schema) => schema.required("Reference is required for receipt"),
            }),
            particulars: Yup.string(),
            amount: Yup.number()
                .typeError("Amount must be a number")
                .required("Enter amount"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = {
                    paymentType: voucherType === "receive" ? "Receive Voucher" : "Payment Voucher",
                    companyId: values.companyId,
                    date: values.date,
                    accountType: values.accountType,
                    partyName: values.partyName,
                    paymentMode: values.paymentMode,
                    referenceNumber: values.reference,
                    particulars: values.particulars,
                    amount: values.amount,
                    invoice: getNextInvoiceNumber(),
                };

                await dispatch(createVoucher(payload)).unwrap();

                toast.success("Voucher created successfully!");
                navigate("/payments"); // ✅ Now using correct variable
                resetForm();
                setVoucherType("");

            } catch (err) {
                console.error(err);
                toast.error("Failed to create voucher!");
            }
        }
    });

    const getNextInvoiceNumber = () => {
        const current = parseInt(localStorage.getItem("invoiceCounter") || "0", 10) + 1;
        localStorage.setItem("invoiceCounter", current);
        return `INV-${String(current).padStart(3, "0")}`;
    };

    const handlePaymentLinkClick = () => {
        formik.setFieldValue("paymentLinkUsed", true);
        window.open(paymentLink, "_blank");

        if (!formik.values.reference) {
            formik.setFieldValue("reference", `Online-Payment-${Date.now()}`);
        }
    };

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data } = await axios.get("/company");
                setCompanies(data?.data || data);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

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
            {/* Voucher Type Selection */}
            <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                    {voucherType === "receive" ? "Receive Voucher" : "Payment Voucher"}
                </Typography>
                <RadioGroup
                    row
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                >
                    <FormControlLabel
                        value="receive"
                        control={<Radio color="primary" />}
                        label="Receive Voucher"
                    />
                    <FormControlLabel
                        value="payment"
                        control={<Radio color="secondary" />}
                        label="Payment Voucher"
                    />
                </RadioGroup>
            </Box>

            {voucherType && (
                <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
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
                            <Button variant="contained" component="label" fullWidth color="secondary">
                                Upload Screenshot (Optional)
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
                                    <Typography variant="caption">Preview:</Typography>
                                    <Avatar
                                        src={previewImage}
                                        variant="rounded"
                                        sx={{ width: 60, height: 60, mt: 1 }}
                                    />
                                </Box>
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl
                                fullWidth
                                error={formik.touched.accountType && Boolean(formik.errors.accountType)}
                            >
                                <InputLabel>Account Type</InputLabel>
                                <Select
                                    name="accountType"
                                    value={formik.values.accountType}
                                    onChange={formik.handleChange}
                                    label="Account Type"
                                    sx={{ bgcolor: "white" }}
                                >
                                    <MenuItem value="Client">Client</MenuItem>
                                    <MenuItem value="Vendor">Vendor</MenuItem>
                                    <MenuItem value="Vehicle">Vehicle</MenuItem>
                                    <MenuItem value="Agent">Agent</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                            <PartySelector formik={formik} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl
                                fullWidth
                                error={formik.touched.paymentMode && Boolean(formik.errors.paymentMode)}
                            >
                                <InputLabel>Payment Mode</InputLabel>
                                <Select
                                    name="paymentMode"
                                    value={formik.values.paymentMode}
                                    onChange={formik.handleChange}
                                    label="Payment Mode"
                                    sx={{ bgcolor: "white" }}
                                >
                                    {paymentModes.map((mode) => (
                                        <MenuItem key={mode} value={mode}>
                                            {mode}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Reference Field */}
                        {voucherType === "receive" && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Reference / Cash / Cheque"
                                    name="reference"
                                    value={formik.values.reference}
                                    onChange={formik.handleChange}
                                    error={formik.touched.reference && Boolean(formik.errors.reference)}
                                    helperText={formik.touched.reference && formik.errors.reference}
                                    sx={{ bgcolor: "white" }}
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Particulars"
                                name="particulars"
                                multiline
                                rows={2}
                                value={formik.values.particulars}
                                onChange={formik.handleChange}
                                sx={{ bgcolor: "white" }}
                            />
                        </Grid>

                        {/* Payment Link */}
                        {voucherType === "payment" && (
                            <Grid size={{ xs: 12 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        border: "1px dashed #1976d2",
                                        borderRadius: 2,
                                        backgroundColor: "#e3f2fd",
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        Online Payment Link
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handlePaymentLinkClick}
                                        sx={{ mb: 1 }}
                                    >
                                        Pay Now via Iconic Yatra
                                    </Button>
                                    <Typography variant="body2" color="text.secondary">
                                        Click above to make payment through secure gateway
                                    </Typography>
                                    <Link
                                        href={paymentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 1, display: "block" }}
                                    >
                                        {paymentLink}
                                    </Link>
                                </Box>
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Amount"
                                name="amount"
                                type="number"
                                value={formik.values.amount}
                                onChange={formik.handleChange}
                                error={formik.touched.amount && Boolean(formik.errors.amount)}
                                helperText={formik.touched.amount && formik.errors.amount}
                                sx={{ bgcolor: "white" }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                                <Button type="submit" variant="contained" color="primary" size="large">
                                    Submit
                                </Button>
                                <Button type="reset" variant="outlined" color="error" size="large">
                                    Clear
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>
            )}
        </Paper>
    );
};

export default PaymentsForm;