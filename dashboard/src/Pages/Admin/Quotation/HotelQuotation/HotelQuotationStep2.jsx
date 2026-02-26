import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    TextField,
    Typography,
    Paper,
    InputAdornment,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import SearchIcon from "@mui/icons-material/Search";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomesticCities } from "../../../../features/location/locationSlice";

const HotelQuotationStep2 = ({ onNext, onBack, initialData, step1Data }) => {
    const dispatch = useDispatch();

    // Redux state se cities data
    const { cities, loading: citiesLoading } = useSelector((state) => state.location);

    // Local states
    const [selectedState, setSelectedState] = useState("");
    const [locations, setLocations] = useState([]);
    const [stayLocations, setStayLocations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredLocations, setFilteredLocations] = useState([]);

    useEffect(() => {
        const sector = step1Data?.sector || initialData?.selectedState || "";

        if (sector) {
            setSelectedState(sector);
            console.log("Setting selected state:", sector);
        }

        if (initialData) {
            if (initialData.stayLocations) {
                setStayLocations(initialData.stayLocations);
            }
            if (initialData.locations) {
                setLocations(initialData.locations);
            }
        }
    }, [initialData, step1Data]);

    useEffect(() => {
        if (selectedState) {
            console.log("Fetching cities for state:", selectedState);
            dispatch(fetchDomesticCities(selectedState));
        }
    }, [selectedState, dispatch]);

    useEffect(() => {
        if (cities && cities.length > 0) {
            console.log("Cities API response:", cities);

            const cityNames = cities.map(city => city.name);
            console.log("Extracted city names:", cityNames);

            if (locations.length === 0) {
                setLocations(cityNames);
            }

            if (initialData?.locations && initialData.locations.length > 0) {
                const validLocations = initialData.locations.filter(loc =>
                    cityNames.includes(loc)
                );
                if (validLocations.length > 0) {
                    setLocations(prev =>
                        prev.filter(loc => !validLocations.includes(loc))
                    );
                }
            }
        }
    }, [cities, initialData]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredLocations(locations);
        } else {
            const filtered = locations.filter(location =>
                location.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredLocations(filtered);
        }
    }, [locations, searchTerm]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        console.log("Drag result:", {
            source: source.droppableId,
            destination: destination.droppableId,
            sourceIndex: source.index,
            destIndex: destination.index
        });

        // Same list reorder - Locations
        if (source.droppableId === "locations" && destination.droppableId === "locations") {
            const updated = Array.from(locations);
            const [removed] = updated.splice(source.index, 1);
            updated.splice(destination.index, 0, removed);
            setLocations(updated);
            return;
        }

        // Same list reorder - Stay Locations
        if (source.droppableId === "stayLocations" && destination.droppableId === "stayLocations") {
            const updated = Array.from(stayLocations);
            const [removed] = updated.splice(source.index, 1);
            updated.splice(destination.index, 0, removed);
            setStayLocations(updated);
            return;
        }

        // Moving from Locations → Stay Locations
        if (source.droppableId === "locations" && destination.droppableId === "stayLocations") {
            // Use the original locations array (not filtered) to get the correct item
            const actualSourceIndex = locations.indexOf(filteredLocations[source.index]);

            if (actualSourceIndex === -1) {
                console.error("Could not find dragged item in original locations array");
                return;
            }

            const updatedLocations = Array.from(locations);
            const [movedItem] = updatedLocations.splice(actualSourceIndex, 1);

            const updatedStay = Array.from(stayLocations);
            updatedStay.splice(destination.index, 0, {
                name: movedItem,
                nights: "",
                state: selectedState
            });

            console.log("Moving to stay locations:", movedItem);
            setLocations(updatedLocations);
            setStayLocations(updatedStay);
            return;
        }

        // Moving from Stay Locations → Locations
        if (source.droppableId === "stayLocations" && destination.droppableId === "locations") {
            const updatedStay = Array.from(stayLocations);
            const [movedItem] = updatedStay.splice(source.index, 1);

            const updatedLocations = Array.from(locations);
            updatedLocations.splice(destination.index, 0, movedItem.name);

            console.log("Moving back to locations:", movedItem.name);
            setStayLocations(updatedStay);
            setLocations(updatedLocations);
        }
    };

    const handleNightsChange = (index, value) => {
        const updated = [...stayLocations];
        updated[index].nights = value;
        setStayLocations(updated);
    };

    const handleSaveAndContinue = () => {
        if (stayLocations.length === 0) {
            alert("Please add at least one stay location to continue.");
            return;
        }

        const incompleteLocations = stayLocations.filter(loc => !loc.nights || loc.nights === "" || isNaN(loc.nights));
        if (incompleteLocations.length > 0) {
            alert("Please specify valid number of nights for all stay locations.");
            return;
        }

        const stepData = {
            selectedState,
            locations,
            stayLocations,
            totalNights: stayLocations.reduce((total, loc) => total + parseInt(loc.nights || 0), 0),
            totalDays: stayLocations.reduce((total, loc) => total + parseInt(loc.nights || 0), 0) + 1
        };

        console.log("Step 2 Data to save:", stepData);
        onNext(stepData);
    };

    const handleBack = () => {
        const stepData = {
            selectedState,
            locations,
            stayLocations
        };
        onBack(stepData);
    };

    const handleResetItinerary = () => {
        const returnedLocations = [...locations, ...stayLocations.map(loc => loc.name)];
        setLocations([...new Set(returnedLocations)]);
        setStayLocations([]);
        setSearchTerm("");
    };

    // Calculate total nights and days
    const totalNights = stayLocations.reduce((total, loc) => total + parseInt(loc.nights || 0), 0);
    const totalDays = totalNights + 1;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Quotation Itinerary {totalNights}N/{totalDays}D
            </Typography>

            {/* Selected State Display */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    label="Selected Sector (From Step 1)"
                    value={selectedState || "No sector selected"}
                    InputProps={{
                        readOnly: true,
                    }}
                />
            </Box>

            {!selectedState && (
                <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <Typography variant="body2" color="warning.dark">
                        <strong>Note:</strong> Please go back to Step 1 and select a sector first.
                    </Typography>
                </Paper>
            )}

            {stayLocations.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e8' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Itinerary Summary
                    </Typography>
                    <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                                <strong>Total Locations:</strong> {stayLocations.length}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                                <strong>Total Nights:</strong> {totalNights}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                                <strong>Total Days:</strong> {totalDays}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                                <strong>Sector:</strong> {selectedState}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {citiesLoading && (
                <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
                    <Typography>Loading cities for {selectedState}...</Typography>
                </Paper>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
                    {/* Left: Available Cities */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                Available Cities in {selectedState}
                            </Typography>
                            <Typography variant="caption" color="error">
                                Drag & drop to add to itinerary
                            </Typography>

                            {/* Search Box */}
                            <TextField
                                fullWidth
                                placeholder="Search cities..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                sx={{ mt: 1, mb: 1 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <Button
                                                size="small"
                                                onClick={handleClearSearch}
                                                sx={{ minWidth: 'auto', p: 0.5 }}
                                            >
                                                Clear
                                            </Button>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {searchTerm && (
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                                    Showing {filteredLocations.length} of {locations.length} cities
                                </Typography>
                            )}

                            <Droppable droppableId="locations">
                                {(provided, snapshot) => (
                                    <Paper
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            flex: 1,
                                            minHeight: 400,
                                            maxHeight: 400,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            mt: 1,
                                            p: 1,
                                            border: "1px solid #ddd",
                                            backgroundColor: snapshot.isDraggingOver ? '#f0f0f0' : 'white',
                                        }}
                                    >
                                        <Box sx={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {filteredLocations.length === 0 && !citiesLoading ? (
                                                <Box sx={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            p: 2,
                                                            color: "text.secondary",
                                                            textAlign: 'center',
                                                            fontStyle: 'italic'
                                                        }}
                                                    >
                                                        {searchTerm
                                                            ? `No cities found matching "${searchTerm}"`
                                                            : selectedState
                                                                ? `No cities found for ${selectedState}`
                                                                : "Please select a sector in Step 1"
                                                        }
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <>
                                                    {filteredLocations.map((loc, index) => (
                                                        <Draggable
                                                            key={loc}
                                                            draggableId={loc}
                                                            index={index}
                                                        >
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
                                                                        transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                                                                        '&:hover': {
                                                                            bgcolor: '#f0f0f0',
                                                                        }
                                                                    }}
                                                                >
                                                                    <RoomIcon color="warning" fontSize="small" />
                                                                    <Typography>{loc}</Typography>
                                                                </Box>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </>
                                            )}
                                        </Box>
                                    </Paper>
                                )}
                            </Droppable>
                        </Box>
                    </Grid>

                    {/* Right: Stay Locations */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                Itinerary Locations
                            </Typography>
                            <Typography variant="caption" color="error">
                                Arrange in order & set nights
                            </Typography>

                            <Droppable droppableId="stayLocations">
                                {(provided, snapshot) => (
                                    <Paper
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            flex: 1,
                                            minHeight: 400,
                                            maxHeight: 400,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            mt: 1,
                                            p: 1,
                                            border: "1px solid #ddd",
                                            backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : 'white',
                                        }}
                                    >
                                        <Box sx={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {stayLocations.length === 0 ? (
                                                <Box sx={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            p: 2,
                                                            color: "text.secondary",
                                                            textAlign: 'center',
                                                            fontStyle: 'italic'
                                                        }}
                                                    >
                                                        Drag cities from the left to build your itinerary
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <>
                                                    {stayLocations.map((loc, index) => (
                                                        <Draggable
                                                            key={`${loc.name}-${index}`}
                                                            draggableId={`${loc.name}-${index}`}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <Box
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    sx={{
                                                                        p: 1,
                                                                        mb: 2,
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        gap: 1,
                                                                        bgcolor: snapshot.isDragging ? "#bbdefb" : "#e8f4ff",
                                                                        borderRadius: 1,
                                                                        border: "1px solid #cce4ff",
                                                                        cursor: "grab",
                                                                        transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                                                                        '&:hover': {
                                                                            bgcolor: '#d8e8ff',
                                                                        }
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                        <RoomIcon color="primary" fontSize="small" />
                                                                        <Typography fontWeight="medium">{loc.name}</Typography>
                                                                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {index + 1}.
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <TextField
                                                                        type="number"
                                                                        label="No. of Nights"
                                                                        size="small"
                                                                        value={loc.nights}
                                                                        onChange={(e) => handleNightsChange(index, e.target.value)}
                                                                        inputProps={{ min: 1, max: 10 }}
                                                                        error={!loc.nights || loc.nights === "" || isNaN(loc.nights)}
                                                                        helperText={!loc.nights || loc.nights === "" || isNaN(loc.nights) ? "Required" : ""}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </>
                                            )}
                                        </Box>
                                    </Paper>
                                )}
                            </Droppable>
                        </Box>
                    </Grid>
                </Grid>
            </DragDropContext>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                    variant="outlined"
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    onClick={handleBack}
                >
                    Back
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                        onClick={handleResetItinerary}
                        disabled={stayLocations.length === 0}
                    >
                        Reset Itinerary
                    </Button>

                    <Button
                        variant="contained"
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                        onClick={handleSaveAndContinue}
                        disabled={stayLocations.length === 0 || !selectedState}
                    >
                        Save & Continue
                    </Button>
                </Box>
            </Box>

            {!selectedState && (
                <Typography
                    variant="body2"
                    color="error"
                    sx={{ textAlign: 'center', mt: 2 }}
                >
                    Please go back to Step 1 and select a sector first.
                </Typography>
            )}

            {selectedState && stayLocations.length === 0 && (
                <Typography
                    variant="body2"
                    color="error"
                    sx={{ textAlign: 'center', mt: 2 }}
                >
                    Please add at least one city to your itinerary to continue.
                </Typography>
            )}
        </Box>
    );
};

export default HotelQuotationStep2;