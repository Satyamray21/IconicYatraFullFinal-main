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

} from "@mui/material";
import {
    DatePicker,
    TimePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";


const parseTimeStringToDate = (time) => {
    // Accepts Date, "HH:mm" string, or empty — returns Date instance or null
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
    // return "HH:mm", fallback "12:00"
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "12:00";
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};

const safeDateToISOString = (d) =>
    d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();

/* -------------------- Validation Schema -------------------- */
const getValidationSchema = (transport) =>
    Yup.object({
        clientName: Yup.string().required("Client Name is required"),
        vehicleType: Yup.string().required("Vehicle Type is required"),
        tripType: Yup.string().required("Trip Type is required"),
        noOfDays: Yup.number().required("No of Days is required").min(1, "At least 1 day"),

        // pickup / drop (backend requires these)
        pickupDate: Yup.date().required("Pickup date is required"),
        pickupTime: Yup.mixed().required("Pickup time is required"),
        pickupLocation: Yup.string().required("Pickup location is required"),

        dropDate: Yup.date().required("Drop date is required"),
        dropTime: Yup.mixed().required("Drop time is required"),
        dropLocation: Yup.string().required("Drop location is required"),
    });

/* -------------------- Component -------------------- */
const CustomQuotationStep5 = ({
    clientName,
    arrivalCity,
    departureCity,
    arrivalDate,
    departureDate,
    transport = "Yes",
    cities = [],
    vehicleDetails = {},
    onNext,
}) => {
    const [clients, setClients] = useState([clientName || "Client A"].filter(Boolean));
    const [vehicleTypes, setVehicleTypes] = useState([
        "Sedan",
        "SUV",
        "Bus",
        "Tempo Traveller",
    ]);

    const [openDialog, setOpenDialog] = useState(false);
    const [newValue, setNewValue] = useState("");
    const [fieldType, setFieldType] = useState(""); // "client" | "vehicle"

    // default fallbacks — ensure not null
    function parseSafeDate(d) {
        if (!d) return null;
        if (d instanceof Date) return d;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Update the initialPickupDate and initialDropDate logic:
    const initialPickupDate = parseSafeDate(
        vehicleDetails?.pickupDropDetails?.pickupDate ||
        vehicleDetails?.pickupDate || // Additional fallback
        arrivalDate
    ) || new Date();
    const initialDropDate = parseSafeDate(
        vehicleDetails?.pickupDropDetails?.dropDate ||
        vehicleDetails?.dropDate || // Additional fallback
        departureDate
    ) || new Date(initialPickupDate.getTime() + 24 * 60 * 60 * 1000);


    // initial vehicleType fallback
    const initialVehicleType =
        transport === "No"
            ? "No Transport"
            : vehicleDetails?.basicsDetails?.vehicleType || vehicleTypes[0];

    /* -------------------- Formik -------------------- */

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            clientName: clientName || vehicleDetails?.basicsDetails?.clientName || "",
            vehicleType: initialVehicleType,
            tripType: vehicleDetails?.basicsDetails?.tripType || "One Way",
            noOfDays: vehicleDetails?.basicsDetails?.noOfDays ||
                parseInt(vehicleDetails?.basicsDetails?.noOfDays) || 1, // Parse string
            noOfDaysManuallyEdited: false,

            perDayCost: vehicleDetails?.costDetails?.perDayCost ??
                vehicleDetails?.basicsDetails?.perDayCost ??
                "",

            ratePerKm: vehicleDetails?.costDetails?.ratePerKm ?? "",
            kmPerDay: vehicleDetails?.costDetails?.kmPerDay ?? "",
            driverAllowance: vehicleDetails?.costDetails?.driverAllowance ?? "",
            tollParking: vehicleDetails?.costDetails?.tollParking ?? "",
            totalCost: vehicleDetails?.costDetails?.totalCost ?? 0,

            pickupDate: initialPickupDate,
            pickupTime: parseTimeStringToDate(vehicleDetails?.pickupDropDetails?.pickupTime) ||
                parseTimeStringToDate("12:00"),
            pickupLocation: vehicleDetails?.pickupDropDetails?.pickupLocation ||
                arrivalCity ||
                "TBD",

            dropDate: initialDropDate,
            dropTime: parseTimeStringToDate(vehicleDetails?.pickupDropDetails?.dropTime) ||
                parseTimeStringToDate("12:00"),
            dropLocation: vehicleDetails?.pickupDropDetails?.dropLocation ||
                departureCity ||
                "TBD",
        },

        validationSchema: getValidationSchema(transport),

        onSubmit: (values) => {
            // Ensure required fields are present (double-check)
            if (!values.clientName || !values.vehicleType || !values.tripType) {
                // Let Yup handle these but short-circuit if missing
                return;
            }

            // Prepare formatted payload — backend expects ISO dates and "HH:mm" times
            const payload = {
                basicsDetails: {
                    clientName: values.clientName.trim(),
                    vehicleType: values.vehicleType,
                    tripType: values.tripType,
                    noOfDays: Number(values.noOfDays) || 1,
                    perDayCost: values.perDayCost === "" ? 0 : Number(values.perDayCost),
                },
                costDetails: {
                    perDayCost: values.perDayCost === "" ? 0 : Number(values.perDayCost),
                    ratePerKm: values.ratePerKm === "" ? "" : Number(values.ratePerKm),
                    kmPerDay: values.kmPerDay === "" ? "" : Number(values.kmPerDay),
                    driverAllowance: values.driverAllowance === "" ? 0 : Number(values.driverAllowance),
                    tollParking: values.tollParking === "" ? 0 : Number(values.tollParking),
                    totalCost: Number(values.totalCost) || 0,
                },
                pickupDropDetails: {
                    pickupDate: safeDateToISOString(values.pickupDate),
                    pickupTime: formatTimeForSubmit(values.pickupTime),
                    pickupLocation: (values.pickupLocation || "TBD").toString(),

                    dropDate: safeDateToISOString(values.dropDate),
                    dropTime: formatTimeForSubmit(values.dropTime),
                    dropLocation: (values.dropLocation || "TBD").toString(),
                },
            };

            onNext(payload);
        },
    });

    /* -------------------- Effects -------------------- */

    // Keep clientName in clients list
    useEffect(() => {
        const name = formik.values.clientName;
        if (name && !clients.includes(name)) setClients((s) => [...s, name]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.clientName]);

    // Auto-calc noOfDays from pickup & drop if user hasn't manually edited
    useEffect(() => {
        const pickup = formik.values.pickupDate;
        const drop = formik.values.dropDate;

        if (!pickup || !drop) return;

        // compute difference in days (drop - pickup)
        const diff = Math.ceil((drop - pickup) / (1000 * 60 * 60 * 24));
        const days = diff > 0 ? diff + 1 : 1;

        if (!formik.values.noOfDaysManuallyEdited) {
            formik.setFieldValue("noOfDays", days, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.pickupDate, formik.values.dropDate]);

    // Auto-calc totalCost with priority: perDayCost > (ratePerKm * kmPerDay)
    useEffect(() => {
        if (transport === "No") {
            formik.setFieldValue("totalCost", 0, false);
            return;
        }

        const days = Number(formik.values.noOfDays) || 0;
        const perDay = Number(formik.values.perDayCost) || 0;
        const ratePerKm = Number(formik.values.ratePerKm) || 0;
        const kmPerDay = Number(formik.values.kmPerDay) || 0;
        const driverAllowance = Number(formik.values.driverAllowance) || 0;
        const toll = Number(formik.values.tollParking) || 0;

        let total = 0;
        if (perDay > 0 && days > 0) {
            total = perDay * days + driverAllowance + toll;
        } else if (ratePerKm > 0 && kmPerDay > 0 && days > 0) {
            total = ratePerKm * kmPerDay * days + driverAllowance + toll;
        }

        formik.setFieldValue("totalCost", Number(total.toFixed(2)), false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formik.values.noOfDays,
        formik.values.perDayCost,
        formik.values.ratePerKm,
        formik.values.kmPerDay,
        formik.values.driverAllowance,
        formik.values.tollParking,
        transport,
    ]);

    /* -------------------- UI Handlers -------------------- */
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

    // Add debug logging
    useEffect(() => {
        console.log('Step 5 Received Props:', {
            clientName,
            arrivalCity,
            departureCity,
            arrivalDate,
            departureDate,
            transport,
            vehicleDetails,
            cities
        });

        console.log('Vehicle Details from API:', vehicleDetails);
        console.log('Pickup Drop Details:', vehicleDetails?.pickupDropDetails);

        // Log initial form values
        console.log('Initial form values:', {
            pickupDate: initialPickupDate,
            dropDate: initialDropDate,
            pickupLocation: vehicleDetails?.pickupDropDetails?.pickupLocation,
            dropLocation: vehicleDetails?.pickupDropDetails?.dropLocation,
            noOfDays: vehicleDetails?.basicsDetails?.noOfDays
        });
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ p: 3, maxWidth: 950, mx: "auto" }}>
                <form onSubmit={formik.handleSubmit} noValidate>
                    <Typography variant="h6" gutterBottom>
                        Vehicle & Pickup/Drop Details
                    </Typography>

                    <Box mb={2}>
                        <Grid container spacing={2}>
                            {/* Client */}
                            <Grid item xs={12} sm={4}>
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
                                    {clients.map((c, i) => (
                                        <MenuItem key={i} value={c}>
                                            {c}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="addNew">+ Add New</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Vehicle Type */}
                            <Grid item xs={12} sm={4}>
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
                                    {/* When transport=No we still show No Transport as a valid option */}
                                    {transport === "No" && <MenuItem value="No Transport">No Transport</MenuItem>}

                                    {transport !== "No" &&
                                        vehicleTypes.map((v, i) => (
                                            <MenuItem key={i} value={v}>
                                                {v}
                                            </MenuItem>
                                        ))}

                                    {transport !== "No" && <MenuItem value="addNew">+ Add New</MenuItem>}
                                </TextField>
                            </Grid>

                            {/* Trip Type */}
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    label="Trip Type"
                                    name="tripType"
                                    fullWidth
                                    value={formik.values.tripType}
                                    onChange={(e) => formik.setFieldValue("tripType", e.target.value)}
                                    error={!!formik.touched.tripType && !!formik.errors.tripType}
                                    helperText={formik.touched.tripType && formik.errors.tripType}
                                >
                                    {["One Way", "Round Trip"].map((t) => (
                                        <MenuItem key={t} value={t}>
                                            {t}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* No of Days (editable, manual override flag) */}
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="No of Days"
                                    name="noOfDays"
                                    fullWidth
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={formik.values.noOfDays}
                                    onChange={(e) => {
                                        const v = Number(e.target.value) || 1;
                                        formik.setFieldValue("noOfDays", v);
                                        formik.setFieldValue("noOfDaysManuallyEdited", true);
                                    }}
                                    error={!!formik.touched.noOfDays && !!formik.errors.noOfDays}
                                    helperText={formik.touched.noOfDays && formik.errors.noOfDays}
                                />
                            </Grid>

                            {/* Per Day / Rate / Km */}
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Per Day Cost"
                                    name="perDayCost"
                                    fullWidth
                                    type="number"
                                    value={formik.values.perDayCost}
                                    onChange={(e) => formik.setFieldValue("perDayCost", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Rate Per Km"
                                    name="ratePerKm"
                                    fullWidth
                                    type="number"
                                    value={formik.values.ratePerKm}
                                    onChange={(e) => formik.setFieldValue("ratePerKm", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Km Per Day"
                                    name="kmPerDay"
                                    fullWidth
                                    type="number"
                                    value={formik.values.kmPerDay}
                                    onChange={(e) => formik.setFieldValue("kmPerDay", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Cost details */}
                    <Box mb={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Driver Allowance"
                                    name="driverAllowance"
                                    fullWidth
                                    type="number"
                                    value={formik.values.driverAllowance}
                                    onChange={(e) => formik.setFieldValue("driverAllowance", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Toll / Parking"
                                    name="tollParking"
                                    fullWidth
                                    type="number"
                                    value={formik.values.tollParking}
                                    onChange={(e) => formik.setFieldValue("tollParking", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Total Cost"
                                    name="totalCost"
                                    fullWidth
                                    type="number"
                                    value={formik.values.totalCost}
                                    onChange={(e) => formik.setFieldValue("totalCost", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Pickup / Drop */}
                    <Box mb={2}>
                        <Typography sx={{ mb: 1, fontWeight: "bold" }}>Pickup / Drop Details</Typography>
                        <Grid container spacing={2}>
                            {/* Pickup */}
                            <Grid item xs={12} sm={4}>
                                <DatePicker
                                    label="Pickup Date"
                                    value={formik.values.pickupDate}
                                    onChange={(v) => {
                                        formik.setFieldValue("pickupDate", v);
                                        if (!formik.values.noOfDaysManuallyEdited && formik.values.dropDate) {
                                            // will cause effect to recalc days
                                            formik.setFieldValue("noOfDaysManuallyEdited", false);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!formik.touched.pickupDate && !!formik.errors.pickupDate}
                                            helperText={formik.touched.pickupDate && formik.errors.pickupDate}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TimePicker
                                    label="Pickup Time"
                                    value={formik.values.pickupTime}
                                    onChange={(v) => formik.setFieldValue("pickupTime", v)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!formik.touched.pickupTime && !!formik.errors.pickupTime}
                                            helperText={formik.touched.pickupTime && formik.errors.pickupTime}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Pickup Location"
                                    name="pickupLocation"
                                    fullWidth
                                    value={formik.values.pickupLocation}
                                    onChange={(e) => formik.setFieldValue("pickupLocation", e.target.value)}
                                    error={!!formik.touched.pickupLocation && !!formik.errors.pickupLocation}
                                    helperText={formik.touched.pickupLocation && formik.errors.pickupLocation}
                                />
                            </Grid>

                            {/* Drop */}
                            <Grid item xs={12} sm={4}>
                                <DatePicker
                                    label="Drop Date"
                                    value={formik.values.dropDate}
                                    onChange={(v) => {
                                        formik.setFieldValue("dropDate", v);
                                        if (!formik.values.noOfDaysManuallyEdited && formik.values.pickupDate) {
                                            // will cause effect to recalc days
                                            formik.setFieldValue("noOfDaysManuallyEdited", false);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!formik.touched.dropDate && !!formik.errors.dropDate}
                                            helperText={formik.touched.dropDate && formik.errors.dropDate}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TimePicker
                                    label="Drop Time"
                                    value={formik.values.dropTime}
                                    onChange={(v) => formik.setFieldValue("dropTime", v)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!formik.touched.dropTime && !!formik.errors.dropTime}
                                            helperText={formik.touched.dropTime && formik.errors.dropTime}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Drop Location"
                                    name="dropLocation"
                                    fullWidth
                                    value={formik.values.dropLocation}
                                    onChange={(e) => formik.setFieldValue("dropLocation", e.target.value)}
                                    error={!!formik.touched.dropLocation && !!formik.errors.dropLocation}
                                    helperText={formik.touched.dropLocation && formik.errors.dropLocation}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box textAlign="center">
                        <Button type="submit" variant="contained">
                            Save & Continue
                        </Button>
                    </Box>
                </form>
            </Paper>

            {/* Add New Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{fieldType === "client" ? "Add Client" : "Add Vehicle Type"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        label={fieldType === "client" ? "Client Name" : "Vehicle Type"}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            handleAddNew();
                        }}
                    >
                        Save & Add
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default CustomQuotationStep5;