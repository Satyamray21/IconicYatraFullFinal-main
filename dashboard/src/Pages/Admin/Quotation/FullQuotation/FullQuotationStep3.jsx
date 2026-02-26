import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Typography, Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { step3Update } from "../../../../features/quotation/fullQuotationSlice";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { toast } from "react-toastify";

// Yup schema (image optional)
const daySchema = Yup.object({
    title: Yup.string().required("Required"),
    itineraryDetails: Yup.string().required("Required"),
    aboutCity: Yup.string().required("Required"),
    dayImage: Yup.mixed(),
});

const FullQuotationStep3 = ({ quotationId, stayLocation, quotation }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [days, setDays] = useState([]);

    // Generate days automatically: totalDays = totalNights + 1
    useEffect(() => {
        if (!stayLocation || stayLocation.length === 0) return;

        const totalNights = stayLocation.reduce((sum, loc) => sum + loc.nights, 0);
        const totalDays = totalNights + 1;

        const generatedDays = Array.from({ length: totalDays }, (_, i) => {
            let currentDay = i + 1;
            let accumulatedNights = 0;
            let locationName = "Unknown Location";

            // Find which location this day belongs to
            for (const loc of stayLocation) {
                if (currentDay <= accumulatedNights + loc.nights) {
                    locationName = loc.city;
                    break;
                }
                accumulatedNights += loc.nights;
            }

            // For Day 1, pre-fill with arrival data
            const isDay1 = currentDay === 1;

            return {
                title: `Day ${currentDay}`,
                itineraryDetails: "",
                aboutCity: "",
                dayImage: null,
                locationName,
                dayNumber: currentDay,
                // Only include travel fields for Day 1
                ...(isDay1 && {
                    arrivalAt: quotation?.pickupDrop?.arrivalLocation || "",
                    driveTo: stayLocation[0]?.city || "",
                    distance: "",
                    duration: ""
                })
            };
        });

        setDays(generatedDays);
    }, [stayLocation, quotation]);

    const handleChange = (index, field, value) => {
        setDays((prev) =>
            prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
        );
    };

    const handleSave = async () => {
        try {
            // Validate each day
            await Promise.all(days.map((day) => daySchema.validate(day)));

            const resultAction = await dispatch(step3Update({
                quotationId,
                days
            }));

            if (step3Update.fulfilled.match(resultAction)) {
                toast.success("Step 3 saved successfully!");
                navigate(`/fullquotation/${quotationId}/step/4`);
            } else {
                toast.error("Failed to save Step 3");
            }
        } catch (err) {
            toast.error(`Validation Error: ${err.message}`);
        }
    };

    return (
        <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3, mt: 2, maxWidth: 900, mx: "auto" }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
                Quotation Itinerary
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3}>
                Total Days: {days.length} (Automatically generated from {stayLocation?.reduce((sum, loc) => sum + loc.nights, 0)} nights)
            </Typography>

            {days.map((day, index) => (
                <Box key={index} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                        {day.title} - {day.locationName}
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Show travel fields only for Day 1 */}
                        {day.dayNumber === 1 && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Arrival At"
                                        placeholder="e.g., Bagdogra Airport"
                                        value={day.arrivalAt}
                                        onChange={(e) => handleChange(index, "arrivalAt", e.target.value)}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Drive To"
                                        placeholder="First city destination"
                                        value={day.driveTo}
                                        onChange={(e) => handleChange(index, "driveTo", e.target.value)}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Distance (Km)"
                                        placeholder="e.g., 120"
                                        value={day.distance}
                                        onChange={(e) => handleChange(index, "distance", e.target.value)}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Duration (HH:MM)"
                                        placeholder="e.g., 04:30"
                                        value={day.duration}
                                        onChange={(e) => handleChange(index, "duration", e.target.value)}
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid size={{ x: 12 }}>
                            <TextField
                                fullWidth
                                label="Itinerary Details"
                                multiline
                                rows={4}
                                placeholder="Describe the day's activities"
                                value={day.itineraryDetails}
                                onChange={(e) => handleChange(index, "itineraryDetails", e.target.value)}
                                required
                            />
                        </Grid>

                        <Grid size={{ x: 12 }}>
                            <TextField
                                fullWidth
                                label="About City/Destination"
                                multiline
                                rows={3}
                                placeholder="Describe the city"
                                value={day.aboutCity}
                                onChange={(e) => handleChange(index, "aboutCity", e.target.value)}
                                required
                            />
                        </Grid>

                        <Grid size={{ x: 12 }}>
                            <Button variant="outlined" component="label">
                                Upload Image (optional)
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => handleChange(index, "dayImage", e.target.files[0])}
                                />
                            </Button>
                            {day.dayImage && (
                                <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                    {day.dayImage.name || "Already uploaded"}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            ))}

            <Box textAlign="center">
                <Button
                    variant="contained"
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    onClick={handleSave}
                    disabled={days.length === 0}
                >
                    Save & Continue to Step 4
                </Button>
            </Box>
        </Box>
    );
};

export default FullQuotationStep3;