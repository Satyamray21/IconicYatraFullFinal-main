import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    IconButton,
    MenuItem,
    CircularProgress,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { Formik, Form, FieldArray } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackages } from "../../../../features/package/packageSlice";
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";

const StepPackageDetails = ({ onNext, onBack }) => {
    const dispatch = useDispatch();
    const { items: packages, loading } = useSelector((state) => state.packages);
    const { options } = useSelector((state) => state.leads);
    const [tourType, setTourType] = useState("");
    const [filteredPackages, setFilteredPackages] = useState([]);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [currentField, setCurrentField] = useState("");
    const [addMore, setAddMore] = useState("");

    useEffect(() => {
        // Fetch all packages when component mounts
        dispatch(fetchPackages());
        dispatch(getLeadOptions());
    }, [dispatch]);

    useEffect(() => {
        // Filter packages based on selected tour type
        if (tourType && packages.length > 0) {
            const filtered = packages.filter(pkg =>
                pkg.tourType?.toLowerCase() === tourType.toLowerCase()
            );
            setFilteredPackages(filtered);
        } else {
            setFilteredPackages([]);
        }
    }, [tourType, packages]);

    const handleTourTypeChange = (e, setFieldValue) => {
        const selectedTourType = e.target.value;
        setTourType(selectedTourType);
        setFieldValue("tourType", selectedTourType);
        setFieldValue("selectedPackage", ""); // Reset package selection
    };

    const handlePackageSelect = (e, setFieldValue) => {
        const selectedPackageId = e.target.value;
        setFieldValue("selectedPackage", selectedPackageId);

        const selectedPkg = packages.find(pkg => pkg._id === selectedPackageId);
        if (selectedPkg) {

            // Destinations
            if (selectedPkg.stayLocations?.length > 0) {
                const destinations = selectedPkg.stayLocations.map(loc => loc.city);
                setFieldValue("destinations", destinations);
            }

            // Days / Nights
            const totalNights = selectedPkg.stayLocations?.reduce(
                (sum, loc) => sum + (loc.nights || 0),
                0
            ) || 0;
            const totalDays = totalNights + 1;

            setFieldValue("days", totalDays);
            setFieldValue("nights", totalNights);

            // Hotel Type Auto-fill
            if (selectedPkg.destinationNights?.[0]?.hotels?.[0]?.category) {
                const hotelCategory = selectedPkg.destinationNights[0].hotels[0].category;
                const categoryMap = {
                    "standard": "3 Star",
                    "deluxe": "4 Star",
                    "superior": "5 Star",
                    "luxury": "Luxury",
                    "budget": "Budget"
                };
                setFieldValue("hotelType", categoryMap[hotelCategory] || hotelCategory);
            }

            // Meal Plan
            if (selectedPkg.mealPlan?.planType) {
                setFieldValue("mealPlan", selectedPkg.mealPlan.planType);
            }

            // Activities Auto-fill
            if (selectedPkg.days?.length > 0) {
                const activities = selectedPkg.days
                    .filter(day => day.title && day.notes)
                    .map(day => `${day.title}: ${day.notes}`);
                setFieldValue("activities", activities.length > 0 ? activities : [""]);
            }

            // Itinerary Auto-fill
            if (selectedPkg.days?.length > 0) {
                const itinerary = selectedPkg.days.map(day => ({
                    title: day.title || "",
                    description: day.notes || "",
                    activities: day.aboutCity || ""
                }));
                setFieldValue("itinerary", itinerary);
            }

            // Additional data
            setFieldValue("arrivalCity", selectedPkg.arrivalCity || "");
            setFieldValue("departureCity", selectedPkg.departureCity || "");
            setFieldValue("destinationCountry", selectedPkg.destinationCountry || "");

            // ⭐ ⭐ FETCH TRANSPORTATION FROM PACKAGE ⭐ ⭐
            setFieldValue("transportation", selectedPkg.transportation || "");

            // Total Cost
            if (selectedPkg.price) {
                setFieldValue("totalCost", selectedPkg.price.toString());
            }
        }
    };


    // ===== Add New Option Logic =====
    const handleOpenDialog = (field) => {
        setCurrentField(field);
        setAddMore("");
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleAddNewItem = async () => {
        if (!addMore.trim()) return;

        try {
            const newValue = addMore.trim();
            const backendField = currentField;

            // Add new option to lead options
            await dispatch(addLeadOption({ fieldName: backendField, value: newValue })).unwrap();

            // Fetch updated lead options from backend
            await dispatch(getLeadOptions()).unwrap();

            // If adding a new package, refresh packages list
            if (backendField === "package") {
                await dispatch(fetchPackages());
            }

            handleCloseDialog();
        } catch (error) {
            console.error("Failed to add new option", error);
        }
    };

    const getOptionsForField = (fieldName) => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === fieldName)
            .map((opt) => opt.value);

        return [
            ...(filteredOptions || []),
            "__add_new"
        ];
    };

    // Get package options for Autocomplete
    const getPackageOptions = () => {
        const packageOptions = filteredPackages.map(pkg => ({
            label: pkg.title || pkg.sector || `Package ${pkg.packageId || pkg._id}`,
            value: pkg._id,
            fieldName: "package"
        }));

        // Add lead options for packages
        const leadPackageOptions = options
            ?.filter(opt => opt.fieldName === "package")
            .map(opt => ({
                label: opt.value,
                value: opt._id, // Use the option ID as value
                fieldName: "package",
                isLeadOption: true,
                optionData: opt
            })) || [];

        return [
            ...packageOptions,
            ...leadPackageOptions,
            { label: "+ Add New Package", value: "__add_new" }
        ];
    };

    // Handle package selection from Autocomplete
    const handlePackageAutocompleteChange = (newValue, setFieldValue) => {
        if (!newValue) {
            setFieldValue("selectedPackage", "");
            return;
        }

        if (newValue.value === "__add_new") {
            handleOpenDialog("package");
        } else {
            // Check if it's a lead option or actual package
            if (newValue.isLeadOption) {
                // For lead options, just set the value and clear other fields
                setFieldValue("selectedPackage", newValue.label);
                // Clear auto-filled fields when selecting lead option
                setFieldValue("destinations", [""]);
                setFieldValue("days", "");
                setFieldValue("nights", "");
                setFieldValue("hotelType", "");
                setFieldValue("transportMode", "");
                setFieldValue("mealPlan", "");
                setFieldValue("activities", [""]);
                setFieldValue("itinerary", [{ title: "", description: "", activities: "" }]);
                setFieldValue("arrivalCity", "");
                setFieldValue("departureCity", "");
                setFieldValue("destinationCountry", "");
                setFieldValue("totalCost", ""); // Clear total cost
            } else {
                // For actual packages, use the existing handler
                handlePackageSelect(
                    { target: { value: newValue.value } },
                    setFieldValue
                );
            }
        }
    };

    // Handle delete option
    const handleDeleteOption = async (option, fieldName) => {
        if (option.isLeadOption && option.optionData) {
            if (window.confirm(`Delete "${option.label}"?`)) {
                try {
                    await dispatch(deleteLeadOption(option.optionData._id)).unwrap();
                    await dispatch(getLeadOptions()).unwrap();

                    // If deleted option was selected, clear the selection
                    if (values.selectedPackage === option.label) {
                        setFieldValue("selectedPackage", "");
                    }
                } catch (error) {
                    console.error("Failed to delete option", error);
                }
            }
        }
    };

    return (
        <Formik
            initialValues={{
                tourType: "",
                selectedPackage: "",
                destinations: [""],
                days: "",
                nights: "",
                hotelType: "",
                transportMode: "",
                mealPlan: "",
                activities: [""],
                itinerary: [{ title: "", description: "", activities: "" }],
                // Additional fields
                numberOfPax: "",
                roomType: "",
                pickupPoint: "",
                dropPoint: "",
                arrivalCity: "",
                departureCity: "",
                destinationCountry: "",
                transportation: "",
                totalCost: "" // NEW: Added total cost field
            }}
            validate={(values) => {
                const errors = {};

                if (!values.tourType) {
                    errors.tourType = "Tour Type is required";
                }

                if (!values.selectedPackage) {
                    errors.selectedPackage = "Please select a package";
                }

                // Optional: Add validation for total cost if needed
                if (values.totalCost && isNaN(values.totalCost)) {
                    errors.totalCost = "Total cost must be a valid number";
                }

                return errors;
            }}
            onSubmit={(values, { setSubmitting }) => {
                if (!values.selectedPackage) {
                    alert("Please select a package to continue");
                    setSubmitting(false);
                    return;
                }
                console.log("Package Details Submitted:", values);
                onNext({
                    packageDetails: {
                        ...values,
                        totalCost: Number(values.totalCost) || 0
                    }
                });
                setSubmitting(false);
            }}
        >
            {({ values, handleChange, setFieldValue, errors, touched, isSubmitting }) => (
                <Form>
                    <Typography variant="h6" mb={2} fontWeight={600}>
                        Package Details
                    </Typography>

                    {/* Package Selection Warning */}
                    {!values.selectedPackage && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>Important:</strong> Please select a package to auto-fill details and proceed to next step.
                        </Alert>
                    )}

                    {/* Show selected package info */}
                    {values.selectedPackage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            <strong>Package Selected:</strong> {values.selectedPackage}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Tour Type Selection */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="Tour Type *"
                                name="tourType"
                                value={values.tourType}
                                onChange={(e) => handleTourTypeChange(e, setFieldValue)}
                                error={touched.tourType && Boolean(errors.tourType)}
                                helperText={touched.tourType && errors.tourType}
                            >
                                <MenuItem value="">Select Tour Type</MenuItem>
                                <MenuItem value="Domestic">Domestic</MenuItem>
                                <MenuItem value="International">International</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Package Selection - FIXED with proper options */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                fullWidth
                                options={getPackageOptions()}
                                getOptionLabel={(option) => option.label || ""}
                                value={
                                    getPackageOptions().find(opt =>
                                        opt.value === values.selectedPackage || opt.label === values.selectedPackage
                                    ) || null
                                }
                                onChange={(e, newValue) => handlePackageAutocompleteChange(newValue, setFieldValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Package *"
                                        name="selectedPackage"
                                        error={touched.selectedPackage && Boolean(errors.selectedPackage)}
                                        helperText={touched.selectedPackage && errors.selectedPackage}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading && <CircularProgress color="inherit" size={20} />}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    if (option.value === "__add_new") {
                                        return (
                                            <li {...props} key="add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Package
                                            </li>
                                        );
                                    }

                                    return (
                                        <li
                                            {...props}
                                            key={option.value}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                width: '100%'
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {option.isLeadOption && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteOption(option, "package");
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            )}
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {/* Destinations */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Destinations
                            </Typography>
                            <FieldArray
                                name="destinations"
                                render={(arrayHelpers) => (
                                    <Box>
                                        {values.destinations && values.destinations.map((destination, index) => (
                                            <Box
                                                key={index}
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                mb={1}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={`Destination ${index + 1}`}
                                                    name={`destinations[${index}]`}
                                                    value={destination}
                                                    onChange={handleChange}
                                                    placeholder="Enter destination city"
                                                />
                                                <IconButton
                                                    color="error"
                                                    onClick={() => arrayHelpers.remove(index)}
                                                    disabled={values.destinations.length === 1}
                                                >
                                                    <Delete />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => arrayHelpers.insert(index + 1, "")}
                                                >
                                                    <Add />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            />
                        </Grid>

                        {/* Days and Nights */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Days"
                                name="days"
                                value={values.days}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Nights"
                                name="nights"
                                value={values.nights}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>

                        {/* Hotel Type - UPDATED with Add/Delete */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={getOptionsForField("hotelType")}
                                value={values.hotelType || ""}
                                onChange={(e, newValue) => {
                                    if (newValue === "__add_new") {
                                        handleOpenDialog("hotelType");
                                    } else {
                                        setFieldValue("hotelType", newValue || "");
                                    }
                                }}
                                onInputChange={(e, newValue) => {
                                    if (newValue !== "__add_new") {
                                        setFieldValue("hotelType", newValue);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Hotel Type"
                                        name="hotelType"
                                        placeholder="e.g., 3 Star, 4 Star, Luxury"
                                    />
                                )}
                                renderOption={(props, option) => {
                                    if (option === "__add_new") {
                                        return (
                                            <li {...props} key="add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Hotel Type
                                            </li>
                                        );
                                    }

                                    const optData = options?.find(
                                        (o) => o.fieldName === "hotelType" && o.value === option
                                    );

                                    return (
                                        <li
                                            {...props}
                                            key={option}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>{option}</span>
                                            {optData && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete "${option}"?`)) {
                                                            dispatch(deleteLeadOption(optData._id));
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            )}
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {/* Transport Mode - UPDATED with Add/Delete */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={getOptionsForField("transportMode")}
                                value={values.transportMode || ""}
                                onChange={(e, newValue) => {
                                    if (newValue === "__add_new") {
                                        handleOpenDialog("transportMode");
                                    } else {
                                        setFieldValue("transportMode", newValue || "");
                                    }
                                }}
                                onInputChange={(e, newValue) => {
                                    if (newValue !== "__add_new") {
                                        setFieldValue("transportMode", newValue);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Transport Mode"
                                        name="transportMode"
                                        placeholder="e.g., Car, Bus, Flight"
                                    />
                                )}
                                renderOption={(props, option) => {
                                    if (option === "__add_new") {
                                        return (
                                            <li {...props} key="add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Transport Mode
                                            </li>
                                        );
                                    }

                                    const optData = options?.find(
                                        (o) => o.fieldName === "transportMode" && o.value === option
                                    );

                                    return (
                                        <li
                                            {...props}
                                            key={option}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>{option}</span>
                                            {optData && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete "${option}"?`)) {
                                                            dispatch(deleteLeadOption(optData._id));
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            )}
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {/* Meal Plan - UPDATED with Add/Delete */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={getOptionsForField("mealPlan")}
                                value={values.mealPlan || ""}
                                onChange={(e, newValue) => {
                                    if (newValue === "__add_new") {
                                        handleOpenDialog("mealPlan");
                                    } else {
                                        setFieldValue("mealPlan", newValue || "");
                                    }
                                }}
                                onInputChange={(e, newValue) => {
                                    if (newValue !== "__add_new") {
                                        setFieldValue("mealPlan", newValue);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Meal Plan"
                                        name="mealPlan"
                                        placeholder="e.g., Breakfast, Half Board, Full Board"
                                    />
                                )}
                                renderOption={(props, option) => {
                                    if (option === "__add_new") {
                                        return (
                                            <li {...props} key="add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Meal Plan
                                            </li>
                                        );
                                    }

                                    const optData = options?.find(
                                        (o) => o.fieldName === "mealPlan" && o.value === option
                                    );

                                    return (
                                        <li
                                            {...props}
                                            key={option}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>{option}</span>
                                            {optData && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete "${option}"?`)) {
                                                            dispatch(deleteLeadOption(optData._id));
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            )}
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {/* Room Type - UPDATED with Add/Delete */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={getOptionsForField("roomType")}
                                value={values.roomType || ""}
                                onChange={(e, newValue) => {
                                    if (newValue === "__add_new") {
                                        handleOpenDialog("roomType");
                                    } else {
                                        setFieldValue("roomType", newValue || "");
                                    }
                                }}
                                onInputChange={(e, newValue) => {
                                    if (newValue !== "__add_new") {
                                        setFieldValue("roomType", newValue);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Room Type"
                                        name="roomType"
                                        placeholder="e.g., 02 Triple Sharing, Double Room"
                                    />
                                )}
                                renderOption={(props, option) => {
                                    if (option === "__add_new") {
                                        return (
                                            <li {...props} key="add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Room Type
                                            </li>
                                        );
                                    }

                                    const optData = options?.find(
                                        (o) => o.fieldName === "roomType" && o.value === option
                                    );

                                    return (
                                        <li
                                            {...props}
                                            key={option}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>{option}</span>
                                            {optData && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete "${option}"?`)) {
                                                            dispatch(deleteLeadOption(optData._id));
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            )}
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {/* Arrival City */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Arrival City"
                                name="arrivalCity"
                                value={values.arrivalCity}
                                onChange={handleChange}
                                placeholder="e.g., Mumbai"
                            />
                        </Grid>

                        {/* Departure City */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Departure City"
                                name="departureCity"
                                value={values.departureCity}
                                onChange={handleChange}
                                placeholder="e.g., Delhi"
                            />
                        </Grid>

                        {/* Destination Country */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Destination Country"
                                name="destinationCountry"
                                value={values.destinationCountry}
                                onChange={handleChange}
                                placeholder="e.g., India, Thailand"
                            />
                        </Grid>

                        {/* Number of Pax */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Number of Pax"
                                name="numberOfPax"
                                value={values.numberOfPax}
                                onChange={handleChange}
                                placeholder="e.g., 06 Adults, 01 Child"
                            />
                        </Grid>

                        {/* Activities */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Activities
                            </Typography>
                            <FieldArray
                                name="activities"
                                render={(arrayHelpers) => (
                                    <Box>
                                        {values.activities && values.activities.map((activity, index) => (
                                            <Box
                                                key={index}
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                mb={1}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label={`Activity ${index + 1}`}
                                                    name={`activities[${index}]`}
                                                    value={activity}
                                                    onChange={handleChange}
                                                    multiline
                                                    rows={2}
                                                    placeholder="Enter activity description"
                                                />
                                                <IconButton
                                                    color="error"
                                                    onClick={() => arrayHelpers.remove(index)}
                                                    disabled={values.activities.length === 1}
                                                >
                                                    <Delete />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => arrayHelpers.insert(index + 1, "")}
                                                >
                                                    <Add />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            />
                        </Grid>

                        {/* Day-wise Itinerary */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Day-wise Itinerary
                            </Typography>
                            <FieldArray
                                name="itinerary"
                                render={(arrayHelpers) => (
                                    <Box>
                                        {values.itinerary && Array.isArray(values.itinerary) && values.itinerary.map((day, index) => (
                                            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Typography variant="h6">
                                                        Day {index + 1}
                                                    </Typography>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => arrayHelpers.remove(index)}
                                                        disabled={values.itinerary.length === 1}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Day Title"
                                                            name={`itinerary[${index}].title`}
                                                            value={day?.title || ""}
                                                            onChange={handleChange}
                                                            placeholder="e.g., Arrival in Goa, Sightseeing Tour"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Day Description"
                                                            name={`itinerary[${index}].description`}
                                                            value={day?.description || ""}
                                                            onChange={handleChange}
                                                            multiline
                                                            rows={3}
                                                            placeholder="Detailed description of the day's activities"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Activities & Sightseeing"
                                                            name={`itinerary[${index}].activities`}
                                                            value={day?.activities || ""}
                                                            onChange={handleChange}
                                                            multiline
                                                            rows={2}
                                                            placeholder="Specific activities and sightseeing spots"
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}

                                        <Button
                                            variant="outlined"
                                            startIcon={<Add />}
                                            onClick={() => arrayHelpers.push({ title: "", description: "", activities: "" })}
                                            fullWidth
                                        >
                                            Add Day
                                        </Button>
                                    </Box>
                                )}
                            />
                        </Grid>

                        {/* Additional Package Details */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" mt={2} mb={2}>
                                Additional Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Pickup Point"
                                        name="pickupPoint"
                                        value={values.pickupPoint}
                                        onChange={handleChange}
                                        placeholder="e.g., Goa Airport/Railway Station"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Drop Point"
                                        name="dropPoint"
                                        value={values.dropPoint}
                                        onChange={handleChange}
                                        placeholder="e.g., Goa Airport/Railway Station"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Transportation"
                                        name="transportation"
                                        value={values.transportation}
                                        onChange={handleChange}
                                        placeholder="e.g., Innova Car/Similar"
                                    />
                                </Grid>
                                {/* NEW: Total Cost Field */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Total Cost (₹)"
                                        name="totalCost"
                                        value={values.totalCost}
                                        onChange={handleChange}
                                        placeholder="Enter total package cost"
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                                            inputProps: { min: 0, step: 0.01 }
                                        }}
                                        error={touched.totalCost && Boolean(errors.totalCost)}
                                        helperText={touched.totalCost && errors.totalCost}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Buttons */}
                    <Box mt={4} display="flex" justifyContent="space-between">
                        <Button variant="outlined" onClick={onBack}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={!values.selectedPackage || isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : "Next"}
                        </Button>
                    </Box>

                    {/* Add New Dialog */}
                    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                        <DialogTitle>Add New {currentField}</DialogTitle>
                        <DialogContent>
                            <TextField
                                fullWidth
                                autoFocus
                                margin="dense"
                                label={`New ${currentField}`}
                                value={addMore}
                                onChange={(e) => setAddMore(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddNewItem();
                                    }
                                }}
                                placeholder={`Enter new ${currentField}`}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button
                                onClick={handleAddNewItem}
                                variant="contained"
                                disabled={!addMore.trim()}
                            >
                                Add
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Form>
            )}
        </Formik>
    );
};

export default StepPackageDetails;