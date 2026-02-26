import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Dialog,
  Divider,
  Chip,
  Avatar,
  useTheme,
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
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  FlightTakeoff,
  FlightLand,
  AirlineSeatReclineNormal,
  Person,
  Phone,
  Email,
  Close,
} from "@mui/icons-material";
import { createFlightQuotation } from "../../../../features/quotation/flightQuotationSlice";
import { useSelector, useDispatch } from "react-redux";
import { getAllLeads } from "../../../../features/leads/leadSlice";
import { useNavigate } from "react-router-dom";

// Validation schema (base fields)
const validationSchema = Yup.object({
  clientName: Yup.string().required("Client name is required"),
  from: Yup.string().required("From is required"),
  to: Yup.string().required("To is required"),
  airline: Yup.string().required("Preferred airline is required"),
  flightNo: Yup.string().required("Flight number is required"),
  fare: Yup.number().typeError("Must be a number").required("Fare is required"),
  departureDate: Yup.date().nullable().required("Departure date is required"),
  adults: Yup.number().min(1, "At least 1 adult").required("Required"),
  fullName: Yup.string().required("Full name is required"),
  mobile: Yup.string().required("Mobile number is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
});

const QuotationFlightForm = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    list: leadList = [],
    status,
    options = [],
    loading: optionsLoading,
    error,
  } = useSelector((state) => state.leads);

  useEffect(() => {
    dispatch(getAllLeads());
  }, [dispatch]);

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
    adults: "",
    childs: "",
    infants: "",
    message: "",
    fullName: "",
    mobile: "",
    email: "",
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        tripType: values.tripType,
        clientDetails: {
          clientName: values.clientName,
        },
        flightDetails: [],
        adults: Number(values.adults || 0),
        childs: Number(values.childs || 0),
        infants: Number(values.infants || 0),
        anyMessage: values.message,
        personalDetails: {
          fullName: values.fullName,
          mobileNumber: values.mobile,
          emailId: values.email,
        },
      };

      // Always push first flight
      payload.flightDetails.push({
        from: values.from,
        to: values.to,
        preferredAirline: values.airline,
        flightNo: values.flightNo,
        fare: Number(values.fare),
        departureDate: values.departureDate,
        departureTime: values.departureTime,
      });

      // Add return flight for roundtrip
      // Add 2nd flight if user filled it (for both roundtrip & multicity)
      if (values.returnFrom && values.returnTo) {
        payload.flightDetails.push({
          from: values.returnFrom,
          to: values.returnTo,
          preferredAirline: values.returnAirline,
          flightNo: values.returnFlightNo,
          fare: Number(values.returnFare || 0),
          departureDate: values.returnDate,
          departureTime: values.returnTime,
        });
      }


      // Add multicity flights
      if (values.tripType === "multicity" && values.additionalCities.length > 0) {
        values.additionalCities.forEach((city) => {
          payload.flightDetails.push({
            from: city.from,
            to: city.to,
            preferredAirline: city.airline,
            flightNo: city.flightNo,
            fare: Number(city.fare || 0),
            departureDate: city.date,
            departureTime: city.time,
          });
        });
      }


      await dispatch(createFlightQuotation(payload));
      formik.resetForm();
      navigate("/quotation", { replace: true });
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
    const updatedCities = formik.values.additionalCities.map((city, i) =>
      i === index ? { ...city, [field]: value } : city
    );
    formik.setFieldValue("additionalCities", updatedCities);
  };


  const deleteCity = (index) => {
    const updatedCities = formik.values.additionalCities.filter((_, i) => i !== index);
    formik.setFieldValue("additionalCities", updatedCities);
  };

  const handlePreview = () => {
    const v = formik.values;
    const flightDetails = [];

    // Always add first flight
    flightDetails.push({
      from: v.from,
      to: v.to,
      preferredAirline: v.airline,
      flightNo: v.flightNo,
      fare: v.fare,
      departureDate: v.departureDate,
      departureTime: v.departureTime,
    });

    // Roundtrip
    // Add 2nd flight if user filled it (for both roundtrip & multicity)
    if (v.returnFrom && v.returnTo) {
      flightDetails.push({
        from: v.returnFrom,
        to: v.returnTo,
        preferredAirline: v.returnAirline,
        flightNo: v.returnFlightNo,
        fare: v.returnFare,
        departureDate: v.returnDate,
        departureTime: v.returnTime,
      });
    }


    // Multicity
    if (v.tripType === "multicity" && v.additionalCities.length > 0) {
      v.additionalCities.forEach((c) => {
        flightDetails.push({
          from: c.from,
          to: c.to,
          preferredAirline: c.airline,
          flightNo: c.flightNo,
          fare: c.fare,
          departureDate: c.date,
          departureTime: c.time,
        });
      });
    }

    setPreviewData({
      tripType: v.tripType,
      clientName: v.clientName,
      flightDetails,
      adults: v.adults,
      childs: v.childs,
      infants: v.infants,
      message: v.message,
      fullName: v.fullName,
      mobile: v.mobile,
      email: v.email,
    });

    setPreviewOpen(true);
  };



  const handleClientChange = (event) => {
    const selectedClientName = event.target.value;
    formik.setFieldValue("clientName", selectedClientName);

    const selectedLead =
      leadList.find((lead) => lead?.personalDetails?.fullName === selectedClientName) || null;

    if (selectedLead) {
      const { personalDetails } = selectedLead;
      formik.setFieldValue("fullName", personalDetails?.fullName || "");
      formik.setFieldValue("email", personalDetails?.emailId || "");
      formik.setFieldValue("mobile", personalDetails?.mobile || "");
    }
  };

  // Reusable Flight details block
  const renderFlightDetails = (isReturn = false, values = formik.values) => {
    const prefix = isReturn ? "return" : "";
    const fromField = isReturn ? "returnFrom" : "from";
    const toField = isReturn ? "returnTo" : "to";
    const airlineField = isReturn ? "returnAirline" : "airline";
    const flightNoField = isReturn ? "returnFlightNo" : "flightNo";
    const fareField = isReturn ? "returnFare" : "fare";
    const dateField = isReturn ? "returnDate" : "departureDate";
    const timeField = isReturn ? "returnTime" : "departureTime";

    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`${fromField}-id`}
            fullWidth
            label="From"
            name={fromField}
            autoComplete="off"
            value={values[fromField]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[fromField] && Boolean(formik.errors[fromField])}
            helperText={formik.touched[fromField] && formik.errors[fromField]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`${toField}-id`}
            fullWidth
            label="To"
            name={toField}
            autoComplete="off"
            value={values[toField]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[toField] && Boolean(formik.errors[toField])}
            helperText={formik.touched[toField] && formik.errors[toField]}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            id={`${airlineField}-id`}
            fullWidth
            select
            label="Preferred Airline"
            name={airlineField}
            autoComplete="off"
            value={values[airlineField]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[airlineField] && Boolean(formik.errors[airlineField])}
            helperText={formik.touched[airlineField] && formik.errors[airlineField]}
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
              <MenuItem key={item} value={`${item}`}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`${flightNoField}-id`}
            fullWidth
            label="Flight No."
            name={flightNoField}
            autoComplete="off"
            value={values[flightNoField]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[flightNoField] && Boolean(formik.errors[flightNoField])}
            helperText={formik.touched[flightNoField] && formik.errors[flightNoField]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`${fareField}-id`}
            fullWidth
            label="Fare"
            name={fareField}
            type="number"
            inputProps={{ inputMode: "numeric", min: 0 }}
            autoComplete="off"
            value={values[fareField]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[fareField] && Boolean(formik.errors[fareField])}
            helperText={formik.touched[fareField] && formik.errors[fareField]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label={isReturn ? "Return Date" : "Departure Date"}
            value={values[dateField]}
            onChange={(val) => formik.setFieldValue(dateField, val)}
            slotProps={{
              textField: {
                id: `${dateField}-id`,
                name: dateField,
                fullWidth: true,
                onBlur: formik.handleBlur,
                error: formik.touched[dateField] && Boolean(formik.errors[dateField]),
                helperText: formik.touched[dateField] && formik.errors[dateField],
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TimePicker
            label={isReturn ? "Return Time" : "Departure Time"}
            value={values[timeField]}
            onChange={(val) => formik.setFieldValue(timeField, val)}
            slotProps={{
              textField: {
                id: `${timeField}-id`,
                name: timeField,
                fullWidth: true,
                onBlur: formik.handleBlur,
              },
            }}
          />
        </Grid>
      </Grid>
    );
  };

  const renderAdditionalCity = (city, index) => (
    <Paper key={index} sx={{ p: 3, mb: 3, position: "relative" }}>
      <IconButton
        sx={{ position: "absolute", top: 8, right: 8 }}
        onClick={() => deleteCity(index)}
        color="error"
        aria-label={`delete-city-${index}`}
      >
        <DeleteIcon />
      </IconButton>
      <Typography variant="subtitle1" gutterBottom>
        Additional City {index + 1}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`ac-from-${index}`}
            fullWidth
            label="From"
            name={`additionalCities[${index}].from`}
            value={city.from}
            onChange={(e) => handleAdditionalCityChange(index, "from", e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`ac-to-${index}`}
            fullWidth
            label="To"
            name={`additionalCities[${index}].to`}
            value={city.to}
            onChange={(e) => handleAdditionalCityChange(index, "to", e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            id={`ac-airline-${index}`}
            fullWidth
            select
            label="Preferred Airline"
            name={`additionalCities[${index}].airline`}
            value={city.airline}
            onChange={(e) => handleAdditionalCityChange(index, "airline", e.target.value)}
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
              <MenuItem key={item} value={`airline${item}`}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`ac-flightNo-${index}`}
            fullWidth
            label="Flight No."
            name={`additionalCities[${index}].flightNo`}
            value={city.flightNo}
            onChange={(e) => handleAdditionalCityChange(index, "flightNo", e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            id={`ac-fare-${index}`}
            fullWidth
            label="Fare"
            type="number"
            inputProps={{ inputMode: "numeric", min: 0 }}
            name={`additionalCities[${index}].fare`}
            value={city.fare}
            onChange={(e) => handleAdditionalCityChange(index, "fare", e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label="Date"
            value={city.date}
            onChange={(val) => handleAdditionalCityChange(index, "date", val)}
            slotProps={{ textField: { id: `ac-date-${index}`, name: `additionalCities[${index}].date`, fullWidth: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TimePicker
            label="Time"
            value={city.time}
            onChange={(val) => handleAdditionalCityChange(index, "time", val)}
            slotProps={{ textField: { id: `ac-time-${index}`, name: `additionalCities[${index}].time`, fullWidth: true } }}
          />
        </Grid>
      </Grid>
    </Paper>
  );

  // Preview dialog (self-contained, safe)
  const PreviewDialog = ({ data }) => {
    if (!data || !data.flightDetails || data.flightDetails.length === 0) return null;

    return (
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #004ba0 100%)",
            color: "white",
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center">
            <FlightTakeoff sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="div" fontWeight="600">
              Iconic Yatra
            </Typography>
          </Box>
          <Typography variant="h6" component="div">
            Flight Quotation Preview
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box>
            {/* Header with trip type and client */}
            <Box sx={{ p: 3, pb: 2, background: "#f9f9f9" }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Chip
                  label={data.tripType?.toUpperCase()}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
                />
                <Box textAlign="right">
                  <Typography variant="body2" color="textSecondary">
                    Prepared for
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="600">
                    {data.clientName || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Flight Details (first leg) */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <FlightTakeoff sx={{ mr: 1, color: "primary.main" }} />
                Flight Details
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mb: 2, background: "#fafafa" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      From
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {data.flightDetails?.[0]?.from || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "center", flex: 1 }}>
                    <FlightTakeoff sx={{ color: "success.main", fontSize: 20, verticalAlign: "middle" }} />
                    <Box
                      sx={{
                        display: "inline-block",
                        height: "2px",
                        width: "40px",
                        bgcolor: "grey.300",
                        mx: 1,
                        verticalAlign: "middle",
                      }}
                    />
                    <FlightLand sx={{ color: "error.main", fontSize: 20, verticalAlign: "middle" }} />
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" color="textSecondary">
                      To
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {data.flightDetails?.[0]?.to || "-"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Airline
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {data.flightDetails?.[0]?.preferredAirline || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="textSecondary">
                      Flight No
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {data.flightDetails?.[0]?.flightNo || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" color="textSecondary">
                      Fare
                    </Typography>
                    <Typography variant="body1" fontWeight="500" color="primary">
                      {data.flightDetails?.[0]?.fare || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Return / extra legs */}
              {/* Next flights / Multi-city legs */}
              {data.flightDetails.length > 1 && (
                <>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", mt: 3 }}
                  >
                    <FlightLand sx={{ mr: 1, color: "primary.main" }} />
                    {data.tripType === "multicity" ? "Multi-City Flight Details" : "Return / Next Flight"}
                  </Typography>

                  {data.flightDetails.slice(1).map((leg, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, background: "#fafafa" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            From
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            {leg?.from || "-"}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", flex: 1 }}>
                          <FlightTakeoff sx={{ color: "success.main", fontSize: 20 }} />
                          <Box
                            sx={{
                              display: "inline-block",
                              height: "2px",
                              width: "40px",
                              bgcolor: "grey.300",
                              mx: 1,
                            }}
                          />
                          <FlightLand sx={{ color: "error.main", fontSize: 20 }} />
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body2" color="textSecondary">
                            To
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            {leg?.to || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Airline
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {leg?.preferredAirline || "-"}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="body2" color="textSecondary">
                            Flight No
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {leg?.flightNo || "-"}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body2" color="textSecondary">
                            Fare
                          </Typography>
                          <Typography variant="body1" fontWeight="500" color="primary">
                            {leg?.fare || "-"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </>
              )}


              {/* Passengers */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <AirlineSeatReclineNormal sx={{ mr: 1, color: "primary.main" }} />
                  Passengers
                </Typography>

                <Box display="flex" gap={2}>
                  <Chip
                    avatar={<Avatar>{data.adults || 0}</Avatar>}
                    label="Adults"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    avatar={<Avatar>{data.childs || 0}</Avatar>}
                    label="Children"
                    variant="outlined"
                    color="secondary"
                  />
                  <Chip avatar={<Avatar>{data.infants || 0}</Avatar>} label="Infants" variant="outlined" />
                </Box>
              </Box>

              {/* Message */}
              {data.message && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Message
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, background: "#f9f9f9" }}>
                    <Typography variant="body2">{data.message}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Personal Details */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Person sx={{ mr: 1, color: "primary.main" }} />
                  Personal Details
                </Typography>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person sx={{ mr: 1, color: "action.active" }} />
                    <Typography variant="body1">{data.fullName || "-"}</Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Phone sx={{ mr: 1, color: "action.active" }} />
                    <Typography variant="body1">{data.mobile || "-"}</Typography>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <Email sx={{ mr: 1, color: "action.active" }} />
                    <Typography variant="body1">{data.email || "-"}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} variant="outlined" startIcon={<Close />}>
            Close
          </Button>
          <Button variant="contained" onClick={() => window.print()}>
            Print Quotation
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quotation Flight Section
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
                label={type === "oneway" ? "One Way" : type === "roundtrip" ? "Round-Trip" : "Multi City"}
              />
            ))}
          </RadioGroup>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Client Details
          </Typography>
          <TextField
            id="clientName-id"
            select
            fullWidth
            label="Client Name"
            name="clientName"
            value={formik.values.clientName}
            onChange={handleClientChange}
            onBlur={formik.handleBlur}
            error={formik.touched.clientName && Boolean(formik.errors.clientName)}
            helperText={formik.touched.clientName && formik.errors.clientName}
          >
            {leadList.map((lead, index) => (
              <MenuItem key={index} value={lead?.personalDetails?.fullName || ""}>
                {lead?.personalDetails?.fullName || "-"}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Flight Details
              </Typography>
              {renderFlightDetails(false)}
            </Paper>
          </Grid>

          {(formik.values.tripType === "roundtrip" || formik.values.tripType === "multicity") && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {formik.values.tripType === "roundtrip" ? "Return Flight Details" : "Next Flight Details"}
                </Typography>
                {renderFlightDetails(true)}
              </Paper>
            </Grid>
          )}
        </Grid>

        {formik.values.tripType === "multicity" && (
          <Grid container spacing={2}>
            {formik.values.additionalCities.map((city, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={index}>
                {renderAdditionalCity(city, index)}
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addAnotherCity}
                sx={{
                  mb: 3,
                  borderRadius: "5px",
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  fontWeight: "bold",
                  boxShadow: 3,
                  "&:hover": {
                    backgroundColor: "#1565c0",
                    transform: "scale(1.05)",
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                Add Another City
              </Button>
            </Grid>
          </Grid>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            {["adults", "childs", "infants"].map((field) => (
              <Grid key={field} size={{ xs: 12, md: 4 }}>
                <TextField
                  id={`${field}-id`}
                  fullWidth
                  type="number"
                  inputProps={{ inputMode: "numeric", min: 0 }}
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
                id="message-id"
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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1">Personal Details</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                id="fullName-id"
                fullWidth
                label="Full Name"
                name="fullName"
                autoComplete="name"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                id="mobile-id"
                fullWidth
                label="Mobile Number"
                name="mobile"
                autoComplete="tel"
                value={formik.values.mobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                helperText={formik.touched.mobile && formik.errors.mobile}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                id="email-id"
                fullWidth
                label="Email Id"
                name="email"
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box display="flex" gap={2}>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
          <Button variant="outlined" color="info" startIcon={<VisibilityIcon />} onClick={handlePreview}>
            View
          </Button>
          <Button type="reset" variant="outlined" color="secondary" onClick={formik.handleReset}>
            Clear Form
          </Button>
        </Box>

        <PreviewDialog data={previewData} />
      </form>
    </LocalizationProvider>
  );
};

export default QuotationFlightForm;
