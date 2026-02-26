import React, { useState, useEffect } from "react";
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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useDispatch, useSelector } from "react-redux";
import { viewLeadById, updateLead, resetViewStatus, resetUpdateStatus } from "../../../../features/leads/leadSlice";
import AssociatesForm from "../../Associates/Form/AssociatesForm";
import dayjs from "dayjs";
import { fetchCountries, fetchStatesByCountry, fetchCitiesByState, clearStates, clearCities } from '../../../../features/location/locationSlice';
import { fetchAllAssociates } from "../../../../features/associate/associateSlice";
import { fetchAllStaff } from "../../../../features/staff/staffSlice"
// Validation schema combining both steps
const validationSchema = Yup.object({
  // Step 1 fields
  fullName: Yup.string().required("Name is required"),
  source: Yup.string().required("Source is required"),
  assignedTo: Yup.string().required("Assigned To is required"),
  mobile: Yup.string(),
  email: Yup.string().email("Invalid email format"),

  // Step 2 fields
  destination: Yup.string().required("Destination is required"),
  services: Yup.string().required("Services are required"),
  adults: Yup.number().required("Required").min(1, "At least 1 adult"),
  arrivalDate: Yup.date().required("Arrival date is required"),
  departureDate: Yup.date().required("Departure date is required"),
  sharingType: Yup.string().required("Sharing type is required"),
  noOfRooms: Yup.number().required("Required").min(1, "At least 1 room"),
  country: Yup.string().when("tourType", {
    is: "International",
    then: Yup.string().required("Country is required for international tours"),
  }),
});

