import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    TextField,
    MenuItem,
    Button,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Checkbox,
    FormControlLabel,
    CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    step4Update,
    getQuotationById,
} from "../../../../features/quotation/fullQuotationSlice";

const hotelTypes = ["5 Star", "4 Star", "3 Star", "Budget", "Guest House"];
const roomTypes = ["Single Sharing", "Double Sharing", "Triple Sharing"];
const mealPlans = ["Breakfast Only", "Half Board", "Full Board"];

const initialHotelNames = [
    "Hotel Sea View",
    "Hotel Coral Reef",
    "Hotel Blue Lagoon",
    "Hotel Ocean Breeze",
];

const emptyAccommodationPlan = {
    hotelType: "",
    hotelName: "",
    roomType: "",
    mealPlan: "",
    noNights: "1",
    noOfRooms: "1",
    mattressForAdult: false,
    adultExBed: false,
    mattressForChildren: false,
    adultExMattress: "",
    adultExCost: "",
    childrenExMattress: "",
    childrenExCost: "",
    withoutMattress: false,
    withoutBedCost: "",
    costNight: "",
    totalCost: "",
};

const FullQuotationStep4 = ({ quotationId, quotation, onNextStep, onPrevStep }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { fetchLoading, loading } = useSelector(
        (state) => state.fullQuotation
    );

    const [hotelNames, setHotelNames] = useState(initialHotelNames);
    const [openDialog, setOpenDialog] = useState(false);
    const [newHotelName, setNewHotelName] = useState("");
    const [initialized, setInitialized] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Get accommodation and client details from quotation
    const accommodationData = quotation?.accommodation;
    const clientDetails = quotation?.clientDetails;
    const members = clientDetails?.members || {
        adults: 0,
        children: 0,
        kidsWithoutMattress: 0,
        infants: 0
    };

    // Calculate room requirements based on members and accommodation data
    const calculateRecommendedRooms = () => {
        // Use accommodation.noOfRooms if available, otherwise calculate from members
        if (accommodationData?.noOfRooms) {
            return {
                recommendedRooms: accommodationData.noOfRooms.toString(),
                totalPeople: members.adults + members.children,
                adults: members.adults,
                children: members.children,
                hotelType: accommodationData.hotelType?.[0] || "",
                mealPlan: accommodationData.mealPlan || "",
                sharingType: accommodationData.sharingType || "Double Sharing"
            };
        }

        const { adults, children } = members;
        const totalPeople = adults + children;
        const recommendedRooms = Math.ceil(totalPeople / 2);

        return {
            recommendedRooms: recommendedRooms.toString(),
            totalPeople,
            adults,
            children,
            hotelType: accommodationData?.hotelType?.[0] || "",
            mealPlan: accommodationData?.mealPlan || "",
            sharingType: accommodationData?.sharingType || "Double Sharing"
        };
    };

    const roomInfo = calculateRecommendedRooms();

    // Initialize form when quotation data is available
    useEffect(() => {
        if (quotation?.stayLocation?.length > 0 && !initialized && !fetchLoading) {
            console.log("Initializing form with accommodation data:", roomInfo);

            const initializedStayLocation = quotation.stayLocation.map((loc, i) => {
                // Get existing accommodation data for this location if available
                const existingStandard = loc.standard || {};
                const existingDeluxe = loc.deluxe || {};
                const existingSuperior = loc.superior || {};

                return {
                    city: loc.city || `City ${i + 1}`,
                    order: loc.order || i + 1,
                    nights: loc.nights || 1,
                    standard: {
                        ...emptyAccommodationPlan,
                        noNights: (loc.nights || 1).toString(),
                        noOfRooms: existingStandard.noOfRooms || roomInfo.recommendedRooms,
                        hotelType: existingStandard.hotelType || roomInfo.hotelType,
                        mealPlan: existingStandard.mealPlan || roomInfo.mealPlan,
                        roomType: existingStandard.roomType || roomInfo.sharingType,
                        ...existingStandard
                    },
                    deluxe: {
                        ...emptyAccommodationPlan,
                        noNights: (loc.nights || 1).toString(),
                        noOfRooms: existingDeluxe.noOfRooms || roomInfo.recommendedRooms,
                        hotelType: existingDeluxe.hotelType || roomInfo.hotelType,
                        mealPlan: existingDeluxe.mealPlan || roomInfo.mealPlan,
                        roomType: existingDeluxe.roomType || roomInfo.sharingType,
                        ...existingDeluxe
                    },
                    superior: {
                        ...emptyAccommodationPlan,
                        noNights: (loc.nights || 1).toString(),
                        noOfRooms: existingSuperior.noOfRooms || roomInfo.recommendedRooms,
                        hotelType: existingSuperior.hotelType || roomInfo.hotelType,
                        mealPlan: existingSuperior.mealPlan || roomInfo.mealPlan,
                        roomType: existingSuperior.roomType || roomInfo.sharingType,
                        ...existingSuperior
                    },
                };
            });

            formik.setValues({
                stayLocation: initializedStayLocation,
            });
            setInitialized(true);
            toast.success("Accommodation form initialized with existing data");
        }
    }, [quotation, fetchLoading]);

    // Formik configuration
    const formik = useFormik({
        initialValues: { stayLocation: [] },
        enableReinitialize: false,
        onSubmit: async (values) => {
            if (!quotationId || quotationId === "new") {
                toast.error("Quotation ID is missing!");
                return;
            }

            if (!values.stayLocation?.length) {
                toast.error("Please complete Step 2 before filling accommodations.");
                return;
            }

            setSubmitting(true);
            try {
                const res = await dispatch(
                    step4Update({ quotationId, stayLocation: values.stayLocation })
                );
                if (step4Update.fulfilled.match(res)) {
                    toast.success("Accommodation details saved successfully!");
                    onNextStep();
                } else {
                    toast.error(
                        res.payload?.message || "Failed to save accommodation details"
                    );
                }
            } catch (err) {
                console.error(err);
                toast.error("Unexpected error while saving");
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Calculate total cost
    const calculateTotalCost = (cityIndex, category) => {
        const loc = formik.values.stayLocation[cityIndex];
        if (!loc) return;
        const plan = loc[category];

        // Convert empty strings to 0 for calculation
        const costNight = parseFloat(plan.costNight) || 0;
        const noOfRooms = parseFloat(plan.noOfRooms) || 0;
        const nights = parseFloat(loc.nights) || 1;
        const adultExCost = parseFloat(plan.adultExCost) || 0;
        const adultExMattress = parseFloat(plan.adultExMattress) || 0;
        const childrenExCost = parseFloat(plan.childrenExCost) || 0;
        const childrenExMattress = parseFloat(plan.childrenExMattress) || 0;
        const withoutBedCost = parseFloat(plan.withoutBedCost) || 0;

        const total =
            costNight * noOfRooms * nights +
            adultExCost * adultExMattress +
            childrenExCost * childrenExMattress +
            withoutBedCost;

        formik.setFieldValue(
            `stayLocation[${cityIndex}].${category}.totalCost`,
            total > 0 ? total.toString() : ""
        );
    };

    // Auto-calculate when dependencies change
    useEffect(() => {
        if (initialized && formik.values.stayLocation.length > 0) {
            formik.values.stayLocation.forEach((_, cityIndex) => {
                ['standard', 'deluxe', 'superior'].forEach(category => {
                    calculateTotalCost(cityIndex, category);
                });
            });
        }
    }, [formik.values]);

    const handleAddHotel = () => {
        if (newHotelName.trim()) {
            setHotelNames([...hotelNames, newHotelName.trim()]);
            toast.success("Hotel added successfully!");
            setNewHotelName("");
            setOpenDialog(false);
        }
    };

    // Auto-fill all fields based on accommodation data
    const handleAutoFillAll = () => {
        if (!formik.values.stayLocation.length) {
            toast.error("No stay locations available to auto-fill");
            return;
        }

        // Normalize hotel type casing and ensure valid options
        let normalizedHotelType = "";
        if (roomInfo.hotelType) {
            normalizedHotelType =
                hotelTypes.find(
                    (type) => type.toLowerCase() === roomInfo.hotelType.toLowerCase()
                ) || hotelTypes[0];
        }

        // Normalize meal plan similarly
        let normalizedMealPlan = "";
        if (roomInfo.mealPlan) {
            normalizedMealPlan =
                mealPlans.find(
                    (plan) => plan.toLowerCase() === roomInfo.mealPlan.toLowerCase()
                ) || mealPlans[0];
        }

        const updatedStayLocation = formik.values.stayLocation.map((loc) => ({
            ...loc,
            standard: {
                ...loc.standard,
                noOfRooms: roomInfo.recommendedRooms,
                noNights: loc.nights?.toString() || "1", // ✅ update based on city
                hotelType: normalizedHotelType,
                mealPlan: normalizedMealPlan,
                roomType: roomInfo.sharingType,
            },
            deluxe: {
                ...loc.deluxe,
                noOfRooms: roomInfo.recommendedRooms,
                noNights: loc.nights?.toString() || "1",
                hotelType: normalizedHotelType,
                mealPlan: normalizedMealPlan,
                roomType: roomInfo.sharingType,
            },
            superior: {
                ...loc.superior,
                noOfRooms: roomInfo.recommendedRooms,
                noNights: loc.nights?.toString() || "1",
                hotelType: normalizedHotelType,
                mealPlan: normalizedMealPlan,
                roomType: roomInfo.sharingType,
            },
        }));

        formik.setValues({ stayLocation: updatedStayLocation });
        toast.success("Auto-filled accommodation details for all cities!");
    };


    // Handle numeric input - allow empty, 0, and positive numbers
    const handleNumericInput = (e, cityIndex, category) => {
        const { name, value } = e.target;

        // Allow empty string, 0, or positive numbers
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            formik.setFieldValue(name, value);

            // Only calculate total if it's a cost-related field
            if (name.includes('costNight') || name.includes('ExCost') || name.includes('withoutBedCost') || name.includes('noOfRooms')) {
                setTimeout(() => calculateTotalCost(cityIndex, category), 100);
            }
        }
    };

    // Render accommodation plan
    const renderAccommodationPlan = (label, category, cityIndex) => {
        const loc = formik.values.stayLocation[cityIndex];
        const plan = loc[category] || {};

        return (
            <Paper sx={{ p: 2, bgcolor: "#fafafa" }} variant="outlined">
                <Typography variant="subtitle1" gutterBottom color="primary">
                    {label}
                </Typography>
                <Grid container spacing={1.5}>
                    {/* Hotel Type */}
                    <Grid size={12}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Hotel Type"
                            name={`stayLocation[${cityIndex}].${category}.hotelType`}
                            value={plan.hotelType || ""}
                            onChange={formik.handleChange}
                        >
                            {hotelTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Hotel Name */}
                    <Grid size={12}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Hotel Name"
                            name={`stayLocation[${cityIndex}].${category}.hotelName`}
                            value={plan.hotelName || ""}
                            onChange={(e) => {
                                if (e.target.value === "add_new") setOpenDialog(true);
                                else formik.handleChange(e);
                            }}
                        >
                            {hotelNames.map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))}
                            <MenuItem value="add_new" sx={{ color: "blue", fontWeight: "bold" }}>
                                + Add New Hotel
                            </MenuItem>
                        </TextField>
                    </Grid>

                    {/* Room Type */}
                    <Grid size={12}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Room Type"
                            name={`stayLocation[${cityIndex}].${category}.roomType`}
                            value={plan.roomType || ""}
                            onChange={formik.handleChange}
                        >
                            {roomTypes.map((r) => (
                                <MenuItem key={r} value={r}>
                                    {r}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Meal Plan */}
                    <Grid size={12}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Meal Plan"
                            name={`stayLocation[${cityIndex}].${category}.mealPlan`}
                            value={plan.mealPlan || ""}
                            onChange={formik.handleChange}
                        >
                            {mealPlans.map((mp) => (
                                <MenuItem key={mp} value={mp}>
                                    {mp}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Nights & Rooms */}
                    <Grid size={6}>
                        <TextField
                            fullWidth
                            size="small"
                            label="No of Nights"
                            name={`stayLocation[${cityIndex}].${category}.noNights`}
                            value={plan.noNights || ""}
                            onChange={(e) => handleNumericInput(e, cityIndex, category)}
                            placeholder="Enter nights"
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextField
                            fullWidth
                            size="small"
                            label="No of Rooms"
                            name={`stayLocation[${cityIndex}].${category}.noOfRooms`}
                            value={plan.noOfRooms || ""}
                            onChange={(e) => handleNumericInput(e, cityIndex, category)}
                            placeholder="Enter rooms"
                        />
                    </Grid>

                    {/* Cost/Night */}
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Cost per Night (₹)"
                            name={`stayLocation[${cityIndex}].${category}.costNight`}
                            value={plan.costNight || ""}
                            onChange={(e) => handleNumericInput(e, cityIndex, category)}
                            placeholder="Enter cost per night"
                        />
                    </Grid>

                    <Grid size={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2">Extra Bed / Mattress Options</Typography>
                    </Grid>

                    {/* Checkboxes */}
                    {[
                        ["mattressForAdult", "Mattress For Adult"],
                        ["adultExBed", "Adult Extra Bed"],
                        ["mattressForChildren", "Mattress For Children"],
                        ["withoutMattress", "Without Mattress"],
                    ].map(([key, label]) => (
                        <Grid size={12} key={key}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name={`stayLocation[${cityIndex}].${category}.${key}`}
                                        checked={plan[key] || false}
                                        onChange={formik.handleChange}
                                    />
                                }
                                label={label}
                            />
                        </Grid>
                    ))}

                    {/* Extra Costs */}
                    {[
                        ["adultExMattress", "Adult Ex Mattress Qty"],
                        ["adultExCost", "Adult Ex Cost (₹)"],
                        ["childrenExMattress", "Child Ex Mattress Qty"],
                        ["childrenExCost", "Child Ex Cost (₹)"],
                        ["withoutBedCost", "Without Bed Cost (₹)"],
                    ].map(([key, label]) => (
                        <Grid size={12} key={key}>
                            <TextField
                                fullWidth
                                size="small"
                                label={label}
                                name={`stayLocation[${cityIndex}].${category}.${key}`}
                                value={plan[key] || ""}
                                onChange={(e) => handleNumericInput(e, cityIndex, category)}
                                placeholder="Enter amount"
                            />
                        </Grid>
                    ))}

                    {/* Total */}
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Total Cost (₹)"
                            name={`stayLocation[${cityIndex}].${category}.totalCost`}
                            value={plan.totalCost || ""}
                            InputProps={{ readOnly: true }}
                            sx={{ "& input": { fontWeight: "bold", color: "primary.main" } }}
                            placeholder="Will calculate automatically"
                        />
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    // Render city accommodation
    const renderCityAccommodation = (city, i) => (
        <Paper sx={{ p: 3, mb: 3 }} variant="outlined" key={i}>
            <Typography variant="h6" gutterBottom>
                {city.city} – {city.nights} Night(s)
            </Typography>
            <Grid container spacing={2}>
                <Grid size={12} md={4}>
                    {renderAccommodationPlan("Standard", "standard", i)}
                </Grid>
                <Grid size={12} md={4}>
                    {renderAccommodationPlan("Deluxe", "deluxe", i)}
                </Grid>
                <Grid size={12} md={4}>
                    {renderAccommodationPlan("Superior", "superior", i)}
                </Grid>
            </Grid>
        </Paper>
    );

    // Loading state
    if (fetchLoading && !initialized) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="50vh"
                flexDirection="column"
            >
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading accommodation details...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Step 4: Accommodation Details
            </Typography>

            {/* Client Members Summary */}
            {clientDetails && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="h6" gutterBottom>
                        Client: {clientDetails.clientName} | Tour: {clientDetails.tourType} - {clientDetails.sector}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size="auto">
                            <Typography><strong>Adults:</strong> {members.adults}</Typography>
                        </Grid>
                        <Grid size="auto">
                            <Typography><strong>Children:</strong> {members.children}</Typography>
                        </Grid>
                        <Grid size="auto">
                            <Typography><strong>Kids without Mattress:</strong> {members.kidsWithoutMattress}</Typography>
                        </Grid>
                        <Grid size="auto">
                            <Typography><strong>Infants:</strong> {members.infants}</Typography>
                        </Grid>
                        <Grid size="auto">
                            <Typography><strong>Recommended Rooms:</strong> {roomInfo.recommendedRooms} ({roomInfo.sharingType})</Typography>
                        </Grid>
                        {roomInfo.hotelType && (
                            <Grid size="auto">
                                <Typography><strong>Hotel Type:</strong> {roomInfo.hotelType}</Typography>
                            </Grid>
                        )}
                        {roomInfo.mealPlan && (
                            <Grid size="auto">
                                <Typography><strong>Meal Plan:</strong> {roomInfo.mealPlan}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            )}

            {!initialized ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="textSecondary" variant="h6">
                        Please complete Step 2 to add stay locations.
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/fullquotation/${quotationId}/step/2`)}
                    >
                        Go to Step 2
                    </Button>
                </Paper>
            ) : (
                <form onSubmit={formik.handleSubmit}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography color="textSecondary">
                            Configure accommodation details for each city in your quotation.
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleAutoFillAll}
                            disabled={submitting}
                        >
                            Auto-fill All Details
                        </Button>
                    </Box>

                    {formik.values.stayLocation.map((city, i) =>
                        renderCityAccommodation(city, i)
                    )}

                    <Box
                        mt={4}
                        display="flex"
                        justifyContent="center"
                        gap={2}
                        textAlign="center"
                    >
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={onPrevStep}
                            disabled={submitting}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={submitting || loading}
                        >
                            {submitting ? "Saving..." : "Save & Continue → Step 5"}
                        </Button>
                    </Box>
                </form>
            )}

            {/* Add Hotel Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Add New Hotel</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Hotel Name"
                        autoFocus
                        margin="dense"
                        value={newHotelName}
                        onChange={(e) => setNewHotelName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddHotel()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddHotel}
                        disabled={!newHotelName.trim()}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FullQuotationStep4;