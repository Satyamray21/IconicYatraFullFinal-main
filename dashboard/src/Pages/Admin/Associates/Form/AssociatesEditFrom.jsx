import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssociateById, updateAssociate, clearSelectedAssociate } from "../../../../features/associate/associateSlice";
import { useParams } from "react-router-dom";
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchCitiesByState,
  clearStates,
  clearCities,
} from "../../../../features/location/locationSlice";

// ----- Static Data -----
const titles = ["Mr", "Mrs", "Ms", "Dr"];
const roles = [
  "B2B Vendor",
  "Hotel Vendor",
  "Referral Partner",
  "Staff",
  "Sub Agent",
  "Vehicle Vendor",
];
const firmTypesDefault = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Ltd",
  "Public Ltd",
];

// ----- Validation Schema -----
const validationSchema = Yup.object().shape({
  personalDetails: Yup.object().shape({
    fullName: Yup.string().required("Required"),
    mobileNumber: Yup.string().required("Required"),
    associateType: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email"),
  }),
  staffLocation: Yup.object().shape({
    country: Yup.string().required("Required"),
    state: Yup.string().required("Required"),
    city: Yup.string().required("Required"),
  }),
  firm: Yup.object().shape({
    firmType: Yup.string().required("Required"),
    firmName: Yup.string().required("Required"),
  }),
});

// Initial empty values structure
const getInitialValues = (associate) => ({
  personalDetails: {
    title: associate?.personalDetails?.title || "",
    fullName: associate?.personalDetails?.fullName || "",
    mobileNumber: associate?.personalDetails?.mobileNumber || "",
    alternateContact: associate?.personalDetails?.alternateContact || "",
    associateType: associate?.personalDetails?.associateType || "",
    email: associate?.personalDetails?.email || "",
    dob: associate?.personalDetails?.dob ? dayjs(associate.personalDetails.dob) : null,
  },
  staffLocation: {
    country: associate?.staffLocation?.country || "",
    state: associate?.staffLocation?.state || "",
    city: associate?.staffLocation?.city || "",
  },
  address: {
    addressLine1: associate?.address?.addressLine1 || "",
    addressLine2: associate?.address?.addressLine2 || "",
    addressLine3: associate?.address?.addressLine3 || "",
    pincode: associate?.address?.pincode || "",
  },
  firm: {
    firmType: associate?.firm?.firmType || "",
    gstIn: associate?.firm?.gstIn || "",
    cin: associate?.firm?.cin || "",
    pan: associate?.firm?.pan || "",
    existingTurnOver: associate?.firm?.existingTurnOver || "",
    firmName: associate?.firm?.firmName || "",
    firmDescription: associate?.firm?.firmDescription || "",
    sameAsContact: associate?.firm?.sameAsContact || false,
  },
  bank: {
    bankName: associate?.bank?.bankName || "",
    branchName: associate?.bank?.branchName || "",
    accountHolderName: associate?.bank?.accountHolderName || "",
    accountNumber: associate?.bank?.accountNumber || "",
    ifscCode: associate?.bank?.ifscCode || "",
  },
});

