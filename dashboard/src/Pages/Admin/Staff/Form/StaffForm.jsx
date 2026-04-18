import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  IconButton,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import StaffFormDetail from "./StaffFormDetail";
import { useDispatch, useSelector } from "react-redux";
import { createStaff } from "../../../../features/staff/staffSlice";
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchCitiesByState,
  clearStates,
  clearCities,
} from "../../../../features/location/locationSlice";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

const titles = ["Mr", "Mrs", "Ms", "Dr"];
const roles = ["Admin", "Manager", "Executive"];

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Required"),
  mobile: Yup.string()
    .required("Required")
    .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  alternateContact: Yup.string().matches(/^[0-9]{10}$/, "Alternate contact must be 10 digits"),
  designation: Yup.string().required("Required"),
  userRole: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  aadharNumber: Yup.string()
    .required("Aadhar number is required")
    .matches(/^[0-9]{12}$/, "Aadhar number must be 12 digits"),
  panNumber: Yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format"),
  title: Yup.string(),
  dob: Yup.date().nullable(),
  country: Yup.string().required("Required"),
  state: Yup.string().required("Required"),
  city: Yup.string().required("Required"),
  address1: Yup.string(),
  address2: Yup.string(),
  address3: Yup.string(),
  pincode: Yup.string(),
});