const LeadEditForm = ({ leadId, onSave, onCancel }) => {
  const dispatch = useDispatch();
  const { viewedLead, viewLoading, viewError, updateLoading, updateError } = useSelector((state) => state.leads);
  const {
    countries,
    states,
    cities,
    loading,
  } = useSelector((state) => state.location);
  const { list: staffList = [], loading: staffLoading } = useSelector(
    (state) => state.staffs
  );
  const { list: associates = [], loading: associatesLoading } = useSelector(
    (state) => state.associate
  );
  const [activeStep, setActiveStep] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [activeField, setActiveField] = useState("");
  const [showAssociateForm, setShowAssociateForm] = useState(false);

  // Initialize with static options
  const [dropdownOptions, setDropdownOptions] = useState({
    title: ["Mr", "Ms", "Mrs"],
    source: ["Direct", "Referral", "Agent's"],
    referralBy: [],
    agentName: [],
    assignedTo: ["Staff A", "Staff B"],
    priority: ["High", "Medium", "Low"],
    country: ["India", "USA", "Canada"],
    state: ["Karnataka", "Maharashtra"],
    city: ["Bangalore", "Mumbai"],
    // Step 2 dropdowns
    destination: ["Delhi", "Paris"],
    services: ["Hotel", "Transport"],
    arrivalCity: ["Mumbai", "Delhi"],
    arrivalLocation: ["Airport"],
    departureCity: ["Delhi"],
    departureLocation: ["Hotel"],
    hotelType: ["3 Star", "5 Star"],
    mealPlan: ["Breakfast"],
    sharingType: ["Twin"],
  });

  const [customItems, setCustomItems] = useState({
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

  // Default data structure
  const defaultInitialData = {
    // Step 1 fields
    fullName: "",
    mobile: "",
    alternateNumber: "",
    email: "",
    title: "",
    dob: null,
    country: "India",
    state: "",
    city: "",
    address1: "",
    address2: "",
    address3: "",
    pincode: "",
    businessType: "B2B",
    priority: "",
    source: "",
    referralBy: "",
    agentName: "",
    assignedTo: "",
    note: "",

    // Step 2 fields
    tourType: "Domestic",
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
  };

  // Transform API data to form format
  const transformApiDataToForm = (apiData) => {
    if (!apiData) return defaultInitialData;

    console.log("📥 Raw API Data received:", apiData);

    const { personalDetails, location, address, officialDetail, tourDetails } = apiData;

    const transformedData = {
      // Step 1 fields
      fullName: personalDetails?.fullName || "",
      mobile: personalDetails?.mobile || "",
      alternateNumber: personalDetails?.alternateNumber || "",
      email: personalDetails?.emailId || "",
      title: personalDetails?.title || "",
      dob: personalDetails?.dateOfBirth ? dayjs(personalDetails.dateOfBirth) : null,
      country: location?.country || "India",
      state: location?.state || "",
      city: location?.city || "",
      address1: address?.addressLine1 || "",
      address2: address?.addressLine2 || "",
      address3: address?.addressLine3 || "",
      pincode: address?.pincode || "",
      businessType: officialDetail?.businessType || "B2B",
      priority: officialDetail?.priority || "",
      source: officialDetail?.source || "",
      referralBy: officialDetail?.referredBy || "",
      agentName: officialDetail?.agentName || "",
      assignedTo: officialDetail?.assignedTo || "",
      note: "",

      // Step 2 fields
      tourType: tourDetails?.tourType || "Domestic",
      destination: tourDetails?.tourDestination || "",
      services: tourDetails?.servicesRequired?.[0] || "",
      adults: tourDetails?.members?.adults || "",
      children: tourDetails?.members?.children || "",
      kidsWithoutMattress: tourDetails?.members?.kidsWithoutMattress || "",
      infants: tourDetails?.members?.infants || "",
      arrivalDate: tourDetails?.pickupDrop?.arrivalDate ? dayjs(tourDetails.pickupDrop.arrivalDate) : null,
      arrivalCity: tourDetails?.pickupDrop?.arrivalCity || "",
      arrivalLocation: tourDetails?.pickupDrop?.arrivalLocation || "",
      departureDate: tourDetails?.pickupDrop?.departureDate ? dayjs(tourDetails.pickupDrop.departureDate) : null,
      departureCity: tourDetails?.pickupDrop?.departureCity || "",
      departureLocation: tourDetails?.pickupDrop?.departureLocation || "",
      hotelType: tourDetails?.accommodation?.hotelType?.[0] || "",
      mealPlan: tourDetails?.accommodation?.mealPlan || "",
      transport: tourDetails?.accommodation?.transport ? "Yes" : "No",
      sharingType: tourDetails?.accommodation?.sharingType || "",
      noOfRooms: tourDetails?.accommodation?.noOfRooms || "",
      noOfMattress: tourDetails?.accommodation?.noOfMattress || "0",
      noOfNights: tourDetails?.accommodation?.noOfNights || "",
      requirementNote: tourDetails?.accommodation?.requirementNote || "",
    };

    console.log("🔄 Transformed Form Data:", transformedData);
    return transformedData;
  };

  // Update dropdown options with API data
  const updateDropdownOptionsWithApiData = (apiData) => {
    if (!apiData) return;

    const { location, officialDetail, tourDetails } = apiData;

    setDropdownOptions(prev => ({
      ...prev,
      // Update location options
      country: [...new Set([...prev.country, location?.country].filter(Boolean))],
      state: [...new Set([...prev.state, location?.state].filter(Boolean))],
      city: [...new Set([...prev.city, location?.city].filter(Boolean))],

      // Update official detail options
      referralBy: [...new Set([...prev.referralBy, officialDetail?.referredBy].filter(Boolean))],
      assignedTo: [...new Set([...prev.assignedTo, officialDetail?.assignedTo].filter(Boolean))],
      agentName: [...new Set([...prev.agentName, officialDetail?.agentName].filter(Boolean))],

      // Update tour detail options
      destination: [...new Set([...prev.destination, tourDetails?.tourDestination].filter(Boolean))],
      arrivalCity: [...new Set([...prev.arrivalCity, tourDetails?.pickupDrop?.arrivalCity].filter(Boolean))],
      arrivalLocation: [...new Set([...prev.arrivalLocation, tourDetails?.pickupDrop?.arrivalLocation].filter(Boolean))],
      departureCity: [...new Set([...prev.departureCity, tourDetails?.pickupDrop?.departureCity].filter(Boolean))],
      departureLocation: [...new Set([...prev.departureLocation, tourDetails?.pickupDrop?.departureLocation].filter(Boolean))],
      hotelType: [...new Set([...prev.hotelType, ...(tourDetails?.accommodation?.hotelType || [])].filter(Boolean))],
      mealPlan: [...new Set([...prev.mealPlan, tourDetails?.accommodation?.mealPlan].filter(Boolean))],
      sharingType: [...new Set([...prev.sharingType, tourDetails?.accommodation?.sharingType].filter(Boolean))],
      services: [...new Set([...prev.services, ...(tourDetails?.servicesRequired || [])].filter(Boolean))],
    }));
  };

  const formik = useFormik({
    initialValues: defaultInitialData,
    validationSchema,
    onSubmit: (values) => {
      console.log("✅ Form submitted:", values);
      // Transform form data back to API format
      const updateData = {
        personalDetails: {
          fullName: values.fullName,
          mobile: values.mobile,
          alternateNumber: values.alternateNumber,
          emailId: values.email,
          title: values.title,
          dateOfBirth: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        },
        location: {
          country: values.country,
          state: values.state,
          city: values.city,
        },
        address: {
          addressLine1: values.address1,
          addressLine2: values.address2,
          addressLine3: values.address3,
          pincode: values.pincode,
        },
        officialDetail: {
          businessType: values.businessType,
          priority: values.priority,
          source: values.source,
          agentName: values.agentName,
          referredBy: values.referralBy,
          assignedTo: values.assignedTo,
        },
        tourDetails: {
          tourType: values.tourType,
          tourDestination: values.destination,
          servicesRequired: [values.services],
          members: {
            adults: parseInt(values.adults) || 0,
            children: parseInt(values.children) || 0,
            kidsWithoutMattress: parseInt(values.kidsWithoutMattress) || 0,
            infants: parseInt(values.infants) || 0,
          },
          pickupDrop: {
            arrivalDate: values.arrivalDate ? values.arrivalDate.toISOString() : null,
            arrivalCity: values.arrivalCity,
            arrivalLocation: values.arrivalLocation,
            departureDate: values.departureDate ? values.departureDate.toISOString() : null,
            departureCity: values.departureCity,
            departureLocation: values.departureLocation,
          },
          accommodation: {
            hotelType: [values.hotelType],
            mealPlan: values.mealPlan,
            transport: values.transport === "Yes",
            sharingType: values.sharingType,
            noOfRooms: parseInt(values.noOfRooms) || 0,
            noOfMattress: parseInt(values.noOfMattress) || 0,
            noOfNights: parseInt(values.noOfNights) || 0,
            requirementNote: values.requirementNote,
          },
        },
      };

      console.log("📤 Update Data to API:", updateData);

      dispatch(updateLead({ leadId, updateData }))
        .unwrap()
        .then(() => {
          if (onSave) {
            onSave();
          }
        })
        .catch((error) => {
          console.error("Update failed:", error);
        });
    },
  });

  // Fetch lead data when component mounts or leadId changes
  useEffect(() => {
    if (leadId) {
      dispatch(viewLeadById(leadId));
    }

    // Cleanup function
    return () => {
      dispatch(resetViewStatus());
      dispatch(resetUpdateStatus());
    };
  }, [dispatch, leadId]);

  // Update form when viewedLead data changes
  useEffect(() => {
    if (viewedLead) {
      console.log("🎯 Received viewedLead:", viewedLead);

      // Update dropdown options with API data first
      updateDropdownOptionsWithApiData(viewedLead);

      // Then set form values
      const formData = transformApiDataToForm(viewedLead);
      console.log("🔄 Setting form values:", formData);
      formik.setValues(formData);
    }
  }, [viewedLead]);
  useEffect(() => {
    if (formik.values.source === "Referral") {
      dispatch(fetchAllAssociates());
    }
  }, [formik.values.source, dispatch]);
  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (formik.values.country) {
      dispatch(fetchStatesByCountry(formik.values.country));
      formik.setFieldValue("state", "");
      formik.setFieldValue("city", "");
      dispatch(clearCities());
    } else {
      dispatch(clearStates());
      dispatch(clearCities());
    }
  }, [formik.values.country, dispatch]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formik.values.state && formik.values.country) {
      dispatch(
        fetchCitiesByState({
          countryName: formik.values.country,
          stateName: formik.values.state,
        })
      );
    } else {
      dispatch(clearCities());
    }
  }, [formik.values.state, formik.values.country, dispatch]);
  const steps = ['Customer Details', 'Tour Details', 'Review'];

  // Handles +Add New option
  const handleAddNewClick = (field) => {
    if (["assignedTo", "referralBy", "agentName"].includes(field)) {
      setActiveField(field);
      setShowAssociateForm(true);
    } else {
      setActiveField(field);
      setNewValue("");
      setDialogOpen(true);
    }
  };

  const handleAddNewValue = () => {
    if (newValue.trim() !== "") {
      setDropdownOptions((prev) => ({
        ...prev,
        [activeField]: [
          ...new Set([...(prev[activeField] || []), newValue.trim()]),
        ],
      }));
      setCustomItems((prev) => ({
        ...prev,
        [activeField]: [
          ...new Set([...(prev[activeField] || []), newValue.trim()]),
        ],
      }));
      formik.setFieldValue(activeField, newValue.trim());
      setDialogOpen(false);
      setNewValue("");
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (value === "__add_new__") {
      handleAddNewClick(name);
    } else {
      formik.setFieldValue(name, value);
    }
  };

  const handleAssociateSave = (newName) => {
    if (!newName) return;
    setDropdownOptions((prev) => ({
      ...prev,
      [activeField]: [...new Set([...(prev[activeField] || []), newName])],
    }));
    formik.setFieldValue(activeField, newName);
    setShowAssociateForm(false);
  };
  const renderSelectField = (label, name, options = []) => (
    <TextField
      fullWidth
      select
      label={label}
      name={name}
      value={formik.values[name]}
      onChange={handleFieldChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={{ mb: 2 }}
      disabled={
        (name === "referralBy" && associatesLoading) ||
        (name === "assignedTo" && staffLoading)
      }
    >
      {name === "referralBy" && associatesLoading && (
        <MenuItem disabled>Loading associates...</MenuItem>
      )}

      {/* Show loading message for assignedTo */}
      {name === "assignedTo" && staffLoading && (
        <MenuItem disabled>Loading staff...</MenuItem>
      )}

      {/* Show normal options when not loading */}
      {!associatesLoading &&
        !staffLoading &&
        options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}

      {name !== "priority" && (
        <MenuItem value="__add_new__">➕ Add New</MenuItem>
      )}
    </TextField>
  );
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Step1Content
            formik={formik}
            dropdownOptions={dropdownOptions}
            onFieldChange={handleFieldChange}
            onAddNewClick={handleAddNewClick}
            countries={countries} // Add this line
            states={states} // Add this line
            cities={cities}
            staffList={staffList} // Add this
            staffLoading={staffLoading} // Add this
            associates={associates} // Add this
            associatesLoading={associatesLoading} // Add this
          />
        );
      case 1:
        return (
          <Step2Content
            formik={formik}
            dropdownOptions={dropdownOptions}
            customItems={customItems}
            onFieldChange={handleFieldChange}
            onAddNewClick={handleAddNewClick}
            countries={countries}
          />
        );
      case 2:
        return <ReviewContent formik={formik} />;
      default:
        return null;
    }
  };

  const handleNext = () => {
    let isValid = true;

    if (activeStep === 0) {
      const step1Fields = ['fullName', 'source', 'assignedTo'];
      step1Fields.forEach(field => {
        if (!formik.values[field]) {
          formik.setFieldTouched(field, true);
          isValid = false;
        }
      });
    } else if (activeStep === 1) {
      const step2Fields = ['destination', 'services', 'adults', 'arrivalDate', 'departureDate', 'sharingType', 'noOfRooms'];
      step2Fields.forEach(field => {
        if (!formik.values[field]) {
          formik.setFieldTouched(field, true);
          isValid = false;
        }
      });

      if (formik.values.tourType === "International" && !formik.values.country) {
        formik.setFieldTouched('country', true);
        isValid = false;
      }
    }

    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Show loading while fetching data
  if (viewLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Loading lead data...</Typography>
      </Box>
    );
  }

  // Show error if fetch fails
  if (viewError) {
    return (
      <Box p={2}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading lead: {viewError}
        </Alert>
        <Button variant="outlined" onClick={onCancel}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={formik.handleSubmit} p={2}>
      <Typography variant="h5" gutterBottom>
        Edit Lead - {viewedLead?.leadId}
      </Typography>

      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateError}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {getStepContent(activeStep)}

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={onCancel} disabled={updateLoading}>
            Cancel
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              type="submit"
              disabled={updateLoading}
            >
              {updateLoading ? <CircularProgress size={24} /> : "Update Lead"}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Add New Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New {activeField}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={`Enter new ${activeField}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddNewValue();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNewValue}
            variant="contained"
            disabled={!newValue.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Associate Form Dialog */}
      <Dialog
        open={showAssociateForm}
        onClose={() => setShowAssociateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <AssociatesForm onSave={handleAssociateSave} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Step 1 Content Component
const Step1Content = ({ formik, dropdownOptions, onFieldChange, onAddNewClick, countries, // Add this prop
  states,    // Add this prop
  cities,
  staffList, // Add this prop
  staffLoading, // Add this prop
  associates, // Add this prop
  associatesLoading
}) => {
  const renderSelectField = (label, name, options = []) => {
    // Combine dropdown options and current value to ensure it appears
    const allOptions = [...new Set([...options, formik.values[name]].filter(Boolean))];

    return (
      <TextField
        fullWidth
        select
        label={label}
        name={name}
        value={formik.values[name]}
        onChange={onFieldChange}
        error={formik.touched[name] && Boolean(formik.errors[name])}
        helperText={formik.touched[name] && formik.errors[name]}
        sx={{ mb: 2 }}
        disabled={
          (name === "referralBy" && associatesLoading) ||
          (name === "assignedTo" && staffLoading)
        }
      >
        {/* Show loading message for referralBy */}
        {name === "referralBy" && associatesLoading && (
          <MenuItem disabled>Loading associates...</MenuItem>
        )}

        {/* Show loading message for assignedTo */}
        {name === "assignedTo" && staffLoading && (
          <MenuItem disabled>Loading staff...</MenuItem>
        )}

        {/* Show normal options when not loading */}
        {!associatesLoading && !staffLoading && allOptions.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}

        <MenuItem value="__add_new__">➕ Add New</MenuItem>
      </TextField>
    );
  };

  const renderTextField = (label, name) => (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={formik.values[name]}
      onChange={formik.handleChange}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={{ mb: 2 }}
    />
  );

  return (
    <Box>
      {/* Personal Details */}
      <Box border={1} borderRadius={1} p={2} mb={2}>
        <Typography fontWeight="bold" mb={2}>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderSelectField("Title", "title", dropdownOptions.title)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Full Name *", "fullName")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Mobile", "mobile")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Alternate Number", "alternateNumber")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Email", "email")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date Of Birth"
                value={formik.values.dob}
                onChange={(value) => formik.setFieldValue("dob", value)}
                renderInput={(params) => (
                  <TextField
                    fullWidth
                    sx={{ mb: 2 }}
                    {...params}
                    error={formik.touched.dob && Boolean(formik.errors.dob)}
                    helperText={formik.touched.dob && formik.errors.dob}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      {/* Location */}
      <Box border={1} borderRadius={1} p={2} mb={2}>
        <Typography fontWeight="bold" mb={2}>
          Location
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            {renderSelectField(
              "Country",
              "country",
              countries && countries.length > 0
                ? countries.map((c) => c.name)
                : ["Loading countries..."]
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {renderSelectField(
              "State",
              "state",
              states && states.length > 0
                ? states.map((s) => s.name) // ✅ Fetch full state names from API
                : ["No states available"]
            )}

          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {renderSelectField(
              "City",
              "city",
              cities && cities.length > 0
                ? cities.map((c) => c.name) // ✅ Always fetch from API
                : ["No cities available"]
            )}

          </Grid>
        </Grid>
      </Box>

      {/* Address & Official Detail */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box border={1} borderRadius={1} p={2} height="100%">
            <Typography fontWeight="bold" mb={2}>
              Address
            </Typography>
            {renderTextField("Address Line1", "address1")}
            {renderTextField("Address Line2", "address2")}
            {renderTextField("Address Line3", "address3")}
            {renderTextField("Pincode", "pincode")}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box border={1} borderRadius={1} p={2}>
            <Typography fontWeight="bold" mb={2}>
              Official Detail
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel>Business Type</FormLabel>
              <RadioGroup
                row
                name="businessType"
                value={formik.values.businessType}
                onChange={formik.handleChange}
              >
                <FormControlLabel value="B2B" control={<Radio />} label="B2B" />
                <FormControlLabel value="B2C" control={<Radio />} label="B2C" />
              </RadioGroup>
            </FormControl>

            {renderSelectField("Priority", "priority", dropdownOptions.priority)}
            {renderSelectField("Source *", "source", dropdownOptions.source)}

            {formik.values.businessType === "B2B" &&
              formik.values.source === "Referral" &&
              renderSelectField(
                "Referral By",
                "referralBy",
                associatesLoading
                  ? ["Loading associates..."] // Empty while loading
                  : associates.map((a) => a.personalDetails.fullName) // ✅ Use correct field from API
              )}


            {formik.values.businessType === "B2B" &&
              formik.values.source === "Agent's" &&
              renderSelectField(
                "Agent Name",
                "agentName",
                dropdownOptions.agentName
              )}

            {renderSelectField(
              "Assigned To *",
              "assignedTo",
              staffLoading
                ? []
                : staffList.map((staff) => staff.personalDetails?.fullName || staff.name)
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Note */}
      <Box mb={2} mt={6}>
        <TextField
          label="Initial Note"
          name="note"
          multiline
          rows={3}
          fullWidth
          value={formik.values.note}
          onChange={formik.handleChange}
        />
      </Box>
    </Box>
  );
};

// Step 2 Content Component
const Step2Content = ({ formik, dropdownOptions, customItems, onFieldChange, onAddNewClick, countries }) => {
  const dispatch = useDispatch();
  const { states, cities, loading: locationLoading } = useSelector((state) => state.location);

  // Improved getOptions function that includes current value
  const getOptions = (field) => {
    const baseOptions = [
      ...(dropdownOptions[field] || []),
      ...(customItems[field] || []),
    ];

    // Include current value if it's not already in options
    const currentValue = formik.values[field];
    const allOptions = [...new Set([...baseOptions, currentValue].filter(Boolean))];

    return allOptions;
  };

  // Handle tour type change
  const handleTourTypeChange = (e) => {
    const tourType = e.target.value;
    formik.handleChange(e);

    if (tourType === "Domestic") {
      formik.setFieldValue("country", "India");
      formik.setFieldValue("destination", "");
    } else {
      formik.setFieldValue("country", "");
      formik.setFieldValue("destination", "");
      dispatch(clearStates());
    }
  };

  // Handle country change for international tours
  const handleCountryChange = (e) => {
    const country = e.target.value;
    if (country === "__add_new__") {
      onAddNewClick("country");
    } else {
      formik.setFieldValue("country", country);
      formik.setFieldValue("destination", "");
    }
  };

  // Improved destination options with loading state
  const getDestinationOptions = () => {
    if (formik.values.tourType === "Domestic") {
      // For domestic tours, show Indian states
      if (locationLoading) {
        return ["Loading states..."];
      }
      return states && states.length > 0
        ? states.map(s => s.name)
        : ["No states available"];
    } else {
      // For international tours, show states of selected country
      if (!formik.values.country) {
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

  // Improved SelectField component
  const SelectField = ({
    name,
    label,
    options,
    disabled = false,
    onChange = onFieldChange,
    required = false
  }) => (
    <TextField
      select
      fullWidth
      name={name}
      label={label + (required ? " *" : "")}
      value={formik.values[name] || ''}
      onChange={onChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      disabled={disabled}
      sx={{ mb: 2 }}
    >
      {/* Always show current value as an option */}
      {formik.values[name] && !options.includes(formik.values[name]) && (
        <MenuItem key={formik.values[name]} value={formik.values[name]}>
          {formik.values[name]} (current)
        </MenuItem>
      )}

      {/* Show available options */}
      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}

      <MenuItem value="__add_new__">➕ Add New</MenuItem>
    </TextField>
  );

  const renderTextInputs = [
    { name: "adults", label: "No of Adults", required: true },
    { name: "children", label: "No of Children (6-12)" },
    { name: "kidsWithoutMattress", label: "No of Kids (2-5)" },
    { name: "infants", label: "No of Infants" },
    { name: "noOfRooms", label: "No of Rooms", required: true },
    { name: "noOfMattress", label: "No of Mattress" },
    { name: "noOfNights", label: "No of Nights" },
  ];

  return (
    <Box>
      {/* Basic Tour Details */}
      <Box p={2} border={1} borderRadius={2} borderColor="grey.300">
        <Typography variant="subtitle1" mb={2}>Basic Tour Details</Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl>
                <FormLabel>Tour Type</FormLabel>
                <RadioGroup
                  row
                  name="tourType"
                  value={formik.values.tourType}
                  onChange={handleTourTypeChange}
                >
                  <FormControlLabel value="Domestic" control={<Radio />} label="Domestic" />
                  <FormControlLabel value="International" control={<Radio />} label="International" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Country Field */}
            <Grid size={{ xs: 12, md: 6 }}>
              {formik.values.tourType === "International" ? (
                <SelectField
                  name="country"
                  label="Country"
                  required={formik.values.tourType === "International"}
                  options={locationLoading
                    ? ["Loading countries..."]
                    : (countries && countries.length > 0
                      ? countries.map(c => c.name)
                      : ["No countries available"])
                  }
                  onChange={handleCountryChange}
                  disabled={locationLoading}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Country"
                  value="India"
                  disabled
                  sx={{ mb: 2 }}
                  helperText="Domestic tours are within India"
                />
              )}
            </Grid>

            {/* Tour Destination */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SelectField
                name="destination"
                label="Tour Destination"
                required
                options={getDestinationOptions()}
                disabled={
                  formik.values.tourType === "International" && !formik.values.country ||
                  locationLoading
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SelectField
                name="services"
                label="Services Required"
                required
                options={getOptions("services")}
              />
            </Grid>

            {renderTextInputs.slice(0, 4).map(({ name, label, required }) => (
              <Grid size={{ xs: 12, md: 3 }} key={name}>
                <TextField
                  fullWidth
                  name={name}
                  label={label + (required ? " *" : "")}
                  type="number"
                  value={formik.values[name] || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched[name] && Boolean(formik.errors[name])}
                  helperText={formik.touched[name] && formik.errors[name]}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pickup / Drop Section */}
          <Box mt={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
            <Typography variant="subtitle1" mb={2}>Pickup/Drop</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <DatePicker
                  label="Arrival Date *"
                  value={formik.values.arrivalDate}
                  onChange={(val) => formik.setFieldValue("arrivalDate", val)}
                  renderInput={(params) => (
                    <TextField
                      fullWidth
                      {...params}
                      error={formik.touched.arrivalDate && Boolean(formik.errors.arrivalDate)}
                      helperText={formik.touched.arrivalDate && formik.errors.arrivalDate}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <SelectField
                  name="arrivalCity"
                  label="Arrival City"
                  options={getOptions("arrivalCity")}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <SelectField
                  name="arrivalLocation"
                  label="Arrival Location"
                  options={getOptions("arrivalLocation")}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <DatePicker
                  label="Departure Date *"
                  value={formik.values.departureDate}
                  onChange={(val) => formik.setFieldValue("departureDate", val)}
                  renderInput={(params) => (
                    <TextField
                      fullWidth
                      {...params}
                      error={formik.touched.departureDate && Boolean(formik.errors.departureDate)}
                      helperText={formik.touched.departureDate && formik.errors.departureDate}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <SelectField
                  name="departureCity"
                  label="Departure City"
                  options={getOptions("departureCity")}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <SelectField
                  name="departureLocation"
                  label="Departure Location"
                  options={getOptions("departureLocation")}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Accommodation */}
          <Box mt={3} p={2} border={1} borderRadius={2} borderColor="grey.300">
            <Typography variant="subtitle1" mb={2}>Accommodation & Facility</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <SelectField
                  name="hotelType"
                  label="Hotel Type"
                  options={getOptions("hotelType")}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <SelectField
                  name="mealPlan"
                  label="Meal Plan"
                  options={getOptions("mealPlan")}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl>
                  <FormLabel>Transport</FormLabel>
                  <RadioGroup
                    row
                    name="transport"
                    value={formik.values.transport}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <SelectField
                  name="sharingType"
                  label="Sharing Type"
                  required
                  options={getOptions("sharingType")}
                />
              </Grid>

              {renderTextInputs.slice(4).map(({ name, label }) => (
                <Grid size={{ xs: 12, md: 4 }} key={name}>
                  <TextField
                    fullWidth
                    name={name}
                    label={label}
                    type="number"
                    value={formik.values[name] || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched[name] && Boolean(formik.errors[name])}
                    helperText={formik.touched[name] && formik.errors[name]}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </LocalizationProvider>
      </Box>

      <Box mt={3}>
        <TextField
          fullWidth
          multiline
          rows={4}
          name="requirementNote"
          label="Requirement Note"
          value={formik.values.requirementNote || ''}
          onChange={formik.handleChange}
        />
      </Box>
    </Box>
  );
};
// Review Content Component
const ReviewContent = ({ formik }) => {
  const personalDetails = [
    { label: "Full Name", value: formik.values.fullName },
    { label: "Mobile", value: formik.values.mobile },
    { label: "Email", value: formik.values.email },
    { label: "Business Type", value: formik.values.businessType },
    { label: "Source", value: formik.values.source },
    { label: "Assigned To", value: formik.values.assignedTo },
  ];

  const tourDetails = [
    { label: "Tour Type", value: formik.values.tourType },
    { label: "Destination", value: formik.values.destination },
    { label: "Services", value: formik.values.services },
    { label: "Adults", value: formik.values.adults },
    { label: "Children", value: formik.values.children },
    { label: "Arrival Date", value: formik.values.arrivalDate?.toString() },
    { label: "Departure Date", value: formik.values.departureDate?.toString() },
    { label: "No of Rooms", value: formik.values.noOfRooms },
    { label: "Sharing Type", value: formik.values.sharingType },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box border={1} borderRadius={1} p={2}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Customer Details
            </Typography>
            {personalDetails.map((detail, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold">{detail.label}:</Typography>
                <Typography>{detail.value || "Not provided"}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box border={1} borderRadius={1} p={2}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Tour Details
            </Typography>
            {tourDetails.map((detail, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold">{detail.label}:</Typography>
                <Typography>{detail.value || "Not provided"}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle1" fontWeight="bold">
          Notes
        </Typography>
        <Typography>
          {formik.values.note || "No initial note provided"}
        </Typography>
        <Typography mt={1} fontWeight="bold">
          Requirement Note:
        </Typography>
        <Typography>
          {formik.values.requirementNote || "No requirement note provided"}
        </Typography>
      </Box>
    </Box>
  );
};

export default LeadEditForm;