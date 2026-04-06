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
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { updateHotelStep3 } from "../../../../features/hotel/hotelSlice";
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";

const mealPlans = [
    { value: "EP", label: "Room Only (EP)" },
    { value: "CP", label: "Breakfast Only (CP)" },
    { value: "MAP", label: "Half Board (MAP)" },
    { value: "AP", label: "Full Board (AP)" }
];

const HotelFormStep3 = ({ hotelId, onNext, onBack }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.hotel);
    const { options } = useSelector((state) => state.leads);

    const [openDialog, setOpenDialog] = useState(false);
    const [currentField, setCurrentField] = useState("");
    const [addMore, setAddMore] = useState("");
    const [currentRoomIndex, setCurrentRoomIndex] = useState(null);

    // ✅ Dialog functions
    const handleOpenDialog = (field, roomIndex) => {
        setCurrentField(field);
        setCurrentRoomIndex(roomIndex);
        setAddMore("");
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentRoomIndex(null);
    };

    const handleAddNewItem = async () => {
        if (!addMore.trim()) return;
        try {
            const newValue = addMore.trim();
            await dispatch(addLeadOption({ fieldName: currentField, value: newValue })).unwrap();
            await dispatch(getLeadOptions()).unwrap();

            // ✅ Automatically set the new value in the form
            if (currentRoomIndex !== null) {
                const newMattressCost = [...formik.values.tempMattressCost];
                newMattressCost[currentRoomIndex].roomType = newValue;
                formik.setFieldValue("tempMattressCost", newMattressCost);
            }

            handleCloseDialog();
        } catch (error) {
            console.error("Failed to add new option", error);
        }
    };

    // ✅ Get room type options
    const getRoomTypeOptions = () => {
        const filteredOptions = options
            ?.filter((opt) => opt.fieldName === "roomType")
            .map((opt) => opt.value);
        return [...(filteredOptions || []), "__add_new"];
    };

    useEffect(() => {
        dispatch(getLeadOptions());
    }, [dispatch]);

    // ✅ Handle room type change
    const handleRoomTypeChange = (roomIndex, selectedRoomType) => {
        if (selectedRoomType === "__add_new") {
            handleOpenDialog("roomType", roomIndex);
        } else {
            const newMattressCost = [...formik.values.tempMattressCost];
            newMattressCost[roomIndex].roomType = selectedRoomType;
            formik.setFieldValue("tempMattressCost", newMattressCost);
        }
    };

    const formik = useFormik({
        initialValues: {
            tempMattressCost: [
                {
                    roomType: "",
                    mealPlan: "EP",
                    adult: "",
                    children: "",
                    kidWithoutMattress: "",
                }
            ]
        },
        validationSchema: Yup.object({
            tempMattressCost: Yup.array().of(
                Yup.object({
                    roomType: Yup.string().required("Room Type is required"),
                    mealPlan: Yup.string().required("Meal Plan is required"),
                    adult: Yup.number()
                        .typeError("Must be a number")
                        .positive("Must be positive")
                        .required("Adult cost is required"),
                    children: Yup.number()
                        .typeError("Must be a number")
                        .positive("Must be positive")
                        .required("Children cost is required"),
                    kidWithoutMattress: Yup.number()
                        .typeError("Must be a number")
                        .positive("Must be positive")
                        .required("Kid without mattress cost is required"),
                })
            ),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // ✅ Validate data before sending
                if (!values.tempMattressCost || !Array.isArray(values.tempMattressCost)) {
                    console.error("❌ Invalid tempMattressCost format");
                    return;
                }

                console.log("🔹 Form values:", values);
                console.log("🔹 tempMattressCost:", values.tempMattressCost);
                console.log("🔹 Is Array:", Array.isArray(values.tempMattressCost));

                // ✅ DIRECT JSON DATA BHEJO - FormData mat use karo
                const requestData = {
                    tempMattressCost: values.tempMattressCost
                };

                console.log("🔹 Sending JSON data:", requestData);

                // ✅ Step 3 API call karo with DIRECT JSON data
                const resultAction = await dispatch(updateHotelStep3({
                    id: hotelId,
                    data: requestData  // ✅ Yeh change important hai
                }));

                // ✅ Check if request was successful
                if (updateHotelStep3.fulfilled.match(resultAction)) {
                    console.log("✅ Mattress Cost Updated:", resultAction.payload);
                    onNext();
                } else {
                    console.error("❌ Mattress cost update failed:", resultAction.error);
                }
            } catch (err) {
                console.error("❌ Mattress cost update failed:", err);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <FormikProvider value={formik}>
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                p={2}
            >
                <Typography variant="h6" gutterBottom>
                    Mattress Cost - Hotel ID: {hotelId}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Dynamic Mattress Sections */}
                <FieldArray
                    name="tempMattressCost"
                    render={(arrayHelpers) => (
                        <Box>
                            {formik.values.tempMattressCost.map((mattress, index) => (
                                <Box
                                    key={index}
                                    border={1}
                                    borderRadius={1}
                                    p={2}
                                    mb={3}
                                    position="relative"
                                >
                                    <Typography variant="subtitle1" gutterBottom>
                                        Mattress Cost {index + 1}
                                    </Typography>

                                    {index > 0 && (
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => arrayHelpers.remove(index)}
                                            style={{ position: "absolute", top: 8, right: 8 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}

                                    <Grid container spacing={2}>
                                        {/* Room Type - UPDATED WITH DROPDOWN */}
                                        <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                                            <FormControl
                                                fullWidth
                                                size="small"
                                                error={
                                                    formik.touched.tempMattressCost?.[index]?.roomType &&
                                                    Boolean(formik.errors.tempMattressCost?.[index]?.roomType)
                                                }
                                            >
                                                <InputLabel>Room Type *</InputLabel>
                                                <Select
                                                    value={mattress.roomType}
                                                    onChange={(e) => handleRoomTypeChange(index, e.target.value)}
                                                    onBlur={formik.handleBlur}
                                                    label="Room Type *"
                                                    name={`tempMattressCost[${index}].roomType`}
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
                                                <FormHelperText error>
                                                    {formik.touched.tempMattressCost?.[index]?.roomType &&
                                                        formik.errors.tempMattressCost?.[index]?.roomType}
                                                </FormHelperText>
                                            </FormControl>
                                        </Grid>

                                        {/* Meal Plan */}
                                        <Grid size={{ xs: 12, md: 3, sm: 6 }}>
                                            <FormControl
                                                fullWidth
                                                size="small"
                                                error={
                                                    formik.touched.tempMattressCost?.[index]?.mealPlan &&
                                                    Boolean(formik.errors.tempMattressCost?.[index]?.mealPlan)
                                                }
                                            >
                                                <InputLabel>Meal Plan</InputLabel>
                                                <Select
                                                    name={`tempMattressCost[${index}].mealPlan`}
                                                    value={mattress.mealPlan}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    label="Meal Plan"
                                                >
                                                    {mealPlans.map((plan) => (
                                                        <MenuItem key={plan.value} value={plan.value}>
                                                            {plan.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                <FormHelperText>
                                                    {
                                                        formik.touched.tempMattressCost?.[index]?.mealPlan &&
                                                        formik.errors.tempMattressCost?.[index]?.mealPlan
                                                    }
                                                </FormHelperText>
                                            </FormControl>
                                        </Grid>

                                        {/* Adult Cost */}
                                        <Grid size={{ xs: 12, md: 2, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Adult Cost"
                                                name={`tempMattressCost[${index}].adult`}
                                                type="number"
                                                value={mattress.adult}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={
                                                    formik.touched.tempMattressCost?.[index]?.adult &&
                                                    Boolean(formik.errors.tempMattressCost?.[index]?.adult)
                                                }
                                                helperText={
                                                    formik.touched.tempMattressCost?.[index]?.adult &&
                                                    formik.errors.tempMattressCost?.[index]?.adult
                                                }
                                            />
                                        </Grid>

                                        {/* Children Cost */}
                                        <Grid size={{ xs: 12, md: 2, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Children Cost (6-12 yrs)"
                                                name={`tempMattressCost[${index}].children`}
                                                type="number"
                                                value={mattress.children}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={
                                                    formik.touched.tempMattressCost?.[index]?.children &&
                                                    Boolean(formik.errors.tempMattressCost?.[index]?.children)
                                                }
                                                helperText={
                                                    formik.touched.tempMattressCost?.[index]?.children &&
                                                    formik.errors.tempMattressCost?.[index]?.children
                                                }
                                            />
                                        </Grid>

                                        {/* Kid Without Mattress Cost */}
                                        <Grid size={{ xs: 12, md: 2, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Kid Without Mattress (Below 6 yrs)"
                                                name={`tempMattressCost[${index}].kidWithoutMattress`}
                                                type="number"
                                                value={mattress.kidWithoutMattress}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={
                                                    formik.touched.tempMattressCost?.[index]?.kidWithoutMattress &&
                                                    Boolean(formik.errors.tempMattressCost?.[index]?.kidWithoutMattress)
                                                }
                                                helperText={
                                                    formik.touched.tempMattressCost?.[index]?.kidWithoutMattress &&
                                                    formik.errors.tempMattressCost?.[index]?.kidWithoutMattress
                                                }
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}

                            <Button
                                type="button"
                                variant="outlined"
                                color="secondary"
                                onClick={() =>
                                    arrayHelpers.push({
                                        roomType: "",
                                        mealPlan: "EP",
                                        adult: "",
                                        children: "",
                                        kidWithoutMattress: "",
                                    })
                                }
                                sx={{ mb: 2 }}
                            >
                                ➕ Add Another Mattress Cost
                            </Button>
                        </Box>
                    )}
                />

                {/* Navigation Buttons */}
                <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                        variant="outlined"
                        onClick={onBack}
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Save & Continue"}
                    </Button>
                </Box>

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
        </FormikProvider>
    );
};

export default HotelFormStep3;