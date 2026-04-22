import React, { useState, useEffect } from "react";
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Typography,
  Autocomplete,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import AddIcon from "@mui/icons-material/Add";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchCitiesByState,
  clearStates,
  clearCities,
  fetchDomesticCities,
  fetchInternationalCities,
} from "../../../../features/location/locationSlice";
import {
  getLeadOptions,
  addLeadOption,
  deleteLeadOption,
} from "../../../../features/leads/leadSlice";
import DeleteIcon from "@mui/icons-material/Delete";

// ✅ NEW: Tour Type Constants
const TOUR_TYPES = [
  "Domestic",
  "International",
  // "Yatra",
  // "Holiday",
  // "Special",
  // "Latest"
];

// ✅ NEW: Package Category Constants
const PACKAGE_CATEGORIES = [
  { label: "Spiritual Tour", value: "Yatra" },
  { label: "Holidays", value: "Holidays" },
  { label: "Special", value: "Special" },
  { label: "Latest", value: "Latest" },
];

// ✅ NEW: Domestic Tour Types (India specific)
const DOMESTIC_TOUR_TYPES = ["Domestic"];

const PackageEntryForm = ({ onNext, initialData }) => {
  const [tourType, setTourType] = useState(initialData?.tourType || "Domestic");
  const [allCities, setAllCities] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [stayLocationList, setStayLocationList] = useState(
    initialData?.stayLocations || [],
  );
  const [selectedCountry, setSelectedCountry] = useState(
    initialData?.destinationCountry || "",
  );
  const [searchText, setSearchText] = useState("");
  const [currentState, setCurrentState] = useState(""); // ✅ NEW: Track current state
  const BOX_HEIGHT = 220;

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [addMore, setAddMore] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const dispatch = useDispatch();
  const { countries, states } = useSelector((state) => state.location);
  const { options } = useSelector((state) => state.leads);
  const { loading } = useSelector((state) => state.packages);

  useEffect(() => {
    dispatch(fetchCountries());
    dispatch(getLeadOptions());

    // ✅ UPDATED: Fetch Indian states for Domestic tour types
    if (DOMESTIC_TOUR_TYPES.includes(tourType)) {
      dispatch(fetchStatesByCountry("India"));
      formik.setFieldValue("destinationCountry", "India");
      setSelectedCountry("India");
    }
  }, [dispatch, tourType]);

  const formik = useFormik({
    initialValues: {
      tourType: initialData?.tourType || "Domestic",
      sector: initialData?.sector || "",
      destinationCountry: initialData?.destinationCountry || "",
      packageCategory: initialData?.packageCategory || "", // ✅ NEW: Package Category
      packageSubType: initialData?.packageSubType || [],
    },
    validationSchema: Yup.object({
      tourType: Yup.string()
        .oneOf(TOUR_TYPES, "Invalid tour type")
        .required("Tour type is required"),
      destinationCountry: Yup.string().when("tourType", {
        is: "International",
        then: (schema) => schema.required("Destination country is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      sector: Yup.string().required("State is required"),
      packageCategory: Yup.string().required("Package category is required"), // ✅ NEW: Package Category validation
      packageSubType: Yup.array()
        .of(Yup.string())
        .min(1, "At least one package sub type is required"),
    }),
    onSubmit: (values) => {
      if (stayLocationList.length === 0) {
        alert("Please select at least one stay location.");
        return;
      }

      const payload = {
        ...values,
        stayLocations: stayLocationList,
        destinationCountry: DOMESTIC_TOUR_TYPES.includes(values.tourType)
          ? "India"
          : values.destinationCountry,
        status: "active",
      };

      onNext(payload, stayLocationList);
    },
  });

  const handleTourTypeChange = (e) => {
    const selectedType = e.target.value;
    setTourType(selectedType);

    formik.setFieldValue("tourType", selectedType);
    formik.setFieldValue("sector", "");
    formik.setFieldValue("packageCategory", ""); // ✅ NEW: Reset package category
    formik.setFieldValue("packageSubType", "");
    formik.setTouched({});

    setAllCities([]);
    setLocationList([]);
    setStayLocationList([]); // ✅ Reset stay locations when tour type changes
    setCurrentState(""); // ✅ Reset current state
    dispatch(clearStates());
    dispatch(clearCities());

    if (DOMESTIC_TOUR_TYPES.includes(selectedType)) {
      formik.setFieldValue("destinationCountry", "India");
      setSelectedCountry("India");
      dispatch(fetchStatesByCountry("India"));
    } else if (selectedType === "International") {
      formik.setFieldValue("destinationCountry", "");
      setSelectedCountry("");
    }
  };

  const handleCountryChange = (countryName) => {
    setSelectedCountry(countryName);
    formik.setFieldValue("destinationCountry", countryName);
    formik.setFieldValue("sector", "");
    formik.setFieldValue("packageCategory", ""); // ✅ NEW: Reset package category
    formik.setFieldValue("packageSubType", []);

    setAllCities([]);
    setLocationList([]);
    setStayLocationList([]); // ✅ Reset stay locations when country changes
    setCurrentState(""); // ✅ Reset current state
    dispatch(clearStates());
    dispatch(clearCities());

    dispatch(fetchStatesByCountry(countryName));
  };

  const handleSectorChange = (selectedStateName) => {
    console.log("Selected state:", selectedStateName);
    console.log("Tour type:", tourType);
    console.log("Selected country:", selectedCountry);

    formik.setFieldValue("sector", selectedStateName);
    setCurrentState(selectedStateName); // ✅ Store current state

    if (DOMESTIC_TOUR_TYPES.includes(tourType)) {
      // For domestic tour types - India specific
      dispatch(fetchDomesticCities(selectedStateName))
        .unwrap()
        .then((cityList) => {
          console.log("Domestic cities received:", cityList);
          const cities = cityList.map((c) => c.name || c.city || c);
          setAllCities(cities);
          setLocationList(cities);
          setSearchText("");
          // ✅ DON'T reset stayLocationList here - keep existing selections
        })
        .catch((error) => {
          console.error("Failed to fetch domestic cities:", error);
        });
    } else {
      // For international tours
      dispatch(
        fetchInternationalCities({
          countryName: selectedCountry,
          stateName: selectedStateName,
        }),
      )
        .unwrap()
        .then((cityList) => {
          console.log("International cities received:", cityList);
          const cities = cityList.map((c) => c.name || c.city || c);
          setAllCities(cities);
          setLocationList(cities);
          setSearchText("");
          // ✅ DON'T reset stayLocationList here - keep existing selections
        })
        .catch((error) => {
          console.error("Failed to fetch international cities:", error);
        });
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    if (!value) {
      setLocationList(allCities);
    } else {
      setLocationList(allCities.filter((c) => c.toLowerCase().includes(value)));
    }
  };

  const handleSelectCity = (city) => {
    // ✅ Include state information with city
    const cityWithState = {
      city,
      state: currentState, // ✅ Store which state this city belongs to
      country:
        selectedCountry ||
        (DOMESTIC_TOUR_TYPES.includes(tourType) ? "India" : ""),
      nights: "",
    };

    // Check if city already exists (from any state)
    if (
      !stayLocationList.find(
        (item) => item.city === city && item.state === currentState,
      )
    ) {
      setStayLocationList([...stayLocationList, cityWithState]);
    }
  };

  const handleRemoveCity = (cityToRemove) => {
    setStayLocationList(
      stayLocationList.filter(
        (item) =>
          !(
            item.city === cityToRemove.city && item.state === cityToRemove.state
          ),
      ),
    );
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

      await dispatch(
        addLeadOption({ fieldName: backendField, value: newValue }),
      ).unwrap();
      await dispatch(getLeadOptions()).unwrap();
      formik.setFieldValue(backendField, [
        ...formik.values[backendField],
        newValue,
      ]);

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to add new option", error);
    }
  };

  // ✅ Add New Location Logic
  const handleOpenLocationDialog = () => {
    setNewLocation("");
    setOpenLocationDialog(true);
  };

  const handleCloseLocationDialog = () => {
    setOpenLocationDialog(false);
  };

  const handleAddNewLocation = () => {
    if (!newLocation.trim()) return;

    const locationName = newLocation.trim();

    // Add to all cities and location list
    setAllCities((prev) => [...prev, locationName]);
    setLocationList((prev) => [...prev, locationName]);

    handleCloseLocationDialog();
  };

  // ✅ Delete Location from Available Locations
  const handleDeleteLocation = (locationToDelete, e) => {
    e.stopPropagation();

    // Remove from all arrays
    setAllCities((prev) =>
      prev.filter((location) => location !== locationToDelete),
    );
    setLocationList((prev) =>
      prev.filter((location) => location !== locationToDelete),
    );

    // Also remove from stay locations if present (with current state)
    setStayLocationList((prev) =>
      prev.filter(
        (item) =>
          !(item.city === locationToDelete && item.state === currentState),
      ),
    );
  };

  // ✅ NEW: Group stay locations by state for better display
  const getStayLocationsByState = () => {
    const grouped = {};
    stayLocationList.forEach((item) => {
      if (!grouped[item.state]) {
        grouped[item.state] = [];
      }
      grouped[item.state].push(item);
    });
    return grouped;
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

  const groupedStayLocations = getStayLocationsByState();

  return (
    <Box border={1} borderColor="grey.300" borderRadius={2} p={3} boxShadow={2}>
      <Typography
        variant="h6"
        fontWeight="bold"
        gutterBottom
        mb={3}
        color="primary"
      >
        Package Entry Form
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* Tour Type */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel>Tour Type *</FormLabel>
              <RadioGroup
                row
                name="tourType"
                value={tourType}
                onChange={handleTourTypeChange}
              >
                {TOUR_TYPES.map((type) => (
                  <FormControlLabel
                    key={type}
                    value={type}
                    control={<Radio />}
                    label={type}
                  />
                ))}
              </RadioGroup>
              {formik.touched.tourType && formik.errors.tourType && (
                <Typography variant="caption" color="error">
                  {formik.errors.tourType}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Destination Country - Only for International */}
          {tourType === "International" && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                fullWidth
                options={countries.map((c) => c.name)}
                value={formik.values.destinationCountry || ""}
                onChange={(e, newValue) => {
                  formik.setFieldValue("destinationCountry", newValue || "");
                  if (newValue) {
                    handleCountryChange(newValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Destination Country *"
                    error={
                      formik.touched.destinationCountry &&
                      Boolean(formik.errors.destinationCountry)
                    }
                    helperText={
                      formik.touched.destinationCountry &&
                      formik.errors.destinationCountry
                    }
                  />
                )}
              />
            </Grid>
          )}

          {/* Sector/State for all tour types */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={states.map((state) => state.name)}
              value={formik.values.sector || ""}
              onChange={(e, newValue) => {
                formik.setFieldValue("sector", newValue || "");
                if (newValue) handleSectorChange(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    DOMESTIC_TOUR_TYPES.includes(tourType)
                      ? "State *"
                      : "State/Province *"
                  }
                  error={formik.touched.sector && Boolean(formik.errors.sector)}
                  helperText={formik.touched.sector && formik.errors.sector}
                  placeholder={
                    states.length === 0
                      ? "Loading..."
                      : `Select ${DOMESTIC_TOUR_TYPES.includes(tourType) ? "Indian" : ""} state`
                  }
                />
              )}
              disabled={states.length === 0}
            />
            {states.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                {DOMESTIC_TOUR_TYPES.includes(tourType)
                  ? "Loading Indian states..."
                  : tourType === "International" &&
                      formik.values.destinationCountry
                    ? `Loading states for ${formik.values.destinationCountry}...`
                    : "Select country first"}
              </Typography>
            )}
          </Grid>

          {/* ✅ NEW: Package Category Dropdown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <Autocomplete
                fullWidth
                options={PACKAGE_CATEGORIES}
                getOptionLabel={(option) => option.label}
                value={
                  PACKAGE_CATEGORIES.find(
                    (opt) => opt.value === formik.values.packageCategory,
                  ) || null
                }
                onChange={(e, newValue) => {
                  formik.setFieldValue(
                    "packageCategory",
                    newValue?.value || "",
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Package Category *"
                    error={
                      formik.touched.packageCategory &&
                      Boolean(formik.errors.packageCategory)
                    }
                    helperText={
                      formik.touched.packageCategory &&
                      formik.errors.packageCategory
                    }
                    placeholder="Select package category"
                  />
                )}
              />
            </FormControl>
          </Grid>

          {/* Package Sub Type */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              multiple
              fullWidth
              options={getOptionsForField("packageSubType").map(
                (opt) => opt.value,
              )}
              value={formik.values.packageSubType || []}
              onChange={(e, newValue) => {
                if (newValue.includes("__add_new")) {
                  const filtered = newValue.filter((v) => v !== "__add_new");
                  formik.setFieldValue("packageSubType", filtered);
                  handleOpenDialog("packageSubType");
                } else {
                  formik.setFieldValue("packageSubType", newValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Package Sub Type *"
                  error={
                    formik.touched.packageSubType &&
                    Boolean(formik.errors.packageSubType)
                  }
                  helperText={
                    formik.touched.packageSubType &&
                    formik.errors.packageSubType
                  }
                />
              )}
              renderOption={(props, option) => {
                if (option === "__add_new") {
                  return (
                    <li
                      {...props}
                      key="add_new"
                      style={{ color: "#1976d2", fontWeight: 500 }}
                    >
                      + Add New
                    </li>
                  );
                }

                const optData = options.find(
                  (o) => o.fieldName === "packageSubType" && o.value === option,
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
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </li>
                );
              }}
            />
          </Grid>

          {/* Location List + Stay Locations */}
          <Grid size={{ xs: 12 }} mt={2}>
            <Grid container spacing={2}>
              {/* Available Locations */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                    color="primary"
                  >
                    <LocationOnIcon sx={{ mr: 1, color: "red" }} />
                    Available Locations {currentState && `- ${currentState}`}
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                    onClick={handleOpenLocationDialog}
                    disabled={!formik.values.sector}
                  >
                    Add Location
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search city..."
                  value={searchText}
                  onChange={handleSearch}
                  sx={{ mt: 1 }}
                  disabled={!formik.values.sector}
                />
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    height: BOX_HEIGHT,
                    overflowY: "auto",
                    mt: 1,
                    p: 1,
                    borderRadius: 2,
                    background: "#fafafa",
                  }}
                >
                  {locationList.length > 0 ? (
                    locationList.map((city, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          background: "#f5f5f5",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          "&:hover": { background: "#e0f7fa" },
                        }}
                        onClick={() => handleSelectCity(city)}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <LocationOnIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "grey.600" }}
                          />
                          {city}
                          <Chip
                            label={currentState}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteLocation(city, e)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(211, 47, 47, 0.04)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      py={2}
                    >
                      {formik.values.sector
                        ? "No cities found"
                        : "Select a state to see cities"}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Stay Locations */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "bold",
                  }}
                  color="primary"
                >
                  <HomeWorkIcon sx={{ mr: 1, color: "#1976d2" }} />
                  Stay Locations ({stayLocationList.length})
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    height: 270,
                    overflowY: "auto",
                    mt: 1,
                    p: 1,
                    borderRadius: 2,
                    background: "#f0f8ff",
                  }}
                >
                  {stayLocationList.length > 0 ? (
                    Object.entries(groupedStayLocations).map(
                      ([state, cities]) => (
                        <Box key={state} sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              color: "primary.main",
                              mb: 1,
                            }}
                          >
                            {state}
                          </Typography>
                          {cities.map((item, i) => {
                            const globalIndex = stayLocationList.findIndex(
                              (stayItem) =>
                                stayItem.city === item.city &&
                                stayItem.state === item.state,
                            );

                            return (
                              <Box
                                key={`${item.city}-${item.state}`}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  p: 1,
                                  mb: 1,
                                  borderRadius: 1,
                                  background: "#e3f2fd",
                                  flexDirection: "column",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "100%",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <HomeWorkIcon
                                      fontSize="small"
                                      sx={{ mr: 1, color: "#1976d2" }}
                                    />
                                    {item.city}
                                  </Box>

                                  <Box>
                                    <IconButton
                                      size="small"
                                      disabled={globalIndex === 0}
                                      onClick={() => {
                                        if (globalIndex === 0) return;
                                        const newList = [...stayLocationList];
                                        const [moved] = newList.splice(
                                          globalIndex,
                                          1,
                                        );
                                        newList.splice(
                                          globalIndex - 1,
                                          0,
                                          moved,
                                        );
                                        setStayLocationList(newList);
                                      }}
                                    >
                                      ⬆️
                                    </IconButton>

                                    <IconButton
                                      size="small"
                                      disabled={
                                        globalIndex ===
                                        stayLocationList.length - 1
                                      }
                                      onClick={() => {
                                        if (
                                          globalIndex ===
                                          stayLocationList.length - 1
                                        )
                                          return;
                                        const newList = [...stayLocationList];
                                        const [moved] = newList.splice(
                                          globalIndex,
                                          1,
                                        );
                                        newList.splice(
                                          globalIndex + 1,
                                          0,
                                          moved,
                                        );
                                        setStayLocationList(newList);
                                      }}
                                    >
                                      ⬇️
                                    </IconButton>

                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveCity(item)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <TextField
                                  type="number"
                                  size="small"
                                  label="Number of Nights"
                                  value={item.nights}
                                  onChange={(e) => {
                                    const newList = [...stayLocationList];
                                    const itemIndex = newList.findIndex(
                                      (stayItem) =>
                                        stayItem.city === item.city &&
                                        stayItem.state === item.state,
                                    );
                                    if (itemIndex !== -1) {
                                      newList[itemIndex].nights =
                                        e.target.value;
                                      setStayLocationList(newList);
                                    }
                                  }}
                                  sx={{ mt: 1, width: "50%" }}
                                  inputProps={{ min: 1 }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      ),
                    )
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      py={2}
                    >
                      No stay locations selected
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Submit */}
          <Grid size={{ xs: 12 }} textAlign="center" mt={3}>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "#4db9f3", px: 4 }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </Grid>
        </Grid>
      </form>

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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddNewItem} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Location Dialog */}
      <Dialog open={openLocationDialog} onClose={handleCloseLocationDialog}>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="dense"
            label="New Location Name"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Enter location name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationDialog}>Cancel</Button>
          <Button onClick={handleAddNewLocation} variant="contained">
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageEntryForm;
