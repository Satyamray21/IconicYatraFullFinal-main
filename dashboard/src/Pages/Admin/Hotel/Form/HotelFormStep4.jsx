import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Box,
    TextField,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
    Grid,
    Paper,
    CircularProgress,
    Alert,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // ✅ ADD NAVIGATE
import { updateHotelStep4 } from "../../../../features/hotel/hotelSlice";
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";
import DeleteIcon from "@mui/icons-material/Delete";

const HotelFormStep4 = ({ hotelId, onBack, onClose }) => {
    const [peakCosts, setPeakCosts] = useState([]);
    const dispatch = useDispatch();
    const navigate = useNavigate(); // ✅ ADD NAVIGATE
    const { loading, error, success } = useSelector((state) => state.hotel);
    const { options } = useSelector((state) => state.leads);

    const [openDialog, setOpenDialog] = useState(false);
    const [addMore, setAddMore] = useState("");

    // ✅ Get room type options from lead options
    const getRoomTypeOptions = () => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === "roomType")
            .map((opt) => opt.value);
        return [...(filteredOptions || []), "__add_new"];
    };

    useEffect(() => {
        dispatch(getLeadOptions());
    }, [dispatch]);

    // ✅ SUCCESS EFFECT - Navigate when successful
    useEffect(() => {
        if (success && success.includes("completed")) {
            console.log("✅ Hotel completed successfully, navigating...");
            // Delay navigation to show success message
            setTimeout(() => {
                navigate("/hotel"); // ✅ Navigate to hotel list
            }, 1000);
        }
    }, [success, navigate]);

    // ✅ Handle dialog functions
    const handleOpenDialog = () => {
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
            await dispatch(addLeadOption({ fieldName: "roomType", value: newValue })).unwrap();
            await dispatch(getLeadOptions()).unwrap();

            // ✅ Automatically set the new value in the form
            formik.setFieldValue("roomType", newValue);
            handleCloseDialog();
        } catch (error) {
            console.error("Failed to add new option", error);
        }
    };

    // ✅ Handle room type change
    const handleRoomTypeChange = (selectedRoomType) => {
        if (selectedRoomType === "__add_new") {
            handleOpenDialog();
        } else {
            formik.setFieldValue("roomType", selectedRoomType);
        }
    };

    const formik = useFormik({
        initialValues: {
            roomType: "",
            title: "",
            weekendSurcharge: false,
            validFrom: null,
            validTill: null,
            surcharge: "",
            note: "",
        },
        validationSchema: Yup.object({
            roomType: Yup.string().required("Room Type is required"),
            title: Yup.string().required("Title is required"),
            validFrom: Yup.date().nullable(),
            validTill: Yup.date()
                .nullable()
                .when('validFrom', (validFrom, schema) => {
                    return validFrom ? schema.min(validFrom, "Valid Till must be after Valid From") : schema;
                }),
            surcharge: Yup.number()
                .typeError("Surcharge must be a number")
                .positive("Surcharge must be positive")
                .required("Surcharge is required"),
            note: Yup.string(),
        }),
        onSubmit: (values, { resetForm }) => {
            const newPeakCost = {
                roomType: values.roomType,
                title: values.title,
                weekendSurcharge: values.weekendSurcharge,
                validFrom: values.validFrom,
                validTill: values.validTill,
                surcharge: parseFloat(values.surcharge),
                note: values.note,
            };
            setPeakCosts([...peakCosts, newPeakCost]);
            resetForm();
        },
    });

    const handleSubmitAll = async () => {
        try {
            // ✅ Validate data before sending
            if (!peakCosts || !Array.isArray(peakCosts) || peakCosts.length === 0) {
                console.error("❌ No peak costs to submit");
                return;
            }

            console.log("🔹 Peak costs to submit:", peakCosts);

            // ✅ DIRECT JSON DATA BHEJO - FormData mat use karo
            const requestData = {
                tempPeakCost: peakCosts,
                finalSubmit: true // ✅ Mark as final submit
            };

            console.log("🔹 Sending JSON data:", requestData);

            // ✅ Step 4 API call karo with DIRECT JSON data
            const resultAction = await dispatch(updateHotelStep4({
                id: hotelId,
                data: requestData  // ✅ data parameter use karo
            }));

            // ✅ Check if request was successful
            if (updateHotelStep4.fulfilled.match(resultAction)) {
                console.log("✅ All Peak Costs Submitted:", resultAction.payload);

                // Don't clear peak costs immediately, wait for navigation
                // setPeakCosts([]); // ❌ Remove this line

                // Success message will trigger navigation via useEffect
            } else {
                console.error("❌ Peak cost submission failed:", resultAction.error);
            }
        } catch (err) {
            console.error("❌ Error submitting peak costs:", err);
        }
    };

    // Handle checkbox change (auto-fill title when checked)
    const handleWeekendChange = (event) => {
        const checked = event.target.checked;
        formik.setFieldValue("weekendSurcharge", checked);
        if (checked) {
            formik.setFieldValue("title", "Saturday-Sunday-Special");
            formik.setFieldValue("validFrom", null);
            formik.setFieldValue("validTill", null);
        } else {
            formik.setFieldValue("title", "");
        }
    };

    // Remove peak cost from list
    const removePeakCost = (index) => {
        const updatedCosts = peakCosts.filter((_, i) => i !== index);
        setPeakCosts(updatedCosts);
    };

    // Check if form is valid for adding peak cost
    const isAddButtonDisabled = !formik.isValid || !formik.values.roomType || !formik.values.title || !formik.values.surcharge;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Weekend / Seasonal Surcharge - Hotel ID: {hotelId}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Form */}
            <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                    {/* Room Type - UPDATED WITH DROPDOWN */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl
                            fullWidth
                            size="small"
                            error={formik.touched.roomType && Boolean(formik.errors.roomType)}
                        >
                            <InputLabel>Room Type *</InputLabel>
                            <Select
                                value={formik.values.roomType}
                                onChange={(e) => handleRoomTypeChange(e.target.value)}
                                onBlur={formik.handleBlur}
                                label="Room Type *"
                                name="roomType"
                            >
                                {getRoomTypeOptions().map((roomType) => (
                                    roomType === "__add_new" ? (
                                        <MenuItem
                                            key="add_new"
                                            value="__add_new"
                                            style={{ color: "#1976d2", fontWeight: 500 }}
                                        >
                                            + Add New Room Type
                                        </MenuItem>
                                    ) : (
                                        <MenuItem key={roomType} value={roomType}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                width: "100%"
                                            }}>
                                                <span>{roomType}</span>
                                                {options?.find(opt => opt.fieldName === "roomType" && opt.value === roomType) && (
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const optionToDelete = options.find(
                                                                opt => opt.fieldName === "roomType" && opt.value === roomType
                                                            );
                                                            if (optionToDelete && window.confirm(`Delete "${roomType}"?`)) {
                                                                dispatch(deleteLeadOption(optionToDelete._id));
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </div>
                                        </MenuItem>
                                    )
                                ))}
                            </Select>
                            {formik.touched.roomType && formik.errors.roomType && (
                                <FormHelperText error>
                                    {formik.errors.roomType}
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Title */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Title *"
                            name="title"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.title && Boolean(formik.errors.title)}
                            helperText={formik.touched.title && formik.errors.title}
                            placeholder="e.g., Summer Peak, Festival Surcharge"
                        />
                    </Grid>

                    {/* Weekend Checkbox */}
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.weekendSurcharge}
                                    onChange={handleWeekendChange}
                                    name="weekendSurcharge"
                                />
                            }
                            label={
                                <Typography variant="body2" color="orange">
                                    Sat–Sun (Tick the checkbox for weekend surcharge)
                                </Typography>
                            }
                        />
                    </Grid>

                    {/* Valid From / Valid Till */}
                    {!formik.values.weekendSurcharge && (
                        <>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Valid From"
                                        value={formik.values.validFrom}
                                        onChange={(date) =>
                                            formik.setFieldValue("validFrom", date)
                                        }
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: "small",
                                                error: formik.touched.validFrom && Boolean(formik.errors.validFrom),
                                                helperText: formik.touched.validFrom && formik.errors.validFrom
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Valid Till"
                                        value={formik.values.validTill}
                                        onChange={(date) =>
                                            formik.setFieldValue("validTill", date)
                                        }
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: "small",
                                                error: formik.touched.validTill && Boolean(formik.errors.validTill),
                                                helperText: formik.touched.validTill && formik.errors.validTill
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </>
                    )}

                    {/* Surcharge */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Surcharge Amount *"
                            name="surcharge"
                            type="number"
                            value={formik.values.surcharge}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.surcharge && Boolean(formik.errors.surcharge)}
                            helperText={formik.touched.surcharge && formik.errors.surcharge}
                            placeholder="0.00"
                        />
                    </Grid>

                    {/* Note */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Note (Optional)"
                            name="note"
                            value={formik.values.note}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.note && Boolean(formik.errors.note)}
                            helperText={formik.touched.note && formik.errors.note}
                            placeholder="Additional notes..."
                        />
                    </Grid>

                    {/* Add Peak Cost Button */}
                    <Grid size={{ xs: 12 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isAddButtonDisabled}
                            sx={{ mt: 2 }}
                        >
                            Add Peak Cost
                        </Button>
                    </Grid>
                </Grid>
            </form>

            {/* Peak Costs List */}
            {peakCosts.length > 0 && (
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Added Peak Cost Details ({peakCosts.length})
                    </Typography>
                    {peakCosts.map((cost, index) => (
                        <Paper key={index} sx={{ p: 2, mt: 2, position: "relative", border: '1px solid #e0e0e0' }}>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => removePeakCost(index)}
                                style={{ position: "absolute", top: 8, right: 8 }}
                            >
                                <DeleteIcon />
                            </IconButton>

                            <Typography><strong>Room Type:</strong> {cost.roomType}</Typography>
                            <Typography><strong>Title:</strong> {cost.title}</Typography>
                            {cost.validFrom && cost.validTill && (
                                <Typography>
                                    <strong>Valid:</strong>{" "}
                                    {new Date(cost.validFrom).toLocaleDateString()} -{" "}
                                    {new Date(cost.validTill).toLocaleDateString()}
                                </Typography>
                            )}
                            {cost.weekendSurcharge && (
                                <Typography><strong>Type:</strong> Weekend Surcharge</Typography>
                            )}
                            <Typography><strong>Surcharge:</strong> ₹{cost.surcharge}</Typography>
                            {cost.note && <Typography><strong>Note:</strong> {cost.note}</Typography>}
                        </Paper>
                    ))}
                </Box>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={3} gap={2}>
                <Button
                    variant="outlined"
                    onClick={onBack}
                    disabled={loading}
                >
                    Back
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmitAll}
                    disabled={loading || peakCosts.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Submitting..." : "Final Submit"}
                </Button>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={onClose}
                    disabled={loading}
                >
                    Close
                </Button>
            </Box>

            {/* Info Message */}
            {peakCosts.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Add at least one peak cost before final submission
                </Alert>
            )}

            {/* Add New Option Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Add New Room Type</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        autoFocus
                        margin="dense"
                        label="New Room Type"
                        value={addMore}
                        onChange={(e) => setAddMore(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddNewItem();
                            }
                        }}
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
        </Box>
    );
};

export default HotelFormStep4;