import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    IconButton,
    Typography,
    TextField,
    MenuItem,
    Paper,
    RadioGroup,
    FormControlLabel,
    Radio,
    Grid,
} from "@mui/material";
import {
    DatePicker,
    TimePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Close,
    Delete as DeleteIcon,
    AddCircleOutline as AddCircleOutlineIcon,
} from '@mui/icons-material';

const validationSchema = Yup.object({
    clientName: Yup.string().required("Client name is required"),
    from: Yup.string().required("From is required"),
    to: Yup.string().required("To is required"),
    airline: Yup.string().required("Preferred airline is required"),
    flightNo: Yup.string().required("Flight number is required"),
    fare: Yup.number().typeError("Must be a number").required("Fare is required"),
    departureDate: Yup.date().required("Departure date is required"),
    adults: Yup.number().min(1, "At least 1 adult").required("Required"),
    fullName: Yup.string().required("Full name is required"),
    mobile: Yup.string().required("Mobile number is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
});

const FlightDialog = ({ open, onClose, onSave }) => {
    const initialValues = {
        tripType: "oneway",
        clientName: "",
        from: "",
        to: "",
        airline: "",
        flightNo: "",
        fare: "",
        departureDate: null,
        departureTime: null,
        returnFrom: "",
        returnTo: "",
        returnAirline: "",
        returnFlightNo: "",
        returnFare: "",
        returnDate: null,
        returnTime: null,
        additionalCities: [],
        adults: "1",
        childs: "0",
        infants: "0",
        message: "",
        fullName: "",
        mobile: "",
        email: "",
    };

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: (values) => {
            onSave(values);
        },
    });

    const addAnotherCity = () => {
        const newCity = {
            from: "",
            to: "",
            airline: "",
            flightNo: "",
            fare: "",
            date: null,
            time: null,
        };
        formik.setFieldValue("additionalCities", [
            ...formik.values.additionalCities,
            newCity,
        ]);
    };

    const handleAdditionalCityChange = (index, field, value) => {
        const updatedCities = [...formik.values.additionalCities];
        updatedCities[index][field] = value;
        formik.setFieldValue("additionalCities", updatedCities);
    };

    const deleteCity = (index) => {
        const updatedCities = formik.values.additionalCities.filter(
            (_, i) => i !== index
        );
        formik.setFieldValue("additionalCities", updatedCities);
    };

    const renderFlightDetails = (prefix = "", values = formik.values) => (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    fullWidth
                    label="From"
                    name={`${prefix}from`}
                    value={values[`${prefix}from`]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched[`${prefix}from`] &&
                        Boolean(formik.errors[`${prefix}from`])
                    }
                    helperText={
                        formik.touched[`${prefix}from`] && formik.errors[`${prefix}from`]
                    }
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    fullWidth
                    label="To"
                    name={`${prefix}to`}
                    value={values[`${prefix}to`]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched[`${prefix}to`] &&
                        Boolean(formik.errors[`${prefix}to`])
                    }
                    helperText={
                        formik.touched[`${prefix}to`] && formik.errors[`${prefix}to`]
                    }
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    fullWidth
                    select
                    label="Preferred Airline"
                    name={`${prefix}airline`}
                    value={values[`${prefix}airline`]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched[`${prefix}airline`] &&
                        Boolean(formik.errors[`${prefix}airline`])
                    }
                    helperText={
                        formik.touched[`${prefix}airline`] &&
                        formik.errors[`${prefix}airline`]
                    }
                >
                    {[
                        "AirIndia",
                        "AirAsia",
                        "IndiGo",
                        "SpiceJet",
                        "Vistara",
                        "AirArabia",
                        "AirDeccan",
                        "GoAir",
                    ].map((item) => (
                        <MenuItem key={item} value={item}>
                            {item}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    fullWidth
                    label="Flight No."
                    name={`${prefix}flightNo`}
                    value={values[`${prefix}flightNo`]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched[`${prefix}flightNo`] &&
                        Boolean(formik.errors[`${prefix}flightNo`])
                    }
                    helperText={
                        formik.touched[`${prefix}flightNo`] &&
                        formik.errors[`${prefix}flightNo`]
                    }
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                    fullWidth
                    label="Fare"
                    name={`${prefix}fare`}
                    value={values[`${prefix}fare`]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched[`${prefix}fare`] &&
                        Boolean(formik.errors[`${prefix}fare`])
                    }
                    helperText={
                        formik.touched[`${prefix}fare`] && formik.errors[`${prefix}fare`]
                    }
                />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <DatePicker
                    label={`${prefix ? "Return " : "Departure "}Date`}
                    value={
                        values[`${prefix}departureDate`] || values[`${prefix}returnDate`]
                    }
                    onChange={(val) =>
                        formik.setFieldValue(
                            `${prefix}${prefix ? "return" : "departure"}Date`,
                            val
                        )
                    }
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            error:
                                formik.touched[
                                `${prefix}${prefix ? "return" : "departure"}Date`
                                ] &&
                                Boolean(
                                    formik.errors[
                                    `${prefix}${prefix ? "return" : "departure"}Date`
                                    ]
                                ),
                            helperText:
                                formik.touched[
                                `${prefix}${prefix ? "return" : "departure"}Date`
                                ] &&
                                formik.errors[
                                `${prefix}${prefix ? "return" : "departure"}Date`
                                ],
                        },
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TimePicker
                    label={`${prefix ? "Return " : "Departure "}Time`}
                    value={
                        values[`${prefix}departureTime`] || values[`${prefix}returnTime`]
                    }
                    onChange={(val) =>
                        formik.setFieldValue(
                            `${prefix}${prefix ? "return" : "departure"}Time`,
                            val
                        )
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                />
            </Grid>
        </Grid>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog
                open={open}
                onClose={onClose}
                fullScreen
                sx={{
                    '& .MuiDialog-paper': {
                        m: 0,
                        width: '100%',
                        height: '100%',
                        maxHeight: '100%'
                    }
                }}
            >
                <DialogTitle sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Add Flight Details</Typography>
                        <IconButton onClick={onClose}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 2, overflowY: 'auto' }}>
                    <form onSubmit={formik.handleSubmit}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Trip Type
                            </Typography>
                            <RadioGroup
                                row
                                name="tripType"
                                value={formik.values.tripType}
                                onChange={formik.handleChange}
                            >
                                {["oneway", "roundtrip", "multicity"].map((type) => (
                                    <FormControlLabel
                                        key={type}
                                        value={type}
                                        control={<Radio />}
                                        label={
                                            type === "oneway"
                                                ? "One Way"
                                                : type === "roundtrip"
                                                    ? "Round-Trip"
                                                    : "Multi City"
                                        }
                                    />
                                ))}
                            </RadioGroup>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1">Client Details</Typography>
                            <TextField
                                fullWidth
                                select
                                label="Client Name"
                                name="clientName"
                                value={formik.values.clientName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.touched.clientName && Boolean(formik.errors.clientName)
                                }
                                helperText={formik.touched.clientName && formik.errors.clientName}
                                margin="normal"
                            >
                                {[1, 2, 3].map((num) => (
                                    <MenuItem key={num} value={`Client ${num}`}>
                                        Client {num}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Flight Details
                            </Typography>
                            {renderFlightDetails()}
                        </Paper>

                        {(formik.values.tripType === "roundtrip" ||
                            formik.values.tripType === "multicity") && (
                                <Paper sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Return Flight Details
                                    </Typography>
                                    {renderFlightDetails("return", formik.values)}
                                </Paper>
                            )}

                        {formik.values.tripType === "multicity" && (
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Additional Cities
                                </Typography>
                                {formik.values.additionalCities.map((city, index) => (
                                    <Paper key={index} sx={{ p: 2, mb: 2, position: "relative" }}>
                                        <IconButton
                                            sx={{ position: "absolute", top: 8, right: 8 }}
                                            onClick={() => deleteCity(index)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Additional City {index + 1}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="From"
                                                    value={city.from}
                                                    onChange={(e) =>
                                                        handleAdditionalCityChange(index, "from", e.target.value)
                                                    }
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="To"
                                                    value={city.to}
                                                    onChange={(e) =>
                                                        handleAdditionalCityChange(index, "to", e.target.value)
                                                    }
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Preferred Airline"
                                                    value={city.airline}
                                                    onChange={(e) =>
                                                        handleAdditionalCityChange(index, "airline", e.target.value)
                                                    }
                                                >
                                                    {[
                                                        "AirIndia",
                                                        "AirAsia",
                                                        "IndiGo",
                                                        "SpiceJet",
                                                        "Vistara",
                                                        "AirArabia",
                                                        "AirDeccan",
                                                        "GoAir",
                                                    ].map((item) => (
                                                        <MenuItem key={item} value={item}>
                                                            {item}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Flight No."
                                                    value={city.flightNo}
                                                    onChange={(e) =>
                                                        handleAdditionalCityChange(index, "flightNo", e.target.value)
                                                    }
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Fare"
                                                    value={city.fare}
                                                    onChange={(e) =>
                                                        handleAdditionalCityChange(index, "fare", e.target.value)
                                                    }
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <DatePicker
                                                    label="Date"
                                                    value={city.date}
                                                    onChange={(val) => handleAdditionalCityChange(index, "date", val)}
                                                    slotProps={{ textField: { fullWidth: true } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TimePicker
                                                    label="Time"
                                                    value={city.time}
                                                    onChange={(val) => handleAdditionalCityChange(index, "time", val)}
                                                    slotProps={{ textField: { fullWidth: true } }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={addAnotherCity}
                                >
                                    Add Another City
                                </Button>
                            </Paper>
                        )}

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1">Passenger Details</Typography>
                            <Grid container spacing={2}>
                                {["adults", "childs", "infants"].map((field) => (
                                    <Grid key={field} size={{ xs: 4 }} mt={2}>
                                        <TextField
                                            fullWidth
                                            label={
                                                field === "adults"
                                                    ? "Adults (12+ Yrs)"
                                                    : field === "childs"
                                                        ? "Childs (2-11 Yrs)"
                                                        : "Infants (Under 2 Yrs)"
                                            }
                                            name={field}
                                            value={formik.values[field]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched[field] && Boolean(formik.errors[field])}
                                            helperText={formik.touched[field] && formik.errors[field]}
                                        />
                                    </Grid>
                                ))}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Any Message"
                                        name="message"
                                        value={formik.values.message}
                                        onChange={formik.handleChange}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1">Personal Details</Typography>
                            <Grid container spacing={2}>
                                {["fullName", "mobile", "email"].map((field, index) => (
                                    <Grid key={field} size={{ xs: index === 2 ? 12 : 6 }}>
                                        <TextField
                                            fullWidth
                                            label={
                                                field === "fullName"
                                                    ? "Full Name"
                                                    : field === "mobile"
                                                        ? "Mobile Number"
                                                        : "Email Id"
                                            }
                                            name={field}
                                            value={formik.values[field]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched[field] && Boolean(formik.errors[field])}
                                            helperText={formik.touched[field] && formik.errors[field]}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </form>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={formik.handleSubmit}
                    >
                        Add Flight
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default FlightDialog;