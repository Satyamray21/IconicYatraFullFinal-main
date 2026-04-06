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

const titles = ["Mr", "Mrs", "Ms", "Dr"];
const roles = ["Admin", "Manager", "Executive"];

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Required"),
  mobile: Yup.string().required("Required"),
  alternateContact: Yup.string(),
  designation: Yup.string().required("Required"),
  userRole: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email"),
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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    countries: countriesData,
    states: statesData,
    cities: citiesData,
    loading,
  } = useSelector((state) => state.location);

  // Initialize formik FIRST
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

      // Staff Address
      address1: "",
      address2: "",
      address3: "",
      pincode: "",
      country: "",
      state: "",
      city: "",

      // Firm
      firmType: "",
      gstin: "",
      cin: "",
      pan: "",
      turnover: "",
      firmName: "",
      firmDescription: "",
      sameAsContact: false,
      supportingDocs: null,
      firmAddress1: "",
      firmAddress2: "",
      firmAddress3: "",

      // Bank
      bankName: "",
      branchName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      nameOfBranch: "",
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

  // NOW destructure formik after initialization
  const {
    values,
    errors,
    touched,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
  } = formik;

  // Use effects that depend on formik values should come AFTER formik initialization
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

  const handleFinalSubmit = (values) => {
    const formattedData = {
      personalDetails: {
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
      },
      staffLocation: {
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
      firm: {
        firmType: values.firmType,
        gstin: values.gstin,
        cin: values.cin,
        pan: values.pan,
        turnover: values.turnover,
        firmName: values.firmName,
        firmDescription: values.firmDescription,
        sameAsContact: values.sameAsContact,
        address1: values.firmAddress1,
        address2: values.firmAddress2,
        address3: values.firmAddress3,
        supportingDocs: values.supportingDocs,
      },
      bank: {
        bankName: values.bankName,
        branchName: values.branchName,
        accountHolderName: values.accountHolderName,
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
      },
    };

    dispatch(createStaff(formattedData))
      .unwrap()
      .then(() => {
        navigate("/staff");
      })
      .catch((err) => {
        console.error("Staff creation failed:", err);
      });
  };

  // Helper function to render select options
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