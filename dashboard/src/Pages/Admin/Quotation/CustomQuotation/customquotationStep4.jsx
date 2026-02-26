// customquotationStep4.jsx
import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    IconButton,
    Paper,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";

const validationSchema = Yup.object({
    days: Yup.array().of(
        Yup.object({
            dayTitle: Yup.string().required("Day Title is required"),
            dayNote: Yup.string().max(5000, "Max 5000 characters"),
            aboutCity: Yup.string().max(5000, "Max 5000 characters"),
        })
    ),
});

const CustomQuotationStep4 = ({
    clientName,
    sector,
    cities,
    arrivalCity,
    departureCity,
    onNext,
}) => {
    const [totalNights, setTotalNights] = useState(0);
    const [totalDays, setTotalDays] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Safe fallbacks for arrival/departure cities
    const actualArrivalCity = arrivalCity || (cities && cities[0]?.cityName) || "TBD";
    const actualDepartureCity =
        departureCity || (cities && cities[cities.length - 1]?.cityName) || "TBD";

    // Calculate total nights and days from cities data
    useEffect(() => {
        if (cities && cities.length > 0) {
            const nights = cities.reduce((sum, city) => sum + (parseInt(city.nights) || 0), 0);
            setTotalNights(nights);
            setTotalDays(nights + 1);
        }
    }, [cities]);

    // Generate automatic itinerary based on cities
    const generateDaysArray = (cities, daysCount, arrivalCity, departureCity) => {
        const days = [];

        if (!cities || cities.length === 0) {
            for (let i = 1; i <= daysCount; i++) {
                days.push({
                    dayTitle: `Day ${i}`,
                    dayNote: "",
                    aboutCity: "",
                    image: null,
                    imageFile: null,
                });
            }
            return days;
        }

        let currentDay = 1;

        // Arrival day
        if (cities.length > 0) {
            const firstCity = cities[0];
            days.push({
                dayTitle: `Day ${currentDay}: Arrival at ${firstCity.cityName}`,
                dayNote: `Arrive at ${arrivalCity}. Transfer to ${firstCity.cityName}. Check-in at hotel and rest of the day at leisure.`,
                aboutCity: `Welcome to ${firstCity.cityName}! Starting your journey from ${arrivalCity}, you'll be transferred to the beautiful ${firstCity.cityName}. ${firstCity.cityName} offers...`,
                image: null,
                imageFile: null,
            });
            currentDay++;
        }

        // Intermediate days
        for (let i = 0; i < cities.length; i++) {
            const currentCity = cities[i];
            const nights = parseInt(currentCity.nights) || 1;

            for (let nightCount = 1; nightCount <= nights; nightCount++) {
                if (i === 0 && nightCount === 1) continue;

                let dayTitle = `Day ${currentDay}`;
                let dayNote = "";
                let aboutCity = `Enjoy your time in ${currentCity.cityName}!`;

                if (nightCount === 1 && i > 0) {
                    const previousCity = cities[i - 1];
                    dayTitle += `: Transfer from ${previousCity.cityName} to ${currentCity.cityName}`;
                    dayNote = `After breakfast, check-out from ${previousCity.cityName} and transfer to ${currentCity.cityName}. Check-in at hotel. Rest of the day at leisure.`;
                    aboutCity = `Traveling from ${previousCity.cityName} to ${currentCity.cityName}. Explore the new surroundings of ${currentCity.cityName}.`;
                } else {
                    dayTitle += `: Exploring ${currentCity.cityName}`;
                    dayNote = `Full day to explore ${currentCity.cityName}. Visit local attractions and enjoy the culture.`;
                }

                days.push({
                    dayTitle,
                    dayNote,
                    aboutCity,
                    image: null,
                    imageFile: null,
                });
                currentDay++;
            }
        }

        // Departure day
        if (cities.length > 0) {
            const lastCity = cities[cities.length - 1];
            days.push({
                dayTitle: `Day ${currentDay}: Departure from ${lastCity.cityName}`,
                dayNote: `After breakfast, check-out from hotel. Transfer from ${lastCity.cityName} to ${departureCity} for your departure.`,
                aboutCity: `We hope you enjoyed your stay in ${lastCity.cityName}! Safe travels back to ${departureCity}.`,
                image: null,
                imageFile: null,
            });
        }

        while (days.length < daysCount) {
            days.push({
                dayTitle: `Day ${days.length + 1}`,
                dayNote: "",
                aboutCity: "",
                image: null,
                imageFile: null,
            });
        }

        return days.slice(0, daysCount);
    };

    const formik = useFormik({
        initialValues: {
            days: generateDaysArray(cities, totalDays || 1, actualArrivalCity, actualDepartureCity),
        },
        validationSchema,
        onSubmit: async (values) => {
            setUploading(true);

            try {
                const formData = new FormData();
                formData.append("quotationId", localStorage.getItem("currentQuotationId"));
                formData.append("stepNumber", "4");

                const itineraryData = values.days.map((day) => ({
                    dayTitle: day.dayTitle,
                    dayNote: day.dayNote,
                    aboutCity: day.aboutCity,
                    image: day.image && day.image.startsWith("http") ? day.image : null,
                }));

                formData.append("stepData", JSON.stringify({ itinerary: itineraryData }));

                values.days.forEach((day) => {
                    if (day.imageFile) formData.append("itineraryImages", day.imageFile);
                });

                await onNext(formData);
            } catch (error) {
                console.error("❌ Step 4 upload failed:", error);
            } finally {
                setUploading(false);
            }
        },
        enableReinitialize: true,
    });

    useEffect(() => {
        if (totalDays > 0) {
            const newDays = generateDaysArray(cities, totalDays, actualArrivalCity, actualDepartureCity);
            formik.setValues({ days: newDays });
        }
    }, [cities, totalDays, actualArrivalCity, actualDepartureCity]);

    const handleImageChange = (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        const newDays = [...formik.values.days];
        newDays[index] = { ...newDays[index], image: imageUrl, imageFile: file };
        formik.setValues({ days: newDays });
    };

    const getCitiesSummary = () => {
        if (!cities || cities.length === 0) return "No cities selected";
        return cities
            .map(
                (city) =>
                    `${city.cityName} (${city.nights || 1} night${city.nights > 1 ? "s" : ""})`
            )
            .join(" → ");
    };

    return (
        <FormikProvider value={formik}>
            <Paper sx={{ p: 3, position: "relative" }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Custom Quotation - Itinerary
                </Typography>

                <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Tour Route:</strong> {getCitiesSummary()}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Total Nights:</strong> {totalNights} | <strong>Total Days:</strong>{" "}
                        {totalDays}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Itinerary is automatically generated based on your selected cities. You can
                        customize each day below.
                    </Typography>
                </Box>

                <form onSubmit={formik.handleSubmit}>
                    {formik.values.days.map((day, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 2, border: "1px solid #ddd" }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={11}>
                                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
                                        Day {index + 1}
                                    </Typography>
                                </Grid>
                                <Grid item xs={1}>
                                    {formik.values.days.length > 1 && (
                                        <IconButton
                                            color="error"
                                            onClick={() => {
                                                const newDays = [...formik.values.days];
                                                newDays.splice(index, 1);
                                                formik.setValues({ days: newDays });
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Grid>

                                {/* Day Title */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Day Title"
                                        name={`days[${index}].dayTitle`}
                                        value={day.dayTitle}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={
                                            formik.touched.days?.[index]?.dayTitle &&
                                            Boolean(formik.errors.days?.[index]?.dayTitle)
                                        }
                                        helperText={
                                            formik.touched.days?.[index]?.dayTitle &&
                                            formik.errors.days?.[index]?.dayTitle
                                        }
                                    />
                                </Grid>

                                {/* Day Note */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label="Day Note"
                                        name={`days[${index}].dayNote`}
                                        value={day.dayNote}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    <Typography variant="caption" color="green">
                                        You have written {day.dayNote.length}/5000 characters
                                    </Typography>
                                </Grid>

                                {/* About City */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label="About City"
                                        name={`days[${index}].aboutCity`}
                                        value={day.aboutCity}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    <Typography variant="caption" color="green">
                                        You have written {day.aboutCity.length}/5000 characters
                                    </Typography>
                                </Grid>

                                {/* Image Upload */}
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Add Image (For best view Image size - 430px X 185px)
                                    </Typography>

                                    {day.image && (
                                        <Box sx={{ mb: 2 }}>
                                            <img
                                                src={day.image}
                                                alt={`Day ${index + 1}`}
                                                style={{
                                                    maxWidth: "200px",
                                                    maxHeight: "100px",
                                                    objectFit: "cover",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </Box>
                                    )}

                                    <Button
                                        variant="outlined"
                                        component="label"
                                        sx={{ width: 250, height: 50 }}
                                        disabled={uploading}
                                    >
                                        {uploading ? <CircularProgress size={20} /> : "Choose File"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(event) => handleImageChange(event, index)}
                                        />
                                    </Button>
                                    {day.imageFile && (
                                        <Typography variant="caption" sx={{ ml: 2 }}>
                                            {day.imageFile.name}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}

                    {/* Submit Button */}
                    <Grid container>
                        <Grid item xs={12} textAlign="center">
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={uploading}
                            >
                                {uploading ? <CircularProgress size={24} /> : "Save & Continue"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </FormikProvider>
    );
};

export default CustomQuotationStep4;