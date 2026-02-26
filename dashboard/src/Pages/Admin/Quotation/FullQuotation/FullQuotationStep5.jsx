// FullQuotationStep5.jsx
import React, { useState } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    MenuItem,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { DatePicker, TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { step5Update } from "../../../../features/quotation/fullQuotationSlice";
import { toast } from "react-toastify";

// Validation Schema
const validationSchema = Yup.object({
    clientName: Yup.string().required("Client Name is required"),
    vehicleType: Yup.string().required("Vehicle Type is required"),
    tripType: Yup.string().required("Trip Type is required"),
    totalCost: Yup.number()
        .typeError("Must be a number")
        .required("Total Costing is required"),
});

const tripTypes = ["One Way", "Round Trip"];

const FullQuotationStep5 = ({ quotationId, quotation, onNextStep }) => {
    const dispatch = useDispatch();

    const [clients] = useState(["Client A", "Client B"]);
    const [vehicleTypes] = useState(["Sedan", "SUV", "Bus", "Tempo Traveller"]);
    const [openDialog, setOpenDialog] = useState(false);
    const [fieldType, setFieldType] = useState("");

    if (!quotation) return <Typography>Loading quotation...</Typography>;

    // Initialize form values from quotation
    const initialValues = {
        clientName: quotation.clientDetails?.clientName || "",
        vehicleType: quotation.vehicleDetails?.vehicleType || "",
        tripType: quotation.vehicleDetails?.tripType || "",
        noOfDays: quotation.vehicleDetails?.noOfDays || "",
        ratePerKm: quotation.vehicleDetails?.ratePerKm || "",
        kmPerDay: quotation.vehicleDetails?.kmPerDay || "",
        driverAllowance: quotation.vehicleDetails?.driverAllowance || "",
        tollParking: quotation.vehicleDetails?.tollParking || "",
        totalCost: quotation.vehicleDetails?.totalCost || "",
        pickupDate: quotation.pickupDrop?.arrivalDate ? new Date(quotation.pickupDrop.arrivalDate) : null,
        pickupTime: quotation.pickupDrop?.arrivalDate ? new Date(quotation.pickupDrop.arrivalDate) : null,
        pickupLocation: quotation.pickupDrop?.arrivalLocation || "",
        dropDate: quotation.pickupDrop?.departureDate ? new Date(quotation.pickupDrop.departureDate) : null,
        dropTime: quotation.pickupDrop?.departureDate ? new Date(quotation.pickupDrop.departureDate) : null,
        dropLocation: quotation.pickupDrop?.departureLocation || "",
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            try {
                // Map flat values to nested structure
                const vehicleDetailsPayload = {
                    basicsDetails: {
                        clientName: values.clientName,
                        vehicleType: values.vehicleType,
                        tripType: values.tripType,
                        noOfDays: values.noOfDays,
                        perDayCost: values.ratePerKm, // or calculate if needed
                    },
                    costDetails: {
                        totalCost: values.totalCost,
                        driverAllowance: values.driverAllowance,
                        tollParking: values.tollParking,
                    },
                    pickupDropDetails: {
                        pickupDate: values.pickupDate,
                        pickupTime: values.pickupTime,
                        pickupLocation: values.pickupLocation,
                        dropDate: values.dropDate,
                        dropTime: values.dropTime,
                        dropLocation: values.dropLocation,
                    },
                };

                const resultAction = await dispatch(
                    step5Update({ quotationId, vehicleDetails: vehicleDetailsPayload })
                );

                if (step5Update.fulfilled.match(resultAction)) {
                    toast.success("Step 5 saved successfully!");
                    if (onNextStep) onNextStep(); // Move to Step 6
                } else {
                    toast.error("Failed to save Step 5");
                    console.error(resultAction.payload);
                }
            } catch (err) {
                toast.error("Error saving Step 5");
                console.error(err);
            }
        },
    });


    // Dropdown handlers
    const handleClientChange = (event) => {
        if (event.target.value === "addNew") {
            setFieldType("client");
            setOpenDialog(true);
        } else {
            formik.handleChange(event);
        }
    };

    const handleVehicleChange = (event) => {
        if (event.target.value === "addNew") {
            setFieldType("vehicle");
            setOpenDialog(true);
        } else {
            formik.handleChange(event);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ p: 3, maxWidth: 900, mx: "auto", mt: 3 }}>
                <form onSubmit={formik.handleSubmit}>
                    <Typography variant="h6" gutterBottom>
                        Vehicle Details
                    </Typography>

                    {/* Basic Details */}
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Basic Details
                        </Typography>
                        <Grid container spacing={2} mt={1}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Client Name"
                                    name="clientName"
                                    value={formik.values.clientName}
                                    onChange={handleClientChange}
                                    error={formik.touched.clientName && Boolean(formik.errors.clientName)}
                                    helperText={formik.touched.clientName && formik.errors.clientName}
                                >
                                    {clients.map((client, idx) => (
                                        <MenuItem key={idx} value={client}>
                                            {client}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="addNew">+ Add New</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Vehicle Type"
                                    name="vehicleType"
                                    value={formik.values.vehicleType}
                                    onChange={handleVehicleChange}
                                    error={formik.touched.vehicleType && Boolean(formik.errors.vehicleType)}
                                    helperText={formik.touched.vehicleType && formik.errors.vehicleType}
                                >
                                    {vehicleTypes.map((type, idx) => (
                                        <MenuItem key={idx} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="addNew">+ Add New</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Trip Type"
                                    name="tripType"
                                    value={formik.values.tripType}
                                    onChange={formik.handleChange}
                                >
                                    {tripTypes.map((type, idx) => (
                                        <MenuItem key={idx} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="No Of Days"
                                    name="noOfDays"
                                    value={formik.values.noOfDays}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Rate Per Km"
                                    name="ratePerKm"
                                    value={formik.values.ratePerKm}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Km Per Day"
                                    name="kmPerDay"
                                    value={formik.values.kmPerDay}
                                    onChange={formik.handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Cost Details */}
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Cost Details
                        </Typography>
                        <Grid container spacing={2} mt={1}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Driver Allowance"
                                    name="driverAllowance"
                                    value={formik.values.driverAllowance}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Toll/Parking"
                                    name="tollParking"
                                    value={formik.values.tollParking}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Total Costing"
                                    name="totalCost"
                                    value={formik.values.totalCost}
                                    onChange={formik.handleChange}
                                    error={formik.touched.totalCost && Boolean(formik.errors.totalCost)}
                                    helperText={formik.touched.totalCost && formik.errors.totalCost}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Pickup/Drop Details */}
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            PickUp/Drop Details
                        </Typography>
                        <Grid container spacing={2} mt={1}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <DatePicker
                                    label="Pickup Date"
                                    value={formik.values.pickupDate}
                                    onChange={(val) => formik.setFieldValue("pickupDate", val)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TimePicker
                                    label="Pickup Time"
                                    value={formik.values.pickupTime}
                                    onChange={(val) => formik.setFieldValue("pickupTime", val)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Pickup Location"
                                    name="pickupLocation"
                                    value={formik.values.pickupLocation}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <DatePicker
                                    label="Drop Date"
                                    value={formik.values.dropDate}
                                    onChange={(val) => formik.setFieldValue("dropDate", val)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TimePicker
                                    label="Drop Time"
                                    value={formik.values.dropTime}
                                    onChange={(val) => formik.setFieldValue("dropTime", val)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Drop Location"
                                    name="dropLocation"
                                    value={formik.values.dropLocation}
                                    onChange={formik.handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Submit */}
                    <Box textAlign="center" mt={2}>
                        <Button type="submit" variant="contained" color="primary">
                            Save & Continue
                        </Button>
                    </Box>
                </form>
            </Paper>

            {/* Add New Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Add New {fieldType === "client" ? "Client" : "Vehicle"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={fieldType === "client" ? "Client Name" : "Vehicle Type"}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default FullQuotationStep5;