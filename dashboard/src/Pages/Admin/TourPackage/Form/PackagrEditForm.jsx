import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Autocomplete,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  BeachAccess as BeachIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchPackageById,
  updatePackageStep1,
  uploadPackageBanner,
  uploadPackageDayImage,
} from "../../../../features/package/packageSlice";
import {
  fetchCountries,
  fetchStatesByCountry,
  clearStates,
  clearCities,
} from "../../../../features/location/locationSlice";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Constants
const TOUR_TYPES = ["Domestic", "International"];
const PACKAGE_CATEGORIES = ["Yatra", "Holidays", "Special", "Latest"];
const DOMESTIC_TOUR_TYPES = ["Domestic"];

const PackageEditView = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, loading } = useSelector((state) => state.packages || {});
  const { countries = [], states = [] } = useSelector((state) => state.location || {});

  // State with safe default values
  const [pkg, setPkg] = useState({
    // Step 1 Fields
    tourType: "Domestic",
    packageCategory: "",
    packageSubType: [],
    destinationCountry: "India",
    sector: "",
    stayLocations: [],
    
    // Step 2 Fields
    title: "",
    arrivalCity: "",
    departureCity: "",
    notes: "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
    bannerImage: "",
    validFrom: null,
    validTill: null,
    days: [],
    perPerson: 1,
    mealPlan: {
      planType: "",
      description: "",
    },
    destinationNights: [],
    
    // Policy Fields
    policy: {
      inclusionPolicy: "",
      exclusionPolicy: "",
      paymentPolicy: "",
      cancellationPolicy: "",
      termsAndConditions: ""
    },
    
    // Status
    status: "deactive",
    _id: null
  });

  // UI State
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [groupedStayLocations, setGroupedStayLocations] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      console.log("Fetching package with ID:", id);
      dispatch(fetchPackageById(id))
        .unwrap()
        .catch((err) => {
          console.error("Failed to fetch package:", err);
          setError("Failed to load package data");
        });
      dispatch(fetchCountries());
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (current && !initialized) {
      console.log("Current package data received:", current);
      
      try {
        // Safe data extraction with fallbacks
        const safeCurrent = current || {};
        
        // Calculate hotel costs safely
        let hotelCosts = { Standard: 0, Deluxe: 0, Superior: 0 };
        if (safeCurrent.destinationNights?.length > 0 && safeCurrent.destinationNights[0]?.hotels) {
          safeCurrent.destinationNights[0].hotels.forEach((hotel) => {
            if (hotel?.category?.toLowerCase() === "standard")
              hotelCosts.Standard = hotel.pricePerPerson || 0;
            if (hotel?.category?.toLowerCase() === "deluxe")
              hotelCosts.Deluxe = hotel.pricePerPerson || 0;
            if (hotel?.category?.toLowerCase() === "superior")
              hotelCosts.Superior = hotel.pricePerPerson || 0;
          });
        }

        // Policy Data Conversion with safety
        const getPolicyContent = (policyArray) => {
          if (!policyArray || !Array.isArray(policyArray) || policyArray.length === 0) return "";
          if (policyArray[0] && (policyArray[0].includes('<p>') || policyArray[0].includes('<h'))) {
            return policyArray[0];
          }
          return policyArray.map(item => item ? `<p>${item}</p>` : '').join('');
        };

        // Initialize days safely
        const initializedDays = (safeCurrent.days || []).map((d) => ({
          title: d?.title || "",
          notes: d?.notes || "",
          aboutCity: d?.aboutCity || "",
          dayImage: d?.dayImage || "",
          sightseeing: Array.isArray(d?.sightseeing) ? d.sightseeing : [],
          selectedSightseeing: Array.isArray(d?.selectedSightseeing) ? d.selectedSightseeing : [],
        }));

        // Initialize stayLocations safely
        const initializedStayLocations = (safeCurrent.stayLocations || []).map((location) => ({
          city: location?.city || "",
          nights: location?.nights || 1,
          state: location?.state || safeCurrent.sector || "",
          country: location?.country || safeCurrent.destinationCountry || "India"
        }));

        // Initialize destinationNights safely - FIXED: Properly initialize all fields
        const initializedDestinationNights = (safeCurrent.destinationNights || []).map((dest) => {
          // Ensure hotels array exists and has 3 items
          let hotels = [];
          if (Array.isArray(dest?.hotels) && dest.hotels.length > 0) {
            hotels = dest.hotels;
          } else {
            hotels = [
              { category: "standard", hotelName: "", pricePerPerson: 0 },
              { category: "deluxe", hotelName: "", pricePerPerson: 0 },
              { category: "superior", hotelName: "", pricePerPerson: 0 },
            ];
          }
          
          return {
            destination: dest?.destination || "",
            nights: dest?.nights || 1,  // Changed default to 1 instead of 0
            hotels: hotels
          };
        });

        // Group stay locations by state
        const grouped = {};
        initializedStayLocations.forEach(item => {
          const stateKey = item?.state || "Unknown";
          if (!grouped[stateKey]) {
            grouped[stateKey] = [];
          }
          grouped[stateKey].push(item);
        });

        setGroupedStayLocations(grouped);
        
        setPkg({
          // Step 1 Fields
          tourType: safeCurrent.tourType || "Domestic",
          packageCategory: safeCurrent.packageCategory || "",
          packageSubType: Array.isArray(safeCurrent.packageSubType) ? safeCurrent.packageSubType : 
                         (safeCurrent.packageSubType ? [safeCurrent.packageSubType] : []),
          destinationCountry: safeCurrent.destinationCountry || "India",
          sector: safeCurrent.sector || "",
          stayLocations: initializedStayLocations,
          
          // Step 2 Fields
          title: safeCurrent.title || "",
          arrivalCity: safeCurrent.arrivalCity || "",
          departureCity: safeCurrent.departureCity || "",
          notes: safeCurrent.notes || "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
          bannerImage: safeCurrent.bannerImage || "",
          validFrom: safeCurrent.validFrom || null,
          validTill: safeCurrent.validTill || null,
          days: initializedDays,
          perPerson: safeCurrent.perPerson || 1,
          mealPlan: safeCurrent.mealPlan || { planType: "", description: "" },
          destinationNights: initializedDestinationNights,
          
          // Policy Fields
          policy: {
            inclusionPolicy: getPolicyContent(safeCurrent.policy?.inclusionPolicy),
            exclusionPolicy: getPolicyContent(safeCurrent.policy?.exclusionPolicy),
            paymentPolicy: getPolicyContent(safeCurrent.policy?.paymentPolicy),
            cancellationPolicy: getPolicyContent(safeCurrent.policy?.cancellationPolicy),
            termsAndConditions: getPolicyContent(safeCurrent.policy?.termsAndConditions)
          },
          
          // Status
          status: safeCurrent.status || "deactive",
          _id: safeCurrent._id || id
        });

        setSelectedCountry(safeCurrent.destinationCountry || "India");
        setInitialized(true);
        setError(null);

        // Fetch states for the country
        if (safeCurrent.destinationCountry) {
          dispatch(fetchStatesByCountry(safeCurrent.destinationCountry));
        }
      } catch (err) {
        console.error("Error initializing package data:", err);
        setError("Error processing package data");
      }
    }
  }, [current, initialized, id, dispatch]);

  // Loading state
  if (loading && !initialized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading package data...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/tourpackage")}>
          Go Back
        </Button>
      </Box>
    );
  }

  // No data state
  if (!current && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No package data found
        </Alert>
        <Button variant="contained" onClick={() => navigate("/tourpackage")}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Handlers with safety checks
  const handleTourTypeChange = (e) => {
    const selectedType = e?.target?.value || "Domestic";
    setPkg(prev => ({
      ...prev,
      tourType: selectedType,
      destinationCountry: DOMESTIC_TOUR_TYPES.includes(selectedType) ? "India" : prev.destinationCountry,
      sector: "",
      packageCategory: "",
      packageSubType: [],
      stayLocations: []
    }));
    setSelectedCountry(DOMESTIC_TOUR_TYPES.includes(selectedType) ? "India" : "");
    setGroupedStayLocations({});
    dispatch(clearStates());
    dispatch(clearCities());

    if (DOMESTIC_TOUR_TYPES.includes(selectedType)) {
      dispatch(fetchStatesByCountry("India"));
    }
  };

  const handleCountryChange = (countryName) => {
    if (!countryName) return;
    setSelectedCountry(countryName);
    setPkg(prev => ({
      ...prev,
      destinationCountry: countryName,
      sector: "",
      packageCategory: "",
      packageSubType: [],
      stayLocations: []
    }));
    setGroupedStayLocations({});
    dispatch(clearStates());
    dispatch(clearCities());
    dispatch(fetchStatesByCountry(countryName));
  };

  const handleSectorChange = (selectedStateName) => {
    setPkg(prev => ({ ...prev, sector: selectedStateName || "" }));
  };

  const handleStayChange = (index, field, value) => {
    if (!pkg.stayLocations || index < 0 || index >= pkg.stayLocations.length) return;
    
    const updated = [...pkg.stayLocations];
    if (field === "nights") {
      updated[index] = {
        ...updated[index],
        [field]: parseInt(value) || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value || ""
      };
    }
    setPkg({ ...pkg, stayLocations: updated });

    // Update grouped display
    const grouped = {};
    updated.forEach(item => {
      const stateKey = item?.state || "Unknown";
      if (!grouped[stateKey]) {
        grouped[stateKey] = [];
      }
      grouped[stateKey].push(item);
    });
    setGroupedStayLocations(grouped);
  };

  const handleRemoveCity = (cityToRemove) => {
    if (!cityToRemove || !pkg.stayLocations) return;
    
    const updated = pkg.stayLocations.filter((item) =>
      !(item?.city === cityToRemove.city && item?.state === cityToRemove.state)
    );
    setPkg({ ...pkg, stayLocations: updated });
    
    // Update grouped display
    const grouped = {};
    updated.forEach(item => {
      const stateKey = item?.state || "Unknown";
      if (!grouped[stateKey]) {
        grouped[stateKey] = [];
      }
      grouped[stateKey].push(item);
    });
    setGroupedStayLocations(grouped);
  };

  const handleDayChange = (index, field, value) => {
    if (!pkg.days || index < 0 || index >= pkg.days.length) return;
    
    const updated = [...pkg.days];
    if (field === "selectedSightseeing") {
      updated[index] = {
        ...updated[index],
        [field]: Array.isArray(value) ? value : []
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setPkg({ ...pkg, days: updated });
  };

  const handleAddDay = () => {
    setPkg({
      ...pkg,
      days: [
        ...(pkg.days || []),
        {
          title: "",
          notes: "",
          aboutCity: "",
          dayImage: null,
          sightseeing: [],
          selectedSightseeing: [],
        },
      ],
    });
  };

  const handleRemoveDay = (index) => {
    if (!pkg.days) return;
    setPkg({
      ...pkg,
      days: pkg.days.filter((_, i) => i !== index),
    });
  };

  const handleAddSightseeing = (dayIndex, e) => {
    if (!e || !e.key || !pkg.days || dayIndex < 0 || dayIndex >= pkg.days.length) return;
    
    if (e.key === "Enter" && e.target.value?.trim() !== "") {
      e.preventDefault();
      const updatedDays = [...pkg.days];
      const newSight = e.target.value.trim();
      
      if (!updatedDays[dayIndex].sightseeing) {
        updatedDays[dayIndex].sightseeing = [];
      }
      if (!updatedDays[dayIndex].selectedSightseeing) {
        updatedDays[dayIndex].selectedSightseeing = [];
      }
      
      updatedDays[dayIndex].sightseeing.push(newSight);
      updatedDays[dayIndex].selectedSightseeing.push(newSight);
      
      setPkg({ ...pkg, days: updatedDays });
      e.target.value = "";
    }
  };

  // NEW: Handler for destination nights change

const handleDestinationNightsChange = (destIndex, value) => {
  if (!pkg.destinationNights || destIndex < 0 || destIndex >= pkg.destinationNights.length) return;
  
  const updatedNights = [...pkg.destinationNights];
  updatedNights[destIndex].nights = parseInt(value) || 0;
  
  setPkg({ ...pkg, destinationNights: updatedNights });
  console.log(`Updated nights for destination ${destIndex}:`, value);
};

// Hotel name change handler
const handleHotelChange = (destIndex, category, hotelName) => {
  if (!pkg.destinationNights || destIndex < 0 || destIndex >= pkg.destinationNights.length) return;
  
  const updatedNights = [...pkg.destinationNights];
  const catIndex = ["standard", "deluxe", "superior"].indexOf(category);
  
  // Ensure hotels array exists
  if (!updatedNights[destIndex].hotels) {
    updatedNights[destIndex].hotels = [
      { category: "standard", hotelName: "", pricePerPerson: 0 },
      { category: "deluxe", hotelName: "", pricePerPerson: 0 },
      { category: "superior", hotelName: "", pricePerPerson: 0 },
    ];
  }
  
  // Ensure the specific hotel object exists
  if (!updatedNights[destIndex].hotels[catIndex]) {
    updatedNights[destIndex].hotels[catIndex] = { category, hotelName: "", pricePerPerson: 0 };
  }
  
  // Update the hotel name
  updatedNights[destIndex].hotels[catIndex] = {
    ...updatedNights[destIndex].hotels[catIndex],
    category,
    hotelName: hotelName,
  };
  
  setPkg({ ...pkg, destinationNights: updatedNights });
  console.log(`Updated ${category} hotel for destination ${destIndex}:`, hotelName);
};

// Price change handler
const handlePriceChange = (destIndex, category, price) => {
  if (!pkg.destinationNights || destIndex < 0 || destIndex >= pkg.destinationNights.length) return;
  
  const updatedNights = [...pkg.destinationNights];
  const catIndex = ["standard", "deluxe", "superior"].indexOf(category);
  const priceValue = price === "" ? 0 : Number(price);
  
  // Ensure hotels array exists
  if (!updatedNights[destIndex].hotels) {
    updatedNights[destIndex].hotels = [
      { category: "standard", hotelName: "", pricePerPerson: 0 },
      { category: "deluxe", hotelName: "", pricePerPerson: 0 },
      { category: "superior", hotelName: "", pricePerPerson: 0 },
    ];
  }
  
  // Ensure the specific hotel object exists
  if (!updatedNights[destIndex].hotels[catIndex]) {
    updatedNights[destIndex].hotels[catIndex] = { category, hotelName: "", pricePerPerson: 0 };
  }
  
  // Update the price
  updatedNights[destIndex].hotels[catIndex] = {
    ...updatedNights[destIndex].hotels[catIndex],
    category,
    pricePerPerson: priceValue,
  };
  
  setPkg({ ...pkg, destinationNights: updatedNights });
  console.log(`Updated ${category} price for destination ${destIndex}:`, priceValue);
};

  // Banner Upload Handler
  const handleBannerUpload = (file) => {
    if (!pkg._id || !file) {
      alert("Package ID not found or no file selected");
      return;
    }

    dispatch(uploadPackageBanner({ id: pkg._id, file }))
      .unwrap()
      .then((response) => {
        if (response?.package?.bannerImage) {
          setPkg(prev => ({ ...prev, bannerImage: response.package.bannerImage }));
          alert("✅ Banner updated successfully");
        } else if (response?.bannerImage) {
          setPkg(prev => ({ ...prev, bannerImage: response.bannerImage }));
          alert("✅ Banner updated successfully");
        } else {
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Banner updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading banner:", error);
        alert("❌ Failed to update banner: " + (error.message || "Unknown error"));
      });
  };

  // Day Image Upload Handler
  const handleDayImageUpload = (dayIndex, file) => {
    if (!pkg._id || !file) {
      alert("Package ID not found or no file selected");
      return;
    }

    dispatch(uploadPackageDayImage({
      id: pkg._id,
      dayIndex: dayIndex,
      file: file
    }))
      .unwrap()
      .then((response) => {
        if (response?.package?.days?.[dayIndex]?.dayImage) {
          const updatedDays = [...pkg.days];
          updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            dayImage: response.package.days[dayIndex].dayImage
          };
          setPkg(prev => ({ ...prev, days: updatedDays }));
          alert("✅ Day image updated successfully");
        } else {
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Day image updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading day image:", error);
        alert("❌ Failed to update day image: " + (error.message || "Unknown error"));
      });
  };

  const handleSave = () => {
    if (!pkg || !pkg._id) {
      alert("Package ID not found");
      return;
    }

    try {
      // Convert HTML back to array format for backend
      const convertHtmlToArray = (htmlString) => {
        if (!htmlString || htmlString.trim() === '') return [];
        return [htmlString];
      };

      // Validate stayLocations
      const validatedStayLocations = (pkg.stayLocations || []).map((location, index) => ({
        city: location?.city?.trim() || `City ${index + 1}`,
        nights: parseInt(location?.nights) || 1,
        state: location?.state || pkg.sector || "",
        country: location?.country || pkg.destinationCountry || "India"
      }));

      // Validate destinationNights - FIXED: Preserve all edited data including nights
      const validatedDestinationNights = (pkg.destinationNights || []).map(dest => ({
        destination: dest.destination || "",
        nights: parseInt(dest.nights) || 1,
        hotels: (dest.hotels || []).map(hotel => ({
          category: hotel.category || "",
          hotelName: hotel.hotelName || "",
          pricePerPerson: hotel.pricePerPerson || 0
        }))
      }));
const perPersonValue = parseInt(pkg.perPerson) || 1;
    
    console.log("Saving perPerson value:", perPersonValue);
    console.log("Original pkg.perPerson:", pkg.perPerson);
      const transformedData = {
        // Step 1 Fields
        tourType: pkg.tourType || "Domestic",
        destinationCountry: pkg.destinationCountry || "India",
        sector: pkg.sector || "",
        packageCategory: pkg.packageCategory || "",
        packageSubType: Array.isArray(pkg.packageSubType) ? pkg.packageSubType : [pkg.packageSubType || ""],
        stayLocations: validatedStayLocations,
        
        // Step 2 Fields
        title: pkg.title || "",
        arrivalCity: pkg.arrivalCity || "",
        departureCity: pkg.departureCity || "",
        notes: pkg.notes || "",
        bannerImage: pkg.bannerImage || "",
        validFrom: pkg.validFrom || null,
        validTill: pkg.validTill || null,
        days: (pkg.days || []).map(day => ({
          title: day?.title || "",
          notes: day?.notes || "",
          aboutCity: day?.aboutCity || "",
          sightseeing: Array.isArray(day?.sightseeing) ? day.sightseeing : [],
          selectedSightseeing: Array.isArray(day?.selectedSightseeing) ? day.selectedSightseeing : [],
          dayImage: typeof day?.dayImage === "string" ? day.dayImage : "",
        })),
        
    perPerson: perPersonValue, 
        mealPlan: pkg.mealPlan || { planType: "", description: "" },
        destinationNights: validatedDestinationNights,
        
        // Policy Fields
        policy: {
          inclusionPolicy: convertHtmlToArray(pkg.policy?.inclusionPolicy),
          exclusionPolicy: convertHtmlToArray(pkg.policy?.exclusionPolicy),
          paymentPolicy: convertHtmlToArray(pkg.policy?.paymentPolicy),
          cancellationPolicy: convertHtmlToArray(pkg.policy?.cancellationPolicy),
          termsAndConditions: convertHtmlToArray(pkg.policy?.termsAndConditions)
        },
        
        // Status
        status: pkg.status || "deactive"
      };

      console.log("Saving package data:", transformedData);

      dispatch(updatePackageStep1({ id: pkg._id, data: transformedData }))
        .unwrap()
        .then(() => {
          alert("✅ Package updated successfully");
          navigate("/tourpackage");
        })
        .catch((err) => {
          console.error("❌ Error updating package:", err);
          alert("❌ Failed to update package: " + (err.message || "Please try again"));
        });
    } catch (err) {
      console.error("Error preparing data for save:", err);
      alert("Error preparing data for save");
    }
  };

  const getStayLocationsByState = () => {
    return groupedStayLocations || {};
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: "#eef3f8", minHeight: "100vh" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            ✈️ Edit Package
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ mr: 1, borderRadius: 2 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              sx={{ borderRadius: 2 }}
            >
              Convert to Quotation
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid size={{xs:12, md:8}}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3, background: "white" }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <EditIcon sx={{ mr: 1 }} /> Package Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* ===== STEP 1 FIELDS ===== */}
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 2 }}>
                📍 Step 1: Basic Information
              </Typography>

              {/* Tour Type */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{xs:12}}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel>Tour Type *</FormLabel>
                    <RadioGroup
                      row
                      name="tourType"
                      value={pkg.tourType || "Domestic"}
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
                  </FormControl>
                </Grid>

                {/* Destination Country - Only for International */}
                {pkg.tourType === "International" && (
                  <Grid size={{xs:12, md:6}}>
                    <Autocomplete
                      fullWidth
                      options={Array.isArray(countries) ? countries.map((c) => c?.name || "") : []}
                      value={pkg.destinationCountry || ""}
                      onChange={(e, newValue) => {
                        if (newValue) {
                          handleCountryChange(newValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Destination Country *" />
                      )}
                    />
                  </Grid>
                )}

                {/* Sector/State */}
                <Grid size={{xs:12, md:6}}>
                  <Autocomplete
                    fullWidth
                    options={Array.isArray(states) ? states.map((state) => state?.name || "") : []}
                    value={pkg.sector || ""}
                    onChange={(e, newValue) => {
                      handleSectorChange(newValue || "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={DOMESTIC_TOUR_TYPES.includes(pkg.tourType) ? "State *" : "State/Province *"}
                      />
                    )}
                  />
                </Grid>

                {/* Package Category */}
                <Grid size={{xs:12, md:6}}>
                  <Autocomplete
                    fullWidth
                    options={PACKAGE_CATEGORIES}
                    value={pkg.packageCategory || ""}
                    onChange={(e, newValue) => {
                      setPkg({ ...pkg, packageCategory: newValue || "" });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Package Category *" />
                    )}
                  />
                </Grid>

                {/* Package Sub Type */}
                <Grid size={{xs:12, md:6}}>
                  <Autocomplete
                    multiple
                    freeSolo
                    fullWidth
                    options={[]}
                    value={pkg.packageSubType || []}
                    onChange={(e, newValue) => {
                      setPkg({ ...pkg, packageSubType: newValue || [] });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Package Sub Type *" />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Stay Locations */}
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                🏨 Stay Locations
              </Typography>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f8f9fa" }}>
                {Object.entries(getStayLocationsByState()).length > 0 ? (
                  Object.entries(getStayLocationsByState()).map(([state, cities]) => (
                    <Box key={state} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                        {state}
                      </Typography>
                      {Array.isArray(cities) && cities.map((item, index) => {
                        const globalIndex = pkg.stayLocations?.findIndex(
                          stayItem => stayItem?.city === item?.city && stayItem?.state === item?.state
                        );

                        if (globalIndex === -1 || globalIndex === undefined) return null;

                        return (
                          <Paper
                            key={`${item?.city}-${item?.state}-${index}`}
                            sx={{
                              p: 2,
                              mb: 2,
                              backgroundColor: "#e3f2fd",
                              borderRadius: 2
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid size={{xs:12, md:5}}>
                                <TextField
                                  label="City"
                                  fullWidth
                                  size="small"
                                  value={item?.city || ""}
                                  onChange={(e) => handleStayChange(globalIndex, "city", e.target.value)}
                                />
                              </Grid>
                              <Grid size={{xs:12, md:3}}>
                                <TextField
                                  label="Nights"
                                  type="number"
                                  fullWidth
                                  size="small"
                                  value={item?.nights || 1}
                                  onChange={(e) => handleStayChange(globalIndex, "nights", e.target.value)}
                                  inputProps={{ min: 1 }}
                                />
                              </Grid>
                              <Grid size={{xs:12, md:4}}>
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                  <IconButton
                                    size="small"
                                    disabled={globalIndex === 0}
                                    onClick={() => {
                                      const newList = [...pkg.stayLocations];
                                      const [moved] = newList.splice(globalIndex, 1);
                                      newList.splice(globalIndex - 1, 0, moved);
                                      setPkg({ ...pkg, stayLocations: newList });
                                    }}
                                  >
                                    ⬆️
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    disabled={globalIndex === pkg.stayLocations.length - 1}
                                    onClick={() => {
                                      const newList = [...pkg.stayLocations];
                                      const [moved] = newList.splice(globalIndex, 1);
                                      newList.splice(globalIndex + 1, 0, moved);
                                      setPkg({ ...pkg, stayLocations: newList });
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
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No stay locations added yet
                  </Typography>
                )}
              </Paper>

              {/* ===== STEP 2 FIELDS ===== */}
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 4 }}>
                📅 Step 2: Tour Details
              </Typography>

              {/* Basic Info */}
              <Grid container spacing={2}>
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Package Title"
                    fullWidth
                    value={pkg.title || ""}
                    onChange={(e) => setPkg({ ...pkg, title: e.target.value })}
                  />
                </Grid>
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Arrival City"
                    fullWidth
                    value={pkg.arrivalCity || ""}
                    onChange={(e) => setPkg({ ...pkg, arrivalCity: e.target.value })}
                  />
                </Grid>
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Departure City"
                    fullWidth
                    value={pkg.departureCity || ""}
                    onChange={(e) => setPkg({ ...pkg, departureCity: e.target.value })}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={pkg.notes || ""}
                    onChange={(e) => setPkg({ ...pkg, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* Validity */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                Package Validity
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{xs:12, md:6}}>
                  <DatePicker
                    label="Valid From"
                    value={pkg.validFrom ? new Date(pkg.validFrom) : null}
                    onChange={(newValue) => setPkg({ ...pkg, validFrom: newValue })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{xs:12, md:6}}>
                  <DatePicker
                    label="Valid Till"
                    value={pkg.validTill ? new Date(pkg.validTill) : null}
                    onChange={(newValue) => setPkg({ ...pkg, validTill: newValue })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>

              {/* Banner Image */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                Banner Image
              </Typography>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 2, backgroundColor: "#f5f5f5", mb: 3 }}>
                {pkg.bannerImage ? (
                  <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: 200 }}>
                    <img
                      src={pkg.bannerImage}
                      alt="Banner"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography color="text.secondary">No banner image</Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  component="label"
                  sx={{ mt: 2 }}
                >
                  Upload Banner
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleBannerUpload(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
              </Box>

              {/* Days Section */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                Itinerary Days
              </Typography>

              {Array.isArray(pkg.days) && pkg.days.map((day, index) => (
                <Paper key={index} sx={{ p: 2, mb: 3, border: "1px solid #ccc" }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight="bold">Day {index + 1}</Typography>
                    {index > 0 && (
                      <IconButton color="error" onClick={() => handleRemoveDay(index)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{xs:12, md:6}}>
                      <TextField
                        fullWidth
                        label="Day Title"
                        value={day?.title || ""}
                        onChange={(e) => handleDayChange(index, "title", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{xs:12, md:6}}>
                      <TextField
                        fullWidth
                        label="Day Notes"
                        value={day?.notes || ""}
                        onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        multiline
                        rows={5}
                        label="About City"
                        value={day?.aboutCity || ""}
                        onChange={(e) => handleDayChange(index, "aboutCity", e.target.value)}
                      />
                    </Grid>
                    
                    {/* Day Image */}
                    <Grid size={{xs:12, md:6}}>
                      <Box sx={{ border: "1px dashed #ccc", p: 1, borderRadius: 1, textAlign: "center" }}>
                        {day?.dayImage ? (
                          <img src={day.dayImage} alt={`Day ${index + 1}`} style={{ maxHeight: 100, maxWidth: "100%" }} />
                        ) : (
                          <Typography variant="caption">No image</Typography>
                        )}
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          fullWidth
                          sx={{ mt: 1 }}
                        >
                          {day?.dayImage ? "Change" : "Upload"} Image
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleDayImageUpload(index, e.target.files[0]);
                              }
                            }}
                          />
                        </Button>
                      </Box>
                    </Grid>

                    {/* Sightseeing */}
                    <Grid size={{xs:12, md:6}}>
                      <TextField
                        fullWidth
                        placeholder="Add Sightseeing (press Enter)"
                        onKeyDown={(e) => handleAddSightseeing(index, e)}
                      />
                      <Box sx={{ mt: 1, maxHeight: 150, overflowY: "auto" }}>
                        {Array.isArray(day?.selectedSightseeing) && day.selectedSightseeing.map((s, i) => (
                          <Chip
                            key={i}
                            label={s}
                            onDelete={() => {
                              const newSelected = [...(day.selectedSightseeing || [])];
                              newSelected.splice(i, 1);
                              handleDayChange(index, "selectedSightseeing", newSelected);
                            }}
                            size="small"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Button variant="contained" sx={{ mt: 2, mb: 3 }} onClick={handleAddDay}>
                + Add Day
              </Button>

              {/* Meal Plan & Per Person */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid size={{xs:12, md:6}}>
  <TextField
    fullWidth
    type="number"
    label="Number of Persons"
    value={pkg.perPerson || 1}
    onChange={(e) => {
      const value = e.target.value === "" ? 1 : Number(e.target.value);
      setPkg({ ...pkg, perPerson: value });
    }}
    inputProps={{ min: 1 }}
  />
</Grid>
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    select
                    label="Meal Plan"
                    value={pkg.mealPlan?.planType || ""}
                    onChange={(e) => setPkg({
                      ...pkg,
                      mealPlan: { ...(pkg.mealPlan || {}), planType: e.target.value }
                    })}
                    fullWidth
                  >
                    <MenuItem value="AP">AP (All meals)</MenuItem>
                    <MenuItem value="MAP">MAP (Breakfast + Dinner)</MenuItem>
                    <MenuItem value="CP">CP (Breakfast only)</MenuItem>
                    <MenuItem value="EP">EP (Room only)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
{/* Hotels Table - Fully Editable */}
<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
  🏨 Hotel Selection & Pricing
</Typography>

<Table sx={{ mb: 3 }}>
  <TableHead>
    <TableRow>
      <TableCell>Destination</TableCell>
      <TableCell>Nights</TableCell>
      <TableCell>Standard Hotel</TableCell>
      <TableCell>Deluxe Hotel</TableCell>
      <TableCell>Superior Hotel</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {Array.isArray(pkg.destinationNights) && pkg.destinationNights.length > 0 ? (
      pkg.destinationNights.map((dest, index) => {
        // Ensure hotels array exists with proper structure
        const hotels = dest.hotels && dest.hotels.length === 3 ? dest.hotels : [
          { category: "standard", hotelName: "", pricePerPerson: 0 },
          { category: "deluxe", hotelName: "", pricePerPerson: 0 },
          { category: "superior", hotelName: "", pricePerPerson: 0 },
        ];

        return (
          <TableRow key={index}>
            {/* Destination */}
            <TableCell>
              <TextField
                size="small"
                value={dest.destination || ""}
                onChange={(e) => {
                  const updated = [...pkg.destinationNights];
                  updated[index] = {
                    ...updated[index],
                    destination: e.target.value
                  };
                  setPkg({ ...pkg, destinationNights: updated });
                }}
                fullWidth
              />
            </TableCell>

            {/* Nights */}
            <TableCell>
              <TextField
                type="number"
                size="small"
                value={dest.nights || 1}
                onChange={(e) => {
                  const updated = [...pkg.destinationNights];
                  updated[index] = {
                    ...updated[index],
                    nights: parseInt(e.target.value) || 1
                  };
                  setPkg({ ...pkg, destinationNights: updated });
                }}
                inputProps={{ min: 1 }}
                fullWidth
              />
            </TableCell>

            {/* Standard */}
            <TableCell>
              <Box sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  value={hotels[0]?.hotelName || ""}
                  onChange={(e) => {
                    const updated = [...pkg.destinationNights];
                    if (!updated[index].hotels) {
                      updated[index].hotels = [
                        { category: "standard", hotelName: "", pricePerPerson: 0 },
                        { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                        { category: "superior", hotelName: "", pricePerPerson: 0 },
                      ];
                    } else {
                      updated[index].hotels = [...updated[index].hotels];
                    }
                    updated[index].hotels[0] = {
                      ...updated[index].hotels[0],
                      category: "standard",
                      hotelName: e.target.value
                    };
                    setPkg({ ...pkg, destinationNights: updated });
                  }}
                  placeholder="Standard Hotel"
                  fullWidth
                />
              </Box>
              <TextField
                type="number"
                size="small"
                value={hotels[0]?.pricePerPerson || ""}
                onChange={(e) => {
                  const updated = [...pkg.destinationNights];
                  if (!updated[index].hotels) {
                    updated[index].hotels = [
                      { category: "standard", hotelName: "", pricePerPerson: 0 },
                      { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                      { category: "superior", hotelName: "", pricePerPerson: 0 },
                    ];
                  } else {
                    updated[index].hotels = [...updated[index].hotels];
                  }
                  updated[index].hotels[0] = {
                    ...updated[index].hotels[0],
                    category: "standard",
                    pricePerPerson: e.target.value === "" ? 0 : Number(e.target.value)
                  };
                  setPkg({ ...pkg, destinationNights: updated });
                }}
                placeholder="Price"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </TableCell>

            {/* Deluxe */}
            <TableCell>
              <Box sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  value={hotels[1]?.hotelName || ""}
                  onChange={(e) => {
                    const updated = [...pkg.destinationNights];
                    if (!updated[index].hotels) {
                      updated[index].hotels = [
                        { category: "standard", hotelName: "", pricePerPerson: 0 },
                        { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                        { category: "superior", hotelName: "", pricePerPerson: 0 },
                      ];
                    } else {
                      updated[index].hotels = [...updated[index].hotels];
                    }
                    updated[index].hotels[1] = {
                      ...updated[index].hotels[1],
                      category: "deluxe",
                      hotelName: e.target.value
                    };
                    setPkg({ ...pkg, destinationNights: updated });
                  }}
                  placeholder="Deluxe Hotel"
                  fullWidth
                />
              </Box>
              <TextField
                type="number"
                size="small"
                value={hotels[1]?.pricePerPerson || ""}
                onChange={(e) => {
                    const updated = [...pkg.destinationNights];
                  if (!updated[index].hotels) {
                    updated[index].hotels = [
                      { category: "standard", hotelName: "", pricePerPerson: 0 },
                      { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                      { category: "superior", hotelName: "", pricePerPerson: 0 },
                    ];
                  } else {
                    updated[index].hotels = [...updated[index].hotels];
                  }
                  updated[index].hotels[1] = {
                    ...updated[index].hotels[1],
                    category: "deluxe",
                    pricePerPerson: e.target.value === "" ? 0 : Number(e.target.value)
                  };
                  setPkg({ ...pkg, destinationNights: updated });
                }}
                placeholder="Price"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </TableCell>

            {/* Superior */}
            <TableCell>
              <Box sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  value={hotels[2]?.hotelName || ""}
                  onChange={(e) => {
                    const updated = [...pkg.destinationNights];
                    if (!updated[index].hotels) {
                      updated[index].hotels = [
                        { category: "standard", hotelName: "", pricePerPerson: 0 },
                        { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                        { category: "superior", hotelName: "", pricePerPerson: 0 },
                      ];
                    } else {
                      updated[index].hotels = [...updated[index].hotels];
                    }
                    updated[index].hotels[2] = {
                      ...updated[index].hotels[2],
                      category: "superior",
                      hotelName: e.target.value
                    };
                    setPkg({ ...pkg, destinationNights: updated });
                  }}
                  placeholder="Superior Hotel"
                  fullWidth
                />
              </Box>
              <TextField
                type="number"
                size="small"
                value={hotels[2]?.pricePerPerson || ""}
                onChange={(e) => {
                  const updated = [...pkg.destinationNights];
                  if (!updated[index].hotels) {
                    updated[index].hotels = [
                      { category: "standard", hotelName: "", pricePerPerson: 0 },
                      { category: "deluxe", hotelName: "", pricePerPerson: 0 },
                      { category: "superior", hotelName: "", pricePerPerson: 0 },
                    ];
                  } else {
                    updated[index].hotels = [...updated[index].hotels];
                  }
                  updated[index].hotels[2] = {
                    ...updated[index].hotels[2],
                    category: "superior",
                    pricePerPerson: e.target.value === "" ? 0 : Number(e.target.value)
                  };
                  setPkg({ ...pkg, destinationNights: updated });
                }}
                placeholder="Price"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </TableCell>
          </TableRow>
        );
      })
    ) : (
      <TableRow>
        <TableCell colSpan={5} align="center">
          <Typography color="text.secondary">
            No destinations found
          </Typography>
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>

              {/* Status */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                Status
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{xs:12, md:4}}>
                  <TextField
                    select
                    label="Package Status"
                    fullWidth
                    value={pkg.status || "deactive"}
                    onChange={(e) => setPkg({ ...pkg, status: e.target.value })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="deactive">Deactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* Policy Section */}
              <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mt: 4, mb: 3 }}>
                📋 Package Policies
              </Typography>

              <Grid container spacing={3}>
                {[
                  { key: 'inclusionPolicy', label: '✅ Inclusion Policy', helper: 'What is included in the package' },
                  { key: 'exclusionPolicy', label: '❌ Exclusion Policy', helper: 'What is not included' },
                  { key: 'paymentPolicy', label: '💰 Payment Policy', helper: 'Payment terms' },
                  { key: 'cancellationPolicy', label: '⏰ Cancellation Policy', helper: 'Cancellation rules' },
                  { key: 'termsAndConditions', label: '📄 Terms & Conditions', helper: 'General terms' }
                ].map((policy) => (
                  <Grid size={{xs:12}} key={policy.key}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        {policy.label}
                      </Typography>

                      <Box sx={{
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        overflow: 'hidden',
                        '& .ql-toolbar': { borderBottom: '1px solid #ccc', backgroundColor: '#f8f9fa' },
                        '& .ql-container': { minHeight: '200px', fontSize: '14px' },
                        '& .ql-editor': { minHeight: '200px' }
                      }}>
                        <ReactQuill
                          value={pkg.policy?.[policy.key] || ""}
                          onChange={(content) => setPkg(prev => ({
                            ...prev,
                            policy: { ...(prev.policy || {}), [policy.key]: content }
                          }))}
                          modules={{
                            toolbar: [
                              [{ 'font': [] }, { 'size': [] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'color': [] }, { 'background': [] }],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              [{ 'indent': '-1' }, { 'indent': '+1' }],
                              [{ 'align': [] }],
                              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                              ['blockquote', 'code-block'],
                              ['link', 'image', 'video'],
                              ['clean']
                            ]
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        💡 {policy.helper}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Save Button */}
              <Box textAlign="center" sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveIcon />}
                  sx={{ px: 5, borderRadius: 2 }}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save All Changes"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right Info Panel */}
          <Grid size={{xs:12, md:4}}>
            {/* Package Information Card */}
            <Paper elevation={6} sx={{ p: 3, borderRadius: 4, mb: 3, background: "#f5f7fa" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📋 Package Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Tour Type</Typography>
                <Typography variant="body1">{pkg.tourType || "--"}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Country</Typography>
                <Typography variant="body1">{pkg.destinationCountry || "--"}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Sector</Typography>
                <Typography variant="body1">{pkg.sector || "--"}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Category</Typography>
                <Typography variant="body1">{pkg.packageCategory || "--"}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Sub Type</Typography>
                <Typography variant="body1">
                  {Array.isArray(pkg.packageSubType) ? pkg.packageSubType.join(", ") : pkg.packageSubType || "--"}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Validity</Typography>
                <Typography variant="body1">
                  {pkg.validFrom ? new Date(pkg.validFrom).toLocaleDateString() : "--"} to {pkg.validTill ? new Date(pkg.validTill).toLocaleDateString() : "--"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Chip
                  label={pkg.status?.toUpperCase() || "DEACTIVE"}
                  color={pkg.status === "active" ? "success" : "default"}
                  size="small"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Stay Locations</Typography>
                <Typography variant="body1">{pkg.stayLocations?.length || 0}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Total Nights</Typography>
                <Typography variant="body1">
                  {(pkg.stayLocations || []).reduce((sum, loc) => sum + (loc?.nights || 0), 0)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Days in Itinerary</Typography>
                <Typography variant="body1">{pkg.days?.length || 0}</Typography>
              </Box>
            </Paper>

            {/* Quick Actions Card */}
            <Paper elevation={6} sx={{ p: 3, borderRadius: 4, background: "#f5f7fa" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ⚡ Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button variant="contained" fullWidth sx={{ mb: 2, borderRadius: 3 }} startIcon={<DownloadIcon />}>
                Download PDF
              </Button>
              <Button variant="contained" fullWidth sx={{ mb: 2, borderRadius: 3, backgroundColor: "#9c27b0" }} startIcon={<DescriptionIcon />}>
                Convert to Quotation
              </Button>
              <Button variant="contained" fullWidth sx={{ borderRadius: 3, backgroundColor: "#d32f2f" }} startIcon={<DeleteIcon />}>
                Delete Package
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default PackageEditView;