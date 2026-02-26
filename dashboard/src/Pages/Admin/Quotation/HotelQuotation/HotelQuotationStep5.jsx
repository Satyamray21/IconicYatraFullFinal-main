import React from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    Alert,
    CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const HotelQuotationStep5 = ({ formData, onBack, onSubmit, submissionStatus }) => {
    const { step1, step2, step3, step4 } = formData;

    // Combine Step 5 fields from your API response
    const step5 = {
        quotationInclusion: step4?.quotationInclusion || "N/A",
        quotationExculsion: step4?.quotationExculsion || "N/A",
        paymentPolicies: step4?.paymentPolicies || "N/A",
        CancellationRefund: step4?.CancellationRefund || "N/A",
        termsAndConditions: step4?.termsAndConditions || "N/A",
    };

    const handleFinalSubmit = () => {
        onSubmit();
    };

    // Success message
    if (submissionStatus === "success") {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
                <Typography variant="h5" gutterBottom color="success.main">
                    Quotation Created Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your hotel quotation has been saved and is now ready for use.
                </Typography>
            </Box>
        );
    }

    // Error message
    if (submissionStatus === "error") {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <ErrorIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
                <Typography variant="h5" gutterBottom color="error.main">
                    Submission Failed
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    There was an error creating your quotation. Please try again.
                </Typography>
                <Button variant="contained" onClick={handleFinalSubmit}>
                    Retry Submission
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Final Review
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Please review all the information before final submission.
            </Typography>

            {/* Step 1 Review */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Client & Basic Details
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Client:</strong> {step1.clientName}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Tour Type:</strong> {step1.tourType}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Sector:</strong> {step1.sector}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Adults:</strong> {step1.adults}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Children:</strong> {step1.children}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Infants:</strong> {step1.infants}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Kids:</strong> {step1.kids}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Step 2 Review */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Itinerary Details
                </Typography>
                {step2.stayLocations && step2.stayLocations.length > 0 ? (
                    <List>
                        {step2.stayLocations.map((location, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={location.city}
                                    secondary={`${location.nights} night(s)`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No itinerary locations added
                    </Typography>
                )}
            </Paper>

            {/* Step 3 Review */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Hotel Configuration
                </Typography>
                {step3.sections && step3.sections.length > 0 ? (
                    <Typography variant="body2">
                        {step3.sections.length} hotel section(s) configured
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No hotel configurations added
                    </Typography>
                )}
            </Paper>

            {/* Step 4 Review */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Transport Details
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Vehicle:</strong> {step4.vehicleType}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Trip Type:</strong> {step4.tripType}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="body2">
                            <strong>Total Cost:</strong> ₹{step4.totalCost}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Step 5 Review */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Quotation Policies & Terms
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2">
                            <strong>Inclusions:</strong> {step5.quotationInclusion}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2">
                            <strong>Exclusions:</strong> {step5.quotationExculsion}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2">
                            <strong>Payment Policies:</strong> {step5.paymentPolicies}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2">
                            <strong>Cancellation & Refund:</strong> {step5.CancellationRefund}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2">
                            <strong>Terms & Conditions:</strong> {step5.termsAndConditions}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
                After submission, you will be able to view and edit this quotation from the quotations list.
            </Alert>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button onClick={onBack} variant="outlined">
                    Back
                </Button>
                <Button
                    onClick={handleFinalSubmit}
                    variant="contained"
                    disabled={submissionStatus === "loading"}
                    startIcon={submissionStatus === "loading" ? <CircularProgress size={20} /> : null}
                >
                    {submissionStatus === "loading" ? "Submitting..." : "Submit Quotation"}
                </Button>
            </Box>
        </Box>
    );
};

export default HotelQuotationStep5;
