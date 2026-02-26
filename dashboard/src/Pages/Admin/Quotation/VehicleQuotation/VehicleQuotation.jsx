import React, { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import VehicleQuotationStep2 from "./VehicleQuotationStep2";
import { useSelector, useDispatch } from "react-redux";
import { getAllLeads, getLeadOptions, addLeadOption } from "../../../../features/leads/leadSlice";


// Validation Schema
const validationSchema = Yup.object({
  clientName: Yup.string().required("Client Name is required"),
  vehicleType: Yup.string().required("Vehicle Type is required"),
  tripType: Yup.string().required("Trip Type is required"),
  totalCost: Yup.number().typeError("Must be a number").required("Total Costing is required"),
});

const tripTypes = ["One Way", "Round Trip"];

const VehicleQuotationStep1 = () => {
  const [step, setStep] = useState(1);

  const [vehicleTypes, setVehicleTypes] = useState([
    "Sedan",
    "SUV",
    "Bus",
    "Tempo Traveller",
  ]);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [fieldType, setFieldType] = useState("");
  const dispatch = useDispatch();
  const {
    list: leadList = [],
    status,
    options = [],
    loading: optionsLoading,
    error,
  } = useSelector((state) => state.leads);

  const formik = useFormik({
    initialValues: {
      clientName: "",
      vehicleType: "",
      tripType: "",
      noOfDays: "",
      perDayCost: "",
      totalCost: "",
      pickupDate: null,
      pickupTime: null,
      pickupLocation: "",
      dropDate: null,
      dropTime: null,
      dropLocation: "",
    },
    validationSchema,
    onSubmit: (values) => {
      console.log("Step 1 Form Data", values);
      setStep(2); // move to Step 2 and send values
    },
  });
  useEffect(() => {
    dispatch(getAllLeads());
    dispatch(getLeadOptions({ fieldName: "vehicleType" }));

  }, [dispatch]);

  const handleClientChange = (event) => {
    event.preventDefault();
    const selectedClientName = event.target.value;

    if (selectedClientName === "addNew") {
      setFieldType("client");
      setNewValue("");
      setOpenDialog(true);
      return;
    }

    formik.handleChange(event);

    // Find selected client details from API data
    const selectedLead = leadList.find(
      (lead) => lead.personalDetails.fullName === selectedClientName
    );

    if (selectedLead) {
      const { tourDetails } = selectedLead;

      formik.setFieldValue(
        "noOfDays",
        (tourDetails?.accommodation?.noOfNights || 0) + 1
      );
      formik.setFieldValue(
        "pickupDate",
        tourDetails?.pickupDrop?.arrivalDate
          ? new Date(tourDetails.pickupDrop.arrivalDate)
          : null
      );
      formik.setFieldValue(
        "pickupLocation",
        tourDetails?.pickupDrop?.arrivalLocation || ""
      );
      formik.setFieldValue(
        "dropDate",
        tourDetails?.pickupDrop?.departureDate
          ? new Date(tourDetails.pickupDrop.departureDate)
          : null
      );
      formik.setFieldValue(
        "dropLocation",
        tourDetails?.pickupDrop?.departureLocation || ""
      );
    }
  };


  const handleVehicleChange = (event) => {
    event.preventDefault();
    if (event.target.value === "addNew") {
      setFieldType("vehicle");
      setNewValue("");
      setOpenDialog(true);
    } else {
      formik.handleChange(event);
    }
  };

  const handleDialogSave = async () => {
    if (newValue.trim() === "") return;
    if (fieldType === "client") {

      formik.setFieldValue("clientName", newValue);
    } else if (fieldType === "vehicle") {
      try {
        await dispatch(addLeadOption({ fieldName: "vehicleType", value: newValue }));
        await dispatch(getLeadOptions({ fieldName: "vehicleType" }));

        formik.setFieldValue("vehicleType", newValue);
      } catch (err) {
        console.error("Error adding vehicle option:", err);
      }
    }
    setOpenDialog(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {step === 1 && (
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
                <Grid size={{ xs: 12, sm: 4 }} >
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
                    {leadList.map((lead) => (
                      <MenuItem
                        key={lead._id}
                        value={lead.personalDetails.fullName}
                      >
                        {lead.personalDetails.fullName}
                      </MenuItem>
                    ))}
                    <MenuItem value="addNew">+ Add New</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                    {optionsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                      </MenuItem>
                    ) : error ? (
                      <MenuItem disabled>Error Loading</MenuItem>
                    ) : (
                      options.filter((opt) => opt.fieldName === "vehicleType")
                        .map((type, idx) => (
                          <MenuItem key={idx} value={type.value}>
                            {type.value}
                          </MenuItem>
                        ))
                    )}
                    <MenuItem value="addNew">+ Add New</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="No Of Days"
                    name="noOfDays"
                    value={formik.values.noOfDays}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Per Day Cost"
                    name="perDayCost"
                    value={formik.values.perDayCost}
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

                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DatePicker
                    label="Pickup Date"
                    value={formik.values.pickupDate}
                    onChange={(val) => formik.setFieldValue("pickupDate", val)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TimePicker
                    label="Pickup Time"
                    value={formik.values.pickupTime}
                    onChange={(val) => formik.setFieldValue("pickupTime", val)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Pickup Location"
                    name="pickupLocation"
                    value={formik.values.pickupLocation}
                    onChange={formik.handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <DatePicker
                    label="Drop Date"
                    value={formik.values.dropDate}
                    onChange={(val) => formik.setFieldValue("dropDate", val)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TimePicker
                    label="Drop Time"
                    value={formik.values.dropTime}
                    onChange={(val) => formik.setFieldValue("dropTime", val)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
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
      )}

      {/* Step 2 */}
      {step === 2 && (
        <VehicleQuotationStep2 onBack={() => setStep(1)} step1Data={formik.values} />
      )}

      {/* Add New Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Add New {fieldType === "client" ? "Client" : "Vehicle"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={fieldType === "client" ? "Client Name" : "Vehicle Type"}
            fullWidth
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDialogSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default VehicleQuotationStep1;
