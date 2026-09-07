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
  Card,
  CardContent,
  Snackbar,
  Tooltip,
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
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AutoAwesome as AutoAwesomeIcon,
  PhotoLibrary as PhotoLibraryIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { ArrowBack, Delete, Check } from "@mui/icons-material";
import axios from "../../../../utils/axios";
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
  clearCurrent,
} from "../../../../features/package/packageSlice";
import { fetchHotels, createHotelStep1 } from "../../../../features/hotel/hotelSlice";
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchDomesticCities,
  fetchInternationalCities,
  clearStates,
  clearCities,
} from "../../../../features/location/locationSlice";
import {
  getLeadOptions,
  addLeadOption,
  deleteLeadOption,
} from "../../../../features/leads/leadSlice";
import LeadOptionsManager from "../../../../Components/LeadOptionsManager";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Constants
const TOUR_TYPES = ["Domestic", "International"];
const PACKAGE_CATEGORIES = ["Yatra", "Holidays", "Special", "Latest"];
const DOMESTIC_TOUR_TYPES = ["Domestic"];

const generateImpressiveTitles = ({
  nights,
  days,
  sector,
  country,
  tourType,
  packageCategory,
  stayLocations,
}) => {
  if (!nights || nights <= 0) return [];
  const safeDays = days > 0 ? days : nights + 1;
  const dur = `${nights} Nights / ${safeDays} Days`;
  const dur0 = `${String(nights).padStart(2, "0")} Nights / ${String(safeDays).padStart(2, "0")} Days`;
  const durShort = `${nights}N/${safeDays}D`;

  const dest = (
    sector ||
    country ||
    (Array.isArray(stayLocations) && stayLocations[0]?.city) ||
    "Scenic Tour"
  ).trim();

  const cityList = (stayLocations || [])
    .map((s) => (typeof s === "string" ? s.trim() : s?.city?.trim()))
    .filter(Boolean);

  const cityChain = (stayLocations || [])
    .filter((s) => (typeof s === "string" ? s.trim() : s?.city?.trim()))
    .map((s) => {
      const c = typeof s === "string" ? s.trim() : s.city.trim();
      const n = typeof s === "object" ? Number(s.nights) || 1 : 1;
      return `${c} ${n}N`;
    })
    .join(" - ");

  const cityNames =
    cityList.slice(0, 3).join(", ") + (cityList.length > 3 ? " & more" : "");

  const textToCheck = `${dest} ${tourType || ""} ${packageCategory || ""}`.toLowerCase();
  const isSpiritual =
    /kashi|varanasi|ayodhya|puri|char dham|chardham|kedarnath|badrinath|amarnath|haridwar|rishikesh|ujjain|shirdi|vaishno|tirupati|rameshwaram|mathura|vrindavan|yatra|spiritual/i.test(
      textToCheck
    );
  const isHeritage =
    /rajasthan|jaipur|udaipur|jodhpur|jaisalmer|agra|delhi|khajuraho|hampi|mysore|heritage|royal/i.test(
      textToCheck
    );
  const isHills =
    /himachal|kashmir|ladakh|manali|shimla|kullu|uttarakhand|nainital|mussoorie|sikkim|gangtok|darjeeling|ooty|munnar|kodaikanal|meghalaya|shillong|hills|mountain/i.test(
      textToCheck
    );
  const isBeach =
    /goa|andaman|kerala|maldives|bali|phuket|thailand|mauritius|seychelles|dubai|beach|island/i.test(
      textToCheck
    );

  const suggestions = [];

  // 1. Primary Mesmerizing / Scenic (Iconic Yatra signature style)
  suggestions.push({
    label: `🌟 Mesmerizing ${dest} (${dur0})`,
    value: `Mesmerizing ${dest}: ${dur0} Scenic Tour`,
  });

  // 2. Enchanting Getaway
  suggestions.push({
    label: `✨ Enchanting ${dest} (${dur})`,
    value: `Enchanting ${dest} Getaway - ${dur}`,
  });

  // 3. Thematic / Mood-specific
  if (isSpiritual) {
    suggestions.push({
      label: `🕉️ Divine ${dest} Spiritual Yatra`,
      value: `Divine ${dest}: ${dur0} Sacred Yatra`,
    });
  } else if (isHeritage) {
    suggestions.push({
      label: `👑 Royal ${dest} Heritage Tour`,
      value: `Royal ${dest}: ${dur0} Heritage & Palace Tour`,
    });
  } else if (isHills) {
    suggestions.push({
      label: `🏔️ Splendid ${dest} Mountain Paradise`,
      value: `Splendid ${dest}: ${dur0} Mountain Paradise Tour`,
    });
  } else if (isBeach) {
    suggestions.push({
      label: `🌴 Exotic ${dest} Tropical Holiday`,
      value: `Exotic ${dest} Getaway: ${dur0} Holiday`,
    });
  } else {
    suggestions.push({
      label: `💎 Splendid ${dest} Explorer`,
      value: `Splendid ${dest}: ${dur0} Holiday Package`,
    });
  }

  // 4. Best of with key cities
  if (cityNames) {
    suggestions.push({
      label: `📍 Best of ${dest} (${cityNames})`,
      value: `Best of ${dest} (${cityNames}) - ${dur}`,
    });
  }

  // 5. Circuit breakdown with night counts per city
  if (cityChain) {
    suggestions.push({
      label: `🗺️ Circuit (${cityChain})`,
      value: `${dur} ${dest} Tour (${cityChain})`,
    });
  }

  // 6. Classic Two-digit Scenic
  suggestions.push({
    label: `🎯 ${dur0} Classic`,
    value: `${dur0} Scenic ${dest} Holiday`,
  });

  // 7. Short & Punchy
  suggestions.push({
    label: `⚡ ${dest} Explorer - ${durShort}`,
    value: `${dest} Explorer - ${durShort}`,
  });

  return suggestions;
};

const createInitialPackageState = () => ({
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
  notes:
    "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
  bannerImage: "",
  validFrom: null,
  validTill: null,
  days: [],
  perPerson: 1,
  numberOfRooms: 1,
  transportationCostPerDay: 0,
  transportationDays: 0,
  manualCostMargin: 0,
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
    termsAndConditions: "",
  },

  // Status
  status: "deactive",
  _id: null,
});

