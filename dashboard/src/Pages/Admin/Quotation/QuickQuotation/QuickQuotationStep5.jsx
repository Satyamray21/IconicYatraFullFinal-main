import React from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const StepPreviewSubmit = ({
    formData = {},
    onBack,
    onSubmit,
    loading = false
}) => {
    const {
        clientDetails = {},
        packageDetails = {},
        policies = {},
    } = formData || {};
    const navigate = useNavigate();

    const handleSubmit = async () => {
        console.log("Submitting form data:", formData);
        if (!packageDetails?.selectedPackage) {
            alert("Please go back and select a package in Package Details step");
            return;
        }

        if (!clientDetails?.customerName || !clientDetails?.email) {
            alert("Please ensure all client details are filled");
            return;
        }

        try {
            await onSubmit(formData);
            navigate("/quotation");
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Something went wrong while submitting the quotation.");
        }
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={600} mb={3} textAlign="center">
                Preview & Confirm Quotation
            </Typography>

            {/* Warning if package not selected */}
            {!packageDetails?.selectedPackage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <strong>Error:</strong> No package selected. Please go back to Package Details step and select a package.
                </Alert>
            )}

            {/* Warning if client details missing */}
            {(!clientDetails?.customerName || !clientDetails?.email) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Warning:</strong> Please ensure all client details are filled in Step 1.
                </Alert>
            )}

            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: "#fafafa",
                }}
            >
                {/* Debug Info */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Data Check:</strong>
                    Client: {clientDetails?.customerName ? "✓" : "✗"} |
                    Package: {packageDetails?.selectedPackage ? "✓" : "✗"} |
                    Policies: {policies?.inclusions ? "✓" : "✗"}
                </Alert>

                {/* 🧍 Client Details */}
                <Typography variant="h6" color="primary" fontWeight={600}>
                    Client Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Name:</strong> {clientDetails?.customerName || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Email:</strong> {clientDetails?.email || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Phone:</strong> {clientDetails?.phone || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Adults:</strong> {clientDetails?.adults || 0} |{" "}
                            <strong>Children:</strong> {clientDetails?.children || 0}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography>
                            <strong>Message:</strong> {clientDetails?.message || "—"}
                        </Typography>
                    </Grid>
                </Grid>

                <Box mt={4} />

                {/* 🧳 Package Details */}
                <Typography variant="h6" color="primary" fontWeight={600}>
                    Package Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Tour Type:</strong> {packageDetails?.tourType || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Duration:</strong> {packageDetails?.days || 0} Days / {packageDetails?.nights || 0} Nights
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Hotel Type:</strong> {packageDetails?.hotelType || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Transport Mode:</strong> {packageDetails?.transportMode || "—"}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>
                            <strong>Selected Package:</strong> {packageDetails?.selectedPackage ? "✓ Selected" : "✗ Not Selected"}
                        </Typography>
                    </Grid>
                </Grid>

                {/* Show destinations if available */}
                {packageDetails?.destinations && packageDetails.destinations.length > 0 && (
                    <Box mt={2}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Destinations:
                        </Typography>
                        <List dense>
                            {packageDetails.destinations.map((destination, index) => (
                                destination && destination.trim() !== "" && (
                                    <ListItem key={index}>
                                        <ListItemText primary={`• ${destination}`} />
                                    </ListItem>
                                )
                            ))}
                        </List>
                    </Box>
                )}

                <Box mt={4} />

                {/* 📜 Policies */}
                <Typography variant="h6" color="primary" fontWeight={600}>
                    Policies & Others
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Inclusions:
                        </Typography>
                        <List dense>
                            {policies?.inclusions && policies.inclusions.length > 0 ? (
                                policies.inclusions.map((item, i) => (
                                    item && item.trim() !== "" && (
                                        <ListItem key={i}>
                                            <ListItemText primary={`• ${item}`} />
                                        </ListItem>
                                    )
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="—" />
                                </ListItem>
                            )}
                        </List>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Exclusions:
                        </Typography>
                        <List dense>
                            {policies?.exclusions && policies.exclusions.length > 0 ? (
                                policies.exclusions.map((item, i) => (
                                    item && item.trim() !== "" && (
                                        <ListItem key={i}>
                                            <ListItemText primary={`• ${item}`} />
                                        </ListItem>
                                    )
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="—" />
                                </ListItem>
                            )}
                        </List>
                    </Grid>
                </Grid>
            </Paper>

            {/* Buttons */}
            <Box mt={4} display="flex" justifyContent="space-between">
                <Button
                    variant="outlined"
                    onClick={onBack}
                    disabled={loading}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={
                        loading ||
                        !packageDetails?.selectedPackage ||
                        !clientDetails?.customerName ||
                        !clientDetails?.email
                    }
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Submitting..." : "Submit & Create Quotation"}
                </Button>
            </Box>
        </Box>
    );
};

export default StepPreviewSubmit;