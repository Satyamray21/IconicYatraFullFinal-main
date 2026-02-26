import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    MenuItem,
    TextField,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Alert,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import AddIcon from "@mui/icons-material/Add";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { step2Update } from "../../../../features/quotation/fullQuotationSlice";
import {
    fetchStatesByCountry,
    fetchCitiesByState,
    fetchAllCitiesByCountry
} from "../../../../features/location/locationSlice";

const FullQuotationStep2 = ({ quotationId, quotation }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { states, cities, loading: locationLoading } = useSelector(
        (state) => state.location
    );

    const country = "India"; // default
    const sector = quotation?.clientDetails?.sector || "Kerala";
    const tourType = quotation?.clientDetails?.tourType?.toLowerCase() || "domestic";
    const totalAllowedNights = quotation?.accommodation?.noOfNights || 0;

    const [locations, setLocations] = useState([]);
    const [stayLocations, setStayLocations] = useState([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [loading, setLoading] = useState(false);
    const [customCityDialog, setCustomCityDialog] = useState(false);
    const [customCityName, setCustomCityName] = useState("");

    // Fetch states when component mounts (for domestic)
    useEffect(() => {
        if (country && tourType === "domestic") {
            dispatch(fetchStatesByCountry(country));
        }
    }, [country, tourType, dispatch]);

    // Set state based on sector if matches
    useEffect(() => {
        if (tourType === "domestic" && states.length > 0) {
            const stateNames = states.map(state => state.name);

            if (stateNames.includes(sector)) {
                setSelectedState(sector);
            } else if (stateNames.length > 0) {
                setSelectedState(stateNames[0]);
            }
        }
    }, [states, sector, tourType]);

    // Fetch cities based on tour type
    useEffect(() => {
        if (tourType === "domestic" && selectedState) {
            dispatch(fetchCitiesByState({ countryName: country, stateName: selectedState }));
        } else if (tourType === "international" && selectedCountry) {
            dispatch(fetchAllCitiesByCountry(selectedCountry));
        }
    }, [selectedState, selectedCountry, tourType, country, dispatch]);

    // Update available locations when cities are fetched
    useEffect(() => {
        if (cities && cities.length > 0) {
            if (typeof cities[0] === 'object') {
                // If cities are objects, extract names
                const cityNames = cities.map(city => city.name);
                setLocations(cityNames);
            } else {
                // If cities are already strings
                setLocations(cities);
            }
        } else {
            setLocations([]);
        }
    }, [cities]);

    // Clear locations when selection changes
    useEffect(() => {
        setLocations([]);
        setStayLocations([]);
    }, [selectedState, selectedCountry, tourType]);

    // Add custom city
    const handleAddCustomCity = () => {
        if (!customCityName.trim()) {
            toast.error("Please enter a city name");
            return;
        }

        if (locations.includes(customCityName.trim())) {
            toast.error("This city already exists");
            return;
        }

        setLocations(prev => [...prev, customCityName.trim()]);
        setCustomCityName("");
        setCustomCityDialog(false);
        toast.success("Custom city added successfully");
    };

    // ---------- DRAG & DROP ----------
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Same list reorder
        if (source.droppableId === destination.droppableId) {
            if (source.droppableId === "locations") {
                const updated = Array.from(locations);
                const [removed] = updated.splice(source.index, 1);
                updated.splice(destination.index, 0, removed);
                setLocations(updated);
            } else if (source.droppableId === "stayLocations") {
                const updated = Array.from(stayLocations);
                const [removed] = updated.splice(source.index, 1);
                updated.splice(destination.index, 0, removed);
                setStayLocations(updated);
            }
            return;
        }

        // Moving from Locations → Stay Locations
        if (source.droppableId === "locations" && destination.droppableId === "stayLocations") {
            const updatedLocations = Array.from(locations);
            const [movedItem] = updatedLocations.splice(source.index, 1);

            const updatedStay = Array.from(stayLocations);
            updatedStay.splice(destination.index, 0, {
                name: movedItem,
                nights: "" // Empty initially for manual input
            });

            setLocations(updatedLocations);
            setStayLocations(updatedStay);
        }

        // Moving from Stay Locations → Locations
        if (source.droppableId === "stayLocations" && destination.droppableId === "locations") {
            const updatedStay = Array.from(stayLocations);
            const [movedItem] = updatedStay.splice(source.index, 1);

            const updatedLocations = Array.from(locations);
            updatedLocations.splice(destination.index, 0, movedItem.name);

            setStayLocations(updatedStay);
            setLocations(updatedLocations);
        }
    };

    // ---------- Handle Nights ----------
    const handleNightsChange = (index, value) => {
        // Allow only numbers and empty string
        const numericValue = value === "" ? "" : value.replace(/[^0-9]/g, '');

        // Limit to 2 digits if not empty
        const limitedValue = numericValue === "" ? "" : numericValue.slice(0, 2);

        const updated = [...stayLocations];
        updated[index].nights = limitedValue;
        setStayLocations(updated);
    };

    // Validate nights when field loses focus
    const handleNightsBlur = (index) => {
        const updated = [...stayLocations];
        const currentNights = updated[index].nights;

        if (currentNights === "") {
            updated[index].nights = 1; // Default to 1 if empty
        } else {
            const numericValue = parseInt(currentNights) || 1;
            updated[index].nights = Math.max(1, Math.min(30, numericValue));
        }

        setStayLocations(updated);
    };

    // ---------- Remove Stay Location ----------
    const handleRemoveStayLocation = (index) => {
        const updatedStay = [...stayLocations];
        const removedLocation = updatedStay.splice(index, 1)[0];
        setLocations(prev => [...prev, removedLocation.name]);
        setStayLocations(updatedStay);
    };

    // ---------- Calculate total nights ----------
    const totalNights = stayLocations.reduce((total, loc) => {
        const nights = parseInt(loc.nights) || 0;
        return total + nights;
    }, 0);

    const totalDays = totalNights + 1;

    // Check if nights match the accommodation requirement
    const nightsValidation = {
        isValid: totalNights === totalAllowedNights,
        isLess: totalNights < totalAllowedNights,
        isMore: totalNights > totalAllowedNights,
        message: totalNights === totalAllowedNights
            ? `Perfect! Total nights (${totalNights}) match accommodation requirement.`
            : totalNights < totalAllowedNights
                ? `Total nights (${totalNights}) are less than accommodation nights (${totalAllowedNights}). Add ${totalAllowedNights - totalNights} more night(s).`
                : `Total nights (${totalNights}) exceed accommodation nights (${totalAllowedNights}). Remove ${totalNights - totalAllowedNights} night(s).`
    };

    // Check if all locations have valid night values
    const hasInvalidNights = stayLocations.some(loc =>
        !loc.nights || loc.nights === "" || parseInt(loc.nights) < 1
    );

    // ---------- Save & Continue ----------
    const handleSave = async () => {
        if (!quotationId || quotationId === "new") {
            toast.error("Please complete Step 1 first!");
            return;
        }

        if (stayLocations.length === 0) {
            toast.error("Please add at least one stay location by dragging from the left panel");
            return;
        }

        if (hasInvalidNights) {
            toast.error("Please enter valid number of nights for all stay locations");
            return;
        }

        if (!nightsValidation.isValid) {
            toast.error(`Total nights (${totalNights}) must match accommodation nights (${totalAllowedNights})`);
            return;
        }

        setLoading(true);

        const transformedStayLocations = stayLocations.map(loc => ({
            name: loc.name,
            nights: parseInt(loc.nights) || 1,
        }));

        try {
            const resultAction = await dispatch(
                step2Update({ quotationId, stayLocation: transformedStayLocations })
            );

            if (step2Update.fulfilled.match(resultAction)) {
                toast.success("Step 2 saved successfully!");
                navigate(`/fullquotation/${quotationId}/step/3`);
            } else {
                toast.error(resultAction.payload?.message || "Failed to save Step 2");
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("An unexpected error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    // Get state names for dropdown
    const stateNames = states.map(state => state.name);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Quotation Itinerary {totalNights}N/{totalDays}D
                <Chip
                    label={tourType === 'domestic' ? 'Domestic Tour' : 'International Tour'}
                    color={tourType === 'domestic' ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ ml: 2 }}
                />
            </Typography>

            {quotationId && quotationId !== "new" && (
                <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                    Quotation ID: <strong>{quotationId}</strong>
                </Typography>
            )}

            {/* Nights Validation Alert */}
            {totalAllowedNights > 0 && (
                <Alert
                    severity={
                        nightsValidation.isValid ? "success" :
                            nightsValidation.isLess ? "warning" : "error"
                    }
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2">
                        <strong>Accommodation Nights: {totalAllowedNights}</strong> | {nightsValidation.message}
                    </Typography>
                </Alert>
            )}

            {/* Selection based on tour type */}
            <Box sx={{ mb: 3 }}>
                {tourType === "domestic" ? (
                    <TextField
                        select
                        fullWidth
                        label="Select State"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                    >
                        {stateNames.map((stateName) => (
                            <MenuItem key={stateName} value={stateName}>
                                {stateName}
                            </MenuItem>
                        ))}
                    </TextField>
                ) : (
                    <TextField
                        fullWidth
                        label="Enter Country Name"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        placeholder="e.g., United States, France, Japan"
                    />
                )}
            </Box>

            {/* Add Custom City Button */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCustomCityDialog(true)}
                >
                    Add Custom City
                </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Grid container spacing={2}>
                    {/* Left: Available Locations */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            Available Locations ({locations.length})
                        </Typography>
                        <Droppable droppableId="locations">
                            {(provided, snapshot) => (
                                <Paper
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        minHeight: 200,
                                        maxHeight: 400,
                                        overflowY: "auto",
                                        mt: 1,
                                        p: 1,
                                        border: "1px solid #ddd",
                                        backgroundColor: snapshot.isDraggingOver ? "#f0f0f0" : "#ffffff",
                                    }}
                                >
                                    {locations.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            sx={{ p: 2, color: "text.secondary", textAlign: "center" }}
                                        >
                                            {locationLoading ? "Loading cities..." : "No cities available. Select a state/country or add custom cities."}
                                        </Typography>
                                    ) : (
                                        locations.map((loc, index) => (
                                            <Draggable key={loc} draggableId={loc} index={index}>
                                                {(provided, snapshot) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1,
                                                            mb: 1,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            bgcolor: snapshot.isDragging ? "#e0e0e0" : "#f9f9f9",
                                                            borderRadius: 1,
                                                            border: "1px solid #eee",
                                                            cursor: "grab",
                                                            transform: snapshot.isDragging ? "rotate(5deg)" : "none",
                                                            transition: "all 0.2s ease",
                                                        }}
                                                    >
                                                        <RoomIcon color="warning" fontSize="small" />
                                                        <Typography variant="body2">{loc}</Typography>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </Paper>
                            )}
                        </Droppable>
                    </Grid>

                    {/* Right: Stay Locations */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                Itinerary Locations ({stayLocations.length})
                            </Typography>
                            {totalNights > 0 && (
                                <Typography variant="caption" color="primary">
                                    Total: {totalNights} nights, {totalDays} days
                                </Typography>
                            )}
                        </Box>

                        <Droppable droppableId="stayLocations">
                            {(provided, snapshot) => (
                                <Paper
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        minHeight: 200,
                                        maxHeight: 400,
                                        overflowY: "auto",
                                        mt: 1,
                                        p: 1,
                                        border: "1px solid #ddd",
                                        backgroundColor: snapshot.isDraggingOver ? "#e8f4ff" : "#ffffff",
                                    }}
                                >
                                    {stayLocations.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            sx={{ p: 2, color: "text.secondary", textAlign: "center" }}
                                        >
                                            No cities added yet. Drag from the left panel to build your itinerary.
                                        </Typography>
                                    ) : (
                                        stayLocations.map((loc, index) => (
                                            <Draggable key={`${loc.name}-${index}`} draggableId={`${loc.name}-${index}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1.5,
                                                            mb: 1.5,
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 1,
                                                            bgcolor: snapshot.isDragging ? "#d4e6ff" : "#e8f4ff",
                                                            borderRadius: 1,
                                                            border: "2px solid #cce4ff",
                                                            cursor: "grab",
                                                            transform: snapshot.isDragging ? "rotate(5deg)" : "none",
                                                            transition: "all 0.2s ease",
                                                        }}
                                                    >
                                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <RoomIcon color="primary" fontSize="small" />
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {loc.name}
                                                                </Typography>
                                                            </Box>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleRemoveStayLocation(index)}
                                                            >
                                                                ✕
                                                            </IconButton>
                                                        </Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <TextField
                                                                type="text"
                                                                label="No. of Nights"
                                                                size="small"
                                                                value={loc.nights}
                                                                onChange={(e) => handleNightsChange(index, e.target.value)}
                                                                onBlur={() => handleNightsBlur(index)}
                                                                inputProps={{
                                                                    maxLength: 2,
                                                                    style: { textAlign: 'center' }
                                                                }}
                                                                placeholder="Enter nights"
                                                                sx={{ width: 140 }}
                                                                error={!loc.nights || parseInt(loc.nights) < 1}
                                                                helperText={!loc.nights || parseInt(loc.nights) < 1 ? "Min 1 night" : ""}
                                                            />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {parseInt(loc.nights) === 1 ? 'night' : 'nights'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </Paper>
                            )}
                        </Droppable>
                    </Grid>
                </Grid>
            </DragDropContext>

            {/* Custom City Dialog */}
            <Dialog open={customCityDialog} onClose={() => setCustomCityDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Custom City</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="City Name"
                        value={customCityName}
                        onChange={(e) => setCustomCityName(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="Enter city name..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomCityDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddCustomCity} variant="contained">
                        Add City
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Action Buttons */}
            <Box textAlign="center" sx={{ mt: 3 }} display="flex" justifyContent="center" gap={2}>
                <Button
                    variant="outlined"
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    onClick={() => navigate(`/fullquotation/${quotationId}/step/1`)}
                    disabled={loading}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    onClick={handleSave}
                    disabled={
                        loading ||
                        stayLocations.length === 0 ||
                        hasInvalidNights ||
                        !nightsValidation.isValid
                    }
                >
                    {loading ? "Saving..." : "Save & Continue"}
                </Button>
            </Box>
        </Box>
    );
};

export default FullQuotationStep2;