const PackageEditView = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, loading } = useSelector((state) => state.packages || {});
  const { countries = [], states = [] } = useSelector(
    (state) => state.location || {},
  );

  // State with safe default values
  const [pkg, setPkg] = useState(createInitialPackageState);

  // UI State
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [allCities, setAllCities] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [addMore, setAddMore] = useState("");
  const [currentHotelCategory, setCurrentHotelCategory] = useState("");
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [fetchingImageIndex, setFetchingImageIndex] = useState(null);

  // AI Itinerary & Photo Picker states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState({ isBanner: false, dayIndex: null });
  const [photoPickerSearch, setPhotoPickerSearch] = useState("");
  const [photoPickerResults, setPhotoPickerResults] = useState([]);
  const [photoPickerLoading, setPhotoPickerLoading] = useState(false);
  const [photoPickerPage, setPhotoPickerPage] = useState(1);
  const [photoPickerTotalPages, setPhotoPickerTotalPages] = useState(1);
  const [photoPickerSightseeing, setPhotoPickerSightseeing] = useState([]);
  const [photoPickerCity, setPhotoPickerCity] = useState("");
  const [photoPickerDayTitle, setPhotoPickerDayTitle] = useState("");
  const [isAutoFetchingAll, setIsAutoFetchingAll] = useState(false);
  const [dayPhotoOffsets, setDayPhotoOffsets] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { options = [] } = useSelector((state) => state.leads || {});
  const { hotels, loading: hotelsLoading } = useSelector((state) => state.hotel || {});
  const BOX_HEIGHT = 220;

  useEffect(() => {
    if (id) {
      console.log("Fetching package with ID:", id);
      setInitialized(false);
      setError(null);
      setSelectedCountry("India");
      setPkg(createInitialPackageState());
      dispatch(clearCurrent());
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
    if (!current || initialized) return;
    if (String(current._id || "") !== String(id || "")) return;

    if (current && !initialized) {
      console.log("Current package data received:", current);

      try {
        // Safe data extraction with fallbacks
        const safeCurrent = current || {};

        // Calculate hotel costs safely
        let hotelCosts = { Standard: 0, Deluxe: 0, Superior: 0 };
        if (
          safeCurrent.destinationNights?.length > 0 &&
          safeCurrent.destinationNights[0]?.hotels
        ) {
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
          if (
            !policyArray ||
            !Array.isArray(policyArray) ||
            policyArray.length === 0
          )
            return "";
          if (
            policyArray[0] &&
            (policyArray[0].includes("<p>") || policyArray[0].includes("<h"))
          ) {
            return policyArray[0];
          }
          return policyArray
            .map((item) => (item ? `<p>${item}</p>` : ""))
            .join("");
        };

        // Initialize days safely
        const initializedDays = (safeCurrent.days || []).map((d) => {
          const sight = Array.isArray(d?.sightseeing) ? d.sightseeing : [];
          const sel = Array.isArray(d?.selectedSightseeing) ? d.selectedSightseeing : [];
          return {
            title: d?.title || "",
            notes: d?.notes || "",
            aboutCity: d?.aboutCity || "",
            dayImage: d?.dayImage || "",
            sightseeing: sight,
            selectedSightseeing: sel.length ? sel : [...sight],
          };
        });

        // Initialize stayLocations safely
        const initializedStayLocations = (safeCurrent.stayLocations || []).map(
          (location) => ({
            city: location?.city || "",
            nights: location?.nights || 1,
            state: location?.state || safeCurrent.sector || "",
            country:
              location?.country || safeCurrent.destinationCountry || "India",
          }),
        );

        // Initialize destinationNights safely - FIXED: Properly initialize all fields
        const initializedDestinationNights = (
          safeCurrent.destinationNights || []
        ).map((dest) => {
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
            nights: dest?.nights || 1, // Changed default to 1 instead of 0
            hotels: hotels,
          };
        });


        setPkg({
          // Step 1 Fields
          tourType: safeCurrent.tourType || "Domestic",
          packageCategory: safeCurrent.packageCategory || "",
          packageSubType: Array.isArray(safeCurrent.packageSubType)
            ? safeCurrent.packageSubType
            : safeCurrent.packageSubType
              ? [safeCurrent.packageSubType]
              : [],
          destinationCountry: safeCurrent.destinationCountry || "India",
          sector: safeCurrent.sector || "",
          stayLocations: initializedStayLocations,

          // Step 2 Fields
          title: safeCurrent.title || "",
          arrivalCity: safeCurrent.arrivalCity || "",
          departureCity: safeCurrent.departureCity || "",
          notes:
            safeCurrent.notes ||
            "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
          bannerImage: safeCurrent.bannerImage || "",
          validFrom: safeCurrent.validFrom || null,
          validTill: safeCurrent.validTill || null,
          days: initializedDays,
          perPerson: safeCurrent.perPerson || 1,
          numberOfRooms: Number(safeCurrent.numberOfRooms) || 1,
          transportationCostPerDay:
            Number(safeCurrent.transportationCostPerDay) || 0,
          transportationDays:
            Number(safeCurrent.transportationDays) ||
            safeCurrent.days?.length ||
            0,
          manualCostMargin: Number(safeCurrent.manualCostMargin) || 0,
          mealPlan: safeCurrent.mealPlan || { planType: "", description: "" },
          destinationNights: initializedDestinationNights,

          // Policy Fields
          policy: {
            inclusionPolicy: getPolicyContent(
              safeCurrent.policy?.inclusionPolicy,
            ),
            exclusionPolicy: getPolicyContent(
              safeCurrent.policy?.exclusionPolicy,
            ),
            paymentPolicy: getPolicyContent(safeCurrent.policy?.paymentPolicy),
            cancellationPolicy: getPolicyContent(
              safeCurrent.policy?.cancellationPolicy,
            ),
            termsAndConditions: getPolicyContent(
              safeCurrent.policy?.termsAndConditions,
            ),
          },

          // Status
          status: safeCurrent.status || "deactive",
          _id: safeCurrent._id || id,
        });

        setSelectedCountry(safeCurrent.destinationCountry || "India");
        setCurrentState(safeCurrent.sector || "");
        setInitialized(true);
        setError(null);

        // Fetch states for the country
        if (safeCurrent.destinationCountry) {
          dispatch(fetchStatesByCountry(safeCurrent.destinationCountry));
        }

        // Fetch cities for the initial sector/state
        if (safeCurrent.sector) {
          if (DOMESTIC_TOUR_TYPES.includes(safeCurrent.tourType || "Domestic")) {
            dispatch(fetchDomesticCities(safeCurrent.sector))
              .unwrap()
              .then((cityList) => {
                const apiCities = cityList.map((c) => c.name || c.city || c);
                const customCities = options?.filter(opt => opt.fieldName === "city").map(opt => opt.value) || [];
                const combinedCities = [...new Set([...apiCities, ...customCities])];
                setAllCities(combinedCities);
                setLocationList(combinedCities);
              });
          } else {
            dispatch(
              fetchInternationalCities({
                countryName: safeCurrent.destinationCountry || "India",
                stateName: safeCurrent.sector,
              }),
            )
              .unwrap()
              .then((cityList) => {
                const apiCities = cityList.map((c) => c.name || c.city || c);
                const customCities = options?.filter(opt => opt.fieldName === "city").map(opt => opt.value) || [];
                const combinedCities = [...new Set([...apiCities, ...customCities])];
                setAllCities(combinedCities);
                setLocationList(combinedCities);
              });
          }
        }
      } catch (err) {
        console.error("Error initializing package data:", err);
        setError("Error processing package data");
      }
    }
  }, [current, initialized, id, dispatch]);

  // Sync destinationNights with stayLocations
  useEffect(() => {
    if (!initialized || !pkg.stayLocations) return;

    setPkg((prev) => {
      const currentDestinations = prev.destinationNights || [];
      const newStayLocations = prev.stayLocations || [];

      // Create a map of existing destination data to preserve hotel info
      // We use a map to quickly look up by city name
      const destinationMap = {};
      currentDestinations.forEach((dest) => {
        if (dest.destination) {
          destinationMap[dest.destination] = dest;
        }
      });

      // Build new destinationNights based on stayLocations
      const updatedDestinationNights = newStayLocations.map((stay) => {
        const cityName = stay.city || "";
        const existing = destinationMap[cityName];
        
        return {
          destination: cityName,
          nights: parseInt(stay.nights) || 1,
          hotels: existing?.hotels || [
            { category: "standard", hotelName: "TBD", pricePerPerson: 0 },
            { category: "deluxe", hotelName: "TBD", pricePerPerson: 0 },
            { category: "superior", hotelName: "TBD", pricePerPerson: 0 },
          ],
        };
      });

      // Only update if there's a real change to avoid infinite loops
      // We check length and destination/nights values
      const hasChanged = 
        updatedDestinationNights.length !== currentDestinations.length ||
        updatedDestinationNights.some((dest, i) => {
          const oldDest = currentDestinations[i];
          return !oldDest || 
                 dest.destination !== oldDest.destination || 
                 dest.nights !== oldDest.nights;
        });

      if (hasChanged) {
        console.log("Syncing destinationNights with stayLocations:", updatedDestinationNights);
        return { ...prev, destinationNights: updatedDestinationNights };
      }
      return prev;
    });
  }, [pkg.stayLocations, initialized]);

  // Hotel Options Manager Logic
  const selectedCities = React.useMemo(() => {
    return pkg.stayLocations?.map((location) => location.city) || [];
  }, [pkg.stayLocations]);

  // Duration & Title suggestions from stay locations: Nights from stay locations & Days = Nights + 1
  const editCalculatedNights = React.useMemo(() => {
    return (pkg.stayLocations || []).reduce(
      (total, loc) => total + (parseInt(loc.nights) || 0),
      0
    );
  }, [pkg.stayLocations]);

  const editCalculatedDays = React.useMemo(() => {
    return editCalculatedNights > 0 ? editCalculatedNights + 1 : 1;
  }, [editCalculatedNights]);

  const editTitleSuggestions = React.useMemo(() => {
    return generateImpressiveTitles({
      nights: editCalculatedNights,
      days: editCalculatedDays,
      sector: pkg.sector || currentState,
      country: pkg.destinationCountry || selectedCountry,
      tourType: pkg.tourType,
      packageCategory: pkg.packageCategory,
      stayLocations: pkg.stayLocations,
    });
  }, [
    editCalculatedNights,
    editCalculatedDays,
    pkg.sector,
    currentState,
    pkg.destinationCountry,
    selectedCountry,
    pkg.tourType,
    pkg.packageCategory,
    pkg.stayLocations,
  ]);

  useEffect(() => {
    if (selectedCities.length > 0) {
      dispatch(fetchHotels());
    }
  }, [selectedCities, dispatch]);

  // Loading state
  if (loading && !initialized) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
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
    setPkg((prev) => {
      return {
        ...prev,
        tourType: selectedType,
        destinationCountry: DOMESTIC_TOUR_TYPES.includes(selectedType) ? "India" : prev.destinationCountry,
        sector: "",
        packageCategory: "",
        packageSubType: [],
        stayLocations: []
      };
    });
    
    const country = DOMESTIC_TOUR_TYPES.includes(selectedType) ? "India" : "";
    setSelectedCountry(country);
    dispatch(clearStates());
    dispatch(clearCities());

    if (DOMESTIC_TOUR_TYPES.includes(selectedType)) {
      dispatch(fetchStatesByCountry("India"));
    }
  };

  const handleCountryChange = (countryName) => {
    if (!countryName) return;
    setSelectedCountry(countryName);
    setPkg((prev) => {
      return {
        ...prev,
        destinationCountry: countryName,
        sector: "",
        packageCategory: "",
        packageSubType: [],
        stayLocations: []
      };
    });
    dispatch(clearStates());
    dispatch(clearCities());
    dispatch(fetchStatesByCountry(countryName));
  };

  const handleSectorChange = (selectedStateName) => {
    setPkg((prev) => ({ ...prev, sector: selectedStateName || "" }));
    setCurrentState(selectedStateName);

    if (DOMESTIC_TOUR_TYPES.includes(pkg.tourType)) {
      dispatch(fetchDomesticCities(selectedStateName))
        .unwrap()
        .then((cityList) => {
          const apiCities = cityList.map((c) => c.name || c.city || c);
          const customCities = options?.filter(opt => opt.fieldName === "city").map(opt => opt.value) || [];
          const combinedCities = [...new Set([...apiCities, ...customCities])];
          setAllCities(combinedCities);
          setLocationList(combinedCities);
          setSearchText("");
        });
    } else {
      dispatch(
        fetchInternationalCities({
          countryName: selectedCountry,
          stateName: selectedStateName,
        }),
      )
        .unwrap()
        .then((cityList) => {
          const apiCities = cityList.map((c) => c.name || c.city || c);
          const customCities = options?.filter(opt => opt.fieldName === "city").map(opt => opt.value) || [];
          const combinedCities = [...new Set([...apiCities, ...customCities])];
          setAllCities(combinedCities);
          setLocationList(combinedCities);
          setSearchText("");
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
    const cityWithState = {
      city,
      state: currentState,
      country:
        selectedCountry ||
        (DOMESTIC_TOUR_TYPES.includes(pkg.tourType) ? "India" : ""),
      nights: 1,
    };

    if (
      !pkg.stayLocations.find(
        (item) => item.city === city && item.state === currentState,
      )
    ) {
      const updated = [...pkg.stayLocations, cityWithState];
      setPkg({ ...pkg, stayLocations: updated });
    }
  };

  // Add New Location Logic removed as we use LeadOptionsManager

  const handleDeleteLocation = (locationToDelete, e) => {
    e.stopPropagation();
    setAllCities((prev) => prev.filter((loc) => loc !== locationToDelete));
    setLocationList((prev) => prev.filter((loc) => loc !== locationToDelete));
  };

  // Lead Options Manager Logic
  // Hotel Options Manager Logic
  const getHotelsForDestination = (destinationCity) => {
    if (!destinationCity) return { standard: [], deluxe: [], superior: [] };
    if (!hotels || hotels.length === 0) return { standard: [], deluxe: [], superior: [] };

    const destinationHotels = hotels.filter((hotel) => {
      const hotelCity = hotel.location?.city?.toLowerCase() || "";
      const hotelName = hotel.hotelName?.toLowerCase() || "";
      const searchCity = destinationCity.toLowerCase().trim();

      const exactMatch = hotelCity === searchCity;
      const partialMatch =
        (hotelCity !== "" && (
          hotelCity.includes(searchCity) ||
          searchCity.includes(hotelCity) ||
          hotelCity.includes(searchCity.split(" ")[0]) ||
          searchCity.includes(hotelCity.split(" ")[0])
        )) ||
        (hotelName !== "" && hotelName.includes(searchCity));

      return exactMatch || partialMatch;
    });

    const organized = { standard: [], deluxe: [], superior: [] };
    destinationHotels.forEach((hotel) => {
      let category = typeof hotel.category === 'string' ? hotel.category.toLowerCase().trim() : "";
      if (!category && hotel.hotelType) {
        if (Array.isArray(hotel.hotelType) && hotel.hotelType.length > 0) {
          category = hotel.hotelType[0].toLowerCase().trim();
        } else if (typeof hotel.hotelType === 'string') {
          category = hotel.hotelType.toLowerCase().trim();
        }
      }
      if (!category) category = "standard";

      const hotelName = hotel.hotelName?.trim();
      if (hotelName) {
        if (organized[category] && !organized[category].includes(hotelName)) {
          organized[category].push(hotelName);
        } else if (!organized[category] && !organized.standard.includes(hotelName)) {
          organized.standard.push(hotelName);
        }
      }
    });
    return organized;
  };

  const getHotelOptionsForCategory = (category, destinationCity = "") => {
    const destinationHotels = getHotelsForDestination(destinationCity);
    const baseOptions = destinationHotels[category] || [];
    const allOptions = [...new Set([...baseOptions])];
    return [...allOptions, { value: "__add_new", label: "+ Add New" }];
  };

  const renderHotelOption = (props, option, category) => {
    if (option === "__add_new") {
      return (
        <li
          {...props}
          key="add_new"
          style={{
            color: "#1976d2",
            fontWeight: 600,
            backgroundColor: "#f0f7ff",
            borderBottom: "2px solid #1976d2",
          }}
        >
          + Add New Hotel
        </li>
      );
    }

    return (
      <li {...props} key={typeof option === "object" ? option.value : option}>
        {typeof option === "object" ? option.label : option}
      </li>
    );
  };

  const handleAddNewHotel = async () => {
    if (!addMore.trim()) {
      alert("Please enter a name");
      return;
    }

    try {
      const newValue = addMore.trim();
      const destIndex = sessionStorage.getItem("currentDestIndex");
      let destinationCity = "";
      let destinationState = "";
      let destinationCountry = selectedCountry || "India";

      if (destIndex !== null && pkg.destinationNights[destIndex]) {
        destinationCity = pkg.destinationNights[destIndex].destination;
        const matchedLocation = pkg.stayLocations?.find((loc) => loc.city === destinationCity);
        if (matchedLocation) {
          destinationState = matchedLocation.state || "";
          destinationCountry = matchedLocation.country || destinationCountry;
        } else {
          destinationState = destinationCountry === "India" ? (currentState || "") : "";
        }
      }

      const hotelFormData = new FormData();
      const locationData = {
        country: destinationCountry,
        state: destinationState,
        city: destinationCity,
        address: "",
        pincode: "",
      };
      hotelFormData.append("location", JSON.stringify(locationData));
      hotelFormData.append("hotelName", newValue);
      hotelFormData.append("category", currentHotelCategory);

      await dispatch(createHotelStep1(hotelFormData)).unwrap();
      
      if (destinationCity) {
        dispatch(fetchHotels());
      }
      
      setHotelDialogOpen(false);
      setCurrentHotelCategory("");
      sessionStorage.removeItem("currentDestIndex");
    } catch (hotelErr) {
      alert("Failed to create hotel: " + (hotelErr.message || "Unknown error"));
    }
  };

  const handleOpenDialog = (field) => {
    setCurrentField(field);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    dispatch(getLeadOptions());
  };

  const handleOptionAdd = (newValue) => {
    if (currentField === "city") {
      setAllCities((prev) => prev.includes(newValue) ? prev : [...prev, newValue]);
      setLocationList((prev) => prev.includes(newValue) ? prev : [...prev, newValue]);
      return;
    }

    if (Array.isArray(pkg[currentField])) {
      if (!pkg[currentField].includes(newValue)) {
        setPkg({
          ...pkg,
          [currentField]: [...pkg[currentField], newValue],
        });
      }
    } else {
      setPkg({ ...pkg, [currentField]: newValue });
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

  const handleStayChange = (index, field, value) => {
    if (!pkg.stayLocations || index < 0 || index >= pkg.stayLocations.length)
      return;

    const updated = [...pkg.stayLocations];
    const oldNights = parseInt(updated[index].nights) || 1;
    const newNights = field === "nights" ? parseInt(value) || 0 : oldNights;

    if (field === "nights") {
      updated[index] = {
        ...updated[index],
        [field]: newNights,
      };

      // Adjust itinerary days if nights changed
      if (newNights !== oldNights) {
        const diff = newNights - oldNights;
        const newDays = [...(pkg.days || [])];

        // Find the split point (after this city's current block)
        let splitPoint = 0;
        for (let i = 0; i <= index; i++) {
          splitPoint += parseInt(pkg.stayLocations[i].nights) || 1;
        }

        if (diff > 0) {
          // Add days
          const newDayEntries = Array(diff)
            .fill(null)
            .map(() => ({
              title: "",
              notes: "",
              aboutCity: "",
              dayImage: null,
              sightseeing: [],
              selectedSightseeing: [],
            }));
          newDays.splice(splitPoint, 0, ...newDayEntries);
        } else if (diff < 0) {
          // Remove days (from the end of this city's block)
          newDays.splice(splitPoint + diff, Math.abs(diff));
        }

        setPkg({ ...pkg, stayLocations: updated, days: newDays });
        return;
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value || "",
      };
    }
    setPkg({ ...pkg, stayLocations: updated });
  };

  const handleRemoveCity = (cityToRemove) => {
    if (!cityToRemove || !pkg.stayLocations) return;

    const index = pkg.stayLocations.findIndex(
      (item) =>
        item?.city === cityToRemove.city && item?.state === cityToRemove.state,
    );

    if (index !== -1) {
      const nights = parseInt(pkg.stayLocations[index].nights) || 1;
      const newDays = [...(pkg.days || [])];

      // Calculate start index of days for this city
      let startDayIndex = 0;
      for (let i = 0; i < index; i++) {
        startDayIndex += parseInt(pkg.stayLocations[i].nights) || 1;
      }

      // Remove corresponding days
      newDays.splice(startDayIndex, nights);

      const updated = pkg.stayLocations.filter((_, i) => i !== index);
      setPkg({ ...pkg, stayLocations: updated, days: newDays });
    }
  };

  const handleDayChange = (index, field, value) => {
    if (!pkg.days || index < 0 || index >= pkg.days.length) return;

    const updated = [...pkg.days];
    if (field === "selectedSightseeing") {
      const arr = Array.isArray(value) ? value : [];
      updated[index] = {
        ...updated[index],
        selectedSightseeing: arr,
        sightseeing: arr,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setPkg({ ...pkg, days: updated });
  };

  const handleGenerateItinerary = async () => {
    try {
      setIsGeneratingAi(true);
      const totalNights =
        (pkg.stayLocations || []).reduce(
          (sum, sl) => sum + (Number(sl.nights) || 0),
          0
        ) || 0;
      const targetDays =
        totalNights > 0
          ? totalNights + 1
          : Math.max(1, (pkg.days || []).length);

      const res = await axios.post("/ai/generate-itinerary", {
        arrivalCity: pkg.arrivalCity || "",
        departureCity: pkg.departureCity || "",
        destinationCountry: pkg.destinationCountry || selectedCountry || "India",
        sector: pkg.sector || currentState || "",
        days: targetDays,
        tourType: pkg.tourType || "Domestic",
        stayLocations: pkg.stayLocations || [],
      });

      if (res.data?.success && res.data?.data) {
        const generatedDays = res.data.data;
        setPkg((prev) => {
          const newDays = [...(prev.days || [])];
          generatedDays.forEach((genDay, idx) => {
            const aiSightseeing = Array.isArray(genDay.sightseeing)
              ? genDay.sightseeing
              : [];
            if (newDays[idx]) {
              newDays[idx] = {
                ...newDays[idx],
                title: genDay.title || newDays[idx].title || "",
                notes: genDay.notes || newDays[idx].notes || "",
                aboutCity: genDay.aboutCity || newDays[idx].aboutCity || "",
                sightseeing:
                  aiSightseeing.length > 0
                    ? aiSightseeing
                    : newDays[idx].sightseeing || [],
                selectedSightseeing:
                  aiSightseeing.length > 0
                    ? aiSightseeing
                    : newDays[idx].selectedSightseeing || [],
              };
            } else {
              newDays.push({
                title: genDay.title || "",
                notes: genDay.notes || "",
                aboutCity: genDay.aboutCity || "",
                dayImage: null,
                sightseeing: aiSightseeing,
                selectedSightseeing: aiSightseeing,
              });
            }
          });
          return { ...prev, days: newDays };
        });
        setSnackbar({
          open: true,
          message: "✨ AI Itinerary generated successfully! Please review days and click Save Package.",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Failed to generate itinerary:", err);
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Failed to generate itinerary. Please try again.",
        severity: "error",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getDaySightseeingList = (index) => {
    const day = pkg.days?.[index];
    if (!day) return [];
    const list = [
      ...(Array.isArray(day.selectedSightseeing) ? day.selectedSightseeing : []),
      ...(Array.isArray(day.sightseeing) ? day.sightseeing : []),
    ];
    return [...new Set(list.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
  };

  const getBestDayQuery = (index) => {
    const day = pkg.days?.[index];
    const city = getCityForDay(index);
    const sightseeingList = getDaySightseeingList(index);

    if (sightseeingList.length > 0) {
      return `${sightseeingList[0]} ${city || ""}`.trim();
    }
    if (day?.title && day.title.trim()) {
      return `${day.title} ${city || ""}`.trim();
    }
    return city || pkg.sector || "landscape";
  };

  const handleAutoFetchImage = async (index, query, isBanner = false) => {
    const effectiveQuery = (
      query ||
      (isBanner
        ? pkg.sector || selectedCountry || "landscape"
        : getBestDayQuery(index))
    ).trim();

    if (!effectiveQuery) {
      setSnackbar({
        open: true,
        message: "No destination found to fetch image for. Please ensure Sector or Stay Locations are filled.",
        severity: "warning",
      });
      return;
    }
    setFetchingImageIndex(isBanner ? "banner" : index);

    // Cycle page offsets so subsequent clicks on "Auto-Fetch" fetch different photos
    const currentOffset = isBanner
      ? dayPhotoOffsets["banner"] || 0
      : dayPhotoOffsets[index] || 0;
    const nextOffset = currentOffset + 1;
    setDayPhotoOffsets((prev) => ({
      ...prev,
      [isBanner ? "banner" : index]: nextOffset,
    }));

    const pageNum = isBanner
      ? nextOffset
      : (index !== null && index !== undefined ? index * 2 : 0) + nextOffset;
    const finalQuery = isBanner
      ? effectiveQuery
      : `${effectiveQuery} landmark architecture`;

    try {
      const res = await axios.get(
        `/photos/search?query=${encodeURIComponent(finalQuery)}&page=${pageNum}`
      );
      if (res.data?.success && res.data?.data) {
        if (isBanner) {
          setPkg((prev) => ({ ...prev, bannerImage: res.data.data }));
        } else {
          handleDayChange(index, "dayImage", res.data.data);
        }
        setSnackbar({
          open: true,
          message: `Photo fetched for ${effectiveQuery}! Click "Choose Photo" if you'd like to pick another.`,
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Auto fetch image error:", err);
      setSnackbar({ open: true, message: "Failed to fetch photo.", severity: "error" });
    } finally {
      setFetchingImageIndex(null);
    }
  };

  const handleAutoFetchAllPhotos = async () => {
    if (!pkg.days || pkg.days.length === 0) {
      setSnackbar({ open: true, message: "No days available to fetch photos for.", severity: "warning" });
      return;
    }
    setIsAutoFetchingAll(true);
    let successCount = 0;
    try {
      const updatedDays = [...pkg.days];
      for (let i = 0; i < updatedDays.length; i++) {
        const query = getBestDayQuery(i);
        const pageNum = i + 1;
        const finalQuery = `${query} landmark architecture`;
        try {
          const res = await axios.get(
            `/photos/search?query=${encodeURIComponent(finalQuery)}&page=${pageNum}`
          );
          if (res.data?.success && res.data?.data) {
            updatedDays[i] = { ...updatedDays[i], dayImage: res.data.data };
            successCount++;
          }
        } catch (e) {
          console.warn(`Could not auto-fetch photo for day ${i + 1}:`, e);
        }
      }
      setPkg((prev) => ({ ...prev, days: updatedDays }));
      setSnackbar({
        open: true,
        message: `Photos fetched for ${successCount} day(s) matched to sightseeing! Click "Choose Photo" on any day to change.`,
        severity: "success",
      });
    } catch (err) {
      console.error("Auto fetch all error:", err);
      setSnackbar({ open: true, message: "Failed to fetch photos for all days.", severity: "error" });
    } finally {
      setIsAutoFetchingAll(false);
    }
  };

  const handleOpenPhotoPicker = (index, isBanner = false) => {
    setPhotoPickerTarget({ isBanner, dayIndex: index });

    if (isBanner) {
      const bannerQuery = pkg.sector || selectedCountry || "landscape";
      setPhotoPickerSightseeing([]);
      setPhotoPickerCity(bannerQuery);
      setPhotoPickerDayTitle("Banner Photo");
      setPhotoPickerSearch(bannerQuery);
      setPhotoPickerPage(1);
      setPhotoPickerOpen(true);
      searchPhotosForPicker(bannerQuery, 1);
    } else {
      const day = pkg.days?.[index];
      const city = getCityForDay(index);
      const sights = getDaySightseeingList(index);
      const initialQuery = getBestDayQuery(index);

      setPhotoPickerSightseeing(sights);
      setPhotoPickerCity(city);
      setPhotoPickerDayTitle(day?.title || `Day ${index + 1}`);
      setPhotoPickerSearch(initialQuery);
      setPhotoPickerPage(1);
      setPhotoPickerOpen(true);
      searchPhotosForPicker(initialQuery, 1);
    }
  };

  const searchPhotosForPicker = async (query, page = 1) => {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) return;
    setPhotoPickerLoading(true);
    try {
      const res = await axios.get(
        `/photos/search?query=${encodeURIComponent(cleanQuery)}&all=true&page=${page}&per_page=20`
      );
      if (res.data?.success) {
        const list = Array.isArray(res.data.photos) && res.data.photos.length > 0
          ? res.data.photos
          : res.data.data
            ? [{ id: "single", url: res.data.data, small: res.data.data, thumb: res.data.data, alt: cleanQuery, photographer: "Unsplash" }]
            : [];
        setPhotoPickerResults(list);
        setPhotoPickerPage(page);
        setPhotoPickerTotalPages(res.data.totalPages || 1);
      } else {
        setPhotoPickerResults([]);
      }
    } catch (err) {
      console.error("Failed to search photos:", err);
      setPhotoPickerResults([]);
    } finally {
      setPhotoPickerLoading(false);
    }
  };

  const handleSelectPhoto = (photoUrl) => {
    if (!photoUrl) return;
    if (photoPickerTarget.isBanner) {
      setPkg((prev) => ({ ...prev, bannerImage: photoUrl }));
      setSnackbar({
        open: true,
        message: "Banner image updated! Click Save Package to save changes.",
        severity: "success",
      });
    } else if (photoPickerTarget.dayIndex !== null && photoPickerTarget.dayIndex !== undefined) {
      handleDayChange(photoPickerTarget.dayIndex, "dayImage", photoUrl);
      setSnackbar({
        open: true,
        message: `Photo selected for Day ${photoPickerTarget.dayIndex + 1}! Click Save Package to save changes.`,
        severity: "success",
      });
    }
    setPhotoPickerOpen(false);
  };

  const getCityForDay = (dayIndex) => {
    if (!pkg.stayLocations || pkg.stayLocations.length === 0) return pkg.sector || "landscape";
    let currentDay = 0;
    for (let loc of pkg.stayLocations) {
      const nights = parseInt(loc.nights) || 1;
      if (dayIndex < currentDay + nights) {
        return loc.city;
      }
      currentDay += nights;
    }
    return pkg.stayLocations[pkg.stayLocations.length - 1].city;
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
    if (!e?.key || !pkg.days || dayIndex < 0 || dayIndex >= pkg.days.length) {
      return;
    }

    if (e.key !== "Enter") return;

    const raw = typeof e.target.value === "string" ? e.target.value : "";
    const newSight = raw.trim();
    if (!newSight) return;

    e.preventDefault();

    setPkg((prev) => {
      if (!prev.days || dayIndex < 0 || dayIndex >= prev.days.length) return prev;
      const updatedDays = prev.days.map((d, i) => {
        if (i !== dayIndex) return d;
        const prevSight = Array.isArray(d.sightseeing) ? d.sightseeing : [];
        const prevSel = Array.isArray(d.selectedSightseeing)
          ? d.selectedSightseeing
          : [];
        return {
          ...d,
          sightseeing: [...prevSight, newSight],
          selectedSightseeing: [...prevSel, newSight],
        };
      });
      return { ...prev, days: updatedDays };
    });

    e.target.value = "";
  };

  // NEW: Handler for destination nights change

  const handleDestinationNightsChange = (destIndex, value) => {
    if (
      !pkg.destinationNights ||
      destIndex < 0 ||
      destIndex >= pkg.destinationNights.length
    )
      return;

    const updatedNights = [...pkg.destinationNights];
    updatedNights[destIndex].nights = parseInt(value) || 0;

    setPkg({ ...pkg, destinationNights: updatedNights });
    console.log(`Updated nights for destination ${destIndex}:`, value);
  };

  // Hotel name change handler
  const handleHotelChange = (destIndex, category, hotelName) => {
    if (hotelName === "__add_new") {
      setCurrentHotelCategory(category);
      setCurrentField(`hotel_${category}`);
      setAddMore("");
      setHotelDialogOpen(true);
      sessionStorage.setItem("currentDestIndex", destIndex);
      return;
    }

    if (
      !pkg.destinationNights ||
      destIndex < 0 ||
      destIndex >= pkg.destinationNights.length
    )
      return;

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
      updatedNights[destIndex].hotels[catIndex] = {
        category,
        hotelName: "",
        pricePerPerson: 0,
      };
    }

    // Update the hotel name
    updatedNights[destIndex].hotels[catIndex] = {
      ...updatedNights[destIndex].hotels[catIndex],
      category,
      hotelName: hotelName,
    };

    setPkg({ ...pkg, destinationNights: updatedNights });
    console.log(
      `Updated ${category} hotel for destination ${destIndex}:`,
      hotelName,
    );
  };

  // Price change handler
  const handlePriceChange = (destIndex, category, price) => {
    if (
      !pkg.destinationNights ||
      destIndex < 0 ||
      destIndex >= pkg.destinationNights.length
    )
      return;

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
      updatedNights[destIndex].hotels[catIndex] = {
        category,
        hotelName: "",
        pricePerPerson: 0,
      };
    }

    // Update the price
    updatedNights[destIndex].hotels[catIndex] = {
      ...updatedNights[destIndex].hotels[catIndex],
      category,
      pricePerPerson: priceValue,
    };

    setPkg({ ...pkg, destinationNights: updatedNights });
    console.log(
      `Updated ${category} price for destination ${destIndex}:`,
      priceValue,
    );
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
          setPkg((prev) => ({
            ...prev,
            bannerImage: response.package.bannerImage,
          }));
          alert("✅ Banner updated successfully");
        } else if (response?.bannerImage) {
          setPkg((prev) => ({ ...prev, bannerImage: response.bannerImage }));
          alert("✅ Banner updated successfully");
        } else {
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Banner updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading banner:", error);
        alert(
          "❌ Failed to update banner: " + (error.message || "Unknown error"),
        );
      });
  };

  // Day Image Upload Handler
  const handleDayImageUpload = (dayIndex, file) => {
    if (!pkg._id || !file) {
      alert("Package ID not found or no file selected");
      return;
    }

    dispatch(
      uploadPackageDayImage({
        id: pkg._id,
        dayIndex: dayIndex,
        file: file,
      }),
    )
      .unwrap()
      .then((response) => {
        if (response?.package?.days?.[dayIndex]?.dayImage) {
          const updatedDays = [...pkg.days];
          updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            dayImage: response.package.days[dayIndex].dayImage,
          };
          setPkg((prev) => ({ ...prev, days: updatedDays }));
          alert("✅ Day image updated successfully");
        } else {
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Day image updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading day image:", error);
        alert(
          "❌ Failed to update day image: " +
          (error.message || "Unknown error"),
        );
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
        if (!htmlString || htmlString.trim() === "") return [];
        return [htmlString];
      };

      // Validate stayLocations
      const validatedStayLocations = (pkg.stayLocations || []).map(
        (location, index) => ({
          city: location?.city?.trim() || `City ${index + 1}`,
          nights: parseInt(location?.nights) || 1,
          state: location?.state || pkg.sector || "",
          country: location?.country || pkg.destinationCountry || "India",
        }),
      );

      // Validate destinationNights - FIXED: Preserve all edited data including nights
      const validatedDestinationNights = (pkg.destinationNights || []).map(
        (dest) => ({
          destination: dest.destination || "",
          nights: parseInt(dest.nights) || 1,
          hotels: (dest.hotels || []).map((hotel) => ({
            category: hotel.category || "",
            hotelName: hotel.hotelName || "",
            pricePerPerson: hotel.pricePerPerson || 0,
          })),
        }),
      );
      const perPersonValue = parseInt(pkg.perPerson) || 1;

      console.log("Saving perPerson value:", perPersonValue);
      console.log("Original pkg.perPerson:", pkg.perPerson);
      const transformedData = {
        // Step 1 Fields
        tourType: pkg.tourType || "Domestic",
        destinationCountry: pkg.destinationCountry || "India",
        sector: pkg.sector || "",
        packageCategory: pkg.packageCategory || "",
        packageSubType: Array.isArray(pkg.packageSubType)
          ? pkg.packageSubType
          : [pkg.packageSubType || ""],
        stayLocations: validatedStayLocations,

        // Step 2 Fields
        title: pkg.title || "",
        arrivalCity: pkg.arrivalCity || "",
        departureCity: pkg.departureCity || "",
        notes: pkg.notes || "",
        bannerImage: pkg.bannerImage || "",
        validFrom: pkg.validFrom || null,
        validTill: pkg.validTill || null,
        days: (pkg.days || []).map((day) => ({
          title: day?.title || "",
          notes: day?.notes || "",
          aboutCity: day?.aboutCity || "",
          sightseeing: Array.isArray(day?.sightseeing) ? day.sightseeing : [],
          selectedSightseeing: Array.isArray(day?.selectedSightseeing)
            ? day.selectedSightseeing
            : [],
          dayImage: typeof day?.dayImage === "string" ? day.dayImage : "",
        })),

        perPerson: perPersonValue,
        numberOfRooms: Number(pkg.numberOfRooms) || 1,
        transportationCostPerDay: Number(pkg.transportationCostPerDay) || 0,
        transportationDays: Number(pkg.transportationDays) || 0,
        transportationTotalCost,
        hotelTotalCost,
        standardHotelTotalCost,
        deluxeHotelTotalCost,
        superiorHotelTotalCost,
        calculatedTotalCost,
        finalStandardCost,
        finalDeluxeCost,
        finalSuperiorCost,
        manualCostMargin: Number(pkg.manualCostMargin) || 0,
        totalCost: finalTotalCost,
        mealPlan: pkg.mealPlan || { planType: "", description: "" },
        destinationNights: validatedDestinationNights,

        // Policy Fields
        policy: {
          inclusionPolicy: convertHtmlToArray(pkg.policy?.inclusionPolicy),
          exclusionPolicy: convertHtmlToArray(pkg.policy?.exclusionPolicy),
          paymentPolicy: convertHtmlToArray(pkg.policy?.paymentPolicy),
          cancellationPolicy: convertHtmlToArray(
            pkg.policy?.cancellationPolicy,
          ),
          termsAndConditions: convertHtmlToArray(
            pkg.policy?.termsAndConditions,
          ),
        },

        // Status
        status: pkg.status || "deactive",
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
          alert(
            "❌ Failed to update package: " +
            (err.message || "Please try again"),
          );
        });
    } catch (err) {
      console.error("Error preparing data for save:", err);
      alert("Error preparing data for save");
    }
  };

  const getStayLocationsByState = () => {
    const grouped = {};
    (pkg.stayLocations || []).forEach((item) => {
      const stateKey = item?.state || "Unknown";
      if (!grouped[stateKey]) {
        grouped[stateKey] = [];
      }
      grouped[stateKey].push(item);
    });
    return grouped;
  };

  const rooms = Number(pkg.numberOfRooms) || 1;

  const hotelTotalCost = (pkg.destinationNights || []).reduce(
    (destTotal, dest) => {
      const nights = Number(dest?.nights) || 0;
      const hotelRatePerNight = (dest?.hotels || []).reduce(
        (rateTotal, hotel) => rateTotal + (Number(hotel?.pricePerPerson) || 0),
        0,
      );
      return destTotal + nights * hotelRatePerNight * rooms;
    },
    0,
  );

  const {
    standardHotelTotalCost,
    deluxeHotelTotalCost,
    superiorHotelTotalCost,
  } = (pkg.destinationNights || []).reduce(
    (acc, dest) => {
      const nights = Number(dest?.nights) || 0;
      const hotels = dest?.hotels || [];
      const standardRate =
        Number(
          hotels.find((hotel) => hotel?.category === "standard")
            ?.pricePerPerson,
        ) || 0;
      const deluxeRate =
        Number(
          hotels.find((hotel) => hotel?.category === "deluxe")?.pricePerPerson,
        ) || 0;
      const superiorRate =
        Number(
          hotels.find((hotel) => hotel?.category === "superior")
            ?.pricePerPerson,
        ) || 0;

      acc.standardHotelTotalCost += nights * standardRate * rooms;
      acc.deluxeHotelTotalCost += nights * deluxeRate * rooms;
      acc.superiorHotelTotalCost += nights * superiorRate * rooms;
      return acc;
    },
    {
      standardHotelTotalCost: 0,
      deluxeHotelTotalCost: 0,
      superiorHotelTotalCost: 0,
    },
  );

  const transportationTotalCost =
    (Number(pkg.transportationCostPerDay) || 0) *
    (Number(pkg.transportationDays) || 0);

  const margin = Number(pkg.manualCostMargin) || 0;
  const calculatedTotalCost = hotelTotalCost + transportationTotalCost;
  const finalStandardCost = standardHotelTotalCost + transportationTotalCost + margin;
  const finalDeluxeCost = deluxeHotelTotalCost + transportationTotalCost + margin;
  const finalSuperiorCost = superiorHotelTotalCost + transportationTotalCost + margin;

  const finalTotalCost = calculatedTotalCost + margin;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: "#eef3f8", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
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
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={4}
              sx={{ p: 3, borderRadius: 3, background: "white" }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <EditIcon sx={{ mr: 1 }} /> Package Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* ===== STEP 1 FIELDS ===== */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                📍 Step 1: Basic Information
              </Typography>

              {/* Tour Type */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      fullWidth
                      options={
                        Array.isArray(countries)
                          ? countries.map((c) => c?.name || "")
                          : []
                      }
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    fullWidth
                    options={
                      Array.isArray(states)
                        ? states.map((state) => state?.name || "")
                        : []
                    }
                    value={pkg.sector || ""}
                    onChange={(e, newValue) => {
                      handleSectorChange(newValue || "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          DOMESTIC_TOUR_TYPES.includes(pkg.tourType)
                            ? "State *"
                            : "State/Province *"
                        }
                      />
                    )}
                  />
                </Grid>

                {/* Package Category */}
                <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={getOptionsForField("packageSubType").map(
                      (opt) => opt.value,
                    )}
                    value={pkg.packageSubType || []}
                    onChange={(e, newValue) => {
                      if (newValue.includes("__add_new")) {
                        const filtered = newValue.filter(
                          (v) => v !== "__add_new",
                        );
                        setPkg({ ...pkg, packageSubType: filtered });
                        handleOpenDialog("packageSubType");
                      } else {
                        setPkg({ ...pkg, packageSubType: newValue });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Package Sub Type *" />
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
                        (o) =>
                          o.fieldName === "packageSubType" &&
                          o.value === option,
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
              </Grid>

              {/* Location List + Stay Locations */}
              <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
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
                      onClick={() => handleOpenDialog("city")}
                      disabled={!pkg.sector}
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
                    disabled={!pkg.sector}
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
                        {pkg.sector
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
                    Stay Locations ({pkg.stayLocations?.length || 0})
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
                    {Object.entries(getStayLocationsByState()).length > 0 ? (
                      Object.entries(getStayLocationsByState()).map(
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
                              const globalIndex = pkg.stayLocations.findIndex(
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
                                          const newList = [
                                            ...pkg.stayLocations,
                                          ];
                                          const oldDays = [
                                            ...(pkg.days || []),
                                          ];

                                          // Calculate day blocks
                                          let currentDay = 0;
                                          const blocks = newList.map(
                                            (stay) => {
                                              const nights =
                                                parseInt(stay.nights) || 1;
                                              const block = oldDays.slice(
                                                currentDay,
                                                currentDay + nights,
                                              );
                                              currentDay += nights;
                                              return block;
                                            },
                                          );
                                          const remaining =
                                            oldDays.slice(currentDay);

                                          // Swap locations
                                          const [movedLoc] = newList.splice(
                                            globalIndex,
                                            1,
                                          );
                                          newList.splice(
                                            globalIndex - 1,
                                            0,
                                            movedLoc,
                                          );

                                          // Swap blocks
                                          const [movedBlock] = blocks.splice(
                                            globalIndex,
                                            1,
                                          );
                                          blocks.splice(
                                            globalIndex - 1,
                                            0,
                                            movedBlock,
                                          );

                                          setPkg({
                                            ...pkg,
                                            stayLocations: newList,
                                            days: [
                                              ...blocks.flat(),
                                              ...remaining,
                                            ],
                                          });
                                        }}
                                      >
                                        ⬆️
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        disabled={
                                          globalIndex ===
                                          pkg.stayLocations.length - 1
                                        }
                                        onClick={() => {
                                          const newList = [
                                            ...pkg.stayLocations,
                                          ];
                                          const oldDays = [
                                            ...(pkg.days || []),
                                          ];

                                          // Calculate day blocks
                                          let currentDay = 0;
                                          const blocks = newList.map(
                                            (stay) => {
                                              const nights =
                                                parseInt(stay.nights) || 1;
                                              const block = oldDays.slice(
                                                currentDay,
                                                currentDay + nights,
                                              );
                                              currentDay += nights;
                                              return block;
                                            },
                                          );
                                          const remaining =
                                            oldDays.slice(currentDay);

                                          // Swap locations
                                          const [movedLoc] = newList.splice(
                                            globalIndex,
                                            1,
                                          );
                                          newList.splice(
                                            globalIndex + 1,
                                            0,
                                            movedLoc,
                                          );

                                          // Swap blocks
                                          const [movedBlock] = blocks.splice(
                                            globalIndex,
                                            1,
                                          );
                                          blocks.splice(
                                            globalIndex + 1,
                                            0,
                                            movedBlock,
                                          );

                                          setPkg({
                                            ...pkg,
                                            stayLocations: newList,
                                            days: [
                                              ...blocks.flat(),
                                              ...remaining,
                                            ],
                                          });
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
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mt: 1,
                                      width: "100%",
                                    }}
                                  >
                                    <TextField
                                      label="Nights"
                                      type="number"
                                      size="small"
                                      sx={{ width: 100 }}
                                      value={item.nights || 1}
                                      onChange={(e) =>
                                        handleStayChange(
                                          globalIndex,
                                          "nights",
                                          e.target.value,
                                        )
                                      }
                                      inputProps={{ min: 1 }}
                                    />
                                  </Box>
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
                        Select a state to see cities
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* ===== STEP 2 FIELDS ===== */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                gutterBottom
                sx={{ mt: 4 }}
              >
                📅 Step 2: Tour Details
              </Typography>

              {/* Basic Info */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2, bgcolor: "#f9fbfe", borderRadius: 2, border: "1px solid #dbe6f5" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                          Package Title
                        </Typography>
                        {editCalculatedNights > 0 && (
                          <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={`⏱️ Duration: ${editCalculatedNights} Nights / ${editCalculatedDays} Days (${editCalculatedNights}N from Stay Locations + 1 Day)`}
                            sx={{ fontWeight: "bold" }}
                          />
                        )}
                      </Box>
                      {editCalculatedNights > 0 && editTitleSuggestions.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => setPkg({ ...pkg, title: editTitleSuggestions[0].value })}
                          startIcon={<AutoAwesomeIcon fontSize="small" />}
                          sx={{ textTransform: "none", fontWeight: "bold", fontSize: "0.8rem" }}
                        >
                          Auto-Fill Title
                        </Button>
                      )}
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      placeholder={
                        editCalculatedNights > 0
                          ? `e.g. ${editCalculatedNights} Nights / ${editCalculatedDays} Days ${pkg.sector || "Scenic Tour"}`
                          : "e.g. 5 Nights / 6 Days Scenic Tour"
                      }
                      value={pkg.title || ""}
                      onChange={(e) => setPkg({ ...pkg, title: e.target.value })}
                      helperText="Nights are computed from Stay Locations & Days = Nights + 1. You can freely edit or choose from suggestions below."
                    />

                    {editCalculatedNights > 0 && editTitleSuggestions.length > 0 && (
                      <Box display="flex" alignItems="center" gap={1} mt={1.5} flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                          Quick Title Formats:
                        </Typography>
                        {editTitleSuggestions.map((sug, sIdx) => (
                          <Chip
                            key={sIdx}
                            size="small"
                            label={sug.label}
                            clickable
                            color={pkg.title === sug.value ? "primary" : "default"}
                            variant={pkg.title === sug.value ? "filled" : "outlined"}
                            onClick={() => setPkg({ ...pkg, title: sug.value })}
                            sx={{ fontSize: "0.75rem", cursor: "pointer" }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Arrival City"
                    fullWidth
                    value={pkg.arrivalCity || ""}
                    onChange={(e) =>
                      setPkg({ ...pkg, arrivalCity: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Departure City"
                    fullWidth
                    value={pkg.departureCity || ""}
                    onChange={(e) =>
                      setPkg({ ...pkg, departureCity: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mt: 3 }}
              >
                Package Validity
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Valid From"
                    value={pkg.validFrom ? new Date(pkg.validFrom) : null}
                    onChange={(newValue) =>
                      setPkg({ ...pkg, validFrom: newValue })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Valid Till"
                    value={pkg.validTill ? new Date(pkg.validTill) : null}
                    onChange={(newValue) =>
                      setPkg({ ...pkg, validTill: newValue })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>

              {/* Banner Image */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mt: 3 }}
              >
                Banner Image
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f5f5f5",
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => handleOpenPhotoPicker(null, true)}
                    startIcon={<PhotoLibraryIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)',
                    }}
                  >
                    🖼️ Choose Banner Photo
                  </Button>
                  <Button 
                    variant="outlined" 
                    disabled={fetchingImageIndex === 'banner'}
                    onClick={() => handleAutoFetchImage(null, pkg.sector || selectedCountry || "landscape", true)}
                    startIcon={fetchingImageIndex === 'banner' ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {fetchingImageIndex === 'banner' ? "⏳ Fetching..." : "✨ Auto-Fetch Banner Photo"}
                  </Button>
                  <Button variant="outlined" component="label" sx={{ textTransform: 'none', fontWeight: 600 }}>
                    📁 Upload Banner
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
                  {pkg.bannerImage && (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => setPkg((prev) => ({ ...prev, bannerImage: "" }))}
                      startIcon={<DeleteIcon fontSize="small" />}
                      sx={{ textTransform: "none" }}
                    >
                      Remove Banner
                    </Button>
                  )}
                </Box>

                {pkg.bannerImage ? (
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      height: 220,
                      maxWidth: "600px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <img
                      src={pkg.bannerImage}
                      alt="Banner"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                        Current Banner Image
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenPhotoPicker(null, true)}
                        sx={{
                          fontSize: "0.75rem",
                          py: 0.3,
                          px: 1.2,
                          textTransform: "none",
                          bgcolor: "rgba(255,255,255,0.9)",
                          color: "#1976d2",
                          fontWeight: "bold",
                          "&:hover": { bgcolor: "white" },
                        }}
                      >
                        Change Banner
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #ccc",
                      borderRadius: 2,
                    }}
                  >
                    <Typography color="text.secondary">
                      No banner image selected. Click "Choose Banner Photo" or "Auto-Fetch" to add one.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Days Section Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={2} flexWrap="wrap" gap={1.5}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="primary"
                >
                  Itinerary Days ({Array.isArray(pkg.days) ? pkg.days.length : 0})
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  {Array.isArray(pkg.days) && pkg.days.length > 0 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleAutoFetchAllPhotos}
                      disabled={isAutoFetchingAll || isGeneratingAi}
                      startIcon={isAutoFetchingAll ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {isAutoFetchingAll ? "Fetching All Photos..." : "✨ Auto-Fetch All Day Photos"}
                    </Button>
                  )}
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleGenerateItinerary} 
                    disabled={isGeneratingAi || isAutoFetchingAll}
                    startIcon={isGeneratingAi ? <CircularProgress size={20} /> : <span>✨</span>}
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                  >
                    {isGeneratingAi ? "Generating Itinerary..." : "Generate Itinerary with AI"}
                  </Button>
                </Box>
              </Box>

              {Array.isArray(pkg.days) &&
                pkg.days.map((day, index) => (
                  <Paper
                    key={index}
                    sx={{ p: 2, mb: 3, border: "1px solid #ccc" }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography fontWeight="bold">Day {index + 1}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => {
                            const newList = [...pkg.days];
                            [newList[index - 1], newList[index]] = [
                              newList[index],
                              newList[index - 1],
                            ];
                            setPkg({ ...pkg, days: newList });
                          }}
                          title="Move Up"
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === pkg.days.length - 1}
                          onClick={() => {
                            const newList = [...pkg.days];
                            [newList[index + 1], newList[index]] = [
                              newList[index],
                              newList[index + 1],
                            ];
                            setPkg({ ...pkg, days: newList });
                          }}
                          title="Move Down"
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveDay(index)}
                          title="Delete Day"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, md: 12 }}>
                        <TextField
                          fullWidth
                          label="Day Title"
                          value={day?.title || ""}
                          onChange={(e) =>
                            handleDayChange(index, "title", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={10}
                          label="Day Notes"
                          value={day?.notes || ""}
                          onChange={(e) =>
                            handleDayChange(index, "notes", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={5}
                          label="About City"
                          value={day?.aboutCity || ""}
                          onChange={(e) =>
                            handleDayChange(index, "aboutCity", e.target.value)
                          }
                        />
                      </Grid>

                      {/* Day Image */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                          sx={{
                            border: "1px solid #e0e0e0",
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => handleOpenPhotoPicker(index)}
                              startIcon={<PhotoLibraryIcon fontSize="small" />}
                              sx={{
                                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                color: 'white',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                fontSize: "0.78rem",
                              }}
                            >
                              🖼️ Choose Photo (by Sightseeing)
                            </Button>

                            <Button 
                              variant="outlined" 
                              size="small"
                              disabled={fetchingImageIndex === index}
                              onClick={() => handleAutoFetchImage(index, getBestDayQuery(index))}
                              startIcon={fetchingImageIndex === index ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: "0.78rem",
                              }}
                            >
                              {fetchingImageIndex === index ? "⏳ Fetching..." : (day?.dayImage ? "✨ Auto-Fetch Next" : "✨ Auto-Fetch Photo")}
                            </Button>

                            <Button
                              variant="outlined"
                              component="label"
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 600, fontSize: "0.78rem" }}
                            >
                              📁 Upload
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleDayImageUpload(
                                      index,
                                      e.target.files[0],
                                    );
                                  }
                                }}
                              />
                            </Button>

                            {day?.dayImage && (
                              <Button
                                color="error"
                                size="small"
                                onClick={() => handleDayChange(index, "dayImage", "")}
                                startIcon={<DeleteIcon fontSize="small" />}
                                sx={{ textTransform: "none", fontSize: "0.78rem" }}
                              >
                                Remove
                              </Button>
                            )}
                          </Box>

                          {day?.dayImage ? (
                            <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                              <img
                                src={day.dayImage}
                                alt={`Day ${index + 1} preview`}
                                style={{
                                  height: "170px",
                                  width: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  p: 1,
                                  background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                                  Day {index + 1} Image
                                </Typography>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleOpenPhotoPicker(index)}
                                  sx={{
                                    fontSize: "0.72rem",
                                    py: 0.2,
                                    px: 1,
                                    textTransform: "none",
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    color: "#1976d2",
                                    fontWeight: "bold",
                                    "&:hover": { bgcolor: "white" },
                                  }}
                                >
                                  Change Photo
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 90,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px dashed #ccc",
                                borderRadius: 1.5,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                No image selected. Click "Choose Photo (by Sightseeing)" or "Auto-Fetch".
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Sightseeing */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          placeholder="Add Sightseeing (press Enter)"
                          onKeyDown={(e) => handleAddSightseeing(index, e)}
                        />
                        <Box sx={{ mt: 1, maxHeight: 150, overflowY: "auto" }}>
                          {Array.isArray(day?.selectedSightseeing) &&
                            day.selectedSightseeing.map((s, i) => (
                              <Chip
                                key={`${index}-${i}-${String(s)}`}
                                label={s}
                                onDelete={() => {
                                  const newSelected = [
                                    ...(day.selectedSightseeing || []),
                                  ];
                                  newSelected.splice(i, 1);
                                  handleDayChange(
                                    index,
                                    "selectedSightseeing",
                                    newSelected,
                                  );
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

              <Button
                variant="contained"
                sx={{ mt: 2, mb: 3 }}
                onClick={handleAddDay}
              >
                + Add Day
              </Button>

              {/* Meal Plan & Per Person */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Persons"
                    value={pkg.perPerson || 1}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 1 : Number(e.target.value);
                      setPkg({ ...pkg, perPerson: value });
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Rooms"
                    value={pkg.numberOfRooms || 1}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? 1
                          : Math.max(1, Number(e.target.value));
                      setPkg({ ...pkg, numberOfRooms: value });
                    }}
                    inputProps={{ min: 1 }}
                    helperText="Applied in all hotel category totals"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Meal Plan"
                    value={pkg.mealPlan?.planType || ""}
                    onChange={(e) =>
                      setPkg({
                        ...pkg,
                        mealPlan: {
                          ...(pkg.mealPlan || {}),
                          planType: e.target.value,
                        },
                      })
                    }
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
                  {Array.isArray(pkg.destinationNights) &&
                    pkg.destinationNights.length > 0 ? (
                    pkg.destinationNights.map((dest, index) => {
                      // Ensure hotels array exists with proper structure
                      const hotels =
                        dest.hotels && dest.hotels.length === 3
                          ? dest.hotels
                          : [
                            {
                              category: "standard",
                              hotelName: "",
                              pricePerPerson: 0,
                            },
                            {
                              category: "deluxe",
                              hotelName: "",
                              pricePerPerson: 0,
                            },
                            {
                              category: "superior",
                              hotelName: "",
                              pricePerPerson: 0,
                            },
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
                                  destination: e.target.value,
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
                                  nights: parseInt(e.target.value) || 1,
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
                               <Autocomplete
                                options={getHotelOptionsForCategory("standard", dest.destination).map((opt) => typeof opt === "object" ? opt.value : opt)}
                                value={hotels[0]?.hotelName || ""}
                                onChange={(e, newValue) => handleHotelChange(index, "standard", newValue)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Select standard hotel"
                                    helperText={`${getHotelsForDestination(dest.destination).standard.length} from API`}
                                  />
                                )}
                                renderOption={(props, option) => {
                                  sessionStorage.setItem("currentDestIndex", index);
                                  return renderHotelOption(props, option, "standard");
                                }}
                                loading={hotelsLoading}
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
                                    {
                                      category: "standard",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "deluxe",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "superior",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                  ];
                                } else {
                                  updated[index].hotels = [
                                    ...updated[index].hotels,
                                  ];
                                }
                                updated[index].hotels[0] = {
                                  ...updated[index].hotels[0],
                                  category: "standard",
                                  pricePerPerson:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                };
                                setPkg({ ...pkg, destinationNights: updated });
                              }}
                              placeholder="Price"
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    ₹
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </TableCell>

                          {/* Deluxe */}
                          <TableCell>
                            <Box sx={{ mb: 1 }}>
                               <Autocomplete
                                options={getHotelOptionsForCategory("deluxe", dest.destination).map((opt) => typeof opt === "object" ? opt.value : opt)}
                                value={hotels[1]?.hotelName || ""}
                                onChange={(e, newValue) => handleHotelChange(index, "deluxe", newValue)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Select deluxe hotel"
                                    helperText={`${getHotelsForDestination(dest.destination).deluxe.length} from API`}
                                  />
                                )}
                                renderOption={(props, option) => {
                                  sessionStorage.setItem("currentDestIndex", index);
                                  return renderHotelOption(props, option, "deluxe");
                                }}
                                loading={hotelsLoading}
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
                                    {
                                      category: "standard",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "deluxe",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "superior",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                  ];
                                } else {
                                  updated[index].hotels = [
                                    ...updated[index].hotels,
                                  ];
                                }
                                updated[index].hotels[1] = {
                                  ...updated[index].hotels[1],
                                  category: "deluxe",
                                  pricePerPerson:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                };
                                setPkg({ ...pkg, destinationNights: updated });
                              }}
                              placeholder="Price"
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    ₹
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </TableCell>

                          {/* Superior */}
                          <TableCell>
                            <Box sx={{ mb: 1 }}>
                               <Autocomplete
                                options={getHotelOptionsForCategory("superior", dest.destination).map((opt) => typeof opt === "object" ? opt.value : opt)}
                                value={hotels[2]?.hotelName || ""}
                                onChange={(e, newValue) => handleHotelChange(index, "superior", newValue)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Select superior hotel"
                                    helperText={`${getHotelsForDestination(dest.destination).superior.length} from API`}
                                  />
                                )}
                                renderOption={(props, option) => {
                                  sessionStorage.setItem("currentDestIndex", index);
                                  return renderHotelOption(props, option, "superior");
                                }}
                                loading={hotelsLoading}
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
                                    {
                                      category: "standard",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "deluxe",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                    {
                                      category: "superior",
                                      hotelName: "",
                                      pricePerPerson: 0,
                                    },
                                  ];
                                } else {
                                  updated[index].hotels = [
                                    ...updated[index].hotels,
                                  ];
                                }
                                updated[index].hotels[2] = {
                                  ...updated[index].hotels[2],
                                  category: "superior",
                                  pricePerPerson:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                };
                                setPkg({ ...pkg, destinationNights: updated });
                              }}
                              placeholder="Price"
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    ₹
                                  </InputAdornment>
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

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                🚐 Transportation & Total Cost
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Transportation Cost / Day"
                    value={
                      Number(pkg.transportationCostPerDay) === 0
                        ? ""
                        : pkg.transportationCostPerDay
                    }
                    onChange={(e) =>
                      setPkg({
                        ...pkg,
                        transportationCostPerDay:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Transportation Days"
                    value={
                      Number(pkg.transportationDays) === 0
                        ? ""
                        : pkg.transportationDays
                    }
                    onChange={(e) =>
                      setPkg({
                        ...pkg,
                        transportationDays:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 0 }}
                    helperText="Usually itinerary days"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Margin (add to each tier)"
                    value={Number(pkg.manualCostMargin) === 0 ? "" : pkg.manualCostMargin}
                    onChange={(e) =>
                      setPkg({
                        ...pkg,
                        manualCostMargin:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 0 }}
                    helperText="Added to Standard, Deluxe & Superior costs"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, backgroundColor: "#fafafa" }}
                  >
                    {/* <Typography variant="body2">
        Hotel Total = sum of (destination nights x selected hotel rates): <strong>Rs. {hotelTotalCost}</strong>
      </Typography> */}
                    <Typography variant="body2">
                      Final Standard Cost:{" "}
                      <strong>Rs. {finalStandardCost}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Final Deluxe Cost: <strong>Rs. {finalDeluxeCost}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Final Superior Cost:{" "}
                      <strong>Rs. {finalSuperiorCost}</strong>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Status */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mt: 3 }}
              >
                Status
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
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
              <Typography
                variant="h6"
                fontWeight="bold"
                color="primary"
                sx={{ mt: 4, mb: 3 }}
              >
                📋 Package Policies
              </Typography>

              <Grid container spacing={3}>
                {[
                  {
                    key: "inclusionPolicy",
                    label: "✅ Inclusion Policy",
                    helper: "What is included in the package",
                  },
                  {
                    key: "exclusionPolicy",
                    label: "❌ Exclusion Policy",
                    helper: "What is not included",
                  },
                  {
                    key: "paymentPolicy",
                    label: "💰 Payment Policy",
                    helper: "Payment terms",
                  },
                  {
                    key: "cancellationPolicy",
                    label: "⏰ Cancellation Policy",
                    helper: "Cancellation rules",
                  },
                  {
                    key: "termsAndConditions",
                    label: "📄 Terms & Conditions",
                    helper: "General terms",
                  },
                ].map((policy) => (
                  <Grid size={{ xs: 12 }} key={policy.key}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        {policy.label}
                      </Typography>

                      <Box
                        sx={{
                          border: "1px solid #ccc",
                          borderRadius: 1,
                          overflow: "hidden",
                          "& .ql-toolbar": {
                            borderBottom: "1px solid #ccc",
                            backgroundColor: "#f8f9fa",
                          },
                          "& .ql-container": {
                            minHeight: "200px",
                            fontSize: "14px",
                          },
                          "& .ql-editor": { minHeight: "200px" },
                        }}
                      >
                        <ReactQuill
                          value={pkg.policy?.[policy.key] || ""}
                          onChange={(content) =>
                            setPkg((prev) => ({
                              ...prev,
                              policy: {
                                ...(prev.policy || {}),
                                [policy.key]: content,
                              },
                            }))
                          }
                          modules={{
                            toolbar: [
                              [{ font: [] }, { size: [] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ color: [] }, { background: [] }],
                              [{ list: "ordered" }, { list: "bullet" }],
                              [{ indent: "-1" }, { indent: "+1" }],
                              [{ align: [] }],
                              [{ header: [1, 2, 3, 4, 5, 6, false] }],
                              ["blockquote", "code-block"],
                              ["link", "image", "video"],
                              ["clean"],
                            ],
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
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
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Package Information Card */}
            <Paper
              elevation={6}
              sx={{ p: 3, borderRadius: 4, mb: 3, background: "#f5f7fa" }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📋 Package Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Tour Type
                </Typography>
                <Typography variant="body1">{pkg.tourType || "--"}</Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Country
                </Typography>
                <Typography variant="body1">
                  {pkg.destinationCountry || "--"}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Sector
                </Typography>
                <Typography variant="body1">{pkg.sector || "--"}</Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {pkg.packageCategory || "--"}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Sub Type
                </Typography>
                <Typography variant="body1">
                  {Array.isArray(pkg.packageSubType)
                    ? pkg.packageSubType.join(", ")
                    : pkg.packageSubType || "--"}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Validity
                </Typography>
                <Typography variant="body1">
                  {pkg.validFrom
                    ? new Date(pkg.validFrom).toLocaleDateString()
                    : "--"}{" "}
                  to{" "}
                  {pkg.validTill
                    ? new Date(pkg.validTill).toLocaleDateString()
                    : "--"}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={pkg.status?.toUpperCase() || "DEACTIVE"}
                  color={pkg.status === "active" ? "success" : "default"}
                  size="small"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Stay Locations
                </Typography>
                <Typography variant="body1">
                  {pkg.stayLocations?.length || 0}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Total Nights
                </Typography>
                <Typography variant="body1">
                  {(pkg.stayLocations || []).reduce(
                    (sum, loc) => sum + (loc?.nights || 0),
                    0,
                  )}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Days in Itinerary
                </Typography>
                <Typography variant="body1">{pkg.days?.length || 0}</Typography>
              </Box>
            </Paper>

            {/* Quick Actions Card */}
            <Paper
              elevation={6}
              sx={{ p: 3, borderRadius: 4, background: "#f5f7fa" }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ⚡ Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2, borderRadius: 3 }}
                startIcon={<DownloadIcon />}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2, borderRadius: 3, backgroundColor: "#9c27b0" }}
                startIcon={<DescriptionIcon />}
                onClick={() => {
                  const totalNights = pkg.destinationNights?.reduce((sum, dest) => sum + (Number(dest.nights) || 0), 0) || 0;
                  navigate("/quickquotation", {
                    state: {
                      convertPackageId: pkg._id,
                      convertSector: pkg.sector || pkg.destinationCountry,
                      convertNights: totalNights
                    },
                  });
                }}
              >
                Convert to Quotation
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{ borderRadius: 3, backgroundColor: "#d32f2f" }}
                startIcon={<DeleteIcon />}
              >
                Delete Package
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {/* Dialog for adding new locations removed */}

      {/* Lead Options Manager Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Options</DialogTitle>
        <DialogContent>
          <LeadOptionsManager
            fieldName={currentField}
            onAdd={handleOptionAdd}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hotel Add New Dialog */}
      <Dialog
        open={hotelDialogOpen}
        onClose={() => {
          setHotelDialogOpen(false);
          setCurrentHotelCategory("");
          sessionStorage.removeItem("currentDestIndex");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New {currentHotelCategory.charAt(0).toUpperCase() + currentHotelCategory.slice(1)} Hotel
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Hotel Name"
              value={addMore}
              onChange={(e) => setAddMore(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddNewHotel();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHotelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNewHotel}
            variant="contained"
            color="primary"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Picker Dialog for selecting sightseeing & landscape photos */}
      <Dialog
        open={photoPickerOpen}
        onClose={() => setPhotoPickerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1.5,
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <PhotoLibraryIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {photoPickerTarget.isBanner
                ? "Choose Banner Photo"
                : `Choose Photo for Day ${(photoPickerTarget.dayIndex ?? 0) + 1}${
                    photoPickerDayTitle ? ` - ${photoPickerDayTitle}` : ""
                  }`}
            </Typography>
          </Box>
          <IconButton onClick={() => setPhotoPickerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Sightseeing & City quick filters */}
          {!photoPickerTarget.isBanner &&
            (photoPickerSightseeing.length > 0 || photoPickerCity) && (
              <Box
                mb={2.5}
                p={2}
                sx={{
                  bgcolor: "#f4f7fb",
                  borderRadius: 2,
                  border: "1px solid #e0e7f1",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.primary"
                  fontWeight="bold"
                  mb={1}
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                >
                  <LocationIcon fontSize="small" color="error" />
                  Quick Filter by Day's Sightseeing & City:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {photoPickerSightseeing.map((spot, sIdx) => {
                    const spotQuery = `${spot} ${photoPickerCity || ""}`.trim();
                    const isSelected =
                      photoPickerSearch.toLowerCase() === spotQuery.toLowerCase() ||
                      photoPickerSearch.toLowerCase() === spot.toLowerCase();
                    return (
                      <Chip
                        key={sIdx}
                        label={`📍 ${spot}`}
                        clickable
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        onClick={() => {
                          setPhotoPickerSearch(spotQuery);
                          searchPhotosForPicker(spotQuery, 1);
                        }}
                        sx={{ fontWeight: 500 }}
                      />
                    );
                  })}
                  {photoPickerCity && (
                    <Chip
                      label={`🏙️ ${photoPickerCity}`}
                      clickable
                      color={
                        photoPickerSearch.toLowerCase() === photoPickerCity.toLowerCase()
                          ? "primary"
                          : "default"
                      }
                      variant={
                        photoPickerSearch.toLowerCase() === photoPickerCity.toLowerCase()
                          ? "filled"
                          : "outlined"
                      }
                      onClick={() => {
                        setPhotoPickerSearch(photoPickerCity);
                        searchPhotosForPicker(photoPickerCity, 1);
                      }}
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
              </Box>
            )}

          {/* Search bar */}
          <Box display="flex" gap={1.5} mb={2.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search sightseeing attraction, monument, landscape, or city (e.g. Taj Mahal, Pangong Lake, Eiffel Tower)..."
              value={photoPickerSearch}
              onChange={(e) => setPhotoPickerSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchPhotosForPicker(photoPickerSearch, 1);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={() => searchPhotosForPicker(photoPickerSearch, 1)}
              disabled={photoPickerLoading || !photoPickerSearch.trim()}
              sx={{ minWidth: 110, textTransform: "none", fontWeight: "bold" }}
            >
              Search
            </Button>
          </Box>

          {/* Photo Grid */}
          {photoPickerLoading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
              gap={2}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Searching high-quality photos for "{photoPickerSearch}"...
              </Typography>
            </Box>
          ) : photoPickerResults.length === 0 ? (
            <Box
              textAlign="center"
              py={6}
              bgcolor="#fafafa"
              borderRadius={2}
              border="1px dashed #ccc"
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No photos found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Try clicking one of the sightseeing tags above or typing a broader name (e.g. city or state name).
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Found {photoPickerResults.length} photos. Click any photo below to select it:
              </Typography>

              <Grid container spacing={2}>
                {photoPickerResults.map((photo, pIdx) => {
                  const currentImage = photoPickerTarget.isBanner
                    ? pkg.bannerImage
                    : pkg.days?.[photoPickerTarget.dayIndex]?.dayImage;
                  const isCurrent = currentImage === photo.url;

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo.id || pIdx}>
                      <Card
                        onClick={() => handleSelectPhoto(photo.url)}
                        sx={{
                          cursor: "pointer",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          border: isCurrent ? "3px solid #1976d2" : "1px solid #e0e0e0",
                          borderRadius: 2,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        <Box sx={{ position: "relative", paddingTop: "65%", overflow: "hidden" }}>
                          <img
                            src={photo.small || photo.url}
                            alt={photo.alt || "Tour photo"}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {isCurrent && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: "primary.main",
                                color: "white",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 14 }} /> Current
                            </Box>
                          )}
                        </Box>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              color: "text.secondary",
                              minHeight: "2.4em",
                            }}
                          >
                            {photo.alt || "Landscape view"}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
                              📸 {photo.photographer}
                            </Typography>
                            <Button
                              size="small"
                              variant={isCurrent ? "outlined" : "contained"}
                              color="primary"
                              sx={{ py: 0.2, px: 1, fontSize: "0.75rem", textTransform: "none" }}
                            >
                              {isCurrent ? "Selected" : "Select"}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Pagination controls */}
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={photoPickerPage <= 1 || photoPickerLoading}
                  onClick={() => searchPhotosForPicker(photoPickerSearch, photoPickerPage - 1)}
                  sx={{ textTransform: "none" }}
                >
                  ◀ Previous
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Page {photoPickerPage} of {photoPickerTotalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={photoPickerPage >= photoPickerTotalPages || photoPickerLoading}
                  onClick={() => searchPhotosForPicker(photoPickerSearch, photoPickerPage + 1)}
                  sx={{ textTransform: "none" }}
                >
                  Next ▶
                </Button>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #eee", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Photos sourced from Unsplash
          </Typography>
          <Button onClick={() => setPhotoPickerOpen(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default PackageEditView;