// src/components/Form/TourDetailsForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  IconButton,
  Autocomplete,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import AssignmentIcon from "@mui/icons-material/Assignment";
import {
  updatePackageTourDetails,
  fetchPackages,
} from "../../../../features/package/packageSlice";
import {
  fetchCitiesByState,
  clearCities,
  fetchDomesticCities,
  fetchInternationalCities,
  fetchCountries,
  fetchStatesByCountry,
  fetchAllIndianCities as fetchAllIndianCitiesAction,
  fetchAllCitiesByCountry,
} from "../../../../features/location/locationSlice";
import {
  getLeadOptions,
  addLeadOption,
  deleteLeadOption,
} from "../../../../features/leads/leadSlice";
import { useNavigate } from "react-router-dom";
import axios from "../../../../utils/axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchHotels, createHotelStep1 } from "../../../../features/hotel/hotelSlice";

const toHtmlParagraphs = (text = "") => {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const parts = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return parts.map((line) => `<p>${line}</p>`).join("");
};

const normalizePolicyForEditor = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const merged = value.join("\n").trim();
    if (!merged) return "";
    if (/<[a-z][\s\S]*>/i.test(merged)) return merged;
    return toHtmlParagraphs(merged);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
    return toHtmlParagraphs(trimmed);
  }

  return "";
};

const normalizePolicyState = (source = {}) => {
  const policySource = source?.policy || source || {};
  return {
    inclusionPolicy: normalizePolicyForEditor(
      policySource?.inclusionPolicy ?? policySource?.inclusions,
    ),
    exclusionPolicy: normalizePolicyForEditor(
      policySource?.exclusionPolicy ?? policySource?.exclusions,
    ),
    paymentPolicy: normalizePolicyForEditor(policySource?.paymentPolicy),
    cancellationPolicy: normalizePolicyForEditor(
      policySource?.cancellationPolicy,
    ),
    termsAndConditions: normalizePolicyForEditor(
      policySource?.termsAndConditions,
    ),
  };
};

