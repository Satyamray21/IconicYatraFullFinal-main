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
  totalCost: Yup.number().typeError("Must be a number").required("Total Costing is required"),
  vehiclesSameOrDifferent: Yup.string().required(),
  noOfVehicles: Yup.number().required().min(1, "At least 1 vehicle"),
  vehicleType: Yup.string().when("vehiclesSameOrDifferent", {
    is: "Same",
    then: (schema) => schema.required("Vehicle Type is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  tripType: Yup.string().when("vehiclesSameOrDifferent", {
    is: "Same",
    then: (schema) => schema.required("Trip Type is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
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

  const activeLeadList = leadList.filter((lead) => {
    if (lead.status === "Cancelled") return false;
    const departure = lead.tourDetails?.pickupDrop?.departureDate || lead.tourDetails?.departureDate || lead.tourDetails?.travelDate;
    if (departure) {
      const depDate = new Date(departure);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(depDate) && depDate < today) return false;
    }
    return true;
  });

  const formik = useFormik({
    initialValues: {
      clientName: "",
      vehiclesSameOrDifferent: "Same",
      noOfVehicles: 1,
      multipleVehicles: [],
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

  const recalculateTotal = (days, rate, vehiclesCount) => {
    const d = parseFloat(days);
    const r = parseFloat(rate);
    const v = parseInt(vehiclesCount) || 1;
    if (!isNaN(d) && !isNaN(r) && d > 0) {
      formik.setFieldValue("totalCost", String(d * r * v));
    }
  };

  const recalculateMultipleTotal = (vehicles) => {
    const total = vehicles.reduce((sum, v) => sum + (parseFloat(v.totalCost) || 0), 0);
    formik.setFieldValue("totalCost", String(total));
  };

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

    const selectedLead = activeLeadList.find(
      (lead) => lead.personalDetails.fullName === selectedClientName
    );

    if (selectedLead) {
      const { tourDetails } = selectedLead;
      const days = (tourDetails?.accommodation?.noOfNights || 0) + 1;

      formik.setFieldValue("noOfDays", days);
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
      
      const vehiclesCount = Number(tourDetails?.pickupDrop?.noOfVehicles) || 1;
      formik.setFieldValue("noOfVehicles", vehiclesCount);

      // Trigger auto-calc if rate is already present
      if (formik.values.vehiclesSameOrDifferent === "Same") {
        if (formik.values.perDayCost) {
          recalculateTotal(days, formik.values.perDayCost, vehiclesCount);
        }
      } else {
        const currentVehicles = [...formik.values.multipleVehicles];
        // Ensure array is size of vehiclesCount
        if (vehiclesCount > currentVehicles.length) {
          for (let i = currentVehicles.length; i < vehiclesCount; i++) {
            currentVehicles.push({ vehicleType: "", tripType: "", noOfDays: days || "", perDayCost: "", totalCost: "" });
          }
        } else {
          currentVehicles.splice(vehiclesCount);
        }

        const calcVehicles = currentVehicles.map(v => {
          v.noOfDays = days;
          const d = parseFloat(v.noOfDays);
          const r = parseFloat(v.perDayCost);
          if (!isNaN(d) && !isNaN(r)) {
            v.totalCost = String(d * r);
          }
          return v;
        });
        formik.setFieldValue("multipleVehicles", calcVehicles);
        recalculateMultipleTotal(calcVehicles);
      }
    }
  };

  const handleVehiclesTypeChange = (e) => {
    const type = e.target.value;
    formik.setFieldValue("vehiclesSameOrDifferent", type);
    
    if (type === "Different") {
      const count = parseInt(formik.values.noOfVehicles) || 1;
      const currentVehicles = [...formik.values.multipleVehicles];
      if (count > currentVehicles.length) {
        for (let i = currentVehicles.length; i < count; i++) {
          currentVehicles.push({ vehicleType: "", tripType: "", noOfDays: formik.values.noOfDays || "", perDayCost: "", totalCost: "" });
        }
      } else {
        currentVehicles.splice(count);
      }
      formik.setFieldValue("multipleVehicles", currentVehicles);
      recalculateMultipleTotal(currentVehicles);
    } else {
      recalculateTotal(formik.values.noOfDays, formik.values.perDayCost, formik.values.noOfVehicles);
    }
  };

  const handleNoOfVehiclesChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    formik.setFieldValue("noOfVehicles", count);

    if (formik.values.vehiclesSameOrDifferent === "Same") {
      recalculateTotal(formik.values.noOfDays, formik.values.perDayCost, count);
    } else {
      const currentVehicles = [...formik.values.multipleVehicles];
      if (count > currentVehicles.length) {
        for (let i = currentVehicles.length; i < count; i++) {
          currentVehicles.push({ vehicleType: "", tripType: "", noOfDays: formik.values.noOfDays || "", perDayCost: "", totalCost: "" });
        }
      } else {
        currentVehicles.splice(count);
      }
      formik.setFieldValue("multipleVehicles", currentVehicles);
      recalculateMultipleTotal(currentVehicles);
    }
  };

  const handleMultipleVehicleChange = (index, field, value) => {
    const updatedVehicles = [...formik.values.multipleVehicles];
    updatedVehicles[index][field] = value;

    if (field === "noOfDays" || field === "perDayCost") {
      const d = parseFloat(updatedVehicles[index].noOfDays);
      const r = parseFloat(updatedVehicles[index].perDayCost);
      if (!isNaN(d) && !isNaN(r)) {
        updatedVehicles[index].totalCost = String(d * r);
      }
    }
    
    formik.setFieldValue("multipleVehicles", updatedVehicles);
    recalculateMultipleTotal(updatedVehicles);
  };

  const handleNoOfDaysChange = (e) => {
    formik.handleChange(e);
    recalculateTotal(e.target.value, formik.values.perDayCost, formik.values.noOfVehicles);
  };

  const handlePerDayCostChange = (e) => {
    formik.handleChange(e);
    recalculateTotal(formik.values.noOfDays, e.target.value, formik.values.noOfVehicles);
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
                    {activeLeadList.map((lead) => (
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
                    label="Vehicles: Same or Different"
                    name="vehiclesSameOrDifferent"
                    value={formik.values.vehiclesSameOrDifferent}
                    onChange={handleVehiclesTypeChange}
                  >
                    <MenuItem value="Same">Same</MenuItem>
                    <MenuItem value="Different">Different</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="No Of Vehicles"
                    name="noOfVehicles"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={formik.values.noOfVehicles}
                    onChange={handleNoOfVehiclesChange}
                    error={formik.touched.noOfVehicles && Boolean(formik.errors.noOfVehicles)}
                    helperText={formik.touched.noOfVehicles && formik.errors.noOfVehicles}
                  />
                </Grid>
                
                {formik.values.vehiclesSameOrDifferent === "Same" && (
                  <>
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
                        error={formik.touched.tripType && Boolean(formik.errors.tripType)}
                        helperText={formik.touched.tripType && formik.errors.tripType}
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
                        type="number"
                        inputProps={{ min: 1 }}
                        value={formik.values.noOfDays}
                        onChange={handleNoOfDaysChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Per Day Cost (₹)"
                        name="perDayCost"
                        type="number"
                        inputProps={{ min: 0 }}
                        value={formik.values.perDayCost}
                        onChange={handlePerDayCostChange}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {formik.values.vehiclesSameOrDifferent === "Different" && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Vehicle Details (Different)
                  </Typography>
                  {formik.values.multipleVehicles.map((vehicle, index) => (
                    <Grid container spacing={2} mt={1} key={index} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          select
                          label={`Vehicle ${index + 1} Type`}
                          value={vehicle.vehicleType}
                          onChange={(e) => handleMultipleVehicleChange(index, "vehicleType", e.target.value)}
                        >
                          {options.filter((opt) => opt.fieldName === "vehicleType").map((type, idx) => (
                            <MenuItem key={idx} value={type.value}>{type.value}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          select
                          label="Trip Type"
                          value={vehicle.tripType}
                          onChange={(e) => handleMultipleVehicleChange(index, "tripType", e.target.value)}
                        >
                          {tripTypes.map((type, idx) => (
                            <MenuItem key={idx} value={type}>{type}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          label="No Of Days"
                          type="number"
                          inputProps={{ min: 1 }}
                          value={vehicle.noOfDays}
                          onChange={(e) => handleMultipleVehicleChange(index, "noOfDays", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          label="Per Day Cost (₹)"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={vehicle.perDayCost}
                          onChange={(e) => handleMultipleVehicleChange(index, "perDayCost", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          label="Total Cost (₹)"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={vehicle.totalCost}
                          onChange={(e) => handleMultipleVehicleChange(index, "totalCost", e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              )}
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
                    label="Total Costing (₹)"
                    name="totalCost"
                    type="number"
                    inputProps={{ min: 0 }}
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
