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
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { updateVoucher } from "../../../../features/payment/paymentSlice";
import axios from "../../../../utils/axios";
import PartySelector from "./PartySelector";

const paymentModes = ["Cash", "Yes Bank", "Kotak"];
const paymentLink = "https://iconicyatra.com/payment";

const EditPaymentForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const [voucherType, setVoucherType] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [companies, setCompanies] = useState([]);

    // ─────────────────────────────
    // 🧾 Formik setup
    // ─────────────────────────────
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
            amount: Yup.number()
                .typeError("Amount must be a number")
                .required("Enter amount"),
        }),
        onSubmit: async (values) => {
            try {
                let uploadedScreenshot = formik.values.paymentScreenshot;

                if (uploadFile) {
                    const formData = new FormData();
                    formData.append("file", uploadFile);
                    const uploadRes = await axios.post("/upload/payment", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    uploadedScreenshot = uploadRes.data.url;
                }

                const payload = {
                    ...values,
                    paymentScreenshot: uploadedScreenshot,
                    paymentType:
                        voucherType === "receive" ? "Receive Voucher" : "Payment Voucher",
                    drCr: voucherType === "receive" ? "Cr" : "Dr",
                };

                await dispatch(updateVoucher({ id, updatedData: payload })).unwrap();

                toast.success("Voucher updated successfully!");
                navigate("/payments");
            } catch (err) {
                console.error(err);
                toast.error("Failed to update voucher!");
            }
        },
    });

    // ─────────────────────────────
    // 🌐 Fetch initial voucher data
    // ─────────────────────────────
    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const { data } = await axios.get(`/payment/${id}`);
                const voucher = data?.data || data;
                if (voucher) {
                    setVoucherType(
                        voucher.paymentType?.toLowerCase().includes("receive")
                            ? "receive"
                            : "payment"
                    );
                    formik.setValues({
                        companyId: voucher.companyId?._id || "",
                        date: formatDateForInput(voucher.date),
                        accountType: voucher.accountType || "",
                        partyName: voucher.partyName || "",
                        paymentMode: voucher.paymentMode || "",
                        reference: voucher.referenceNumber || "",
                        particulars: voucher.particulars || "",
                        amount: voucher.amount || "",
                        paymentLinkUsed: voucher.paymentLinkUsed || false,
                        paymentScreenshot: voucher.paymentScreenshot || "",
                    });
                    if (voucher.paymentScreenshot)
                        setPreviewImage(voucher.paymentScreenshot);
                }
            } catch (error) {
                console.error("Error fetching voucher:", error);
            }
        };
        fetchVoucher();
    }, [id]);

    // ─────────────────────────────
    // 🌐 Fetch companies
    // ─────────────────────────────
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

    // ─────────────────────────────
    // 🧾 Payment link click handler
    // ─────────────────────────────
    const handlePaymentLinkClick = () => {
        formik.setFieldValue("paymentLinkUsed", true);
        window.open(paymentLink, "_blank");
        if (!formik.values.reference) {
            formik.setFieldValue("reference", `Online-Payment-${Date.now()}`);
        }
    };

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split("T")[0];
    };

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
                    {voucherType === "receive" ? "Edit Receive Voucher" : "Edit Payment Voucher"}
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

            <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={3}>
                    {/* Date */}
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

                    {/* Upload Screenshot */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Button variant="contained" component="label" fullWidth color="secondary">
                            Change Screenshot
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

                    {/* Account Type */}
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

                    {/* Company */}
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

                    {/* Party Name */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <PartySelector formik={formik} />
                    </Grid>

                    {/* Payment Mode */}
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

                    {/* Reference */}
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

                    {/* Particulars */}
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

                    {/* Amount */}
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

                    {/* Submit */}
                    <Grid size={{ xs: 12 }}>
                        <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                            <Button type="submit" variant="contained" color="primary" size="large">
                                Update
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="large"
                                onClick={() => navigate("/payments")}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default EditPaymentForm;