import React, { useEffect, useState } from "react";
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
    Divider,
    InputAdornment,
} from "@mui/material";
import {
    DatePicker,
    TimePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";

/* -------------------- Helpers -------------------- */
const parseTimeStringToDate = (time) => {
    if (!time) return null;
    if (time instanceof Date) return time;
    if (typeof time === "string" && time.includes(":")) {
        const [h, m] = time.split(":").map((x) => parseInt(x, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return new Date(1970, 0, 1, h, m);
    }
    return null;
};

const formatTimeForSubmit = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "12:00";
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};

const safeDateToISOString = (d) =>
    d instanceof Date && !isNaN(d.getTime())
        ? d.toISOString()
        : new Date().toISOString();

/* -------------------- Validation Schema -------------------- */
const getValidationSchema = (transport) =>
    Yup.object({
        clientName: Yup.string().required("Client Name is required"),
        vehicleType: Yup.string().required("Vehicle Type is required"),
        tripType: Yup.string().required("Trip Type is required"),
        noOfDays: Yup.number().required("No of Days is required").min(1, "At least 1 day"),
        pickupDate: Yup.date().required("Pickup date is required"),
        pickupTime: Yup.mixed().required("Pickup time is required"),
        pickupLocation: Yup.string().required("Pickup location is required"),
        dropDate: Yup.date().required("Drop date is required"),
        dropTime: Yup.mixed().required("Drop time is required"),
        dropLocation: Yup.string().required("Drop location is required"),
    });

/* -------------------- Component -------------------- */
const HotelQuotationStep4 = ({
    onNext,
    onBack,
    initialData,
    step1Data,
    step2Data,
    step3Data
}) => {
    const transport = step3Data?.transport || "Yes";
    const isTransportEnabled = transport === "Yes";

    const [clients, setClients] = useState(
        [step1Data?.clientName || initialData?.basicsDetails?.clientName].filter(Boolean)
    );
    const [vehicleTypes, setVehicleTypes] = useState(
        initialData?.vehicleTypes || ["Sedan", "SUV", "Bus", "Tempo Traveller"]
    );

    const [openDialog, setOpenDialog] = useState(false);
    const [newValue, setNewValue] = useState("");
    const [fieldType, setFieldType] = useState(""); // "client" | "vehicle"

    function parseSafeDate(d) {
        if (!d) return null;
        if (d instanceof Date) return d;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    const initialPickupDate = parseSafeDate(initialData?.pickupDropDetails?.pickupDate || step2Data?.arrivalDate) || new Date();
    const initialDropDate = parseSafeDate(initialData?.pickupDropDetails?.dropDate || step2Data?.departureDate) || new Date(initialPickupDate.getTime() + 24 * 60 * 60 * 1000);

    const initialVehicleType = !isTransportEnabled ? "No Transport" : (initialData?.basicsDetails?.vehicleType || vehicleTypes[0]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            clientName: step1Data?.clientName || initialData?.basicsDetails?.clientName || "",
            vehicleType: initialVehicleType,
            tripType: initialData?.basicsDetails?.tripType || "One Way",
            noOfDays: initialData?.basicsDetails?.noOfDays || (step2Data?.nights ? step2Data.nights + 1 : 1),
            noOfDaysManuallyEdited: initialData?.basicsDetails?.noOfDaysManuallyEdited || false,

            perDayCost: initialData?.costDetails?.perDayCost || "",
            ratePerKm: initialData?.costDetails?.ratePerKm || "",
            kmPerDay: initialData?.costDetails?.kmPerDay || "",
            driverAllowance: initialData?.costDetails?.driverAllowance || "",
            tollParking: initialData?.costDetails?.tollParking || "",
            totalCost: initialData?.costDetails?.totalCost || 0,
            totalCostManuallyEdited: initialData?.costDetails?.totalCostManuallyEdited || false,

            pickupDate: initialPickupDate,
            pickupTime: parseTimeStringToDate(initialData?.pickupDropDetails?.pickupTime) || parseTimeStringToDate("12:00"),
            pickupLocation: initialData?.pickupDropDetails?.pickupLocation || step2Data?.arrivalLocation || "TBD",

            dropDate: initialDropDate,
            dropTime: parseTimeStringToDate(initialData?.pickupDropDetails?.dropTime) || parseTimeStringToDate("12:00"),
            dropLocation: initialData?.pickupDropDetails?.dropLocation || step2Data?.departureLocation || "TBD",

            // Policies
            quotationInclusion: initialData?.quotationInclusion || "",
            quotationExculsion: initialData?.quotationExculsion || "",
            paymentPolicies: initialData?.paymentPolicies || "",
            CancellationRefund: initialData?.CancellationRefund || "",
            termsAndConditions: initialData?.termsAndConditions || "",
        },
        validationSchema: getValidationSchema(transport),
        onSubmit: (values) => {
            const payload = {
                basicsDetails: {
                    clientName: values.clientName.trim(),
                    vehicleType: values.vehicleType,
                    tripType: values.tripType,
                    noOfDays: Number(values.noOfDays) || 1,
                    noOfDaysManuallyEdited: values.noOfDaysManuallyEdited
                },
                costDetails: {
                    perDayCost: values.perDayCost === "" ? 0 : Number(values.perDayCost),
                    ratePerKm: values.ratePerKm === "" ? "" : Number(values.ratePerKm),
                    kmPerDay: values.kmPerDay === "" ? "" : Number(values.kmPerDay),
                    driverAllowance: values.driverAllowance === "" ? 0 : Number(values.driverAllowance),
                    tollParking: values.tollParking === "" ? 0 : Number(values.tollParking),
                    totalCost: Number(values.totalCost) || 0,
                    totalCostManuallyEdited: values.totalCostManuallyEdited
                },
                pickupDropDetails: {
                    pickupDate: safeDateToISOString(values.pickupDate),
                    pickupTime: formatTimeForSubmit(values.pickupTime),
                    pickupLocation: (values.pickupLocation || "TBD").toString(),
                    dropDate: safeDateToISOString(values.dropDate),
                    dropTime: formatTimeForSubmit(values.dropTime),
                    dropLocation: (values.dropLocation || "TBD").toString(),
                },
                // Policies
                quotationInclusion: values.quotationInclusion,
                quotationExculsion: values.quotationExculsion,
                paymentPolicies: values.paymentPolicies,
                CancellationRefund: values.CancellationRefund,
                termsAndConditions: values.termsAndConditions,
                vehicleTypes: vehicleTypes
            };
            onNext(payload);
        },
    });

    // Auto-calc noOfDays
    useEffect(() => {
        const pickup = formik.values.pickupDate;
        const drop = formik.values.dropDate;
        if (!pickup || !drop) return;
        const diff = Math.ceil((drop - pickup) / (1000 * 60 * 60 * 24));
        const days = diff > 0 ? diff + 1 : 1;
        if (!formik.values.noOfDaysManuallyEdited) {
            formik.setFieldValue("noOfDays", days, false);
        }
    }, [formik.values.pickupDate, formik.values.dropDate, formik.values.noOfDaysManuallyEdited]);

    // Auto-calc totalCost
    useEffect(() => {
        if (!isTransportEnabled || formik.values.totalCostManuallyEdited) return;

        const days = Number(formik.values.noOfDays) || 0;
        const perDay = Number(formik.values.perDayCost) || 0;
        const ratePerKm = Number(formik.values.ratePerKm) || 0;
        const kmPerDay = Number(formik.values.kmPerDay) || 0;
        const driverAllowance = Number(formik.values.driverAllowance) || 0;
        const toll = Number(formik.values.tollParking) || 0;

        let total = 0;
        if (perDay > 0 && days > 0) {
            total = (perDay * days) + (driverAllowance * days) + toll;
        } else if (ratePerKm > 0 && kmPerDay > 0 && days > 0) {
            total = (ratePerKm * kmPerDay * days) + (driverAllowance * days) + toll;
        }
        
        if (total > 0) {
            formik.setFieldValue("totalCost", Number(total.toFixed(2)), false);
        }
    }, [
        formik.values.noOfDays,
        formik.values.perDayCost,
        formik.values.ratePerKm,
        formik.values.kmPerDay,
        formik.values.driverAllowance,
        formik.values.tollParking,
        formik.values.totalCostManuallyEdited,
        isTransportEnabled
    ]);

    const openAddDialog = (type) => {
        setFieldType(type);
        setNewValue("");
        setOpenDialog(true);
    };

    const handleAddNew = () => {
        if (!newValue.trim()) return;
        if (fieldType === "client") {
            setClients((s) => [...s, newValue.trim()]);
            formik.setFieldValue("clientName", newValue.trim());
        } else {
            setVehicleTypes((s) => [...s, newValue.trim()]);
            formik.setFieldValue("vehicleType", newValue.trim());
        }
        setOpenDialog(false);
    };

    const handleBack = () => {
        const payload = {
            ...formik.values,
            pickupDate: safeDateToISOString(formik.values.pickupDate),
            pickupTime: formatTimeForSubmit(formik.values.pickupTime),
            dropDate: safeDateToISOString(formik.values.dropDate),
            dropTime: formatTimeForSubmit(formik.values.dropTime),
            vehicleTypes: vehicleTypes
        };
        onBack(payload);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto", mt: 3, borderRadius: 3, boxShadow: 3 }}>
                <form onSubmit={formik.handleSubmit} noValidate>
                    <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                        Vehicle & Pickup/Drop Details
                    </Typography>
                    <Divider sx={{ mb: 4 }} />

                    <Box mb={3}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    label="Client Name"
                                    name="clientName"
                                    fullWidth
                                    value={formik.values.clientName}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "addNew") return openAddDialog("client");
                                        formik.setFieldValue("clientName", v);
                                    }}
                                    error={!!formik.touched.clientName && !!formik.errors.clientName}
                                    helperText={formik.touched.clientName && formik.errors.clientName}
                                >
                                    {clients.map((c, i) => <MenuItem key={i} value={c}>{c}</MenuItem>)}
                                    <MenuItem value="addNew">+ Add New</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    label="Vehicle Type"
                                    name="vehicleType"
                                    fullWidth
                                    value={formik.values.vehicleType}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "addNew") return openAddDialog("vehicle");
                                        formik.setFieldValue("vehicleType", v);
                                    }}
                                    error={!!formik.touched.vehicleType && !!formik.errors.vehicleType}
                                    helperText={formik.touched.vehicleType && formik.errors.vehicleType}
                                >
                                    {!isTransportEnabled && <MenuItem value="No Transport">No Transport</MenuItem>}
                                    {isTransportEnabled && vehicleTypes.map((v, i) => <MenuItem key={i} value={v}>{v}</MenuItem>)}
                                    {isTransportEnabled && <MenuItem value="addNew">+ Add New</MenuItem>}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="No of Days"
                                    name="noOfDays"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.noOfDays}
                                    onChange={(e) => {
                                        formik.setFieldValue("noOfDays", e.target.value);
                                        formik.setFieldValue("noOfDaysManuallyEdited", true);
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Per Day Cost"
                                    name="perDayCost"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.perDayCost}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Rate Per Km"
                                    name="ratePerKm"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.ratePerKm}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Km Per Day"
                                    name="kmPerDay"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.kmPerDay}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Driver Allowance"
                                    name="driverAllowance"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.driverAllowance}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Toll / Parking"
                                    name="tollParking"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.tollParking}
                                    onChange={formik.handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Total Transport Cost"
                                    name="totalCost"
                                    fullWidth
                                    type="number"
                                    disabled={!isTransportEnabled}
                                    value={formik.values.totalCost}
                                    onChange={(e) => {
                                        formik.setFieldValue("totalCost", e.target.value);
                                        formik.setFieldValue("totalCostManuallyEdited", true);
                                    }}
                                    sx={{ backgroundColor: '#e3f2fd', '& .MuiInputBase-input': { fontWeight: 'bold' } }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {formik.values.totalCostManuallyEdited ? "Manual override active" : "Auto-calculated based on inputs"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mt: 4 }}>
                        Pickup & Drop Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box mb={3}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <DatePicker
                                    label="Pickup Date"
                                    value={formik.values.pickupDate}
                                    onChange={(v) => formik.setFieldValue("pickupDate", v)}
                                    slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TimePicker
                                    label="Pickup Time"
                                    value={formik.values.pickupTime}
                                    onChange={(v) => formik.setFieldValue("pickupTime", v)}
                                    slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Pickup Location"
                                    name="pickupLocation"
                                    fullWidth
                                    value={formik.values.pickupLocation}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <DatePicker
                                    label="Drop Date"
                                    value={formik.values.dropDate}
                                    onChange={(v) => formik.setFieldValue("dropDate", v)}
                                    slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TimePicker
                                    label="Drop Time"
                                    value={formik.values.dropTime}
                                    onChange={(v) => formik.setFieldValue("dropTime", v)}
                                    slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Drop Location"
                                    name="dropLocation"
                                    fullWidth
                                    value={formik.values.dropLocation}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mt: 4 }}>
                        Policies & Terms
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box mb={4}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Inclusions" name="quotationInclusion" multiline rows={3} value={formik.values.quotationInclusion} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Exclusions" name="quotationExculsion" multiline rows={3} value={formik.values.quotationExculsion} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Payment Policies" name="paymentPolicies" multiline rows={3} value={formik.values.paymentPolicies} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Cancellation & Refund" name="CancellationRefund" multiline rows={3} value={formik.values.CancellationRefund} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Terms & Conditions" name="termsAndConditions" multiline rows={3} value={formik.values.termsAndConditions} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button variant="outlined" size="large" onClick={handleBack} sx={{ px: 5, py: 1.5, borderRadius: 2 }}>Back</Button>
                        <Button type="submit" variant="contained" size="large" sx={{ px: 5, py: 1.5, borderRadius: 2 }}>Save & Continue</Button>
                    </Box>
                </form>
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{fieldType === "client" ? "Add Client" : "Add Vehicle Type"}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" fullWidth label={fieldType === "client" ? "Client Name" : "Vehicle Type"} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddNew}>Save & Add</Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default HotelQuotationStep4;