const TourDetailsForm = ({ onNext, initialData, packageId, packageData }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cities, countries, states, loading } = useSelector(
    (state) => state.location,
  );
  const { hotels, loading: hotelsLoading } = useSelector(
    (state) => state.hotel,
  );
  const { options } = useSelector((state) => state.leads);
  const [hotelOptions, setHotelOptions] = useState({});
  const [allIndianCities, setAllIndianCities] = useState([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Loading state for save button
  const [saving, setSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [fetchingImageIndex, setFetchingImageIndex] = useState(null);

  // Photo Picker Modal state for choosing photos
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

  // Search states
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [departureSearch, setDepartureSearch] = useState("");
  const [filteredArrivalCities, setFilteredArrivalCities] = useState([]);
  const [filteredDepartureCities, setFilteredDepartureCities] = useState([]);
  // Keep your existing policyInputs useState with initialData only
  const [policyInputs, setPolicyInputs] = useState(
    normalizePolicyState(initialData),
  );

  // Add globalSettings state
  const [globalSettings, setGlobalSettings] = useState({
    inclusionPolicy: "",
    exclusionPolicy: "",
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: "",
  });

  // Fetch global settings
  const fetchGlobalSettings = async () => {
    try {
      const res = await axios.get("/global-settings");
      const settings = normalizePolicyState(res.data);
      setGlobalSettings(settings);

      // Only set global settings if no initial data exists
      setPolicyInputs((prev) => ({
        inclusionPolicy: prev.inclusionPolicy || settings.inclusionPolicy,
        exclusionPolicy: prev.exclusionPolicy || settings.exclusionPolicy,
        paymentPolicy: prev.paymentPolicy || settings.paymentPolicy,
        cancellationPolicy:
          prev.cancellationPolicy || settings.cancellationPolicy,
        termsAndConditions:
          prev.termsAndConditions || settings.termsAndConditions,
      }));
    } catch (err) {
      console.error("Failed to fetch global settings:", err);
    }
  };

  // Add useEffect to fetch settings
  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (!initialData) return;
    setPolicyInputs((prev) => {
      const normalized = normalizePolicyState(initialData);
      return {
        inclusionPolicy: normalized.inclusionPolicy || prev.inclusionPolicy,
        exclusionPolicy: normalized.exclusionPolicy || prev.exclusionPolicy,
        paymentPolicy: normalized.paymentPolicy || prev.paymentPolicy,
        cancellationPolicy:
          normalized.cancellationPolicy || prev.cancellationPolicy,
        termsAndConditions:
          normalized.termsAndConditions || prev.termsAndConditions,
      };
    });
  }, [initialData]);
  // Add New Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [addMore, setAddMore] = useState("");
  const [currentHotelCategory, setCurrentHotelCategory] = useState("");

  // PackageEntryForm se aaye data ko extract karo
  const tourType = packageData?.tourType || "Domestic";
  const selectedCountry = packageData?.destinationCountry || "India";
  const selectedState = packageData?.sector || "";
  const DOMESTIC_TOUR_TYPES = ["Domestic"];

  const [tourDetails, setTourDetails] = useState({
    arrivalCity: initialData?.arrivalCity || "",
    departureCity: initialData?.departureCity || "",
    title: initialData?.title || "",
    notes:
      initialData?.notes ||
      "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
    bannerImage: initialData?.bannerImage || null,
    validFrom: initialData?.validFrom || null,
    validTill: initialData?.validTill || null,
    days:
      initialData?.days && initialData.days.length > 0
        ? initialData.days.map((d) => ({
          title: d.title || "",
          notes: d.notes || "",
          aboutCity: d.aboutCity || "",
          dayImage: d.dayImage || null,
          sightseeing: d.sightseeing || [],
          selectedSightseeing: d.selectedSightseeing || [],
        }))
        : [
          {
            title: "",
            notes: "",
            aboutCity: "",
            dayImage: null,
            sightseeing: [],
            selectedSightseeing: [],
          },
        ],
    perPerson: initialData?.perPerson || 1,
    numberOfRooms: Number(initialData?.numberOfRooms) || 1,
    transportationCostPerDay:
      Number(initialData?.transportationCostPerDay) || 0,
    transportationDays:
      Number(initialData?.transportationDays) || initialData?.days?.length || 0,
    manualCostMargin: Number(initialData?.manualCostMargin) || 0,
    mealPlan: {
      planType: initialData?.mealPlan?.planType || "",
      description: initialData?.mealPlan?.description || "",
    },
    // ✅ FIXED: Properly initialize destinationNights from Step 1 data
    destinationNights: (() => {
      console.log("🔄 Initializing destinationNights...");
      console.log("📦 packageData:", packageData);
      console.log("🏙️ packageData stayLocations:", packageData?.stayLocations);

      // If we have initialData with destinationNights, use it
      if (initialData?.destinationNights?.length > 0) {
        console.log("✅ Using initialData destinationNights");
        return initialData.destinationNights;
      }
      // If we have packageData from Step 1 with stayLocations, use those cities
      else if (packageData?.stayLocations?.length > 0) {
        console.log("🚀 Creating destinationNights from Step 1 stayLocations");
        const destinations = packageData.stayLocations.map((s) => ({
          destination: s.city || "",
          nights: s.nights || 0,
          hotels: [
            { category: "standard", hotelName: "TBD", pricePerPerson: 0 }, // ✅ 0 means empty
            { category: "deluxe", hotelName: "TBD", pricePerPerson: 0 }, // ✅ 0 means empty
            { category: "superior", hotelName: "TBD", pricePerPerson: 0 }, // ✅ 0 means empty
          ],
        }));
        console.log("📋 Created destinations:", destinations);
        return destinations;
      }
      // Default empty array
      else {
        console.log("⚠️ No data available for destinationNights");
        return [];
      }
    })(),
    policy: initialData?.policy || {
      inclusionPolicy: [],
      exclusionPolicy: [],
      paymentPolicy: [],
      cancellationPolicy: [],
      termsAndConditions: [],
    },
  });

  const hotelTotalCost = useMemo(() => {
    return (tourDetails.destinationNights || []).reduce((destTotal, dest) => {
      const nights = Number(dest?.nights) || 0;
      const rooms = Number(tourDetails.numberOfRooms) || 1;
      const hotelRatePerNight = (dest?.hotels || []).reduce(
        (rateTotal, hotel) => rateTotal + (Number(hotel?.pricePerPerson) || 0),
        0,
      );
      return destTotal + nights * hotelRatePerNight * rooms;
    }, 0);
  }, [tourDetails.destinationNights, tourDetails.numberOfRooms]);

  const {
    standardHotelTotalCost,
    deluxeHotelTotalCost,
    superiorHotelTotalCost,
  } = useMemo(() => {
    const rooms = Number(tourDetails.numberOfRooms) || 1;
    return (tourDetails.destinationNights || []).reduce(
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
            hotels.find((hotel) => hotel?.category === "deluxe")
              ?.pricePerPerson,
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
  }, [tourDetails.destinationNights, tourDetails.numberOfRooms]);

  const transportationTotalCost = useMemo(() => {
    const perDay = Number(tourDetails.transportationCostPerDay) || 0;
    const days = Number(tourDetails.transportationDays) || 0;
    return perDay * days;
  }, [tourDetails.transportationCostPerDay, tourDetails.transportationDays]);

  const calculatedTotalCost = useMemo(() => {
    return hotelTotalCost + transportationTotalCost;
  }, [hotelTotalCost, transportationTotalCost]);

  const costMargin = Number(tourDetails.manualCostMargin) || 0;

  const finalStandardCost = useMemo(
    () => standardHotelTotalCost + transportationTotalCost + costMargin,
    [standardHotelTotalCost, transportationTotalCost, costMargin],
  );
  const finalDeluxeCost = useMemo(
    () => deluxeHotelTotalCost + transportationTotalCost + costMargin,
    [deluxeHotelTotalCost, transportationTotalCost, costMargin],
  );
  const finalSuperiorCost = useMemo(
    () => superiorHotelTotalCost + transportationTotalCost + costMargin,
    [superiorHotelTotalCost, transportationTotalCost, costMargin],
  );

  useEffect(() => {
    const autoTransportationDays = tourDetails.days?.length || 0;
    setTourDetails((prev) => {
      if ((Number(prev.transportationDays) || 0) === autoTransportationDays) {
        return prev;
      }
      return {
        ...prev,
        transportationDays: autoTransportationDays,
      };
    });
  }, [tourDetails.days]);

  const finalTotalCost = useMemo(() => {
    const margin = Number(tourDetails.manualCostMargin) || 0;
    return calculatedTotalCost + margin;
  }, [tourDetails.manualCostMargin, calculatedTotalCost]);
  const selectedCities = useMemo(() => {
    return packageData?.stayLocations?.map((location) => location.city) || [];
  }, [packageData]);

  useEffect(() => {
    if (selectedCities.length > 0) {
      console.log("📍 Selected cities from Step 1:", selectedCities);
      // Fetch all hotels so local filtering can work across multiple cities
      dispatch(fetchHotels());
    } else {
      console.log("⚠️ No cities selected from Step 1");
    }
  }, [selectedCities, dispatch]);

  useEffect(() => {
    console.log("📦 Package Data from Step 1:", packageData);
    console.log("🏙️ Stay Locations from Step 1:", packageData?.stayLocations);

    if (packageData?.stayLocations?.length > 0) {
      const citiesFromStep1 = packageData.stayLocations.map(
        (location) => location.city,
      );
      console.log("📍 Cities from Step 1:", citiesFromStep1);

      // ✅ Update destinationNights with cities from Step 1
      const updatedDestinationNights = citiesFromStep1.map((city) => {
        const existingDest = tourDetails.destinationNights.find(
          (dest) => dest.destination === city,
        );
        const stayLoc = packageData.stayLocations.find((loc) => loc.city === city);
        const nights = stayLoc?.nights || 0;

        if (existingDest) {
          return {
            ...existingDest,
            nights: nights,
          };
        }

        return {
          destination: city,
          nights: nights,
          hotels: [
            { category: "standard", hotelName: "TBD", pricePerPerson: 0 },
            { category: "deluxe", hotelName: "TBD", pricePerPerson: 0 },
            { category: "superior", hotelName: "TBD", pricePerPerson: 0 },
          ],
        };
      });

      console.log("🔄 Updated destination nights:", updatedDestinationNights);
      setTourDetails((prev) => ({
        ...prev,
        destinationNights: updatedDestinationNights,
      }));

      // ✅ We fetch all hotels initially, so local filtering works without overwriting Redux state
      console.log("✅ Local filtering will handle destinations");
    } else {
      console.log("⚠️ No stay locations found in packageData");
    }
  }, [packageData, dispatch]);

  const organizedHotelOptions = useMemo(() => {
    const options = {
      standard: [],
      deluxe: [],
      superior: [],
    };

    if (hotels && hotels.length > 0) {
      hotels.forEach((hotel) => {
        let category = typeof hotel.category === 'string' ? hotel.category.toLowerCase().trim() : "";
        if (!category && hotel.hotelType) {
          if (Array.isArray(hotel.hotelType) && hotel.hotelType.length > 0) {
            category = hotel.hotelType[0].toLowerCase().trim();
          } else if (typeof hotel.hotelType === 'string') {
            category = hotel.hotelType.toLowerCase().trim();
          }
        }
        if (!category) category = "standard";

        if (options[category]) {
          options[category].push(hotel.hotelName);
        } else {
          options.standard.push(hotel.hotelName);
        }
      });
    }

    return options;
  }, [hotels]);

  const getHotelsForDestination = (destinationCity) => {
    if (!destinationCity) {
      console.log("❌ No destination city provided");
      return { standard: [], deluxe: [], superior: [] };
    }

    console.log(`🔍 Filtering hotels for destination: "${destinationCity}"`);
    console.log(
      `📊 Total hotels loaded: ${hotels?.length || 0}`,
    );

    if (!hotels || hotels.length === 0) {
      console.log("⚠️ No hotels available");
      return { standard: [], deluxe: [], superior: [] };
    }

    // ✅ IMPROVED: Better city matching
    const destinationHotels = hotels.filter((hotel) => {
      const hotelCity = hotel.location?.city?.toLowerCase() || "";
      const hotelName = hotel.hotelName?.toLowerCase() || "";
      const searchCity = destinationCity.toLowerCase().trim();

      console.log(
        `🔸 Comparing: Hotel "${hotelName}" in "${hotelCity}" with "${searchCity}"`,
      );

      // Exact matches
      const exactMatch = hotelCity === searchCity;
      // Partial matches
      const partialMatch =
        (hotelCity !== "" && (
          hotelCity.includes(searchCity) ||
          searchCity.includes(hotelCity) ||
          hotelCity.includes(searchCity.split(" ")[0]) ||
          searchCity.includes(hotelCity.split(" ")[0])
        )) ||
        (hotelName !== "" && hotelName.includes(searchCity));

      if (exactMatch) {
        console.log(`✅ Exact match found: ${hotel.hotelName}`);
      } else if (partialMatch) {
        console.log(`🔸 Partial match: ${hotel.hotelName}`);
      }

      return exactMatch || partialMatch;
    });

    console.log(
      `🏨 Found ${destinationHotels.length} hotels for "${destinationCity}"`,
    );

    const organized = {
      standard: [],
      deluxe: [],
      superior: [],
    };

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
          console.log(`🏩 Added ${hotelName} to ${category} category`);
        } else if (!organized[category] && !organized.standard.includes(hotelName)) {
          organized.standard.push(hotelName);
          console.log(`🏩 Added ${hotelName} to standard category (fallback for ${category})`);
        }
      }
    });

    console.log(`📋 Organized hotels for "${destinationCity}":`, organized);
    return organized;
  };

  // ===== Add New Option Logic =====
  const getOptionsForField = (fieldName) => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === fieldName)
      .map((opt) => ({ value: opt.value, label: opt.value }));

    return [
      ...(filteredOptions || []),
      { value: "__add_new", label: "+ Add New" },
    ];
  };

  const getHotelOptionsForCategory = (category, destinationCity = "") => {
    console.log(`🏩 Getting ${category} hotels for "${destinationCity}"`);

    const destinationHotels = getHotelsForDestination(destinationCity);
    const baseOptions = destinationHotels[category] || [];

    const allOptions = [...new Set([...baseOptions])];

    console.log(
      `🏩 ${category} hotels for "${destinationCity}": ${allOptions.length} total`,
    );

    // ✅ Always include Add New option
    return [...allOptions, { value: "__add_new", label: "+ Add New" }];
  };

  const handleOpenDialog = (field, category = "") => {
    setCurrentField(field);
    setCurrentHotelCategory(category);
    setAddMore("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentHotelCategory("");
    sessionStorage.removeItem("currentDestIndex");
  };

  const handleAddNewItem = async () => {
    if (!addMore.trim()) {
      alert("Please enter a name");
      return;
    }

    try {
      const newValue = addMore.trim();
      let backendField = currentField;

      // Special handling for hotel categories
      if (currentHotelCategory) {
        backendField = `hotel_${currentHotelCategory}`;
        console.log(
          `➕ Adding new hotel: "${newValue}" for category "${currentHotelCategory}"`,
        );

        // ✅ Extract destination from session storage
        const destIndex = sessionStorage.getItem("currentDestIndex");
        let destinationCity = "";
        let destinationState = "";
        let destinationCountry = selectedCountry || "India";

        if (destIndex !== null && tourDetails.destinationNights[destIndex]) {
          destinationCity = tourDetails.destinationNights[destIndex].destination;
          
          // Find matching stayLocation to get exact state and country
          const matchedLocation = packageData?.stayLocations?.find(
            (loc) => loc.city === destinationCity
          );
          
          if (matchedLocation) {
             destinationState = matchedLocation.state || "";
             destinationCountry = matchedLocation.country || destinationCountry;
          } else {
             // Fallback: use sector state if country is India
             destinationState = destinationCountry === "India" ? (selectedState || "") : "";
          }
        }

        // ✅ Create real hotel entry with location object payload
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

        try {
          await dispatch(createHotelStep1(hotelFormData)).unwrap();
          console.log(`✅ Real hotel created: ${newValue}`);
          
          if (destinationCity) {
            dispatch(fetchHotels());
          }
          
          console.log(`✅ New ${currentHotelCategory} hotel added: ${newValue}`);
          handleCloseDialog();
          return; // Stop here, do not add to leadOptions
        } catch (hotelErr) {
          console.error("❌ Failed to create real hotel:", hotelErr);
          alert(`Failed to create hotel: ${hotelErr.message || "Unknown error"}`);
          return;
        }
      }

      console.log(
        `📡 Calling API to add: ${newValue} to field: ${backendField}`,
      );

      // ✅ Add to backend
      await dispatch(
        addLeadOption({ fieldName: backendField, value: newValue }),
      ).unwrap();

      // ✅ Fetch updated options
      await dispatch(getLeadOptions()).unwrap();
      console.log("✅ Successfully added new item and refreshed options");

      // ✅ Automatically select the newly added item
      if (currentField === "arrivalCity") {
        setTourDetails({ ...tourDetails, arrivalCity: newValue });
        console.log(`✅ Auto-selected new arrival city: ${newValue}`);
      } else if (currentField === "departureCity") {
        setTourDetails({ ...tourDetails, departureCity: newValue });
        console.log(`✅ Auto-selected new departure city: ${newValue}`);
      } else if (currentHotelCategory) {
        console.log(`✅ New ${currentHotelCategory} hotel added: ${newValue}`);
        // The hotel will automatically appear in the dropdown due to options refresh
      }

      handleCloseDialog();
    } catch (error) {
      console.error("❌ Failed to add new option:", error);
      alert(`Failed to add new item: ${error.message || "Please try again"}`);
    }
  };

  // Pure India ki saari cities fetch karne ka function
  const fetchAllIndianCities = async () => {
    try {
      console.log("Fetching all Indian cities via single optimized request...");
      const citiesData = await dispatch(fetchAllIndianCitiesAction()).unwrap();
      setAllIndianCities(citiesData || []);
    } catch (error) {
      console.error("Failed to fetch all Indian cities:", error);
    }
  };


  // ✅ Available cities filter - Domestic mein pure India ki cities, International mein selected country ki cities
  const getAvailableCities = () => {
    if (DOMESTIC_TOUR_TYPES.includes(tourType)) {
      return allIndianCities;
    } else {
      if (!cities || cities.length === 0) return [];
      return cities
        .map((city) =>
          typeof city === "string" ? city : city.city || city.name || city,
        )
        .filter(Boolean);
    }
  };

  // Optimized smart search function with Add New option
  const smartSearch = useMemo(() => {
    return (searchTerm, citiesList, fieldName) => {
      const input = searchTerm.toLowerCase().trim();
      const hasSearch = input.length > 0;

      // Get custom added cities for this field
      const customCities =
        options
          ?.filter((opt) => opt.fieldName === fieldName)
          .map((opt) => opt.value) || [];

      // Combine API cities and custom cities
      const allAvailableCities = [...new Set([...citiesList, ...customCities])];

      if (!hasSearch) {
        // When no search, show limited cities + Add New at top
        const limitedCities = allAvailableCities.slice(0, 100);
        return ["__add_new", ...limitedCities];
      }

      const results = [];
      const startsWith = [];
      const wordStartsWith = [];
      const contains = [];

      allAvailableCities.forEach((city) => {
        const cityName = city.toLowerCase();

        if (cityName === input) {
          results.unshift(city); // Exact match at very top
        } else if (cityName.startsWith(input)) {
          startsWith.push(city);
        } else if (cityName.split(" ").some((word) => word.startsWith(input))) {
          wordStartsWith.push(city);
        } else if (cityName.includes(input)) {
          contains.push(city);
        }
      });

      // Sort each category alphabetically
      startsWith.sort((a, b) => a.localeCompare(b));
      wordStartsWith.sort((a, b) => a.localeCompare(b));
      contains.sort((a, b) => a.localeCompare(b));

      const searchResults = [
        ...results,
        ...startsWith,
        ...wordStartsWith,
        ...contains,
      ];

      // Add New option at the top if no exact matches found
      if (results.length === 0 && startsWith.length === 0) {
        return ["__add_new", ...searchResults.slice(0, 200)];
      }

      return [...searchResults.slice(0, 200)];
    };
  }, [options]);

  // Search effects
  useEffect(() => {
    const availableCities = getAvailableCities();
    const arrivalFiltered = smartSearch(
      arrivalSearch,
      availableCities,
      "arrivalCity",
    );
    setFilteredArrivalCities(arrivalFiltered);
  }, [arrivalSearch, allIndianCities, tourType, smartSearch]);

  useEffect(() => {
    const availableCities = getAvailableCities();
    const departureFiltered = smartSearch(
      departureSearch,
      availableCities,
      "departureCity",
    );
    setFilteredDepartureCities(departureFiltered);
  }, [departureSearch, allIndianCities, tourType, smartSearch]);

  useEffect(() => {
    dispatch(getLeadOptions());
    dispatch(clearCities());

    if (DOMESTIC_TOUR_TYPES.includes(tourType)) {
      console.log("Fetching all Indian cities for domestic tour type...");
      fetchAllIndianCities();
    } else {
      if (selectedCountry) {
        console.log(
          "Fetching cities for international country:",
          selectedCountry,
        );

        if (selectedState) {
          dispatch(
            fetchInternationalCities({
              countryName: selectedCountry,
              stateName: selectedState,
            }),
          )
            .unwrap()
            .then((cities) => {
              console.log("International cities fetched:", cities);
            })
            .catch((error) => {
              console.error("Failed to fetch international cities:", error);
            });
        } else {
          // Optimized: Fetch all cities of the country in one go
          dispatch(
            fetchAllCitiesByCountry(selectedCountry),
          )
            .unwrap()
            .then((cities) => {
              console.log("All cities for country fetched:", cities);
            })
            .catch((error) => {
              console.error("Failed to fetch cities for country:", error);
            });
        }
      }
    }
  }, [dispatch, selectedCountry, selectedState, tourType]);

  // Rest of your handlers remain the same
  const getCityForDay = (dayIndex) => {
    if (!tourDetails.stayLocations || tourDetails.stayLocations.length === 0) return packageData?.sector || "landscape";
    let currentDay = 0;
    for (let loc of tourDetails.stayLocations) {
      const nights = parseInt(loc.nights) || 1;
      if (dayIndex < currentDay + nights) {
        return loc.city;
      }
      currentDay += nights;
    }
    return tourDetails.stayLocations[tourDetails.stayLocations.length - 1].city;
  };

  const handleDayChange = (index, field, value) => {
    const updatedDays = [...tourDetails.days];
    if (field === "selectedSightseeing") {
      const arr = Array.isArray(value) ? value : [];
      updatedDays[index] = {
        ...updatedDays[index],
        selectedSightseeing: arr,
        sightseeing: arr,
      };
    } else {
      updatedDays[index][field] = value;
    }
    setTourDetails({ ...tourDetails, days: updatedDays });
  };

  const handleGenerateItinerary = async () => {
    try {
      setIsGeneratingAi(true);
      const totalNights = packageData?.stayLocations?.reduce((sum, sl) => sum + (Number(sl.nights) || 0), 0) || 0;
      const targetDays = totalNights > 0 ? totalNights + 1 : Math.max(1, tourDetails.days.length);

      const res = await axios.post("/ai/generate-itinerary", {
        arrivalCity: tourDetails.arrivalCity,
        departureCity: tourDetails.departureCity,
        destinationCountry: selectedCountry,
        sector: selectedState,
        days: targetDays,
        tourType: tourType,
        stayLocations: packageData?.stayLocations
      });
      if (res.data?.success && res.data?.data) {
        const generatedDays = res.data.data;
        setTourDetails(prev => {
          const newDays = [...prev.days];
          generatedDays.forEach((genDay, idx) => {
            const aiSightseeing = Array.isArray(genDay.sightseeing) ? genDay.sightseeing : [];
            if (newDays[idx]) {
              newDays[idx].title = genDay.title || newDays[idx].title;
              newDays[idx].notes = genDay.notes || newDays[idx].notes;
              newDays[idx].aboutCity = genDay.aboutCity || newDays[idx].aboutCity;
              newDays[idx].sightseeing = aiSightseeing.length > 0 ? aiSightseeing : newDays[idx].sightseeing;
              newDays[idx].selectedSightseeing = aiSightseeing.length > 0 ? aiSightseeing : newDays[idx].selectedSightseeing;
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
        setSnackbar({ open: true, message: "Itinerary generated successfully!", severity: "success" });
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
    const day = tourDetails.days?.[index];
    if (!day) return [];
    const list = [
      ...(Array.isArray(day.selectedSightseeing) ? day.selectedSightseeing : []),
      ...(Array.isArray(day.sightseeing) ? day.sightseeing : []),
    ];
    return [...new Set(list.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
  };

  const getBestDayQuery = (index) => {
    const day = tourDetails.days?.[index];
    const city = getCityForDay(index);
    const sightseeingList = getDaySightseeingList(index);

    if (sightseeingList.length > 0) {
      return `${sightseeingList[0]} ${city || ""}`.trim();
    }
    if (day?.title && day.title.trim()) {
      return `${day.title} ${city || ""}`.trim();
    }
    return city || packageData?.sector || "landscape";
  };

  const handleAutoFetchImage = async (index, query, isBanner = false) => {
    const effectiveQuery = (query || (isBanner ? (packageData?.sector || selectedState || selectedCountry || "landscape") : getBestDayQuery(index))).trim();
    if (!effectiveQuery) {
      setSnackbar({ open: true, message: "No destination found to fetch image for. Please fill out the Sector or Stay Locations field.", severity: "warning" });
      return;
    }
    setFetchingImageIndex(isBanner ? 'banner' : index);
    
    // Cycle page offsets so subsequent clicks on "Auto-Fetch" fetch different photos
    const currentOffset = isBanner ? (dayPhotoOffsets['banner'] || 0) : (dayPhotoOffsets[index] || 0);
    const nextOffset = currentOffset + 1;
    setDayPhotoOffsets(prev => ({ ...prev, [isBanner ? 'banner' : index]: nextOffset }));

    const pageNum = isBanner ? nextOffset : ((index !== null && index !== undefined ? index * 2 : 0) + nextOffset);
    const finalQuery = isBanner ? effectiveQuery : `${effectiveQuery} landmark architecture`;
    
    try {
      const res = await axios.get(`/photos/search?query=${encodeURIComponent(finalQuery)}&page=${pageNum}`);
      if (res.data?.success && res.data?.data) {
        if (isBanner) {
          setTourDetails(prev => ({ ...prev, bannerImage: res.data.data }));
        } else {
          handleDayChange(index, "dayImage", res.data.data);
        }
        setSnackbar({ open: true, message: `Photo fetched for ${effectiveQuery}! Click "Choose Photo" if you'd like to pick another.`, severity: "success" });
      }
    } catch (err) {
      console.error("Auto fetch image error:", err);
      setSnackbar({ open: true, message: "Failed to fetch photo.", severity: "error" });
    } finally {
      setFetchingImageIndex(null);
    }
  };

  const handleAutoFetchAllPhotos = async () => {
    if (!tourDetails.days || tourDetails.days.length === 0) {
      setSnackbar({ open: true, message: "No days available to fetch photos for.", severity: "warning" });
      return;
    }
    setIsAutoFetchingAll(true);
    let successCount = 0;
    try {
      const updatedDays = [...tourDetails.days];
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
      setTourDetails((prev) => ({ ...prev, days: updatedDays }));
      setSnackbar({
        open: true,
        message: `Photos fetched for ${successCount} day(s) matched to sightseeing! Click "Choose Photo" on any day to pick another.`,
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
      const bannerQuery = packageData?.sector || selectedState || selectedCountry || "landscape";
      setPhotoPickerSightseeing([]);
      setPhotoPickerCity(bannerQuery);
      setPhotoPickerDayTitle("Banner Photo");
      setPhotoPickerSearch(bannerQuery);
      setPhotoPickerPage(1);
      setPhotoPickerOpen(true);
      searchPhotosForPicker(bannerQuery, 1);
    } else {
      const day = tourDetails.days?.[index];
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
      setTourDetails((prev) => ({ ...prev, bannerImage: photoUrl }));
      setSnackbar({ open: true, message: "Banner image updated successfully!", severity: "success" });
    } else if (photoPickerTarget.dayIndex !== null && photoPickerTarget.dayIndex !== undefined) {
      handleDayChange(photoPickerTarget.dayIndex, "dayImage", photoUrl);
      setSnackbar({
        open: true,
        message: `Photo selected for Day ${photoPickerTarget.dayIndex + 1}!`,
        severity: "success",
      });
    }
    setPhotoPickerOpen(false);
  };

  const handleAddDay = () => {
    setTourDetails({
      ...tourDetails,
      days: [
        ...tourDetails.days,
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
    setTourDetails({
      ...tourDetails,
      days: tourDetails.days.filter((_, i) => i !== index),
    });
  };

  const handleAddSightseeing = (dayIndex, e) => {
    if (e.key !== "Enter") return;
    const raw = typeof e.target.value === "string" ? e.target.value : "";
    const newSight = raw.trim();
    if (!newSight) return;

    e.preventDefault();

    setTourDetails((prev) => {
      if (!prev.days || dayIndex < 0 || dayIndex >= prev.days.length)
        return prev;
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

  const handleSubmit = async () => {
    setSaving(true);
    let textUpdateSuccess = false;

    let bannerImageUrl =
      typeof tourDetails.bannerImage === "string"
        ? tourDetails.bannerImage
        : "";

    if (tourDetails.bannerImage instanceof File) {
      try {
        const formData = new FormData();
        formData.append("banner", tourDetails.bannerImage);
        const res = await axios.post(
          `/packages/${packageId}/banner`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        bannerImageUrl =
          res.data?.package?.bannerImage ||
          res.data?.bannerImage ||
          bannerImageUrl;
      } catch (err) {
        console.warn(
          "⚠️ Banner upload failed:",
          err.response?.data || err.message,
        );
        setSnackbar({
          open: true,
          message: `Banner upload failed: ${err.response?.data?.message || err.message}`,
          severity: "warning",
        });
      }
    }

    try {
      const payload = {
        arrivalCity: tourDetails.arrivalCity,
        departureCity: tourDetails.departureCity,
        title: tourDetails.title,
        notes: tourDetails.notes,
        validFrom: tourDetails.validFrom,
        validTill: tourDetails.validTill,
        mealPlan: {
          planType: tourDetails.mealPlan?.planType || "",
          description: tourDetails.mealPlan?.description || "",
        },
        days: tourDetails.days.map((day) => ({
          title: day.title,
          notes: day.notes,
          aboutCity: day.aboutCity,
          sightseeing: day.sightseeing,
          selectedSightseeing: day.selectedSightseeing || [],
          dayImage: typeof day.dayImage === "string" ? day.dayImage : "",
        })),
        destinationNights: tourDetails.destinationNights.map((dest) => ({
          destination: dest.destination || "",
          nights: dest.nights || 0,
          hotels: [
            dest.hotels[0] || {
              category: "standard",
              hotelName: "",
              pricePerPerson: 0,
            },
            dest.hotels[1] || {
              category: "deluxe",
              hotelName: "",
              pricePerPerson: 0,
            },
            dest.hotels[2] || {
              category: "superior",
              hotelName: "",
              pricePerPerson: 0,
            },
          ],
        })),
        perPerson: tourDetails.perPerson || 1,
        numberOfRooms: Number(tourDetails.numberOfRooms) || 1,
        transportationCostPerDay:
          Number(tourDetails.transportationCostPerDay) || 0,
        transportationDays: Number(tourDetails.transportationDays) || 0,
        transportationTotalCost,
        hotelTotalCost,
        standardHotelTotalCost,
        deluxeHotelTotalCost,
        superiorHotelTotalCost,
        calculatedTotalCost,
        finalStandardCost,
        finalDeluxeCost,
        finalSuperiorCost,
        manualCostMargin: Number(tourDetails.manualCostMargin) || 0,
        totalCost: finalTotalCost,
        policy: {
          inclusionPolicy: policyInputs.inclusionPolicy
            ? [policyInputs.inclusionPolicy]
            : [],
          exclusionPolicy: policyInputs.exclusionPolicy
            ? [policyInputs.exclusionPolicy]
            : [],
          paymentPolicy: policyInputs.paymentPolicy
            ? [policyInputs.paymentPolicy]
            : [],
          cancellationPolicy: policyInputs.cancellationPolicy
            ? [policyInputs.cancellationPolicy]
            : [],
          termsAndConditions: policyInputs.termsAndConditions
            ? [policyInputs.termsAndConditions]
            : [],
        },
        status: "active",
      };

      if (bannerImageUrl) {
        payload.bannerImage = bannerImageUrl;
      } else if (
        typeof tourDetails.bannerImage === "string" &&
        tourDetails.bannerImage
      ) {
        payload.bannerImage = tourDetails.bannerImage;
      }

      await dispatch(
        updatePackageTourDetails({ id: packageId, data: payload }),
      ).unwrap();
      await dispatch(fetchPackages()).unwrap();

      textUpdateSuccess = true;
    } catch (err) {
      console.error(
        "❌ Failed to update textual details:",
        err.response?.data || err.message,
      );
      setSnackbar({
        open: true,
        message: `Failed to save tour details: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
      setSaving(false);
      return;
    }

    for (let i = 0; i < tourDetails.days.length; i++) {
      const day = tourDetails.days[i];
      if (day.dayImage instanceof File) {
        try {
          const formData = new FormData();
          formData.append("dayImage", day.dayImage);
          await axios.post(`/packages/${packageId}/days/${i}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.warn(
            `⚠️ Day ${i + 1} image upload failed:`,
            err.response?.data || err.message,
          );
          setSnackbar({
            open: true,
            message: `Day ${i + 1} image upload failed, but other details saved`,
            severity: "warning",
          });
        }
      }
    }

    if (textUpdateSuccess) {
      setSnackbar({
        open: true,
        message: "✅ Tour details saved successfully!",
        severity: "success",
      });
      setTimeout(() => {
        navigate("/tourpackage");
      }, 1500);
    }
    setSaving(false);
  };

  const handleHotelChange = (destIndex, category, hotelName) => {
    console.log(
      `🏨 Hotel change: Destination ${destIndex}, ${category}, ${hotelName}`,
    );

    if (hotelName === "__add_new") {
      setCurrentHotelCategory(category);
      setCurrentField(`hotel_${category}`);
      setAddMore("");
      setOpenDialog(true);
      sessionStorage.setItem("currentDestIndex", destIndex);
      return;
    }

    const updatedNights = [...tourDetails.destinationNights];
    const catIndex = ["standard", "deluxe", "superior"].indexOf(category);

    if (!updatedNights[destIndex].hotels) {
      updatedNights[destIndex].hotels = [
        { category: "standard", hotelName: "", pricePerPerson: 0 },
        { category: "deluxe", hotelName: "", pricePerPerson: 0 },
        { category: "superior", hotelName: "", pricePerPerson: 0 },
      ];
    }

    updatedNights[destIndex].hotels[catIndex] = {
      ...updatedNights[destIndex].hotels[catIndex],
      category,
      hotelName,
    };

    setTourDetails({ ...tourDetails, destinationNights: updatedNights });
    console.log(`✅ Hotel updated: ${hotelName} for ${category}`);
  };

  const handlePriceChange = (destIndex, category, price) => {
    const updatedNights = [...tourDetails.destinationNights];
    const catIndex = ["standard", "deluxe", "superior"].indexOf(category);

    if (!updatedNights[destIndex].hotels) updatedNights[destIndex].hotels = [];

    // ✅ Convert empty string to 0
    const priceValue = price === "" ? 0 : Number(price);

    updatedNights[destIndex].hotels[catIndex] = {
      ...updatedNights[destIndex].hotels[catIndex],
      category,
      pricePerPerson: priceValue,
    };

    setTourDetails({ ...tourDetails, destinationNights: updatedNights });
    console.log(
      `💰 Price updated: ${category} hotel to ₹${priceValue} for destination ${destIndex}`,
    );
  };

  // Custom render option for Autocomplete
  const renderOption = (props, option, fieldName) => {
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
          + Add New City "{arrivalSearch || departureSearch}"
        </li>
      );
    }

    const optData = options?.find(
      (o) => o.fieldName === fieldName && o.value === option,
    );

    return (
      <li
        {...props}
        key={option}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
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
          + Add New {category.charAt(0).toUpperCase() + category.slice(1)} Hotel
        </li>
      );
    }

    const fieldName = `hotel_${category}`;
    const optData = options?.find(
      (o) => o.fieldName === fieldName && o.value === option,
    );

    return (
      <li
        {...props}
        key={option}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
        }}
      >
        <span>{option}</span>
        {optData && (
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm(`Delete "${option}" from ${category} hotels?`)
              ) {
                dispatch(deleteLeadOption(optData._id));
                console.log(`🗑️ Deleted hotel: ${option} from ${category}`);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </li>
    );
  };
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Tour Details - {tourType} ({selectedCountry})
      </Typography>

      <Box sx={{ mb: 2, p: 1, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Tour Type:</strong> {tourType} |<strong> Country:</strong>{" "}
          {selectedCountry} |<strong> State:</strong>{" "}
          {selectedState || "All States"}
        </Typography>
      </Box>

      {/* Basic Info - OPTIMIZED WITH SEARCH & ADD NEW */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={filteredArrivalCities}
            loading={loading}
            value={tourDetails.arrivalCity || ""}
            onInputChange={(event, newInputValue) => {
              setArrivalSearch(newInputValue);
            }}
            onChange={(e, newValue) => {
              if (newValue === "__add_new") {
                handleOpenDialog("arrivalCity");
              } else {
                setTourDetails({ ...tourDetails, arrivalCity: newValue });
                setArrivalSearch("");
              }
            }}
            filterOptions={(x) => x} // Disable default filter since we're handling it manually
            renderInput={(params) => (
              <TextField
                {...params}
                label="Arrival City"
                fullWidth
                helperText={
                  DOMESTIC_TOUR_TYPES.includes(tourType)
                    ? "All Indian cities - Type to search or add new"
                    : `Cities from ${selectedCountry} - Type to search or add new`
                }
              />
            )}
            renderOption={(props, option) =>
              renderOption(props, option, "arrivalCity")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={filteredDepartureCities}
            value={tourDetails.departureCity || null}
            onInputChange={(event, newInputValue) => {
              setDepartureSearch(newInputValue);
            }}
            onChange={(e, newValue) => {
              if (newValue === "__add_new") {
                handleOpenDialog("departureCity");
              } else {
                setTourDetails({ ...tourDetails, departureCity: newValue });
                setDepartureSearch("");
              }
            }}
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Departure City"
                fullWidth
                helperText={
                  DOMESTIC_TOUR_TYPES.includes(tourType)
                    ? "All Indian cities - Type to search or add new"
                    : `Cities from ${selectedCountry} - Type to search or add new`
                }
              />
            )}
            renderOption={(props, option) =>
              renderOption(props, option, "departureCity")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Package Title"
            value={tourDetails.title}
            onChange={(e) =>
              setTourDetails({ ...tourDetails, title: e.target.value })
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Initial Notes"
            value={tourDetails.notes}
            onChange={(e) =>
              setTourDetails({ ...tourDetails, notes: e.target.value })
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
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
              onClick={() => handleAutoFetchImage(null, packageData?.sector || selectedState || selectedCountry || "landscape", true)}
              startIcon={fetchingImageIndex === 'banner' ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {fetchingImageIndex === 'banner' ? "⏳ Fetching..." : "✨ Auto-Fetch Banner Photo"}
            </Button>
            <Button variant="outlined" component="label" sx={{ textTransform: 'none', fontWeight: 600 }}>
              📁 Upload Banner Image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setTourDetails({
                    ...tourDetails,
                    bannerImage: e.target.files[0],
                  })
                }
              />
            </Button>
            {tourDetails.bannerImage && (
              <Button
                color="error"
                size="small"
                onClick={() => setTourDetails((prev) => ({ ...prev, bannerImage: null }))}
                startIcon={<DeleteIcon fontSize="small" />}
                sx={{ textTransform: "none" }}
              >
                Remove Banner
              </Button>
            )}
          </Box>
          {tourDetails.bannerImage && (
            <Box sx={{ mt: 1.5, maxWidth: "550px" }}>
              {typeof tourDetails.bannerImage === 'string' ? (
                <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <img src={tourDetails.bannerImage} alt="Banner preview" style={{ height: "200px", width: "100%", objectFit: "cover", display: "block" }} />
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
                <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f5f5f5", borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500}>📁 {tourDetails.bannerImage.name}</Typography>
                  <Button size="small" color="error" onClick={() => setTourDetails((prev) => ({ ...prev, bannerImage: null }))}>Remove</Button>
                </Paper>
              )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Validity Section */}
      <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>
        Package Validity
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label="Valid From"
            value={tourDetails.validFrom}
            onChange={(newValue) =>
              setTourDetails({ ...tourDetails, validFrom: newValue })
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label="Valid Till"
            value={tourDetails.validTill}
            onChange={(newValue) =>
              setTourDetails({ ...tourDetails, validTill: newValue })
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
      </Grid>

      {/* Days Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={1} flexWrap="wrap" gap={1.5}>
        <Typography variant="h6" color="primary">
          Day Wise Plan
        </Typography>
        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
          {tourDetails.days.length > 0 && (
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
          >
            {isGeneratingAi ? "Generating..." : "Generate Itinerary with AI"}
          </Button>
        </Box>
      </Box>
      {tourDetails.days.map((day, index) => (
        <Paper key={index} sx={{ p: 2, my: 2, border: "1px solid #ccc" }}>
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight="bold">Day {index + 1}</Typography>
            {index > 0 && (
              <IconButton color="error" onClick={() => handleRemoveDay(index)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          <Grid container spacing={2} mt={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Day Title"
                value={day.title}
                onChange={(e) =>
                  handleDayChange(index, "title", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Day Notes"
                value={day.notes}
                onChange={(e) =>
                  handleDayChange(index, "notes", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="About City"
                value={day.aboutCity}
                onChange={(e) =>
                  handleDayChange(index, "aboutCity", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={() => handleOpenPhotoPicker(index)}
                  startIcon={<PhotoLibraryIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)',
                  }}
                >
                  🖼️ Choose Photo (by Sightseeing)
                </Button>

                <Button 
                  variant="outlined" 
                  disabled={fetchingImageIndex === index}
                  onClick={() => handleAutoFetchImage(index, getBestDayQuery(index))}
                  startIcon={fetchingImageIndex === index ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {fetchingImageIndex === index ? "⏳ Fetching..." : (day.dayImage ? "✨ Auto-Fetch Next" : "✨ Auto-Fetch Photo")}
                </Button>

                <Button variant="outlined" component="label" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  📁 Upload Custom
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleDayChange(index, "dayImage", e.target.files[0])
                    }
                  />
                </Button>

                {day.dayImage && (
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleDayChange(index, "dayImage", null)}
                    startIcon={<DeleteIcon fontSize="small" />}
                    sx={{ textTransform: "none" }}
                  >
                    Remove Photo
                  </Button>
                )}
              </Box>

              {day.dayImage && (
                <Box sx={{ mt: 1, maxWidth: "460px" }}>
                  {typeof day.dayImage === 'string' ? (
                    <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                      <img
                        src={day.dayImage}
                        alt={`Day ${index + 1} preview`}
                        style={{
                          height: "180px",
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
                          Change Photo
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f5f5f5", borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={500}>
                        📁 {day.dayImage.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDayChange(index, "dayImage", null)}
                      >
                        Remove
                      </Button>
                    </Paper>
                  )}
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Add Sightseeing (press Enter)"
                onKeyDown={(e) => handleAddSightseeing(index, e)}
              />
            </Grid>

            {/* Selected Sightseeing */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" mb={1}>
                Selected Sightseeing
              </Typography>
              <Box>
                {day.selectedSightseeing.map((s, i) => (
                  <Paper
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      mb: 1,
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <LocationOnIcon color="error" sx={{ mr: 1 }} />
                      <Typography>{s}</Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        disabled={i === 0}
                        onClick={() => {
                          const newList = [...day.selectedSightseeing];
                          const [moved] = newList.splice(i, 1);
                          newList.splice(i - 1, 0, moved);
                          handleDayChange(
                            index,
                            "selectedSightseeing",
                            newList,
                          );
                        }}
                      >
                        ⬆️
                      </IconButton>

                      <IconButton
                        size="small"
                        disabled={i === day.selectedSightseeing.length - 1}
                        onClick={() => {
                          const newList = [...day.selectedSightseeing];
                          const [moved] = newList.splice(i, 1);
                          newList.splice(i + 1, 0, moved);
                          handleDayChange(
                            index,
                            "selectedSightseeing",
                            newList,
                          );
                        }}
                      >
                        ⬇️
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          const newList = [...day.selectedSightseeing];
                          newList.splice(i, 1);
                          handleDayChange(
                            index,
                            "selectedSightseeing",
                            newList,
                          );
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Button variant="contained" sx={{ mt: 2 }} onClick={handleAddDay}>
        + Add Day
      </Button>

      {/* Hotels Section with Add New Functionality */}
      <Grid container sx={{ mt: 5 }} spacing={5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Number of Persons"
            value={tourDetails.perPerson}
            onChange={(e) =>
              setTourDetails({
                ...tourDetails,
                perPerson: Number(e.target.value),
              })
            }
            inputProps={{ min: 1 }}
            helperText="This will calculate the total package price"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Number of Rooms"
            value={tourDetails.numberOfRooms}
            onChange={(e) =>
              setTourDetails({
                ...tourDetails,
                numberOfRooms:
                  e.target.value === ""
                    ? 1
                    : Math.max(1, Number(e.target.value)),
              })
            }
            inputProps={{ min: 1 }}
            helperText="Applied in all hotel category totals"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            label="Meal Plan"
            value={tourDetails.mealPlan.planType}
            onChange={(e) =>
              setTourDetails({
                ...tourDetails,
                mealPlan: { ...tourDetails.mealPlan, planType: e.target.value },
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

        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Destination (From Step 1)</TableCell>
              <TableCell>Nights</TableCell>
              <TableCell>Standard Hotels</TableCell>
              <TableCell>Deluxe Hotels</TableCell>
              <TableCell>Superior Hotels</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tourDetails.destinationNights.length > 0 ? (
              tourDetails.destinationNights.map((dest, index) => {
                const destinationCity = dest.destination;
                console.log(
                  `🔄 Rendering destination: ${destinationCity} at index ${index}`,
                );

                // ✅ Calculate totals for this destination (with null checks)
                const standardPrice = dest.hotels[0]?.pricePerPerson || 0;
                const deluxePrice = dest.hotels[1]?.pricePerPerson || 0;
                const superiorPrice = dest.hotels[2]?.pricePerPerson || 0;
                const totalPerPerson =
                  (standardPrice || 0) +
                  (deluxePrice || 0) +
                  (superiorPrice || 0);
                const totalForNights = totalPerPerson * (dest.nights || 0);

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {destinationCity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getHotelsForDestination(destinationCity).standard
                          .length +
                          getHotelsForDestination(destinationCity).deluxe
                            .length +
                          getHotelsForDestination(destinationCity).superior
                            .length}{" "}
                        hotels available
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={dest.nights}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </TableCell>

                    {/* Standard Hotel with Price below */}
                    <TableCell>
                      <Box sx={{ mb: 1 }}>
                        <Autocomplete
                          options={getHotelOptionsForCategory(
                            "standard",
                            destinationCity,
                          ).map((opt) =>
                            typeof opt === "object" ? opt.value : opt,
                          )}
                          value={dest.hotels[0]?.hotelName || ""}
                          onChange={(e, newValue) =>
                            handleHotelChange(index, "standard", newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Select standard hotel"
                              helperText={`${getHotelsForDestination(destinationCity).standard.length} from API`}
                            />
                          )}
                          renderOption={(props, option) =>
                            renderHotelOption(props, option, "standard")
                          }
                          loading={hotelsLoading}
                        />
                      </Box>
                      <TextField
                        type="number"
                        size="small"
                        placeholder="Enter price"
                        value={standardPrice === 0 ? "" : standardPrice} // ✅ Empty if 0
                        onChange={(e) =>
                          handlePriceChange(index, "standard", e.target.value)
                        }
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              ₹
                            </Typography>
                          ),
                        }}
                        inputProps={{ min: 0, step: 100 }}
                        helperText="Standard hotel price"
                      />
                    </TableCell>

                    {/* Deluxe Hotel with Price below */}
                    <TableCell>
                      <Box sx={{ mb: 1 }}>
                        <Autocomplete
                          options={getHotelOptionsForCategory(
                            "deluxe",
                            destinationCity,
                          ).map((opt) =>
                            typeof opt === "object" ? opt.value : opt,
                          )}
                          value={dest.hotels[1]?.hotelName || ""}
                          onChange={(e, newValue) =>
                            handleHotelChange(index, "deluxe", newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Select deluxe hotel"
                              helperText={`${getHotelsForDestination(destinationCity).deluxe.length} from API`}
                            />
                          )}
                          renderOption={(props, option) =>
                            renderHotelOption(props, option, "deluxe")
                          }
                          loading={hotelsLoading}
                        />
                      </Box>
                      <TextField
                        type="number"
                        size="small"
                        placeholder="Enter price"
                        value={deluxePrice === 0 ? "" : deluxePrice} // ✅ Empty if 0
                        onChange={(e) =>
                          handlePriceChange(index, "deluxe", e.target.value)
                        }
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              ₹
                            </Typography>
                          ),
                        }}
                        inputProps={{ min: 0, step: 100 }}
                        helperText="Deluxe hotel price"
                      />
                    </TableCell>

                    {/* Superior Hotel with Price below */}
                    <TableCell>
                      <Box sx={{ mb: 1 }}>
                        <Autocomplete
                          options={getHotelOptionsForCategory(
                            "superior",
                            destinationCity,
                          ).map((opt) =>
                            typeof opt === "object" ? opt.value : opt,
                          )}
                          value={dest.hotels[2]?.hotelName || ""}
                          onChange={(e, newValue) =>
                            handleHotelChange(index, "superior", newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Select superior hotel"
                              helperText={`${getHotelsForDestination(destinationCity).superior.length} from API`}
                            />
                          )}
                          renderOption={(props, option) =>
                            renderHotelOption(props, option, "superior")
                          }
                          loading={hotelsLoading}
                        />
                      </Box>
                      <TextField
                        type="number"
                        size="small"
                        placeholder="Enter price"
                        value={superiorPrice === 0 ? "" : superiorPrice} // ✅ Empty if 0
                        onChange={(e) =>
                          handlePriceChange(index, "superior", e.target.value)
                        }
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <Typography variant="caption" sx={{ mr: 1 }}>
                              ₹
                            </Typography>
                          ),
                        }}
                        inputProps={{ min: 0, step: 100 }}
                        helperText="Superior hotel price"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    ❌ No destinations found. Please complete Step 1 first.
                  </Typography>
                  <Typography variant="caption">
                    Package Data: {packageData ? "Available" : "Not available"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Transportation Cost / Day"
              value={
                Number(tourDetails.transportationCostPerDay) === 0
                  ? ""
                  : tourDetails.transportationCostPerDay
              }
              onChange={(e) =>
                setTourDetails({
                  ...tourDetails,
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
              value={tourDetails.transportationDays || 0}
              inputProps={{ min: 0 }}
              InputProps={{ readOnly: true }}
              helperText="Auto-calculated from itinerary day count"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Margin (add to each tier)"
              value={
                Number(tourDetails.manualCostMargin) === 0
                  ? ""
                  : tourDetails.manualCostMargin
              }
              onChange={(e) =>
                setTourDetails({
                  ...tourDetails,
                  manualCostMargin:
                    e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              inputProps={{ min: 0 }}
              helperText="Added to Standard, Deluxe & Superior costs"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#fafafa" }}>
              <Typography variant="body2">
                Hotel Total = sum of (destination nights × selected hotel
                rates): <strong>Rs. {hotelTotalCost}</strong>
              </Typography>
              <Typography variant="body2">
                Final Standard Cost: <strong>Rs. {finalStandardCost}</strong>
              </Typography>
              <Typography variant="body2">
                Final Deluxe Cost: <strong>Rs. {finalDeluxeCost}</strong>
              </Typography>
              <Typography variant="body2">
                Final Superior Cost: <strong>Rs. {finalSuperiorCost}</strong>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Grid>

      <Typography
        variant="h5"
        fontWeight="bold"
        color="primary"
        sx={{ mt: 4, mb: 3, textAlign: "center" }}
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
            helper: "What is not included in the package",
          },
          {
            key: "paymentPolicy",
            label: "💰 Payment Policy",
            helper: "Payment terms and conditions",
          },
          {
            key: "cancellationPolicy",
            label: "⏰ Cancellation Policy",
            helper: "Cancellation rules and refund policy",
          },
          {
            key: "termsAndConditions",
            label: "📄 Terms & Conditions",
            helper: "General terms and conditions",
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
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: "1px solid #ccc",
                    backgroundColor: "#f8f9fa",
                  },
                  "& .ql-container": {
                    border: "none",
                    minHeight: "200px",
                    fontSize: "14px",
                    fontFamily: "Arial, sans-serif",
                  },
                  "& .ql-editor": {
                    minHeight: "200px",
                    fontSize: "14px",
                  },
                }}
              >
                <ReactQuill
                  value={policyInputs[policy.key]}
                  onChange={(content) =>
                    setPolicyInputs((prev) => ({
                      ...prev,
                      [policy.key]: content,
                    }))
                  }
                  modules={{
                    toolbar: {
                      container: [
                        // Font family and size
                        [
                          { font: [] },
                          { size: ["small", false, "large", "huge"] },
                        ],

                        // Text formatting
                        ["bold", "italic", "underline", "strike"],

                        // Text color and background
                        [{ color: [] }, { background: [] }],

                        // Lists
                        [{ list: "ordered" }, { list: "bullet" }],

                        // Indentation
                        [{ indent: "-1" }, { indent: "+1" }],

                        // Alignment
                        [{ align: [] }],

                        // Headers
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],

                        // Script
                        [{ script: "sub" }, { script: "super" }],

                        // Blockquote and code
                        ["blockquote", "code-block"],

                        // Links and media
                        ["link", "image", "video"],

                        // Clean formatting
                        ["clean"],
                      ],
                    },
                  }}
                  formats={[
                    "font",
                    "size",
                    "bold",
                    "italic",
                    "underline",
                    "strike",
                    "color",
                    "background",
                    "list",
                    "bullet",
                    "indent",
                    "align",
                    "header",
                    "script",
                    "blockquote",
                    "code-block",
                    "link",
                    "image",
                    "video",
                  ]}
                />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                💡 {policy.helper} - Use the toolbar above for rich text
                formatting
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box textAlign="center" mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving && <CircularProgress size={20} color="inherit" />}
        >
          {saving ? "Saving..." : "Save Tour Details"}
        </Button>
      </Box>

      {/* Add New Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentHotelCategory
            ? `Add New ${currentHotelCategory.charAt(0).toUpperCase() + currentHotelCategory.slice(1)} Hotel`
            : `Add New ${currentField}`}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="dense"
            label={
              currentHotelCategory
                ? `New ${currentHotelCategory} Hotel Name`
                : `New ${currentField}`
            }
            value={addMore}
            onChange={(e) => setAddMore(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddNewItem();
              }
            }}
            helperText={
              currentHotelCategory
                ? `Enter the name of the ${currentHotelCategory} hotel you want to add`
                : `Enter the name you want to add`
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAddNewItem}
            variant="contained"
            disabled={!addMore.trim()}
          >
            Add {currentHotelCategory ? "Hotel" : "Item"}
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
                  <LocationOnIcon fontSize="small" color="error" />
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
                    ? tourDetails.bannerImage
                    : tourDetails.days?.[photoPickerTarget.dayIndex]?.dayImage;
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
    </Paper>
  );
};

export default TourDetailsForm;