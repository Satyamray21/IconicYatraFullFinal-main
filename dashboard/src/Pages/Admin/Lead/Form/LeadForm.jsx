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
  Snackbar,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import AssociateDetailForm from "../../Associates/Form/AssociatesForm";
import { fetchAllAssociates } from "../../../../features/associate/associateSlice";
import { fetchAllStaff } from "../../../../features/staff/staffSlice"
import { fetchCountries, fetchStatesByCountry, fetchCitiesByState, clearStates, clearCities } from '../../../../features/location/locationSlice';
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice"; // ✅ Import deleteLeadOption

import { useDispatch, useSelector } from "react-redux";

const validationSchema = Yup.object({
  fullName: Yup.string().required("Name is required"),
  mobile: Yup.string()
    .required("Mobile is required")
    .matches(/^[0-9]{10}$/, "Mobile must be 10 digits"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  source: Yup.string().required("Source is required"),
  assignedTo: Yup.string().required("Assigned To is required"),
  pincode: Yup.string().matches(/^[0-9]{6}$/, "Pincode must be 6 digits"),
});

const LeadForm = ({ onSaveAndContinue }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [activeField, setActiveField] = useState("");
  const [showAssociateForm, setShowAssociateForm] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { list: associates = [], loading: associatesLoading } = useSelector(
    (state) => state.associate
  );

  const {
    countries,
    states,
    cities,
    loading: locationLoading,
  } = useSelector((state) => state.location);

  const { list: staffList = [], loading: staffLoading } = useSelector(
    (state) => state.staffs
  );

  // ✅ Get lead options from Redux store
  const { options: leadOptions = [], loading: leadOptionsLoading } = useSelector(
    (state) => state.leads
  );

  // ✅ Extract source options from API response
  // ✅ Extract source options from API response - FIXED VERSION
  const getSourceOptionsFromAPI = () => {
    if (!leadOptions || !Array.isArray(leadOptions)) return [];

    const sourceOptions = leadOptions
      .filter(option => option.fieldName === "source")
      .map(option => ({
        id: option._id || option.id, // Handle both _id and id
        value: option.value
      }));

    return sourceOptions;
  };

  // ✅ Get option ID for deletion - FIXED VERSION
  const getOptionId = (optionValue) => {
    const apiSourceOptions = getSourceOptionsFromAPI();
    const option = apiSourceOptions.find(opt => opt.value === optionValue);
    return option ? option.id : null;
  };
  const [dropdownOptions, setDropdownOptions] = useState({
    title: ["Mr", "Ms", "Mrs"],
    source: ["Direct", "Referral", "Agent's"],
    referralBy: [],
    agentName: [],
    assignedTo: [],
    priority: ["High", "Medium", "Low"],
    country: ["India", "USA", "Canada"],
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      mobile: "",
      alternateNumber: "",
      email: "",
      title: "Mr",
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
      source: "Direct",
      referralBy: "",
      agentName: "",
      assignedTo: "",
      note: "",
    },
    validationSchema,
    onSubmit: (values) => {
      try {
        // Format date before submission
        const formattedValues = {
          ...values,
          dob: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null,
          officialDetail: {
            businessType: values.businessType,
            priority: values.priority,
            source: values.source,
            agentName: values.agentName,
            referredBy: values.referralBy,
            assignedTo: values.assignedTo,
          },
        };
        console.log("✅ LeadForm submitted values:", formattedValues);
        if (typeof onSaveAndContinue === "function") {
          onSaveAndContinue(formattedValues);
        } else {
          navigate("/lead/leadtourform", { state: { leadData: formattedValues } });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error saving lead data",
          severity: "error",
        });
      }
    },
  });

  // ✅ Fetch lead options on component mount
  useEffect(() => {
    dispatch(getLeadOptions());
  }, [dispatch]);

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

  // ✅ Handle delete option
  const handleDeleteOption = async () => {
    if (!optionToDelete) return;

    try {
      await dispatch(deleteLeadOption(optionToDelete.id)).unwrap();
      setTimeout(() => {
        dispatch(getLeadOptions());
      }, 100);
      setSnackbar({
        open: true,
        message: `Source option "${optionToDelete.value}" deleted successfully`,
        severity: "success",
      });

      setDeleteDialogOpen(false);
      setOptionToDelete(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to delete source option: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    }
  };

  // ✅ Open delete confirmation dialog
  const handleOpenDeleteDialog = (option) => {
    setOptionToDelete(option);
    setDeleteDialogOpen(true);
  };

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

  // ✅ Updated handleAddNewValue to save to API
  const handleAddNewValue = async () => {
    if (newValue.trim() !== "") {
      try {
        // Save to API
        await dispatch(addLeadOption({
          fieldName: activeField,
          value: newValue.trim()
        })).unwrap();

        // Update local state
        setDropdownOptions((prev) => ({
          ...prev,
          [activeField]: [
            ...new Set([...(prev[activeField] || []), newValue.trim()]),
          ],
        }));

        formik.setFieldValue(activeField, newValue.trim());
        setDialogOpen(false);

        setSnackbar({
          open: true,
          message: `New ${activeField} added successfully`,
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Failed to add new ${activeField}`,
          severity: "error",
        });
      }
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
    setSnackbar({
      open: true,
      message: `New ${activeField} added successfully`,
      severity: "success",
    });
  };

  // ✅ Get source options based on business type
  const getSourceOptions = () => {
    if (formik.values.businessType === "B2C") {
      // For B2C: "Direct" + API options
      const apiSourceOptions = getSourceOptionsFromAPI();
      return [...apiSourceOptions.map(opt => opt.value)];
    }

    // For B2B: Only hardcoded options
    return ["Direct", "Referral", "Agent's"];
  };

  // ✅ Check if an option is deletable (API option)
  const isDeletableOption = (optionValue) => {
    if (formik.values.businessType !== "B2C") return false;

    const apiSourceOptions = getSourceOptionsFromAPI();
    return apiSourceOptions.some(opt => opt.value === optionValue);
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
        (name === "assignedTo" && staffLoading) ||
        (name === "source" && leadOptionsLoading)
      }
      SelectProps={{
        renderValue: (selected) => {
          // For source field in B2C, show chips for API options
          if (name === "source" && formik.values.businessType === "B2C" && selected !== "Direct") {
            return (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Chip
                  label={selected}
                  size="small"
                  onDelete={() => handleOpenDeleteDialog({
                    id: getOptionId(selected),
                    value: selected
                  })}
                  deleteIcon={<DeleteIcon />}
                />
              </Box>
            );
          }
          return selected;
        }
      }}
    >
      {name === "referralBy" && associatesLoading && (
        <MenuItem disabled>Loading associates...</MenuItem>
      )}

      {/* Show loading message for assignedTo */}
      {name === "assignedTo" && staffLoading && (
        <MenuItem disabled>Loading staff...</MenuItem>
      )}

      {/* Show loading for source API options */}
      {name === "source" && leadOptionsLoading && (
        <MenuItem disabled>Loading sources...</MenuItem>
      )}

      {/* Show normal options when not loading */}
      {!associatesLoading &&
        !staffLoading &&
        !(name === "source" && leadOptionsLoading) &&
        options.map((opt) => (
          <MenuItem
            key={opt}
            value={opt}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {opt}
            {/* Show delete icon only for API options in B2C source field */}
            {name === "source" && formik.values.businessType === "B2C" && opt !== "Direct" && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteDialog({
                    id: getOptionId(opt),
                    value: opt
                  });
                }}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}

      {/* Show "Add New" for source field in both B2B and B2C */}
      {name === "source" && (
        <MenuItem value="__add_new__">➕ Add New</MenuItem>
      )}
    </TextField>
  );

  const renderTextField = (label, name, type = "text") => (
    <TextField
      fullWidth
      label={label}
      name={name}
      type={type}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={{ mb: 2 }}
    />
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} p={2}>
      <Typography variant="h6" gutterBottom>
        Customer Detail Form
      </Typography>

      {/* Personal Details */}
      <Box border={1} borderRadius={1} p={2} mb={2} borderColor="divider">
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
            {renderTextField("Mobile *", "mobile", "tel")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Alternate Number", "alternateNumber", "tel")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderTextField("Email *", "email", "email")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date Of Birth"
                value={formik.values.dob}
                onChange={(value) => formik.setFieldValue("dob", value)}
                maxDate={dayjs()}
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
      <Box border={1} borderRadius={1} p={2} mb={2} borderColor="divider">
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
                ? states.map((s) => s.name)
                : ["No states available"]
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {renderSelectField(
              "City",
              "city",
              cities && cities.length > 0
                ? cities.map((c) => c.name)
                : ["No cities available"]
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Address & Official Detail */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Box border={1} borderRadius={1} p={2} height="100%" borderColor="divider">
            <Typography fontWeight="bold" mb={2}>
              Address
            </Typography>
            {renderTextField("Address Line1", "address1")}
            {renderTextField("Address Line2", "address2")}
            {renderTextField("Address Line3", "address3")}
            {renderTextField("Pincode", "pincode", "number")}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box border={1} borderRadius={1} p={2} borderColor="divider">
            <Typography fontWeight="bold" mb={2}>
              Official Detail
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Business Type</FormLabel>
              <RadioGroup
                row
                name="businessType"
                value={formik.values.businessType}
                onChange={(e) => {
                  formik.handleChange(e);
                  // Reset source to "Direct" when business type changes
                  if (e.target.value === "B2C") {
                    formik.setFieldValue("source", "Direct");
                  }
                }}
              >
                <FormControlLabel value="B2B" control={<Radio />} label="B2B" />
                <FormControlLabel value="B2C" control={<Radio />} label="B2C" />
              </RadioGroup>
            </FormControl>

            {renderSelectField(
              "Priority",
              "priority",
              dropdownOptions.priority
            )}

            {/* ✅ Source field with API options for B2C and hardcoded for B2B */}
            {renderSelectField("Source *", "source", getSourceOptions())}

            {/* Show Referral By only for B2B and Referral source */}
            {formik.values.businessType === "B2B" &&
              formik.values.source === "Referral" &&
              renderSelectField(
                "Referral By",
                "referralBy",
                associatesLoading
                  ? ["Loading associates..."]
                  : associates.map((a) => a.personalDetails.fullName)
              )}

            {/* Show Agent Name only for B2B and Agent's source */}
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

      {/* Buttons */}
      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="outlined"
          onClick={formik.handleReset}
          disabled={!formik.dirty}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={!formik.isValid || formik.isSubmitting}
        >
          Save & Continue
        </Button>
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
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNewValue} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Source Option</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the source option "{optionToDelete?.value}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteOption} variant="contained" color="error">
            Delete
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
        <DialogTitle>Add New {activeField}</DialogTitle>
        <DialogContent>
          <AssociateDetailForm onSave={handleAssociateSave} />
        </DialogContent>
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
    </Box>
  );
};

export default LeadForm;