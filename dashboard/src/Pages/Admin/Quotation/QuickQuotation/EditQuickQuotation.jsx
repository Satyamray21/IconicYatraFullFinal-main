import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    TextField,
    Typography,
    Alert
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchQuickQuotationById,
    updateQuickQuotation,
    clearStatus
} from "../../../../features/quotation/quickQuotationSlice";

const EditQuickQuotation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        currentQuotation,
        loading,
        error,
        successMessage
    } = useSelector((state) => state.quickQuotation);

    const [formData, setFormData] = useState({
        customerName: "",
        email: "",
        phone: "",
        adults: "",
        children: "",
        transportation: "",
        pickupPoint: "",
        dropPoint: "",
        totalCost: "",
        message: "",
    });

    // 🔹 Fetch quotation on load
    useEffect(() => {
        dispatch(fetchQuickQuotationById(id));
    }, [id, dispatch]);

    // 🔹 Prefill form when data comes
    useEffect(() => {
        if (currentQuotation) {
            setFormData({
                customerName: currentQuotation.customerName || "",
                email: currentQuotation.email || "",
                phone: currentQuotation.phone || "",
                adults: currentQuotation.adults || "",
                children: currentQuotation.children || "",
                transportation: currentQuotation.transportation || "",
                pickupPoint: currentQuotation.pickupPoint || "",
                dropPoint: currentQuotation.dropPoint || "",
                totalCost: currentQuotation.totalCost || "",
                message: currentQuotation.message || "",
            });
        }
    }, [currentQuotation]);

    // 🔹 Clear success/error on unmount
    useEffect(() => {
        return () => {
            dispatch(clearStatus());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await dispatch(
                updateQuickQuotation({
                    id,
                    formData,
                })
            ).unwrap();

            navigate("/quotations"); // ya quotation list page
        } catch (err) {
            // handled in slice
        }
    };

    if (loading && !currentQuotation) {
        return (
            <Box textAlign="center" mt={6}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="md" mx="auto" mt={4}>
            <Card>
                <CardContent>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Edit Quick Quotation
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Customer Name"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <TextField
                                    label="Adults"
                                    name="adults"
                                    value={formData.adults}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                />
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <TextField
                                    label="Children"
                                    name="children"
                                    value={formData.children}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Transportation"
                                    name="transportation"
                                    value={formData.transportation}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Pickup Point"
                                    name="pickupPoint"
                                    value={formData.pickupPoint}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Drop Point"
                                    name="dropPoint"
                                    value={formData.dropPoint}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Total Cost"
                                    name="totalCost"
                                    value={formData.totalCost}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12} display="flex" justifyContent="space-between">
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                >
                                    {loading ? "Updating..." : "Update Quotation"}
                                </Button>
                            </Grid>

                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default EditQuickQuotation;
