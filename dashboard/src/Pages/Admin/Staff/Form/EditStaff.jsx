import React, { useState, useEffect } from "react";
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
    Avatar,
    IconButton,
    CircularProgress,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import { fetchStaffById, updateStaff, clearSelectedStaff } from "../../../../features/staff/staffSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

import {
    fetchCountries,
    fetchStatesByCountry,
    fetchCitiesByState,
    clearStates,
    clearCities,
} from "../../../../features/location/locationSlice";
import { useParams } from "react-router-dom";

// -------- Dropdown data ----------
const titles = ["Mr", "Mrs", "Ms", "Dr"];
const roles = ["Admin", "Manager", "Executive"];
const designations = ["Senior Manager", "Manager", "Executive", "Associate", "Senior Developer", "Junior Developer"];

// -------- Validation schema ----------
const validationSchema = Yup.object({
    title: Yup.string(),
    fullName: Yup.string().required("Full name is required"),
    mobile: Yup.string()
        .required("Mobile number is required")
        .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
    alternateContact: Yup.string().matches(/^[0-9]{10}$/, "Alternate contact must be 10 digits"),
    designation: Yup.string().required("Designation is required"),
    userRole: Yup.string().required("User role is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    aadharNumber: Yup.string()
        .required("Aadhar number is required")
        .matches(/^[0-9]{12}$/, "Aadhar number must be 12 digits"),
    panNumber: Yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format"),
    dob: Yup.date().nullable(),
    country: Yup.string().required("Country is required"),
    state: Yup.string().required("State is required"),
    city: Yup.string().required("City is required"),
    address1: Yup.string(),
    address2: Yup.string(),
    address3: Yup.string(),
    pincode: Yup.string(),
    bankName: Yup.string(),
    branchName: Yup.string(),
    accountHolderName: Yup.string(),
    accountNumber: Yup.string(),
    ifscCode: Yup.string(),
});

const StaffEditForm = () => {
    const { staffId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { selected: staff, loading, updating } = useSelector((state) => state.staffs);

    const {
        countries: countriesData,
        states: statesData,
        cities: citiesData,
        loading: locationLoading,
    } = useSelector((state) => state.location);

    const [photoPreviews, setPhotoPreviews] = useState({
        staffPhoto: null,
        aadharPhoto: null,
        panPhoto: null,
    });

    // Fetch staff data
    useEffect(() => {
        if (staffId) {
            dispatch(fetchStaffById(staffId));
        }
        // Cleanup on unmount
        return () => {
            dispatch(clearSelectedStaff());
        };
    }, [dispatch, staffId]);

    // Fetch countries
    useEffect(() => {
        dispatch(fetchCountries());
    }, [dispatch]);

    // Set photo previews when staff data is loaded
    useEffect(() => {
        if (staff) {
            setPhotoPreviews({
                staffPhoto: staff?.staffPhotoUrl || null,
                aadharPhoto: staff?.aadharPhotoUrl || null,
                panPhoto: staff?.panPhotoUrl || null,
            });
        }
    }, [staff]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            title: staff?.title || "",
            fullName: staff?.fullName || "",
            mobile: staff?.mobile || "",
            alternateContact: staff?.alternateContact || "",
            designation: staff?.designation || "",
            userRole: staff?.userRole || "",
            email: staff?.email || "",
            aadharNumber: staff?.aadharNumber || "",
            panNumber: staff?.panNumber || "",
            dob: staff?.dob || null,
            country: staff?.country || "",
            state: staff?.state || "",
            city: staff?.city || "",
            address1: staff?.address1 || "",
            address2: staff?.address2 || "",
            address3: staff?.address3 || "",
            pincode: staff?.pincode || "",
            bankName: staff?.bankName || "",
            branchName: staff?.branchName || "",
            accountHolderName: staff?.accountHolderName || "",
            accountNumber: staff?.accountNumber || "",
            ifscCode: staff?.ifscCode || "",
            staffPhoto: null,
            aadharPhoto: null,
            panPhoto: null,
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            const toastId = toast.loading("Updating staff details...");
            
            try {
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
                
                // Append photos only if new files are selected
                if (values.staffPhoto instanceof File) {
                    formData.append("staffPhoto", values.staffPhoto);
                }
                if (values.aadharPhoto instanceof File) {
                    formData.append("aadharPhoto", values.aadharPhoto);
                }
                if (values.panPhoto instanceof File) {
                    formData.append("panPhoto", values.panPhoto);
                }

                await dispatch(updateStaff({ id: staffId, data: formData })).unwrap();

                toast.update(toastId, {
                    render: "✅ Staff details updated successfully!",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });

                // Navigate after toast
                setTimeout(() => {
                    navigate("/staff");
                }, 2000);
                
            } catch (error) {
                toast.update(toastId, {
                    render: error?.message || "❌ Failed to update staff. Please try again.",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                console.error("Update error:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const { values, errors, touched, handleChange, setFieldValue, isSubmitting } = formik;

    // Load states for the current country. Do not clear state/city here — that runs on
    // every mount when staff hydrates country and would wipe loaded staffLocation values.
    // Clearing when the user changes country is handled on the Country Select onChange.
    useEffect(() => {
        if (values.country) {
            dispatch(fetchStatesByCountry(values.country));
        } else {
            dispatch(clearStates());
            dispatch(clearCities());
        }
    }, [values.country, dispatch]);

    // Fetch cities when state changes
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography ml={2}>Loading staff data...</Typography>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h6" gutterBottom>
                Edit Staff Details
            </Typography>

            <form onSubmit={formik.handleSubmit}>
                {/* Personal Details Section */}
                <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                        Staff's Personal Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Title</InputLabel>
                                <Select 
                                    name="title" 
                                    value={values.title} 
                                    onChange={handleChange}
                                    label="Title"
                                >
                                    {titles.map((title) => (
                                        <MenuItem key={title} value={title}>
                                            {title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Designation</InputLabel>
                                <Select
                                    name="designation"
                                    value={values.designation}
                                    onChange={handleChange}
                                    label="Designation"
                                    error={touched.designation && Boolean(errors.designation)}
                                >
                                    {designations.map((designation) => (
                                        <MenuItem key={designation} value={designation}>
                                            {designation}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth required error={touched.userRole && Boolean(errors.userRole)}>
                                <InputLabel>User Role</InputLabel>
                                <Select
                                    name="userRole"
                                    value={values.userRole}
                                    onChange={handleChange}
                                    label="User Role"
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role} value={role}>
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                name="email"
                                label="Email"
                                fullWidth
                                required
                                value={values.email}
                                onChange={handleChange}
                                error={touched.email && Boolean(errors.email)}
                                helperText={touched.email && errors.email}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 3 }}>
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
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="body2" gutterBottom>Staff Photo</Typography>
                                <Box position="relative" display="inline-block">
                                    <Avatar src={photoPreviews.staffPhoto} sx={{ width: 120, height: 120, mb: 1 }}>
                                        {!photoPreviews.staffPhoto && "Staff"}
                                    </Avatar>
                                    {photoPreviews.staffPhoto && (
                                        <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'white' }}
                                            onClick={() => handleRemovePhoto('staffPhoto')}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />} sx={{ mt: 1 }}>
                                    {photoPreviews.staffPhoto ? "Change" : "Upload"}
                                    <input hidden type="file" accept="image/*" onChange={(e) => handlePhotoChange('staffPhoto', e)} />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="body2" gutterBottom>Aadhar Photo</Typography>
                                <Box position="relative" display="inline-block">
                                    <Avatar src={photoPreviews.aadharPhoto} sx={{ width: 120, height: 120, mb: 1 }}>
                                        {!photoPreviews.aadharPhoto && "Aadhar"}
                                    </Avatar>
                                    {photoPreviews.aadharPhoto && (
                                        <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'white' }}
                                            onClick={() => handleRemovePhoto('aadharPhoto')}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />} sx={{ mt: 1 }}>
                                    {photoPreviews.aadharPhoto ? "Change" : "Upload"}
                                    <input hidden type="file" accept="image/*" onChange={(e) => handlePhotoChange('aadharPhoto', e)} />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="body2" gutterBottom>PAN Photo</Typography>
                                <Box position="relative" display="inline-block">
                                    <Avatar src={photoPreviews.panPhoto} sx={{ width: 120, height: 120, mb: 1 }}>
                                        {!photoPreviews.panPhoto && "PAN"}
                                    </Avatar>
                                    {photoPreviews.panPhoto && (
                                        <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'white' }}
                                            onClick={() => handleRemovePhoto('panPhoto')}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />} sx={{ mt: 1 }}>
                                    {photoPreviews.panPhoto ? "Change" : "Upload"}
                                    <input hidden type="file" accept="image/*" onChange={(e) => handlePhotoChange('panPhoto', e)} />
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Location Section */}
                <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
                    <Typography variant="subtitle1" gutterBottom>Staff's Location</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required>
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
                                    {renderSelectOptions(countriesData?.map((c) => c.name), "Loading countries...")}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required>
                                <InputLabel>State</InputLabel>
                                <Select
                                    name="state"
                                    value={values.state}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setFieldValue("city", "");
                                    }}
                                    disabled={!values.country}
                                    label="State"
                                >
                                    {renderSelectOptions(statesData?.map((s) => s.name), "Loading states...")}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required>
                                <InputLabel>City</InputLabel>
                                <Select
                                    name="city"
                                    value={values.city}
                                    onChange={handleChange}
                                    disabled={!values.state}
                                    label="City"
                                >
                                    {renderSelectOptions(citiesData?.map((c) => c.name), "Loading cities...")}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {/* Address Section */}
                <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
                    <Typography variant="subtitle1" gutterBottom>Address</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField name="address1" label="Address Line 1" fullWidth value={values.address1} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField name="address2" label="Address Line 2" fullWidth value={values.address2} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="address3" label="Address Line 3" fullWidth value={values.address3} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="pincode" label="Pincode" fullWidth value={values.pincode} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>

                {/* Bank Details Section */}
                <Box border={1} borderColor="divider" borderRadius={2} p={2} mb={3}>
                    <Typography variant="subtitle1" gutterBottom>Bank Details (Optional)</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Name of Bank" name="bankName" value={values.bankName} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Branch Name" name="branchName" value={values.branchName} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Account Holder Name" name="accountHolderName" value={values.accountHolderName} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Account Number" name="accountNumber" value={values.accountNumber} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="IFSC Code" name="ifscCode" value={values.ifscCode} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>

                <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={updating || isSubmitting}
                        size="large"
                    >
                        {updating || isSubmitting ? "Updating..." : "Save Changes"}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default StaffEditForm;