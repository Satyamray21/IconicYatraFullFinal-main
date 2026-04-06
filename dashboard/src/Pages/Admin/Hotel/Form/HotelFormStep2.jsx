import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    TextField,
    MenuItem,
    Button,
    Typography,
    InputLabel,
    Select,
    FormControl,
    FormHelperText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    CircularProgress,
    Alert,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";

// ✅ Correct import
import { updateHotelStep2 } from "../../../../features/hotel/hotelSlice";
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";

const validationSchema = Yup.object().shape({
    tempRoomDetails: Yup.array().of(
        Yup.object().shape({
            seasonType: Yup.string().required("Required"),
            validFrom: Yup.date().required("Required"),
            validTill: Yup.date().required("Required"),
            roomDetails: Yup.array().of(
                Yup.object().shape({
                    roomType: Yup.string().required("Required"),
                    ep: Yup.string().required("Required"),
                    cp: Yup.string().required("Required"),
                    map: Yup.string().required("Required"),
                    ap: Yup.string().required("Required"),
                })
            ),
        })
    ),
});

const HotelFormStep2 = ({ hotelId, onNext, onBack }) => {
    const dispatch = useDispatch();
    const { options } = useSelector((state) => state.leads);
    const { loading, error } = useSelector((state) => state.hotel);

    const [openDialog, setOpenDialog] = useState(false);
    const [currentField, setCurrentField] = useState("");
    const [addMore, setAddMore] = useState("");
    const [currentIndex, setCurrentIndex] = useState(null); // ✅ ADD THIS - track which room/season index

    // ✅ UPDATED DIALOG FUNCTION
    const handleOpenDialog = (field, index = null) => {
        setCurrentField(field);
        setCurrentIndex(index);
        setAddMore("");
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentIndex(null);
    };

    // ✅ UPDATED ADD NEW ITEM FUNCTION
    const handleAddNewItem = async () => {
        if (!addMore.trim()) return;
        try {
            const newValue = addMore.trim();
            await dispatch(addLeadOption({ fieldName: currentField, value: newValue })).unwrap();
            await dispatch(getLeadOptions()).unwrap();

            // ✅ AUTOMATICALLY SET THE NEW VALUE IN FORM
            if (currentField === "seasonType") {
                // For season type
                const newRoomDetails = [...formik.values.tempRoomDetails];
                newRoomDetails[0].seasonType = newValue;
                formik.setFieldValue("tempRoomDetails", newRoomDetails);
            } else if (currentField === "roomType" && currentIndex !== null) {
                // For room type
                const newRoomDetails = [...formik.values.tempRoomDetails];
                newRoomDetails[0].roomDetails[currentIndex].roomType = newValue;
                formik.setFieldValue("tempRoomDetails", newRoomDetails);
            }

            handleCloseDialog();
        } catch (error) {
            console.error("Failed to add new option", error);
        }
    };

    const getOptionsForField = (fieldName) => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === fieldName)
            .map((opt) => ({ value: opt.value, label: opt.value }));
        return [
            ...(filteredOptions || []),
            { value: "__add_new", label: "+ Add New" },
        ];
    };

    // ✅ YE FUNCTION ADD KARO
    const getSeasonOptions = () => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === "seasonType")
            .map((opt) => opt.value);
        return [...(filteredOptions || []), "__add_new"];
    };

    // ✅ YE FUNCTION ADD KARO
    const getRoomTypeOptions = () => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === "roomType")
            .map((opt) => opt.value);
        return [...(filteredOptions || []), "__add_new"];
    };

    useEffect(() => {
        dispatch(getLeadOptions());
    }, [dispatch]);

    const formik = useFormik({
        initialValues: {
            tempRoomDetails: [{
                seasonType: "",
                validFrom: null,
                validTill: null,
                roomDetails: [
                    { roomType: "", ep: "", cp: "", map: "", ap: "" },
                ],
            }],
            roomImages: null,
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // ✅ Validate data before sending
                if (!values.tempRoomDetails || !Array.isArray(values.tempRoomDetails)) {
                    console.error("❌ Invalid tempRoomDetails format");
                    return;
                }

                console.log("🔹 Form values:", values);
                console.log("🔹 tempRoomDetails:", values.tempRoomDetails);
                console.log("🔹 Is Array:", Array.isArray(values.tempRoomDetails));

                const formData = new FormData();

                // ✅ Room details ko PROPERLY JSON mein bhejo
                const roomDataString = JSON.stringify(values.tempRoomDetails);
                console.log("🔹 JSON String:", roomDataString);

                formData.append("tempRoomDetails", roomDataString);

                // ✅ Room images add karo
                if (values.roomImages) {
                    console.log("🔹 Room images count:", values.roomImages.length);
                    Array.from(values.roomImages).forEach((file, index) => {
                        formData.append("roomImages", file);
                        console.log(`🔹 Added image ${index}:`, file.name);
                    });
                }

                // ✅ Step 2 API call
                console.log("🔹 Sending request to backend...");
                const resultAction = await dispatch(updateHotelStep2({
                    id: hotelId,
                    formData
                })).unwrap();

                console.log("✅ Room Details Updated:", resultAction);
                onNext();
            } catch (err) {
                console.error("❌ Room details update failed:", err);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleAddRoom = () => {
        const newRoomDetails = [...formik.values.tempRoomDetails];
        if (newRoomDetails.length > 0) {
            newRoomDetails[0].roomDetails.push({
                roomType: "", ep: "", cp: "", map: "", ap: ""
            });
            formik.setFieldValue("tempRoomDetails", newRoomDetails);
        }
    };

    const handleRemoveRoom = (roomIndex) => {
        const newRoomDetails = [...formik.values.tempRoomDetails];
        if (newRoomDetails.length > 0 && newRoomDetails[0].roomDetails.length > 1) {
            newRoomDetails[0].roomDetails.splice(roomIndex, 1);
            formik.setFieldValue("tempRoomDetails", newRoomDetails);
        }
    };

    // ✅ UPDATED SEASON TYPE HANDLING
    const handleSeasonTypeChange = (selectedSeasonType) => {
        if (selectedSeasonType === "__add_new") {
            handleOpenDialog("seasonType");
        } else {
            const newRoomDetails = [...formik.values.tempRoomDetails];
            newRoomDetails[0].seasonType = selectedSeasonType;
            formik.setFieldValue("tempRoomDetails", newRoomDetails);
        }
    };

    // ✅ UPDATED ROOM TYPE HANDLING
    const handleRoomTypeChange = (roomIndex, selectedRoomType) => {
        if (selectedRoomType === "__add_new") {
            handleOpenDialog("roomType", roomIndex);
        } else {
            const newRoomDetails = [...formik.values.tempRoomDetails];
            newRoomDetails[0].roomDetails[roomIndex].roomType = selectedRoomType;
            formik.setFieldValue("tempRoomDetails", newRoomDetails);
        }
    };

    return (
        <Box component="form" onSubmit={formik.handleSubmit} p={2}>
            <Typography variant="h6" gutterBottom>
                Hotel Room Details - Hotel ID: {hotelId}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Season Details */}
            <Box border={1} borderRadius={1} p={2} mb={3}>
                <Typography variant="subtitle1">Season Details</Typography>
                <Grid container spacing={2} mt={1}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small" required>
                            <InputLabel>Season Type</InputLabel>
                            <Select
                                value={formik.values.tempRoomDetails[0]?.seasonType || ""}
                                onChange={(e) => handleSeasonTypeChange(e.target.value)}
                                error={
                                    formik.touched.tempRoomDetails?.[0]?.seasonType &&
                                    Boolean(formik.errors.tempRoomDetails?.[0]?.seasonType)
                                }
                            >
                                {getSeasonOptions().map((season) => (
                                    season === "__add_new" ? (
                                        <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                            + Add New Season
                                        </MenuItem>
                                    ) : (
                                        <MenuItem key={season} value={season}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                <span>{season}</span>
                                                {options?.find(opt => opt.fieldName === "seasonType" && opt.value === season) && (
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const optionToDelete = options.find(
                                                                opt => opt.fieldName === "seasonType" && opt.value === season
                                                            );
                                                            if (optionToDelete && window.confirm(`Delete "${season}"?`)) {
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
                            {formik.touched.tempRoomDetails?.[0]?.seasonType && formik.errors.tempRoomDetails?.[0]?.seasonType && (
                                <FormHelperText error>{formik.errors.tempRoomDetails[0].seasonType}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Valid From"
                                value={formik.values.tempRoomDetails[0]?.validFrom || null}
                                onChange={(val) => formik.setFieldValue("tempRoomDetails[0].validFrom", val)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        error: formik.touched.tempRoomDetails?.[0]?.validFrom && Boolean(formik.errors.tempRoomDetails?.[0]?.validFrom),
                                        helperText: formik.touched.tempRoomDetails?.[0]?.validFrom && formik.errors.tempRoomDetails?.[0]?.validFrom
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Valid Till"
                                value={formik.values.tempRoomDetails[0]?.validTill || null}
                                onChange={(val) => formik.setFieldValue("tempRoomDetails[0].validTill", val)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        error: formik.touched.tempRoomDetails?.[0]?.validTill && Boolean(formik.errors.tempRoomDetails?.[0]?.validTill),
                                        helperText: formik.touched.tempRoomDetails?.[0]?.validTill && formik.errors.tempRoomDetails?.[0]?.validTill
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </Box>

            {/* Room Details */}
            {formik.values.tempRoomDetails[0]?.roomDetails?.map((room, roomIndex) => (
                <Box key={roomIndex} border={1} borderRadius={1} p={2} mb={3} position="relative">
                    <Typography variant="subtitle1">Room {roomIndex + 1}</Typography>
                    {roomIndex > 0 && (
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRoom(roomIndex)}
                            style={{ position: "absolute", top: 8, right: 8 }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                    <Grid container spacing={2} mt={1}>
                        <Grid size={{ xs: 12, md: 2.4 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Room Type</InputLabel>
                                <Select
                                    value={room.roomType}
                                    onChange={(e) => handleRoomTypeChange(roomIndex, e.target.value)}
                                    error={
                                        formik.touched.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.roomType &&
                                        Boolean(formik.errors.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.roomType)
                                    }
                                >
                                    {getRoomTypeOptions().map((roomType) => (
                                        roomType === "__add_new" ? (
                                            <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                                + Add New Room Type
                                            </MenuItem>
                                        ) : (
                                            <MenuItem key={roomType} value={roomType}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
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
                                {formik.touched.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.roomType &&
                                    formik.errors.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.roomType && (
                                        <FormHelperText error>
                                            {formik.errors.tempRoomDetails[0].roomDetails[roomIndex].roomType}
                                        </FormHelperText>
                                    )}
                            </FormControl>
                        </Grid>

                        {["ep", "cp", "map", "ap"].map((meal) => (
                            <Grid size={{ xs: 6, md: 2.4 }} key={meal}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={
                                        meal === "ep" ? "Room Only (EP)" :
                                            meal === "cp" ? "Breakfast (CP)" :
                                                meal === "map" ? "Breakfast + Dinner (MAP)" : "Breakfast + Lunch (AP)"
                                    }
                                    name={`tempRoomDetails[0].roomDetails[${roomIndex}].${meal}`}
                                    value={room[meal]}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                        formik.touched.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.[meal] &&
                                        Boolean(formik.errors.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.[meal])
                                    }
                                    helperText={
                                        formik.touched.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.[meal] &&
                                        formik.errors.tempRoomDetails?.[0]?.roomDetails?.[roomIndex]?.[meal]
                                    }
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}

            <Button variant="outlined" color="secondary" onClick={handleAddRoom} sx={{ mb: 2 }}>
                ➕ Add Room
            </Button>

            {/* Room Images */}
            <Box border={1} borderRadius={1} p={2} mb={3}>
                <Typography variant="subtitle1">Add Room Images</Typography>
                <Button variant="outlined" component="label" fullWidth>
                    Choose Files
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        multiple
                        onChange={(event) => formik.setFieldValue("roomImages", event.currentTarget.files)}
                    />
                </Button>
                {formik.values.roomImages && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {formik.values.roomImages.length} files selected
                    </Typography>
                )}
            </Box>

            {/* Navigation Buttons */}
            <Box display="flex" justifyContent="space-between" mt={2}>
                <Button variant="outlined" onClick={onBack}>Back</Button>
                <Button variant="contained" color="primary" type="submit" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Save & Continue"}
                </Button>
            </Box>

            {/* Add New Option Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
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

export default HotelFormStep2;