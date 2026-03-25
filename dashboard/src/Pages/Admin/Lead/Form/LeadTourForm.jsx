import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";
import { fetchCountries, fetchStatesByCountry, clearStates } from '../../../../features/location/locationSlice';
import axios from "../../../../utils/axios";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";

const LeadTourForm = ({ leadData, onComplete, isSubmitting, onBack }) => {
  console.log("✅ LeadTourForm props:", { onComplete, leadData, isSubmitting });

  const location = useLocation();
  const dispatch = useDispatch();
  const { options, loading: optionsLoading, error } = useSelector((state) => state.leads);

  // Get location data from Redux store
  const {
    countries,
    states,
    loading: locationLoading,
  } = useSelector((state) => state.location);

  const [openDialog, setOpenDialog] = React.useState(false);
  const [currentField, setCurrentField] = React.useState("");
  const [addMore, setNewItem] = React.useState("");
  const [customItems, setCustomItems] = React.useState({
    country: [],
    destination: [],
    services: [],
    arrivalCity: [],
    arrivalLocation: [],
    departureCity: [],
    departureLocation: [],
    hotelType: [],
    mealPlan: [],
    sharingType: [],
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    dispatch(getLeadOptions());
    dispatch(fetchCountries()); // Fetch countries on component mount
  }, [dispatch]);

  // Get leadData from props or location state
  const initialData = leadData || location.state?.leadData || {};

  const formik = useFormik({
    initialValues: {
      tourType: "Domestic",
      country: "",
      destination: "",
      services: "",
      adults: "",
      children: "",
      kidsWithoutMattress: "",
      infants: "",
      arrivalDate: null,
      arrivalCity: "",
      arrivalLocation: "",
      departureDate: null,
      departureCity: "",
      departureLocation: "",
      hotelType: "",
      mealPlan: "",
      transport: "No",
      sharingType: "",
      noOfRooms: "",
      noOfMattress: "0",
      noOfNights: "",
      requirementNote: "",
      ...initialData,
    },
    validationSchema: Yup.object({
      destination: Yup.string().required("Required"),
      services: Yup.string().required("Required"),
      adults: Yup.number()
        .required("Required")
        .min(1, "At least 1 adult")
        .integer("Must be a whole number"),
      children: Yup.number().integer("Must be a whole number"),
      kidsWithoutMattress: Yup.number().integer("Must be a whole number"),
      infants: Yup.number().integer("Must be a whole number"),
      arrivalDate: Yup.date().required("Required"),
      departureDate: Yup.date()
        .required("Required")
        .min(
          Yup.ref("arrivalDate"),
          "Departure date must be after arrival date"
        ),
      sharingType: Yup.string().required("Required"),
      noOfRooms: Yup.number()
        .required("Required")
        .min(1, "At least 1 room")
        .integer("Must be a whole number"),
      noOfMattress: Yup.number().integer("Must be a whole number"),
      noOfNights: Yup.number().integer("Must be a whole number"),
      country: Yup.string().when("tourType", {
        is: "International",
        then: (schema) => schema.required("Country is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: (values) => {
      console.log("✅ Tour form submitted", values);

      const formattedValues = {
        ...values,
        transport: values.transport === "Yes",
        servicesRequired: [values.services],
        hotelType: [values.hotelType],
        tourDestination: values.destination,
        arrivalDate: values.arrivalDate
          ? dayjs(values.arrivalDate).format("YYYY-MM-DD")
          : null,
        departureDate: values.departureDate
          ? dayjs(values.departureDate).format("YYYY-MM-DD")
          : null,
      };

      if (typeof onComplete === "function") {
        onComplete(formattedValues);
      } else {
        console.error("❌ onComplete is not a function");
      }
    }
  });

  const { values, handleChange, setFieldValue, touched, errors } = formik;

  // Handle tour type change
  const handleTourTypeChange = (e) => {
    const tourType = e.target.value;
    formik.handleChange(e);

    if (tourType === "Domestic") {
      // For domestic tours, set country to India and fetch Indian states
      setFieldValue("country", "India");
      setFieldValue("destination", "");
    } else {
      // For international tours, clear the country selection
      setFieldValue("country", "");
      setFieldValue("destination", "");
      dispatch(clearStates());
    }
  };

  // Handle country change for international tours
  const handleCountryChange = (e) => {
    const country = e.target.value;
    if (country === "__add_new") {
      handleOpenDialog("country");
    } else {
      setFieldValue("country", country);
      setFieldValue("destination", ""); // Clear destination when changing country
    }
  };

  const handleDeleteOption = async (id) => {
    if (!id) return;

    if (!window.confirm("Delete this option?")) return;

    try {
      await dispatch(deleteLeadOption(id)).unwrap();

      setSnackbar({
        open: true,
        message: "Deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Delete failed",
        severity: "error",
      });
    }
  };

  // Fetch states when country changes (for international tours)
  useEffect(() => {
    if (values.tourType === "International" && values.country) {
      dispatch(fetchStatesByCountry(values.country));
    }
  }, [values.country, values.tourType, dispatch]);

  // Get destination options based on selected country
  const getDestinationOptions = () => {
    if (values.tourType === "Domestic") {
      // For domestic tours, show Indian states
      if (locationLoading) {
        return ["Loading states..."];
      }
      return states && states.length > 0
        ? states.map(s => s.name)
        : ["No states available"];
    } else {
      // For international tours, show states of selected country
      if (!values.country) {
        return ["Select a country first"];
      }
      if (locationLoading) {
        return ["Loading states..."];
      }
      return states && states.length > 0
        ? states.map(s => s.name)
        : ["No states available for selected country"];
    }
  };

  const calculateAccommodation = async () => {
    try {
      const members = {
        adults: values.adults,
        children: values.children,
        kidsWithoutMattress: values.kidsWithoutMattress,
        infants: values.infants,
      };

      const accommodation = {
        sharingType: values.sharingType,
        noOfRooms: values.noOfRooms,
      };

      const { data } = await axios.post(
        "/accommodation/calculate-accommodation",
        { members, accommodation }
      );

      if (data.success) {
        setFieldValue("noOfRooms", data.data.autoCalculatedRooms);
        setFieldValue("noOfMattress", data.data.extraMattress);
      }
    } catch (error) {
      console.error("Accommodation calculation failed:", error);
    }
  };

  useEffect(() => {
    if (values.sharingType && values.noOfRooms) {
      calculateAccommodation();
    }
  }, [
    values.sharingType,
    values.noOfRooms,
    values.adults,
    values.children,
    values.kidsWithoutMattress,
    values.infants,
  ]);

  useEffect(() => {
    if (values.arrivalDate && values.departureDate) {
      const nights = dayjs(values.departureDate).diff(dayjs(values.arrivalDate), "day");

      if (nights >= 0) {
        setFieldValue("noOfNights", nights);
      } else {
        setFieldValue("noOfNights", 0);
      }
    }
  }, [values.arrivalDate, values.departureDate, setFieldValue]);

  const handleOpenDialog = (fieldName) => {
    setCurrentField(fieldName);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewItem("");
  };

  const getOptionsForField = (fieldName) => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === fieldName)
      .map((opt) => ({
        id: opt._id,
        value: opt.value,
        label: opt.value,
      })) || [];

    const customItemsForField = (customItems[fieldName] || []).map((opt, index) => ({
      id: null,
      value: opt,
      label: opt,
      isCustom: true,
    }));

    // Combine and remove duplicates
    const combined = [...filteredOptions, ...customItemsForField];
    const uniqueOptions = combined.reduce((acc, current) => {
      const exists = acc.find(item => item.value === current.value);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return [
      ...uniqueOptions,
      { value: "__add_new", label: "+ Add New", id: null }
    ];
  };

  /* ================= DROPDOWN ================= */
  const renderDropdownOptions = (fieldName) => {
    const optionsForField = getOptionsForField(fieldName);
    
    return optionsForField.map((option) => {
      if (option.value === "__add_new") {
        return (
          <MenuItem
            key={`add-${fieldName}`}
            value=""
            onClick={() => {
              setCurrentField(fieldName);
              setOpenDialog(true);
            }}
          >
            + Add New
          </MenuItem>
        );
      }
      
      return (
        <MenuItem key={option.value} value={option.value}>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <span>{option.label}</span>
            {option.id && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOption(option.id);
                }}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            )}
          </Box>
        </MenuItem>
      );
    });
  };

  /* ================= ADD ================= */
  const handleAddNewItem = async () => {
    if (!addMore.trim()) return;

    await dispatch(
      addLeadOption({ fieldName: currentField, value: addMore })
    );

    setFieldValue(currentField, addMore);

    setSnackbar({ open: true, message: "Added successfully", severity: "success" });

    setOpenDialog(false);
    setNewItem("");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box p={3}>
      <form onSubmit={formik.handleSubmit}>
        <Typography variant="h6">Tour Detail Form</Typography>

        {/* Add New Item Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Add New {currentField}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={`New ${currentField}`}
              fullWidth
              value={addMore}
              onChange={(e) => setNewItem(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleAddNewItem} color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box mt={2} p={2} border={1} borderRadius={2} borderColor="grey.300">
          <Typography variant="subtitle1" gutterBottom>
            Basic Tour Details
          </Typography>
          {optionsLoading && (
            <Box my={2} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              Failed to load lead options: {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl>
                <FormLabel>Tour Type</FormLabel>
                <RadioGroup
                  row
                  name="tourType"
                  value={values.tourType}
                  onChange={handleTourTypeChange}
                >
                  <FormControlLabel
                    value="Domestic"
                    control={<Radio />}
                    label="Domestic"
                  />
                  <FormControlLabel
                    value="International"
                    control={<Radio />}
                    label="International"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Country Field - Different behavior for Domestic vs International */}
            <Grid size={{ xs: 12, md: 6 }}>
              {values.tourType === "International" ? (
                <TextField
                  select
                  fullWidth
                  name="country"
                  label="Country *"
                  value={values.country}
                  onChange={handleCountryChange}
                  error={touched.country && Boolean(errors.country)}
                  helperText={touched.country && errors.country}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <MenuItem disabled>Loading countries...</MenuItem>
                  ) : (
                    countries && countries.length > 0 ? (
                      countries.map((country) => (
                        <MenuItem key={country.name} value={country.name}>
                          {country.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No countries available</MenuItem>
                    )
                  )}
                  <MenuItem value="__add_new">+ Add New</MenuItem>
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Country"
                  value="India"
                  disabled
                  helperText="Domestic tours are within India"
                />
              )}
            </Grid>

            {/* Tour Destination - Shows states of selected country */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                name="destination"
                label="Tour Destination *"
                value={values.destination}
                onChange={handleChange}
                error={touched.destination && Boolean(errors.destination)}
                helperText={touched.destination && errors.destination}
                disabled={
                  (values.tourType === "International" && !values.country) ||
                  locationLoading
                }
              >
                {getDestinationOptions().map((option, index) => {
                  if (option !== "No states available" && option !== "Loading states..." && option !== "Select a country first") {
                    return (
                      <MenuItem key={`state-${index}`} value={option}>
                        {option}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
                {renderDropdownOptions("destination")}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                name="services"
                label="Services Required *"
                value={values.services}
                onChange={handleChange}
                error={touched.services && Boolean(errors.services)}
                helperText={touched.services && errors.services}
              >
                {renderDropdownOptions("services")}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                name="adults"
                label="No of Adults *"
                type="number"
                value={values.adults}
                onChange={handleChange}
                error={touched.adults && Boolean(errors.adults)}
                helperText={touched.adults && errors.adults}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                name="children"
                label="No of Children (6-12)"
                type="number"
                value={values.children}
                onChange={handleChange}
                error={touched.children && Boolean(errors.children)}
                helperText={touched.children && errors.children}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                name="kidsWithoutMattress"
                label="No of Kids (2-5)"
                type="number"
                value={values.kidsWithoutMattress}
                onChange={handleChange}
                error={
                  touched.kidsWithoutMattress && Boolean(errors.kidsWithoutMattress)
                }
                helperText={
                  touched.kidsWithoutMattress && errors.kidsWithoutMattress
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                name="infants"
                label="No of Infants"
                type="number"
                value={values.infants}
                onChange={handleChange}
                error={touched.infants && Boolean(errors.infants)}
                helperText={touched.infants && errors.infants}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Pickup/Drop Section */}
        <Box mt={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
          <Typography variant="subtitle1" gutterBottom>
            Pickup/Drop
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Arrival Date *"
                value={values.arrivalDate}
                onChange={(val) => setFieldValue("arrivalDate", val)}
                renderInput={(params) => (
                  <TextField
                    fullWidth
                    {...params}
                    error={touched.arrivalDate && Boolean(errors.arrivalDate)}
                    helperText={touched.arrivalDate && errors.arrivalDate}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="arrivalCity"
                label="Arrival City"
                value={values.arrivalCity}
                onChange={handleChange}
                error={touched.arrivalCity && Boolean(errors.arrivalCity)}
                helperText={touched.arrivalCity && errors.arrivalCity}
              >
                {renderDropdownOptions("arrivalCity")}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="arrivalLocation"
                label="Arrival Location"
                value={values.arrivalLocation}
                onChange={handleChange}
                error={
                  touched.arrivalLocation && Boolean(errors.arrivalLocation)
                }
                helperText={touched.arrivalLocation && errors.arrivalLocation}
              >
                {renderDropdownOptions("arrivalLocation")}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Departure Date *"
                value={values.departureDate}
                onChange={(val) => setFieldValue("departureDate", val)}
                minDate={values.arrivalDate || dayjs()}
                renderInput={(params) => (
                  <TextField
                    fullWidth
                    {...params}
                    error={
                      touched.departureDate && Boolean(errors.departureDate)
                    }
                    helperText={touched.departureDate && errors.departureDate}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="departureCity"
                label="Departure City"
                value={values.departureCity}
                onChange={handleChange}
                error={touched.departureCity && Boolean(errors.departureCity)}
                helperText={touched.departureCity && errors.departureCity}
              >
                {renderDropdownOptions("departureCity")}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="departureLocation"
                label="Departure Location"
                value={values.departureLocation}
                onChange={handleChange}
                error={
                  touched.departureLocation && Boolean(errors.departureLocation)
                }
                helperText={
                  touched.departureLocation && errors.departureLocation
                }
              >
                {renderDropdownOptions("departureLocation")}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        {/* Accommodation & Facility Section */}
        <Box mt={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
          <Typography variant="subtitle1" gutterBottom>
            Accommodation & Facility
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="hotelType"
                label="Hotel Type"
                value={values.hotelType}
                onChange={handleChange}
                error={touched.hotelType && Boolean(errors.hotelType)}
                helperText={touched.hotelType && errors.hotelType}
              >
                {renderDropdownOptions("hotelType")}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="mealPlan"
                label="Meal Plan"
                value={values.mealPlan}
                onChange={handleChange}
                error={touched.mealPlan && Boolean(errors.mealPlan)}
                helperText={touched.mealPlan && errors.mealPlan}
              >
                {renderDropdownOptions("mealPlan")}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl>
                <FormLabel>Transport</FormLabel>
                <RadioGroup
                  row
                  name="transport"
                  value={values.transport}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="Yes"
                    control={<Radio />}
                    label="Yes"
                  />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                name="sharingType"
                label="Sharing Type *"
                value={values.sharingType}
                onChange={handleChange}
                error={touched.sharingType && Boolean(errors.sharingType)}
                helperText={touched.sharingType && errors.sharingType}
              >
                {renderDropdownOptions("sharingType")}
              </TextField>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                name="noOfRooms"
                label="No of Rooms *"
                type="number"
                value={values.noOfRooms}
                onChange={handleChange}
                error={touched.noOfRooms && Boolean(errors.noOfRooms)}
                helperText={touched.noOfRooms && errors.noOfRooms}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                name="noOfMattress"
                label="No of Mattress"
                type="number"
                value={values.noOfMattress}
                onChange={handleChange}
                error={touched.noOfMattress && Boolean(errors.noOfMattress)}
                helperText={touched.noOfMattress && errors.noOfMattress}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                name="noOfNights"
                label="No of Nights"
                type="number"
                value={values.noOfNights}
                disabled
              />
            </Grid>
          </Grid>
        </Box>

        <Box mt={3}>
          <TextField
            fullWidth
            multiline
            rows={4}
            name="requirementNote"
            label="Requirement Note"
            value={values.requirementNote}
            onChange={handleChange}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="center" gap={2}>
          <Button
            variant="outlined"
            onClick={onBack}
          >
            Back
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default LeadTourForm;