const EditAssociateForm = () => {
  const { associateId } = useParams();
  const dispatch = useDispatch();
  const { selected: associate, loading, error } = useSelector((state) => state.associate);
  const {
    countries: countriesData,
    states: statesData,
    cities: citiesData,
    loading: locationLoading,
  } = useSelector((state) => state.location);

  const [firmTypes, setFirmTypes] = React.useState(firmTypesDefault);
  const [hasPrefilledData, setHasPrefilledData] = React.useState(false);

  // Fetch associate data when component mounts or ID changes
  useEffect(() => {
    if (associateId) {
      dispatch(fetchAssociateById(associateId));
    }

    return () => {
      dispatch(clearSelectedAssociate());
    };
  }, [dispatch, associateId]);

  // Fetch countries on component mount
  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(associate),
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Convert dayjs object back to string for API
        const submitData = {
          ...values,
          personalDetails: {
            ...values.personalDetails,
            dob: values.personalDetails.dob ? values.personalDetails.dob.format('YYYY-MM-DD') : null,
          },
        };

        const result = await dispatch(updateAssociate({
          id: associateId,
          data: submitData
        })).unwrap();

        console.log('Update successful:', result);
      } catch (error) {
        console.error('Failed to update associate:', error);
      }
    },
  });

  const { values, errors, touched, handleChange, setFieldValue, isSubmitting } = formik;

  // Handle pre-filled data when associate is loaded
  useEffect(() => {
    if (associate && !hasPrefilledData) {
      console.log("Associate data loaded:", associate);
      console.log("Staff Location:", associate.staffLocation);

      // Set flag to indicate we have pre-filled data
      setHasPrefilledData(true);

      // If country is pre-filled, fetch states
      if (associate.staffLocation?.country) {
        dispatch(fetchStatesByCountry(associate.staffLocation.country));
      }

      // If state is pre-filled, fetch cities
      if (associate.staffLocation?.state && associate.staffLocation?.country) {
        dispatch(
          fetchCitiesByState({
            countryName: associate.staffLocation.country,
            stateName: associate.staffLocation.state,
          })
        );
      }
    }
  }, [associate, dispatch, hasPrefilledData]);

  // Fetch states when country changes OR when associate data is loaded with pre-filled country
  useEffect(() => {
    if (values.staffLocation?.country) {
      dispatch(fetchStatesByCountry(values.staffLocation.country));

      // Only clear state and city if we're changing the country, not when pre-filling
      if (!hasPrefilledData) {
        setFieldValue("staffLocation.state", "");
        setFieldValue("staffLocation.city", "");
        dispatch(clearCities());
      }
    } else {
      dispatch(clearStates());
      dispatch(clearCities());
    }
  }, [values.staffLocation?.country, dispatch, setFieldValue, hasPrefilledData]);

  // Fetch cities when state changes OR when associate data is loaded with pre-filled state
  useEffect(() => {
    if (values.staffLocation?.state && values.staffLocation?.country) {
      dispatch(
        fetchCitiesByState({
          countryName: values.staffLocation.country,
          stateName: values.staffLocation.state,
        })
      );
    } else {
      dispatch(clearCities());
    }
  }, [values.staffLocation?.state, values.staffLocation?.country, dispatch]);

  const renderSelectOptions = (options, loadingText = "Loading...") => {
    if (locationLoading) {
      return <MenuItem disabled>{loadingText}</MenuItem>;
    }

    if (!options || options.length === 0) {
      return <MenuItem disabled>No options available</MenuItem>;
    }

    return options.map((option) => (
      <MenuItem key={option} value={option}>
        {option}
      </MenuItem>
    ));
  };

  // Helper function to handle nested field changes
  const handleNestedChange = (section, field) => (e) => {
    setFieldValue(`${section}.${field}`, e.target.value);
  };

  // Helper function to handle nested checkbox changes
  const handleNestedCheckboxChange = (section, field) => (e) => {
    setFieldValue(`${section}.${field}`, e.target.checked);
  };

  // Safe access to nested values with fallbacks
  const getNestedValue = (obj, path, defaultValue = "") => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
  };

  // Safe access to nested errors
  const getNestedError = (path) => {
    return getNestedValue(errors, path);
  };

  // Safe access to nested touched
  const getNestedTouched = (path) => {
    return getNestedValue(touched, path);
  };

  // Show loading state
  if (loading && !associate) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error && !associate) {
    return (
      <Box p={3}>
        <Alert severity="error">Error loading associate: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3} component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Edit Associate Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ---- Personal Details ---- */}
      <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Title</InputLabel>
              <Select
                name="personalDetails.title"
                value={values.personalDetails?.title || ""}
                onChange={handleNestedChange("personalDetails", "title")}
                label="Title"
              >
                {titles.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="personalDetails.fullName"
              label="Full Name"
              fullWidth
              value={values.personalDetails?.fullName || ""}
              onChange={handleNestedChange("personalDetails", "fullName")}
              error={getNestedTouched("personalDetails.fullName") && Boolean(getNestedError("personalDetails.fullName"))}
              helperText={getNestedTouched("personalDetails.fullName") && getNestedError("personalDetails.fullName")}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <TextField
              name="personalDetails.mobileNumber"
              label="Mobile"
              fullWidth
              value={values.personalDetails?.mobileNumber || ""}
              onChange={handleNestedChange("personalDetails", "mobileNumber")}
              error={getNestedTouched("personalDetails.mobileNumber") && Boolean(getNestedError("personalDetails.mobileNumber"))}
              helperText={getNestedTouched("personalDetails.mobileNumber") && getNestedError("personalDetails.mobileNumber")}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <TextField
              name="personalDetails.alternateContact"
              label="Alternate Contact"
              fullWidth
              value={values.personalDetails?.alternateContact || ""}
              onChange={handleNestedChange("personalDetails", "alternateContact")}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Associate Type</InputLabel>
              <Select
                name="personalDetails.associateType"
                value={values.personalDetails?.associateType || ""}
                onChange={handleNestedChange("personalDetails", "associateType")}
                label="Associate Type"
                error={getNestedTouched("personalDetails.associateType") && Boolean(getNestedError("personalDetails.associateType"))}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <TextField
              name="personalDetails.email"
              label="Email"
              fullWidth
              value={values.personalDetails?.email || ""}
              onChange={handleNestedChange("personalDetails", "email")}
              error={getNestedTouched("personalDetails.email") && Boolean(getNestedError("personalDetails.email"))}
              helperText={getNestedTouched("personalDetails.email") && getNestedError("personalDetails.email")}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Birth"
                value={values.personalDetails?.dob || null}
                onChange={(d) => setFieldValue("personalDetails.dob", d)}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: getNestedTouched("personalDetails.dob") && Boolean(getNestedError("personalDetails.dob")),
                    helperText: getNestedTouched("personalDetails.dob") && getNestedError("personalDetails.dob")
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      {/* ---- Location ---- */}
      <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Location
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                name="staffLocation.country"
                value={values.staffLocation?.country || ""}
                onChange={(e) => {
                  handleNestedChange("staffLocation", "country")(e);
                  setFieldValue("staffLocation.state", "");
                  setFieldValue("staffLocation.city", "");
                  setHasPrefilledData(false); // Reset flag when user changes country
                }}
                label="Country"
                error={getNestedTouched("staffLocation.country") && Boolean(getNestedError("staffLocation.country"))}
              >
                {renderSelectOptions(
                  countriesData?.map((c) => c.name),
                  "Loading countries..."
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                name="staffLocation.state"
                value={values.staffLocation?.state || ""}
                onChange={(e) => {
                  handleNestedChange("staffLocation", "state")(e);
                  setFieldValue("staffLocation.city", "");
                  setHasPrefilledData(false); // Reset flag when user changes state
                }}
                disabled={!values.staffLocation?.country}
                label="State"
                error={getNestedTouched("staffLocation.state") && Boolean(getNestedError("staffLocation.state"))}
              >
                {renderSelectOptions(
                  statesData?.map((s) => s.name),
                  "Loading states..."
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                name="staffLocation.city"
                value={values.staffLocation?.city || ""}
                onChange={handleNestedChange("staffLocation", "city")}
                disabled={!values.staffLocation?.state}
                label="City"
                error={getNestedTouched("staffLocation.city") && Boolean(getNestedError("staffLocation.city"))}
              >
                {renderSelectOptions(
                  citiesData?.map((c) => c.name),
                  "Loading cities..."
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* ---- Address ---- */}
      <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Address
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="address.addressLine1"
              label="Address Line 1"
              fullWidth
              value={values.address?.addressLine1 || ""}
              onChange={handleNestedChange("address", "addressLine1")}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="address.addressLine2"
              label="Address Line 2"
              fullWidth
              value={values.address?.addressLine2 || ""}
              onChange={handleNestedChange("address", "addressLine2")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="address.addressLine3"
              label="Address Line 3"
              fullWidth
              value={values.address?.addressLine3 || ""}
              onChange={handleNestedChange("address", "addressLine3")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="address.pincode"
              label="Pincode"
              fullWidth
              value={values.address?.pincode || ""}
              onChange={handleNestedChange("address", "pincode")}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ---- Firm Details ---- */}
      <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Firm Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Firm Type</InputLabel>
              <Select
                name="firm.firmType"
                value={values.firm?.firmType || ""}
                onChange={handleNestedChange("firm", "firmType")}
                label="Firm Type"
                error={getNestedTouched("firm.firmType") && Boolean(getNestedError("firm.firmType"))}
              >
                {firmTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="firm.firmName"
              label="Firm Name"
              fullWidth
              value={values.firm?.firmName || ""}
              onChange={handleNestedChange("firm", "firmName")}
              error={getNestedTouched("firm.firmName") && Boolean(getNestedError("firm.firmName"))}
              helperText={getNestedTouched("firm.firmName") && getNestedError("firm.firmName")}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              name="firm.gstIn"
              label="GSTIN"
              fullWidth
              value={values.firm?.gstIn || ""}
              onChange={handleNestedChange("firm", "gstIn")}
            />
          </Grid>
          <Grid size={{ sx: 4 }}>
            <TextField
              name="firm.cin"
              label="CIN"
              fullWidth
              value={values.firm?.cin || ""}
              onChange={handleNestedChange("firm", "cin")}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              name="firm.pan"
              label="PAN"
              fullWidth
              value={values.firm?.pan || ""}
              onChange={handleNestedChange("firm", "pan")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="firm.existingTurnOver"
              label="Turnover"
              fullWidth
              value={values.firm?.existingTurnOver || ""}
              onChange={handleNestedChange("firm", "existingTurnOver")}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="firm.firmDescription"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={values.firm?.firmDescription || ""}
              onChange={handleNestedChange("firm", "firmDescription")}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="firm.sameAsContact"
                  checked={values.firm?.sameAsContact || false}
                  onChange={handleNestedCheckboxChange("firm", "sameAsContact")}
                />
              }
              label="Same as contact address"
            />
          </Grid>
        </Grid>
      </Box>

      {/* ---- Bank Details ---- */}
      <Box border={1} borderColor="divider" borderRadius={2} p={2}>
        <Typography variant="subtitle1" gutterBottom>
          Bank Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="bank.bankName"
              label="Bank Name"
              fullWidth
              value={values.bank?.bankName || ""}
              onChange={handleNestedChange("bank", "bankName")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="bank.branchName"
              label="Branch Name"
              fullWidth
              value={values.bank?.branchName || ""}
              onChange={handleNestedChange("bank", "branchName")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="bank.accountHolderName"
              label="Account Holder Name"
              fullWidth
              value={values.bank?.accountHolderName || ""}
              onChange={handleNestedChange("bank", "accountHolderName")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="bank.accountNumber"
              label="Account Number"
              fullWidth
              value={values.bank?.accountNumber || ""}
              onChange={handleNestedChange("bank", "accountNumber")}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              name="bank.ifscCode"
              label="IFSC Code"
              fullWidth
              value={values.bank?.ifscCode || ""}
              onChange={handleNestedChange("bank", "ifscCode")}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ---- Submit ---- */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || loading}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Updating...' : 'Update Associate'}
        </Button>
      </Box>
    </Box>
  );
};

export default EditAssociateForm;