import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { fetchAllStaff } from "../../../../features/staff/staffSlice";

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
  arrivalDate: Yup.date().required("Arrival date is required").nullable(),
  departureDate: Yup.date()
    .required("Departure date is required")
    .nullable()
    .min(Yup.ref('arrivalDate'), "Departure date must be after arrival date"),
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
    loading: locationLoading,
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
    assignedTo: [],
    priority: ["High", "Medium", "Low"],
    destination: [],
    services: ["Hotel", "Transport", "Sightseeing", "Meals", "Guide"],
    arrivalCity: [],
    arrivalLocation: ["Airport", "Railway Station", "Hotel", "Bus Stand"],
    departureCity: [],
    departureLocation: ["Airport", "Railway Station", "Hotel", "Bus Stand"],
    hotelType: ["3 Star", "4 Star", "5 Star", "Luxury", "Budget"],
    mealPlan: ["Breakfast", "Half Board", "Full Board", "All Inclusive"],
    sharingType: ["Single", "Double", "Triple", "Quad"],
  });

  const [customItems, setCustomItems] = useState({
    referralBy: [],
    agentName: [],
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

    const { personalDetails, location, address, officialDetail, tourDetails } = apiData;

    return {
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
      adults: tourDetails?.members?.adults?.toString() || "",
      children: tourDetails?.members?.children?.toString() || "",
      kidsWithoutMattress: tourDetails?.members?.kidsWithoutMattress?.toString() || "",
      infants: tourDetails?.members?.infants?.toString() || "",
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
      noOfRooms: tourDetails?.accommodation?.noOfRooms?.toString() || "",
      noOfMattress: tourDetails?.accommodation?.noOfMattress?.toString() || "0",
      noOfNights: tourDetails?.accommodation?.noOfNights?.toString() || "",
      requirementNote: tourDetails?.accommodation?.requirementNote || "",
    };
  };

  // Update dropdown options with API data
  const updateDropdownOptionsWithApiData = (apiData) => {
    if (!apiData) return;

    const { officialDetail, tourDetails } = apiData;

    setDropdownOptions(prev => ({
      ...prev,
      referralBy: [...new Set([...prev.referralBy, officialDetail?.referredBy].filter(Boolean))],
      assignedTo: [...new Set([...prev.assignedTo, officialDetail?.assignedTo].filter(Boolean))],
      agentName: [...new Set([...prev.agentName, officialDetail?.agentName].filter(Boolean))],
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
    enableReinitialize: true,
    onSubmit: (values) => {
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
          servicesRequired: values.services ? [values.services] : [],
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
            hotelType: values.hotelType ? [values.hotelType] : [],
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

    return () => {
      dispatch(resetViewStatus());
      dispatch(resetUpdateStatus());
    };
  }, [dispatch, leadId]);

  // Update form when viewedLead data changes
  useEffect(() => {
    if (viewedLead) {
      updateDropdownOptionsWithApiData(viewedLead);
      const formData = transformApiDataToForm(viewedLead);
      formik.setValues(formData);
    }
  }, [viewedLead]);

  useEffect(() => {
    if (formik.values.source === "Referral" || formik.values.source === "Agent's") {
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
    if (formik.values.country && formik.values.country !== "Loading countries...") {
      dispatch(fetchStatesByCountry(formik.values.country));
    }
  }, [formik.values.country, dispatch]);

  useEffect(() => {
    if (formik.values.state && formik.values.country) {
      dispatch(
        fetchCitiesByState({
          countryName: formik.values.country,
          stateName: formik.values.state,
        })
      );
    }
  }, [formik.values.state, formik.values.country, dispatch]);

  const steps = ['Customer Details', 'Tour Details', 'Review'];

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
      
      // Clear dependent fields
      if (name === "country") {
        formik.setFieldValue("state", "");
        formik.setFieldValue("city", "");
      }
      if (name === "state") {
        formik.setFieldValue("city", "");
      }
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

  const handleNext = () => {
    const errors = [];

    if (activeStep === 0) {
      const step1Fields = ['fullName', 'source', 'assignedTo'];
      step1Fields.forEach(field => {
        if (!formik.values[field]) {
          formik.setFieldTouched(field, true);
          errors.push(field);
        }
      });
    } else if (activeStep === 1) {
      const step2Fields = ['destination', 'services', 'adults', 'arrivalDate', 'departureDate', 'sharingType', 'noOfRooms'];
      step2Fields.forEach(field => {
        if (!formik.values[field]) {
          formik.setFieldTouched(field, true);
          errors.push(field);
        }
      });

      if (formik.values.tourType === "International" && !formik.values.country) {
        formik.setFieldTouched('country', true);
        errors.push('country');
      }
    }

    if (errors.length === 0) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  if (viewLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Loading lead data...</Typography>
      </Box>
    );
  }

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
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'background.paper',
      zIndex: 1300,
      overflow: 'auto',
      p: 3
    }}>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Typography variant="h5" gutterBottom>
          Edit Lead - {viewedLead?.leadId || 'Loading...'}
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

        {activeStep === 0 && (
          <Step1Content
            formik={formik}
            dropdownOptions={dropdownOptions}
            onFieldChange={handleFieldChange}
            countries={countries}
            states={states}
            cities={cities}
            locationLoading={locationLoading}
            staffList={staffList}
            staffLoading={staffLoading}
            associates={associates}
            associatesLoading={associatesLoading}
          />
        )}

        {activeStep === 1 && (
          <Step2Content
            formik={formik}
            dropdownOptions={dropdownOptions}
            customItems={customItems}
            onFieldChange={handleFieldChange}
            onAddNewClick={handleAddNewClick}
            countries={countries}
            states={states}
            locationLoading={locationLoading}
          />
        )}

        {activeStep === 2 && (
          <ReviewContent formik={formik} />
        )}

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
                disabled={updateLoading || !formik.isValid}
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
const Step1Content = ({ 
  formik, 
  dropdownOptions, 
  onFieldChange, 
  countries, 
  states, 
  cities,
  locationLoading,
  staffList, 
  staffLoading, 
  associates, 
  associatesLoading 
}) => {
  const getSubAgentNames = () =>
    associates
      .filter((a) => a?.personalDetails?.associateType === "Sub Agent")
      .map((a) => a?.personalDetails?.fullName || a?.name)
      .filter(Boolean);

  const renderSelectField = (label, name, options = [], loading = false) => {
    const allOptions = [...new Set([...options, formik.values[name]].filter(Boolean))];

    return (
      <TextField
        fullWidth
        select
        label={label}
        name={name}
        value={formik.values[name] || ''}
        onChange={onFieldChange}
        onBlur={formik.handleBlur}
        error={formik.touched[name] && Boolean(formik.errors[name])}
        helperText={formik.touched[name] && formik.errors[name]}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        {loading && (
          <MenuItem disabled>Loading...</MenuItem>
        )}
        
        {!loading && allOptions.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}

        {name !== "priority" && name !== "title" && !loading && (
          <MenuItem value="__add_new__">➕ Add New</MenuItem>
        )}
      </TextField>
    );
  };

  const renderTextField = (label, name, type = "text") => (
    <TextField
      fullWidth
      label={label}
      name={name}
      type={type}
      value={formik.values[name] || ''}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={{ mb: 2 }}
    />
  );

  const getCountryOptions = () => {
    if (!countries || countries.length === 0) return ["India"];
    return countries.map(c => c.name);
  };

  const getStateOptions = () => {
    if (locationLoading) return ["Loading states..."];
    if (!states || states.length === 0) return ["No states available"];
    return states.map(s => s.name);
  };

  const getCityOptions = () => {
    if (locationLoading) return ["Loading cities..."];
    if (!cities || cities.length === 0) return ["No cities available"];
    return cities.map(c => c.name);
  };

  return (
    <Box>
      {/* Personal Details */}
      <Box border={1} borderRadius={1} p={2} mb={2} borderColor="grey.300">
        <Typography fontWeight="bold" mb={2}>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{xs:12, sm:6, md:4}} >
            {renderSelectField("Title", "title", dropdownOptions.title)}
          </Grid>
          <Grid size={{xs:12, sm:6, md:4}}>
            {renderTextField("Full Name *", "fullName")}
          </Grid>
          <Grid size={{xs:12, sm:6, md:4}}>
            {renderTextField("Mobile", "mobile")}
          </Grid>
          <Grid size={{xs:12, sm:6, md:4}}>
            {renderTextField("Alternate Number", "alternateNumber")}
          </Grid>
          <Grid size={{xs:12, sm:6, md:4}}>
            {renderTextField("Email", "email")}
          </Grid>
          <Grid size={{xs:12, sm:6, md:4}}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date Of Birth"
                value={formik.values.dob}
                onChange={(value) => formik.setFieldValue("dob", value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 },
                    error: formik.touched.dob && Boolean(formik.errors.dob),
                    helperText: formik.touched.dob && formik.errors.dob
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      {/* Location */}
      <Box border={1} borderRadius={1} p={2} mb={2} borderColor="grey.300">
        <Typography fontWeight="bold" mb={2}>
          Location
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{xs:12, sm:4}}>
            {renderSelectField("Country", "country", getCountryOptions())}
          </Grid>
          <Grid size={{xs:12, sm:4}}>
            {renderSelectField("State", "state", getStateOptions(), locationLoading)}
          </Grid>
          <Grid size={{xs:12, sm:4}}>
            {renderSelectField("City", "city", getCityOptions(), locationLoading)}
          </Grid>
        </Grid>
      </Box>

      {/* Address & Official Detail */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{xs:12, md:6}}>
          <Box border={1} borderRadius={1} p={2} height="100%" borderColor="grey.300">
            <Typography fontWeight="bold" mb={2}>
              Address
            </Typography>
            {renderTextField("Address Line1", "address1")}
            {renderTextField("Address Line2", "address2")}
            {renderTextField("Address Line3", "address3")}
            {renderTextField("Pincode", "pincode")}
          </Box>
        </Grid>

        <Grid size={{xs:12, md:6}}>
          <Box border={1} borderRadius={1} p={2} borderColor="grey.300">
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

            {formik.values.businessType === "B2B" && formik.values.source === "Referral" && (
              renderSelectField(
                "Referral By",
                "referralBy",
                associatesLoading 
                  ? ["Loading..."] 
                  : associates.map((a) => a.personalDetails?.fullName || a.name).filter(Boolean),
                associatesLoading
              )
            )}

            {formik.values.businessType === "B2B" && formik.values.source === "Agent's" && (
              renderSelectField(
                "Agent Name",
                "agentName",
                associatesLoading ? ["Loading..."] : getSubAgentNames(),
                associatesLoading,
              )
            )}

            {renderSelectField(
              "Assigned To *",
              "assignedTo",
              staffLoading
                ? ["Loading..."]
                : staffList.map((staff) => staff.personalDetails?.fullName || staff.name).filter(Boolean),
              staffLoading
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Note */}
      <Box mb={2}>
        <TextField
          label="Initial Note"
          name="note"
          multiline
          rows={3}
          fullWidth
          value={formik.values.note || ''}
          onChange={formik.handleChange}
        />
      </Box>
    </Box>
  );
};

// Step 2 Content Component
const Step2Content = ({ 
  formik, 
  dropdownOptions, 
  customItems, 
  onFieldChange, 
  onAddNewClick, 
  countries, 
  states,
  locationLoading 
}) => {
  const getOptions = useCallback((field) => {
    const baseOptions = [
      ...(dropdownOptions[field] || []),
      ...(customItems[field] || []),
    ];
    const currentValue = formik.values[field];
    return [...new Set([...baseOptions, currentValue].filter(Boolean))];
  }, [dropdownOptions, customItems, formik.values]);

  const destinationOptions = useMemo(() => {
    if (formik.values.tourType === "Domestic") {
      return ["Select destination"];
    } else {
      if (!formik.values.country || formik.values.country === "Loading countries...") {
        return ["Select a country first"];
      }
      if (locationLoading) return ["Loading destinations..."];
      if (!states || states.length === 0) return ["No destinations available"];
      return states.map(s => s.name);
    }
  }, [formik.values.tourType, formik.values.country, states, locationLoading]);

  const countryOptions = useMemo(() => {
    if (!countries || countries.length === 0) return ["Loading countries..."];
    return countries.map(c => c.name);
  }, [countries]);

  const handleTourTypeChange = (e) => {
    const tourType = e.target.value;
    formik.setFieldValue("tourType", tourType);
    
    if (tourType === "Domestic") {
      formik.setFieldValue("country", "India");
      formik.setFieldValue("destination", "");
    } else {
      formik.setFieldValue("country", "");
      formik.setFieldValue("destination", "");
      formik.setFieldValue("state", "");
    }
  };

  const handleCountryChange = (e) => {
    const { value } = e.target;
    if (value === "__add_new__") {
      onAddNewClick("country");
    } else {
      formik.setFieldValue("country", value);
      formik.setFieldValue("destination", "");
    }
  };

  const renderSelectField = (name, label, options, required = false, disabled = false) => (
    <TextField
      select
      fullWidth
      name={name}
      label={label + (required ? " *" : "")}
      value={formik.values[name] || ''}
      onChange={onFieldChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      disabled={disabled}
      sx={{ mb: 2 }}
    >
      {formik.values[name] && !options.includes(formik.values[name]) && (
        <MenuItem value={formik.values[name]}>
          {formik.values[name]} (current)
        </MenuItem>
      )}

      {options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}

      {!disabled && name !== "country" && (
        <MenuItem value="__add_new__">➕ Add New</MenuItem>
      )}
    </TextField>
  );

  const renderNumberField = (name, label, required = false) => (
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
  );

  return (
    <Box>
      <Box p={2} border={1} borderRadius={2} borderColor="grey.300">
        <Typography variant="subtitle1" mb={2}>Basic Tour Details</Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2}>
            <Grid size={{xs:12, md:6}}>
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

            <Grid size={{xs:12, md:6}}>
              {formik.values.tourType === "International" ? (
                renderSelectField(
                  "country",
                  "Country",
                  countryOptions,
                  true,
                  locationLoading
                )
              ) : (
                <TextField
                  fullWidth
                  label="Country"
                  value="India"
                  disabled
                  sx={{ mb: 2 }}
                />
              )}
            </Grid>

            <Grid size={{xs:12, md:6}}>
              {renderSelectField(
                "destination",
                "Tour Destination",
                destinationOptions,
                true,
                (formik.values.tourType === "International" && !formik.values.country) || locationLoading
              )}
            </Grid>

            <Grid size={{xs:12, md:6}}>
              {renderSelectField(
                "services",
                "Services Required",
                getOptions("services"),
                true
              )}
            </Grid>

            <Grid size={{xs:12, md:3}}>
              {renderNumberField("adults", "No of Adults", true)}
            </Grid>
            <Grid size={{xs:12, md:3}}>
              {renderNumberField("children", "No of Children (6-12)")}
            </Grid>
            <Grid size={{xs:12, md:3}}>
              {renderNumberField("kidsWithoutMattress", "No of Kids (2-5)")}
            </Grid>
            <Grid size={{xs:12, md:3}}>
              {renderNumberField("infants", "No of Infants")}
            </Grid>

            <Grid size={{xs:12, md:6}}>
              <DatePicker
                label="Arrival Date *"
                value={formik.values.arrivalDate}
                onChange={(value) => formik.setFieldValue("arrivalDate", value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.arrivalDate && Boolean(formik.errors.arrivalDate),
                    helperText: formik.touched.arrivalDate && formik.errors.arrivalDate
                  }
                }}
              />
            </Grid>

            <Grid size={{xs:12, md:6}}>
              <DatePicker
                label="Departure Date *"
                value={formik.values.departureDate}
                onChange={(value) => formik.setFieldValue("departureDate", value)}
                minDate={formik.values.arrivalDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.departureDate && Boolean(formik.errors.departureDate),
                    helperText: formik.touched.departureDate && formik.errors.departureDate
                  }
                }}
              />
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField(
                "sharingType",
                "Sharing Type",
                getOptions("sharingType"),
                true
              )}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderNumberField("noOfRooms", "No of Rooms", true)}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderNumberField("noOfNights", "No of Nights")}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("hotelType", "Hotel Type", getOptions("hotelType"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("mealPlan", "Meal Plan", getOptions("mealPlan"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
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

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("arrivalCity", "Arrival City", getOptions("arrivalCity"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("arrivalLocation", "Arrival Location", getOptions("arrivalLocation"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("departureCity", "Departure City", getOptions("departureCity"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderSelectField("departureLocation", "Departure Location", getOptions("departureLocation"))}
            </Grid>

            <Grid size={{xs:12, md:4}}>
              {renderNumberField("noOfMattress", "No of Mattress")}
            </Grid>
          </Grid>
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
    { label: "Country", value: formik.values.country },
    { label: "State", value: formik.values.state },
    { label: "City", value: formik.values.city },
  ];

  const tourDetails = [
    { label: "Tour Type", value: formik.values.tourType },
    { label: "Destination", value: formik.values.destination },
    { label: "Services", value: formik.values.services },
    { label: "Adults", value: formik.values.adults },
    { label: "Children", value: formik.values.children },
    { label: "Kids (2-5)", value: formik.values.kidsWithoutMattress },
    { label: "Infants", value: formik.values.infants },
    { label: "Arrival Date", value: formik.values.arrivalDate ? dayjs(formik.values.arrivalDate).format('DD/MM/YYYY') : "Not set" },
    { label: "Departure Date", value: formik.values.departureDate ? dayjs(formik.values.departureDate).format('DD/MM/YYYY') : "Not set" },
    { label: "No of Rooms", value: formik.values.noOfRooms },
    { label: "Sharing Type", value: formik.values.sharingType },
    { label: "Hotel Type", value: formik.values.hotelType || "Not specified" },
    { label: "Meal Plan", value: formik.values.mealPlan || "Not specified" },
    { label: "Transport", value: formik.values.transport },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12, md:6}}>
          <Box border={1} borderRadius={1} p={2} borderColor="grey.300">
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Customer Details
            </Typography>
            {personalDetails.map((detail, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold" color="text.secondary">{detail.label}:</Typography>
                <Typography>{detail.value || "Not provided"}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid size={{xs:12, md:6}}>
          <Box border={1} borderRadius={1} p={2} borderColor="grey.300">
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Tour Details
            </Typography>
            {tourDetails.map((detail, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold" color="text.secondary">{detail.label}:</Typography>
                <Typography>{detail.value || "Not provided"}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Notes
        </Typography>
        <Box border={1} borderRadius={1} p={2} borderColor="grey.300">
          <Typography fontWeight="bold" color="text.secondary">Initial Note:</Typography>
          <Typography paragraph>
            {formik.values.note || "No initial note provided"}
          </Typography>
          <Typography fontWeight="bold" color="text.secondary">Requirement Note:</Typography>
          <Typography>
            {formik.values.requirementNote || "No requirement note provided"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LeadEditForm;