const StaffForm = () => {
  const [step, setStep] = useState(1);
  const [photoPreviews, setPhotoPreviews] = useState({
    staffPhoto: null,
    aadharPhoto: null,
    panPhoto: null,
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    countries: countriesData,
    states: statesData,
    cities: citiesData,
    loading,
  } = useSelector((state) => state.location);

  const formik = useFormik({
    initialValues: {
      title: "",
      fullName: "",
      mobile: "",
      alternateContact: "",
      designation: "",
      userRole: "",
      email: "",
      dob: null,
      aadharNumber: "",
      panNumber: "",

      // Staff Address
      address1: "",
      address2: "",
      address3: "",
      pincode: "",
      country: "",
      state: "",
      city: "",

      // Photos
      staffPhoto: null,
      aadharPhoto: null,
      panPhoto: null,

      // Bank
      bankName: "",
      branchName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
    },
    validationSchema,
    onSubmit: (values) => {
      if (step === 1) {
        setStep(2);
      } else {
        handleFinalSubmit(values);
      }
    },
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
  } = formik;

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (values.country) {
      dispatch(fetchStatesByCountry(values.country));
      setFieldValue("state", "");
      setFieldValue("city", "");
      dispatch(clearCities());
    } else {
      dispatch(clearStates());
      dispatch(clearCities());
    }
  }, [values.country, dispatch, setFieldValue]);

  useEffect(() => {
    if (values.state && values.country) {
      dispatch(
        fetchCitiesByState({
          countryName: values.country,
          stateName: values.state,
        })
      );
    } else {
      dispatch(clearCities());
    }
  }, [values.state, values.country, dispatch]);

  const handlePhotoChange = (fieldName, event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviews(prev => ({
        ...prev,
        [fieldName]: previewUrl
      }));
      setFieldValue(fieldName, file);
    }
  };

  const handleRemovePhoto = (fieldName) => {
    setPhotoPreviews(prev => ({
      ...prev,
      [fieldName]: null
    }));
    setFieldValue(fieldName, null);
  };

  const handleFinalSubmit = (values) => {
    const formData = new FormData();
    
    // Append personal details
    const personalDetails = {
      title: values.title,
      firstName: values.fullName.split(" ")[0] || "",
      lastName: values.fullName.split(" ").slice(1).join(" ") || "",
      fullName: values.fullName,
      mobileNumber: values.mobile,
      alternateContact: values.alternateContact,
      designation: values.designation,
      userRole: values.userRole,
      email: values.email,
      dob: values.dob ? new Date(values.dob) : null,
      aadharNumber: values.aadharNumber,
      panNumber: values.panNumber,
    };
    
    formData.append("personalDetails", JSON.stringify(personalDetails));
    
    // Append staff location
    const staffLocation = {
      country: values.country,
      state: values.state,
      city: values.city,
    };
    formData.append("staffLocation", JSON.stringify(staffLocation));
    
    // Append address
    const address = {
      addressLine1: values.address1,
      addressLine2: values.address2,
      addressLine3: values.address3,
      pincode: values.pincode,
    };
    formData.append("address", JSON.stringify(address));
    
    // Append bank details
    const bank = {
      bankName: values.bankName,
      branchName: values.branchName,
      accountHolderName: values.accountHolderName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode,
    };
    formData.append("bank", JSON.stringify(bank));
    
    // Append photos if they exist
    if (values.staffPhoto) {
      formData.append("staffPhoto", values.staffPhoto);
    }
    if (values.aadharPhoto) {
      formData.append("aadharPhoto", values.aadharPhoto);
    }
    if (values.panPhoto) {
      formData.append("panPhoto", values.panPhoto);
    }

    dispatch(createStaff(formData))
      .unwrap()
      .then(() => {
        navigate("/staff");
      })
      .catch((err) => {
        console.error("Staff creation failed:", err);
      });
  };

  const renderSelectOptions = (options, loadingText = "Loading...") => {
    if (loading) {
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

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Staff Detail Form
      </Typography>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            {/* Personal Details */}
            <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Staff's Personal Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Title</InputLabel>
                    <Select
                      name="title"
                      value={values.title}
                      onChange={handleChange}
                      label="Title"
                    >
                      {renderSelectOptions(titles)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="fullName"
                    label="Full Name"
                    fullWidth
                    required
                    value={values.fullName}
                    onChange={handleChange}
                    error={touched.fullName && Boolean(errors.fullName)}
                    helperText={touched.fullName && errors.fullName}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="mobile"
                    label="Mobile Number"
                    fullWidth
                    required
                    value={values.mobile}
                    onChange={handleChange}
                    error={touched.mobile && Boolean(errors.mobile)}
                    helperText={touched.mobile && errors.mobile}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="alternateContact"
                    label="Alternate Contact"
                    fullWidth
                    value={values.alternateContact}
                    onChange={handleChange}
                    error={touched.alternateContact && Boolean(errors.alternateContact)}
                    helperText={touched.alternateContact && errors.alternateContact}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="designation"
                    label="Designation"
                    fullWidth
                    required
                    value={values.designation}
                    onChange={handleChange}
                    error={touched.designation && Boolean(errors.designation)}
                    helperText={touched.designation && errors.designation}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <FormControl
                    fullWidth
                    required
                    error={touched.userRole && Boolean(errors.userRole)}
                  >
                    <InputLabel>User Role</InputLabel>
                    <Select
                      name="userRole"
                      value={values.userRole}
                      onChange={handleChange}
                      label="User Role"
                    >
                      {renderSelectOptions(roles)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="email"
                    label="Email Id"
                    fullWidth
                    required
                    value={values.email}
                    onChange={handleChange}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date of Birth"
                      value={values.dob ? dayjs(values.dob) : null}
                      onChange={(date) => setFieldValue("dob", date)}
                      format="DD-MM-YYYY"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="aadharNumber"
                    label="Aadhar Number"
                    fullWidth
                    required
                    value={values.aadharNumber}
                    onChange={handleChange}
                    error={touched.aadharNumber && Boolean(errors.aadharNumber)}
                    helperText={touched.aadharNumber && errors.aadharNumber}
                  />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <TextField
                    name="panNumber"
                    label="PAN Number (Optional)"
                    fullWidth
                    value={values.panNumber}
                    onChange={handleChange}
                    error={touched.panNumber && Boolean(errors.panNumber)}
                    helperText={touched.panNumber && errors.panNumber}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Photo Upload Section */}
            <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Photo Uploads (Optional)
              </Typography>
              <Grid container spacing={3}>
                {/* Staff Photo */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="body2" gutterBottom>
                      Staff Photo
                    </Typography>
                    <Box position="relative" display="inline-block">
                      <Avatar
                        src={photoPreviews.staffPhoto}
                        sx={{ width: 120, height: 120, mb: 1 }}
                      >
                        {!photoPreviews.staffPhoto && "Staff"}
                      </Avatar>
                      {photoPreviews.staffPhoto && (
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                          onClick={() => handleRemovePhoto('staffPhoto')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<PhotoCamera />}
                    >
                      Upload
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange('staffPhoto', e)}
                      />
                    </Button>
                  </Box>
                </Grid>

                {/* Aadhar Photo */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="body2" gutterBottom>
                      Aadhar Photo
                    </Typography>
                    <Box position="relative" display="inline-block">
                      <Avatar
                        src={photoPreviews.aadharPhoto}
                        sx={{ width: 120, height: 120, mb: 1 }}
                      >
                        {!photoPreviews.aadharPhoto && "Aadhar"}
                      </Avatar>
                      {photoPreviews.aadharPhoto && (
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                          onClick={() => handleRemovePhoto('aadharPhoto')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<PhotoCamera />}
                    >
                      Upload
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange('aadharPhoto', e)}
                      />
                    </Button>
                  </Box>
                </Grid>

                {/* PAN Photo */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="body2" gutterBottom>
                      PAN Photo
                    </Typography>
                    <Box position="relative" display="inline-block">
                      <Avatar
                        src={photoPreviews.panPhoto}
                        sx={{ width: 120, height: 120, mb: 1 }}
                      >
                        {!photoPreviews.panPhoto && "PAN"}
                      </Avatar>
                      {photoPreviews.panPhoto && (
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                          onClick={() => handleRemovePhoto('panPhoto')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<PhotoCamera />}
                    >
                      Upload
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange('panPhoto', e)}
                      />
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Location */}
            <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Staff's Location
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <FormControl
                    fullWidth
                    required
                    error={touched.country && Boolean(errors.country)}
                  >
                    <InputLabel>Country</InputLabel>
                    <Select
                      name="country"
                      value={values.country}
                      onChange={(e) => {
                        handleChange(e);
                        setFieldValue("state", "");
                        setFieldValue("city", "");
                      }}
                      label="Country"
                    >
                      {renderSelectOptions(
                        countriesData?.map((c) => c.name),
                        "Loading countries..."
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <FormControl
                    fullWidth
                    required
                    error={touched.state && Boolean(errors.state)}
                  >
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={values.state}
                      onChange={(e) => {
                        handleChange(e);
                        setFieldValue("city", "");
                      }}
                      disabled={!values.country || loading}
                      label="State"
                    >
                      {renderSelectOptions(
                        statesData?.map((s) => s.name),
                        "Loading states..."
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <FormControl
                    fullWidth
                    required
                    error={touched.city && Boolean(errors.city)}
                  >
                    <InputLabel>City</InputLabel>
                    <Select
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      disabled={!values.state || loading}
                      label="City"
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

            {/* Address Section */}
            <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    name="address1"
                    label="Address Line 1"
                    placeholder="Address Line1"
                    fullWidth
                    value={values.address1}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    name="address2"
                    label="Address Line 2"
                    placeholder="Address Line2"
                    fullWidth
                    value={values.address2}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    name="address3"
                    label="Address Line 3"
                    placeholder="Address Line3"
                    fullWidth
                    value={values.address3}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    name="pincode"
                    label="Pincode"
                    placeholder="Pincode"
                    fullWidth
                    value={values.pincode}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {step === 2 && (
          <>
            <StaffFormDetail formik={formik} />

            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Submit Final
              </Button>
            </Box>
          </>
        )}

        <Box display="flex" gap={2} justifyContent="center" mt={3}>
          {step === 1 && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => resetForm()}
              >
                Clear
              </Button>
              <Button variant="contained" type="submit">
                Save & Continue
              </Button>
            </>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default StaffForm;