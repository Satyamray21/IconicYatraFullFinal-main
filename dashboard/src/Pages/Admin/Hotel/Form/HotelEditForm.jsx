// src/pages/hotel/HotelEdit.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  updateHotel,
  getHotelForEdit,
  updateHotelStep2,
  updateHotelStep3,
  updateHotelStep4
} from "../../../../features/hotel/hotelSlice";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Chip,
  Divider,
  Grid,
  Box,
  Card,
  CardMedia,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Snackbar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Lead options import
import { getLeadOptions, addLeadOption, deleteLeadOption } from "../../../../features/leads/leadSlice";

// Location imports
import {
  fetchCountries,
  fetchStatesByCountry,
  fetchCitiesByState,
  clearStates,
  clearCities,
} from "../../../../features/location/locationSlice";

const steps = ["Hotel Details", "Room Details", "Mattress Cost", "Peak Cost"];

// Meal plans for mattress cost
const mealPlans = [
  { value: "EP", label: "Room Only (EP)" },
  { value: "CP", label: "Breakfast Only (CP)" },
  { value: "MAP", label: "Half Board (MAP)" },
  { value: "AP", label: "Full Board (AP)" }
];

const HotelEditForm = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotel: hotelData, loading, error } = useSelector((state) => state.hotel);

  // Lead options selector
  const { options } = useSelector((state) => state.leads);

  // Location selectors
  const { countries, states, cities, loading: locationLoading } = useSelector(
    (state) => state.location
  );

  // State for each step
  const [activeStep, setActiveStep] = useState(0);
  const [hotelId, setHotelId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // STEP 1: Hotel Details State
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelType: "",
    status: "Active",
    description: "",
    cancellationPolicy: "",
    contactDetails: {
      email: "",
      mobile: "",
      alternateContact: "",
      designation: "",
      contactPerson: ""
    },
    location: {
      country: "India",
      state: "",
      city: "",
      address: "",
      pincode: ""
    },
    socialMedia: {
      googleLink: ""
    },
    facilities: [],
    policy: ""
  });
  const [newMainImage, setNewMainImage] = useState(null);
  const [existingMainImage, setExistingMainImage] = useState("");
  const [step1Errors, setStep1Errors] = useState({});

  // STEP 2: Room Details State
  const [roomDetails, setRoomDetails] = useState({
    tempRoomDetails: [{
      seasonType: "",
      validFrom: null,
      validTill: null,
      roomDetails: [
        { roomType: "", ep: "", cp: "", map: "", ap: "" },
      ],
    }],
    roomImages: null,
  });
  const [existingRoomImages, setExistingRoomImages] = useState([]);
  const [step2Errors, setStep2Errors] = useState({});

  // STEP 3: Mattress Cost State
  const [mattressCosts, setMattressCosts] = useState([]);
  const [step3Errors, setStep3Errors] = useState({});

  // STEP 4: Peak Cost State
  const [peakCosts, setPeakCosts] = useState([]);
  const [peakCostForm, setPeakCostForm] = useState({
    roomType: "",
    title: "",
    weekendSurcharge: false,
    validFrom: null,
    validTill: null,
    surcharge: "",
    note: "",
  });

  // Dialog state for adding new options
  const [openDialog, setOpenDialog] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [addMore, setAddMore] = useState("");
  const [currentIndex, setCurrentIndex] = useState(null);

  // Peak cost add form validation
  const [peakCostErrors, setPeakCostErrors] = useState({});

  // Initial options
  const initialHotelTypes = ["3 star", "4 star", "5 star", "Budget", "Luxury", "Boutique", "Resort"];
  const initialFacilityOptions = ["24*7 Service", "Bathroom", "WiFi", "Bar", "Air Conditioning", "Restaurant", "Parking", "Pool", "Spa", "Gym"];
  const statusOptions = ["Active", "Inactive"];

  // ============================================
  // HELPER FUNCTIONS FOR OPTIONS
  // ============================================

  const getHotelTypeOptions = () => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === "hotelType")
      .map((opt) => opt.value);
    return [...new Set([...(filteredOptions || initialHotelTypes)]), "__add_new"];
  };

  const getFacilityOptions = () => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === "facilities")
      .map((opt) => opt.value);
    return [...new Set([...(filteredOptions || initialFacilityOptions)]), "__add_new"];
  };

  const getSeasonOptions = () => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === "seasonType")
      .map((opt) => opt.value);
    return [...new Set([...(filteredOptions || [])]), "__add_new"];
  };

  const getRoomTypeOptions = () => {
    const filteredOptions = options
      ?.filter((opt) => opt.fieldName === "roomType")
      .map((opt) => opt.value);
    return [...new Set([...(filteredOptions || [])]), "__add_new"];
  };

  // ============================================
  // DIALOG HANDLERS FOR ADDING NEW OPTIONS
  // ============================================

  const handleOpenDialog = (field, index = null) => {
    setCurrentField(field);
    setCurrentIndex(index);
    setAddMore("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentIndex(null);
  };

  const handleAddNewItem = async () => {
    if (!addMore.trim()) return;

    try {
      const newValue = addMore.trim();
      await dispatch(addLeadOption({ fieldName: currentField, value: newValue })).unwrap();
      await dispatch(getLeadOptions()).unwrap();

      // Update form field based on current field and active step
      if (currentField === "hotelType") {
        setFormData(prev => ({ ...prev, hotelType: newValue }));
      } else if (currentField === "city") {
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, city: newValue }
        }));
      } else if (currentField === "facilities") {
        setFormData(prev => ({ ...prev, facilities: [...prev.facilities, newValue] }));
      } else if (currentField === "seasonType") {
        const newRoomDetails = [...roomDetails.tempRoomDetails];
        newRoomDetails[0].seasonType = newValue;
        setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
      } else if (currentField === "roomType") {
        if (activeStep === 1 && currentIndex !== null) {
          const newRoomDetails = [...roomDetails.tempRoomDetails];
          newRoomDetails[0].roomDetails[currentIndex].roomType = newValue;
          setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
        } else if (activeStep === 2 && currentIndex !== null) {
          const newMattressCosts = [...mattressCosts];
          newMattressCosts[currentIndex].roomType = newValue;
          setMattressCosts(newMattressCosts);
        } else if (activeStep === 3) {
          setPeakCostForm(prev => ({ ...prev, roomType: newValue }));
        }
      }

      setSnackbar({ open: true, message: `${newValue} added successfully`, severity: "success" });
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to add new option", error);
      setSnackbar({ open: true, message: "Failed to add new option", severity: "error" });
    }
  };

  // ============================================
  // LOCATION EFFECTS
  // ============================================

  useEffect(() => {
    dispatch(getLeadOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (formData?.location?.country) {
      dispatch(fetchStatesByCountry(formData.location.country));
    } else {
      dispatch(clearStates());
      dispatch(clearCities());
    }
  }, [formData?.location?.country, dispatch]);

  useEffect(() => {
    if (formData?.location?.country && formData?.location?.state) {
      dispatch(fetchCitiesByState({
        countryName: formData.location.country,
        stateName: formData.location.state,
      }));
    } else {
      dispatch(clearCities());
    }
  }, [formData?.location?.state, formData?.location?.country, dispatch]);

  // ============================================
  // FETCH HOTEL DATA
  // ============================================

  useEffect(() => {
    if (id) {
      dispatch(getHotelForEdit(id));
    }
  }, [dispatch, id]);

  // Load data into form when hotelData is available
  useEffect(() => {
    if (hotelData && !dataLoaded) {
      console.log("🔹 Loading Hotel Data into Form:", hotelData);
      setHotelId(hotelData._id);

      // ========== STEP 1: HOTEL DETAILS ==========
      setFormData({
        hotelName: hotelData.hotelName || "",
        hotelType: Array.isArray(hotelData.hotelType) ? hotelData.hotelType[0] : (hotelData.hotelType || ""),
        status: hotelData.status || "Active",
        description: hotelData.description || "",
        cancellationPolicy: hotelData.cancellationPolicy || "",
        contactDetails: {
          email: hotelData.contactDetails?.email || "",
          mobile: hotelData.contactDetails?.mobile || "",
          alternateContact: hotelData.contactDetails?.alternateContact || "",
          designation: hotelData.contactDetails?.designation || "",
          contactPerson: hotelData.contactDetails?.contactPerson || ""
        },
        location: {
          country: hotelData.location?.country || "India",
          state: hotelData.location?.state || "",
          city: hotelData.location?.city || "",
          address: hotelData.location?.address || "",
          pincode: hotelData.location?.pincode || ""
        },
        socialMedia: {
          googleLink: hotelData.socialMedia?.googleLink || ""
        },
        facilities: hotelData.facilities || [],
        policy: hotelData.policy || ""
      });

      setExistingMainImage(hotelData.mainImage || "");

      // ========== STEP 2: ROOM DETAILS ==========
      if (hotelData.rooms && hotelData.rooms.length > 0) {
        const roomData = hotelData.rooms[0];
        console.log("🔹 Room Data:", roomData);

        setRoomDetails({
          tempRoomDetails: [{
            seasonType: roomData.seasonType || "",
            validFrom: roomData.validFrom ? new Date(roomData.validFrom) : null,
            validTill: roomData.validTill ? new Date(roomData.validTill) : null,
            roomDetails: (roomData.roomDetails && roomData.roomDetails.length > 0)
              ? roomData.roomDetails.map(room => ({
                roomType: room.roomType || "",
                ep: room.ep?.toString() || "",
                cp: room.cp?.toString() || "",
                map: room.map?.toString() || "",
                ap: room.ap?.toString() || "",
              }))
              : [{ roomType: "", ep: "", cp: "", map: "", ap: "" }]
          }],
          roomImages: null,
        });

        setExistingRoomImages(roomData.images || []);
      } else {
        // Initialize with default room if no rooms exist
        setRoomDetails({
          tempRoomDetails: [{
            seasonType: "",
            validFrom: null,
            validTill: null,
            roomDetails: [{ roomType: "", ep: "", cp: "", map: "", ap: "" }]
          }],
          roomImages: null,
        });
      }

      // ========== STEP 3: MATTRESS COST ==========
      if (hotelData.mattressCosts && hotelData.mattressCosts.length > 0) {
        console.log("🔹 Mattress Costs Data:", hotelData.mattressCosts);
        setMattressCosts(hotelData.mattressCosts.map(cost => ({
          roomType: cost.roomType || "",
          mealPlan: cost.mealPlan || "EP",
          adult: cost.adult?.toString() || "",
          children: cost.children?.toString() || "",
          kidWithoutMattress: cost.kidWithoutMattress?.toString() || "",
        })));
      }

      // ========== STEP 4: PEAK COST ==========
      if (hotelData.peakCosts && hotelData.peakCosts.length > 0) {
        console.log("🔹 Peak Costs Data:", hotelData.peakCosts);
        setPeakCosts(hotelData.peakCosts.map(cost => ({
          roomType: cost.roomType || "",
          title: cost.title || "",
          weekendSurcharge: cost.weekendSurcharge || false,
          validFrom: cost.validFrom ? new Date(cost.validFrom) : null,
          validTill: cost.validTill ? new Date(cost.validTill) : null,
          surcharge: cost.surcharge?.toString() || "",
          note: cost.note || "",
        })));
      }

      setDataLoaded(true);
    }
  }, [hotelData, dataLoaded]);

  // ============================================
  // STEP 1 VALIDATION
  // ============================================

  const validateStep1 = () => {
    const errors = {};
    if (!formData.hotelName.trim()) errors.hotelName = "Hotel Name is required";
    if (!formData.hotelType) errors.hotelType = "Hotel Type is required";
    if (!formData.contactDetails.mobile) errors.mobile = "Mobile number is required";
    if (formData.contactDetails.email && !/\S+@\S+\.\S+/.test(formData.contactDetails.email)) {
      errors.email = "Invalid email format";
    }
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================
  // STEP 1 HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "hotelType" && value === "__add_new") {
      handleOpenDialog("hotelType");
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (step1Errors[name]) {
      setStep1Errors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNestedChange = (e, parent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [name]: value }
    }));
    if (step1Errors[name]) {
      setStep1Errors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFacilitiesChange = (event) => {
    const { value } = event.target;
    if (value.includes("__add_new")) {
      const filtered = value.filter((v) => v !== "__add_new");
      setFormData(prev => ({
        ...prev,
        facilities: filtered,
      }));
      handleOpenDialog("facilities");
      return;
    }
    setFormData(prev => ({
      ...prev,
      facilities: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: "Image size should be less than 5MB", severity: "error" });
        return;
      }
      setNewMainImage(file);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    if (!formData || !hotelId) return;

    setStepLoading(true);
    const submitFormData = new FormData();
    submitFormData.append("hotelName", formData.hotelName);
    submitFormData.append("hotelType", JSON.stringify([formData.hotelType]));
    submitFormData.append("status", formData.status);
    submitFormData.append("description", formData.description || "");
    submitFormData.append("cancellationPolicy", formData.cancellationPolicy || "");
    submitFormData.append("policy", formData.policy || "");
    submitFormData.append("contactDetails", JSON.stringify(formData.contactDetails));
    submitFormData.append("location", JSON.stringify(formData.location));
    submitFormData.append("socialMedia", JSON.stringify(formData.socialMedia));
    submitFormData.append("facilities", JSON.stringify(formData.facilities));

    if (newMainImage) {
      submitFormData.append("mainImage", newMainImage);
    }

    try {
      await dispatch(updateHotel({ id: hotelId, formData: submitFormData })).unwrap();
      console.log("✅ Hotel step 1 updated successfully");
      setSnackbar({ open: true, message: "Hotel details saved successfully", severity: "success" });
      setActiveStep(1);
    } catch (err) {
      console.error("❌ Hotel update failed:", err);
      setSnackbar({ open: true, message: err.message || "Failed to save hotel details", severity: "error" });
    } finally {
      setStepLoading(false);
    }
  };

  // ============================================
  // STEP 2 HANDLERS (Room Details)
  // ============================================

  const validateStep2 = () => {
    const errors = {};
    const seasonType = roomDetails.tempRoomDetails[0]?.seasonType;
    if (!seasonType) errors.seasonType = "Season Type is required";

    roomDetails.tempRoomDetails[0]?.roomDetails?.forEach((room, idx) => {
      if (!room.roomType) {
        errors[`roomType_${idx}`] = `Room ${idx + 1}: Room Type is required`;
      }
    });

    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoomDetailsChange = (e, roomIndex) => {
    const { name, value } = e.target;
    const newRoomDetails = [...roomDetails.tempRoomDetails];

    if (name.startsWith('roomDetails[')) {
      const fieldName = name.match(/\[(\d+)\]\.(\w+)/);
      if (fieldName) {
        const index = parseInt(fieldName[1]);
        const field = fieldName[2];
        newRoomDetails[0].roomDetails[index][field] = value;
      }
    } else {
      newRoomDetails[0][name] = value;
    }
    setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));

    if (step2Errors[name] || step2Errors.seasonType) {
      setStep2Errors({});
    }
  };

  const handleSeasonTypeChange = (selectedSeasonType) => {
    if (selectedSeasonType === "__add_new") {
      handleOpenDialog("seasonType");
    } else {
      const newRoomDetails = [...roomDetails.tempRoomDetails];
      newRoomDetails[0].seasonType = selectedSeasonType;
      setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
      if (step2Errors.seasonType) {
        setStep2Errors(prev => ({ ...prev, seasonType: "" }));
      }
    }
  };

  const handleRoomTypeChangeStep2 = (roomIndex, selectedRoomType) => {
    if (selectedRoomType === "__add_new") {
      handleOpenDialog("roomType", roomIndex);
    } else {
      const newRoomDetails = [...roomDetails.tempRoomDetails];
      newRoomDetails[0].roomDetails[roomIndex].roomType = selectedRoomType;
      setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
    }
  };

  const handleAddRoom = () => {
    const newRoomDetails = [...roomDetails.tempRoomDetails];
    newRoomDetails[0].roomDetails.push({
      roomType: "", ep: "", cp: "", map: "", ap: ""
    });
    setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
  };

  const handleRemoveRoom = (roomIndex) => {
    const newRoomDetails = [...roomDetails.tempRoomDetails];
    if (newRoomDetails[0].roomDetails.length > 1) {
      newRoomDetails[0].roomDetails.splice(roomIndex, 1);
      setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    if (!hotelId) return;

    setStepLoading(true);
    try {
      const formData = new FormData();
      const roomDataString = JSON.stringify(roomDetails.tempRoomDetails);
      formData.append("tempRoomDetails", roomDataString);

      if (roomDetails.roomImages) {
        Array.from(roomDetails.roomImages).forEach((file) => {
          if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: "Some images exceed 5MB limit", severity: "error" });
            return;
          }
          formData.append("roomImages", file);
        });
      }

      await dispatch(updateHotelStep2({ id: hotelId, formData })).unwrap();
      console.log("✅ Room details updated successfully");
      setSnackbar({ open: true, message: "Room details saved successfully", severity: "success" });
      setActiveStep(2);
    } catch (err) {
      console.error("❌ Room details update failed:", err);
      setSnackbar({ open: true, message: err.message || "Failed to save room details", severity: "error" });
    } finally {
      setStepLoading(false);
    }
  };

  // ============================================
  // STEP 3 HANDLERS (Mattress Cost)
  // ============================================

  const validateStep3 = () => {
    const errors = {};
    mattressCosts.forEach((cost, idx) => {
      if (!cost.roomType) {
        errors[`roomType_${idx}`] = `Entry ${idx + 1}: Room Type is required`;
      }
      if (!cost.adult && !cost.children && !cost.kidWithoutMattress) {
        errors[`cost_${idx}`] = `Entry ${idx + 1}: At least one cost field is required`;
      }
    });
    setStep3Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoomTypeChangeStep3 = (index, selectedRoomType) => {
    if (selectedRoomType === "__add_new") {
      handleOpenDialog("roomType", index);
    } else {
      const newMattressCosts = [...mattressCosts];
      newMattressCosts[index].roomType = selectedRoomType;
      setMattressCosts(newMattressCosts);
    }
  };

  const handleMattressCostChange = (index, field, value) => {
    const newMattressCosts = [...mattressCosts];
    newMattressCosts[index][field] = value;
    setMattressCosts(newMattressCosts);
  };

  const handleAddMattressCost = () => {
    setMattressCosts([
      ...mattressCosts,
      { roomType: "", mealPlan: "EP", adult: "", children: "", kidWithoutMattress: "" }
    ]);
  };

  const handleRemoveMattressCost = (index) => {
    const newMattressCosts = mattressCosts.filter((_, i) => i !== index);
    setMattressCosts(newMattressCosts);
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    if (!hotelId) return;

    setStepLoading(true);
    // Filter out empty entries
    const validMattressCosts = mattressCosts.filter(cost =>
      cost.roomType && (cost.adult || cost.children || cost.kidWithoutMattress)
    );

    try {
      const requestData = { tempMattressCost: validMattressCosts };
      await dispatch(updateHotelStep3({ id: hotelId, data: requestData })).unwrap();
      console.log("✅ Mattress costs updated successfully");
      setSnackbar({ open: true, message: "Mattress costs saved successfully", severity: "success" });
      setActiveStep(3);
    } catch (err) {
      console.error("❌ Mattress cost update failed:", err);
      setSnackbar({ open: true, message: err.message || "Failed to save mattress costs", severity: "error" });
    } finally {
      setStepLoading(false);
    }
  };

  // ============================================
  // STEP 4 HANDLERS (Peak Cost)
  // ============================================

  const validatePeakCostForm = () => {
    const errors = {};
    if (!peakCostForm.roomType) errors.roomType = "Room Type is required";
    if (!peakCostForm.title) errors.title = "Title is required";
    if (!peakCostForm.surcharge) errors.surcharge = "Surcharge is required";
    if (peakCostForm.surcharge && isNaN(peakCostForm.surcharge)) errors.surcharge = "Must be a number";
    if (peakCostForm.validFrom && peakCostForm.validTill && peakCostForm.validTill < peakCostForm.validFrom) {
      errors.validTill = "Valid Till must be after Valid From";
    }
    setPeakCostErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePeakCostChange = (field, value) => {
    if (field === "weekendSurcharge") {
      setPeakCostForm(prev => ({
        ...prev,
        weekendSurcharge: value,
        title: value ? "Saturday-Sunday-Special" : "",
        validFrom: value ? null : prev.validFrom,
        validTill: value ? null : prev.validTill,
      }));
    } else if (field === "roomType" && value === "__add_new") {
      handleOpenDialog("roomType");
    } else {
      setPeakCostForm(prev => ({ ...prev, [field]: value }));
      if (peakCostErrors[field]) {
        setPeakCostErrors(prev => ({ ...prev, [field]: "" }));
      }
    }
  };

  const handleAddPeakCost = () => {
    if (validatePeakCostForm()) {
      const newPeakCost = {
        roomType: peakCostForm.roomType,
        title: peakCostForm.title,
        weekendSurcharge: peakCostForm.weekendSurcharge,
        validFrom: peakCostForm.weekendSurcharge ? null : peakCostForm.validFrom,
        validTill: peakCostForm.weekendSurcharge ? null : peakCostForm.validTill,
        surcharge: parseFloat(peakCostForm.surcharge),
        note: peakCostForm.note || "",
      };
      setPeakCosts([...peakCosts, newPeakCost]);
      setPeakCostForm({
        roomType: "",
        title: "",
        weekendSurcharge: false,
        validFrom: null,
        validTill: null,
        surcharge: "",
        note: "",
      });
      setSnackbar({ open: true, message: "Peak cost added successfully", severity: "success" });
    }
  };

  const removePeakCost = (index) => {
    setPeakCosts(peakCosts.filter((_, i) => i !== index));
  };

  const handleStep4Submit = async () => {
    if (!hotelId) return;

    setStepLoading(true);
    try {
      const requestData = { tempPeakCost: peakCosts, finalSubmit: true };
      await dispatch(updateHotelStep4({ id: hotelId, data: requestData })).unwrap();
      console.log("✅ Peak costs updated successfully");
      setSnackbar({ open: true, message: "All changes saved successfully!", severity: "success" });
      setTimeout(() => {
        navigate("/hotel");
      }, 1500);
    } catch (err) {
      console.error("❌ Peak cost update failed:", err);
      setSnackbar({ open: true, message: err.message || "Failed to save peak costs", severity: "error" });
    } finally {
      setStepLoading(false);
    }
  };

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ============================================
  // LOADING AND ERROR STATES
  // ============================================

  if (loading || locationLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !dataLoaded) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate("/hotel")} sx={{ mt: 2 }}>
          Back to Hotel List
        </Button>
      </Container>
    );
  }

  if (!dataLoaded) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading hotel data...</Typography>
      </Container>
    );
  }

  // ============================================
  // RENDER COMPONENT
  // ============================================

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Edit Hotel - {formData.hotelName}
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        {/* STEP 1: HOTEL DETAILS */}
        {activeStep === 0 && (
          <form onSubmit={handleStep1Submit}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Hotel Info
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Hotel Name"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!step1Errors.hotelName}
                  helperText={step1Errors.hotelName}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth required error={!!step1Errors.hotelType}>
                  <InputLabel>Hotel Type</InputLabel>
                  <Select
                    label="Hotel Type"
                    name="hotelType"
                    value={formData.hotelType}
                    onChange={handleChange}
                  >
                    {getHotelTypeOptions().map((option) => (
                      option === "__add_new" ? (
                        <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                          + Add New
                        </MenuItem>
                      ) : (
                        <MenuItem key={option} value={option}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <span>{option}</span>
                            {options?.find(opt => opt.fieldName === "hotelType" && opt.value === option) && (
                              <IconButton size="small" color="error" onClick={(e) => {
                                e.stopPropagation();
                                const optionToDelete = options.find(opt => opt.fieldName === "hotelType" && opt.value === option);
                                if (optionToDelete && window.confirm(`Delete "${option}"?`)) {
                                  dispatch(deleteLeadOption(optionToDelete._id));
                                }
                              }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </div>
                        </MenuItem>
                      )
                    ))}
                  </Select>
                  {step1Errors.hotelType && <FormHelperText error>{step1Errors.hotelType}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  fullWidth
                  required
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Cancellation Policy"
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Hotel Policy"
                  name="policy"
                  value={formData.policy}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Main Image */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Main Image
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {existingMainImage && !newMainImage && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Current Image:</Typography>
                  <Card sx={{ maxWidth: 250, mt: 1 }}>
                    <CardMedia
                      component="img"
                      height="150"
                      image={`http://localhost:5000${existingMainImage}`}
                      alt="Hotel Main"
                      sx={{ objectFit: "cover" }}
                    />
                  </Card>
                </Box>
              )}
              <Button variant="outlined" component="label">
                {newMainImage ? "Change Selected Image" : "Upload New Main Image"}
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
              {newMainImage && (
                <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                  New image selected: {newMainImage.name}
                </Typography>
              )}
            </Box>

            {/* Contact Details */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Contact Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Contact Person"
                    name="contactPerson"
                    value={formData.contactDetails.contactPerson}
                    onChange={(e) => handleNestedChange(e, 'contactDetails')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Designation"
                    name="designation"
                    value={formData.contactDetails.designation}
                    onChange={(e) => handleNestedChange(e, 'contactDetails')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Mobile"
                    name="mobile"
                    value={formData.contactDetails.mobile}
                    onChange={(e) => handleNestedChange(e, 'contactDetails')}
                    fullWidth
                    required
                    error={!!step1Errors.mobile}
                    helperText={step1Errors.mobile}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Alternate Contact"
                    name="alternateContact"
                    value={formData.contactDetails.alternateContact}
                    onChange={(e) => handleNestedChange(e, 'contactDetails')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.contactDetails.email}
                    onChange={(e) => handleNestedChange(e, 'contactDetails')}
                    fullWidth
                    error={!!step1Errors.email}
                    helperText={step1Errors.email}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Location */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Location
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Address"
                    name="address"
                    value={formData.location.address}
                    onChange={(e) => handleNestedChange(e, 'location')}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      name="country"
                      value={formData.location.country}
                      onChange={(e) => handleNestedChange(e, 'location')}
                      label="Country"
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.name} value={country.name}>{country.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={formData.location.state}
                      onChange={(e) => handleNestedChange(e, 'location')}
                      label="State"
                      disabled={!formData.location.country}
                    >
                      {states.map((state) => (
                        <MenuItem key={state.name} value={state.name}>{state.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>City</InputLabel>
                    <Select
                      name="city"
                      value={formData.location.city}
                      onChange={(e) => {
                        if (e.target.value === "__add_new") {
                          handleOpenDialog("city");
                        } else {
                          handleNestedChange(e, 'location');
                        }
                      }}
                      label="City"
                      disabled={!formData.location.state}
                    >
                      {[
                        ...new Set([
                          ...(cities.map((c) => c.name) || []),
                          ...(options
                            ?.filter((opt) => opt.fieldName === "city")
                            .map((opt) => opt.value) || []),
                        ]),
                      ].map((cityName) => (
                        <MenuItem key={cityName} value={cityName}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <span>{cityName}</span>
                            {options?.find((opt) => opt.fieldName === "city" && opt.value === cityName) && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const optionToDelete = options.find(
                                    (opt) => opt.fieldName === "city" && opt.value === cityName
                                  );
                                  if (optionToDelete && window.confirm(`Delete "${cityName}"?`)) {
                                    dispatch(deleteLeadOption(optionToDelete._id));
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </div>
                        </MenuItem>
                      ))}
                      <MenuItem value="__add_new">
                        <em style={{ color: "#1976d2", fontWeight: 500 }}>+ Add New</em>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Pincode"
                    name="pincode"
                    value={formData.location.pincode}
                    onChange={(e) => handleNestedChange(e, 'location')}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Google Link"
                    name="googleLink"
                    value={formData.socialMedia.googleLink}
                    onChange={(e) => handleNestedChange(e, 'socialMedia')}
                    fullWidth
                    placeholder="https://www.google.com"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Facilities */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Facilities
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth>
                <InputLabel>Facilities</InputLabel>
                <Select
                  multiple
                  value={formData.facilities}
                  onChange={handleFacilitiesChange}
                  input={<OutlinedInput label="Facilities" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {getFacilityOptions().map((facility) => (
                    facility === "__add_new" ? (
                      <MenuItem key="add_new" value="__add_new">
                        <em style={{ color: "#1976d2", fontWeight: 500 }}>+ Add New</em>
                      </MenuItem>
                    ) : (
                      <MenuItem key={facility} value={facility}>
                        <Checkbox checked={formData.facilities.indexOf(facility) > -1} />
                        <ListItemText primary={facility} />
                        {options?.find(opt => opt.fieldName === "facilities" && opt.value === facility) && (
                          <IconButton size="small" color="error" onClick={(e) => {
                            e.stopPropagation();
                            const optionToDelete = options.find(opt => opt.fieldName === "facilities" && opt.value === facility);
                            if (optionToDelete && window.confirm(`Delete "${facility}"?`)) {
                              dispatch(deleteLeadOption(optionToDelete._id));
                            }
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </MenuItem>
                    )
                  ))}
                </Select>
              </FormControl>
              <Box mt={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {formData.facilities.map((facility, index) => (
                    <Chip
                      key={index}
                      label={facility}
                      onDelete={() => {
                        const newFacilities = formData.facilities.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, facilities: newFacilities }));
                      }}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>

            <Box mt={4} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={() => navigate("/hotel")}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={stepLoading}>
                {stepLoading ? <CircularProgress size={24} /> : "Save & Continue"}
              </Button>
            </Box>
          </form>
        )}

        {/* STEP 2: ROOM DETAILS */}
        {activeStep === 1 && (
          <form onSubmit={handleStep2Submit}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Room Details
            </Typography>

            <Box border={1} borderRadius={1} p={2} mb={3}>
              <Typography variant="subtitle1">Season Details</Typography>
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small" required error={!!step2Errors.seasonType}>
                    <InputLabel>Season Type</InputLabel>
                    <Select
                      value={roomDetails.tempRoomDetails[0]?.seasonType || ""}
                      onChange={(e) => handleSeasonTypeChange(e.target.value)}
                    >
                      {getSeasonOptions().map((season) => (
                        season === "__add_new" ? (
                          <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                            + Add New Season
                          </MenuItem>
                        ) : (
                          <MenuItem key={season} value={season}>{season}</MenuItem>
                        )
                      ))}
                    </Select>
                    {step2Errors.seasonType && <FormHelperText error>{step2Errors.seasonType}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Valid From"
                      value={roomDetails.tempRoomDetails[0]?.validFrom || null}
                      onChange={(val) => {
                        const newRoomDetails = [...roomDetails.tempRoomDetails];
                        newRoomDetails[0].validFrom = val;
                        setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
                      }}
                      slotProps={{ textField: { fullWidth: true, size: "small" } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Valid Till"
                      value={roomDetails.tempRoomDetails[0]?.validTill || null}
                      onChange={(val) => {
                        const newRoomDetails = [...roomDetails.tempRoomDetails];
                        newRoomDetails[0].validTill = val;
                        setRoomDetails(prev => ({ ...prev, tempRoomDetails: newRoomDetails }));
                      }}
                      slotProps={{ textField: { fullWidth: true, size: "small" } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>

            {roomDetails.tempRoomDetails[0]?.roomDetails?.map((room, roomIndex) => (
              <Box key={roomIndex} border={1} borderRadius={1} p={2} mb={3} position="relative">
                <Typography variant="subtitle1">Room {roomIndex + 1}</Typography>
                {roomIndex > 0 && (
                  <IconButton size="small" color="error" onClick={() => handleRemoveRoom(roomIndex)} sx={{ position: "absolute", top: 8, right: 8 }}>
                    <DeleteIcon />
                  </IconButton>
                )}
                <Grid container spacing={2} mt={1}>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <FormControl fullWidth size="small" required error={!!step2Errors[`roomType_${roomIndex}`]}>
                      <InputLabel>Room Type</InputLabel>
                      <Select
                        value={room.roomType}
                        onChange={(e) => handleRoomTypeChangeStep2(roomIndex, e.target.value)}
                      >
                        {getRoomTypeOptions().map((roomType) => (
                          roomType === "__add_new" ? (
                            <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                              + Add New Room Type
                            </MenuItem>
                          ) : (
                            <MenuItem key={roomType} value={roomType}>{roomType}</MenuItem>
                          )
                        ))}
                      </Select>
                      {step2Errors[`roomType_${roomIndex}`] && <FormHelperText error>{step2Errors[`roomType_${roomIndex}`]}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  {["ep", "cp", "map", "ap"].map((meal) => (
                    <Grid size={{ xs: 6, md: 2.4 }} key={meal}>
                      <TextField
                        fullWidth
                        size="small"
                        label={meal === "ep" ? "Room Only (EP)" : meal === "cp" ? "Breakfast (CP)" : meal === "map" ? "Breakfast + Dinner (MAP)" : "Breakfast + Lunch (AP)"}
                        name={`roomDetails[${roomIndex}].${meal}`}
                        value={room[meal]}
                        onChange={(e) => handleRoomDetailsChange(e, roomIndex)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}

            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRoom} sx={{ mb: 2 }}>
              Add Room
            </Button>

            <Box border={1} borderRadius={1} p={2} mb={3}>
              <Typography variant="subtitle1">Room Images</Typography>
              {existingRoomImages.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Existing Images ({existingRoomImages.length}):</Typography>
                  <Grid container spacing={1} mt={1}>
                    {existingRoomImages.map((img, idx) => (
                      <Grid key={idx} size={{ xs: 4, sm: 3, md: 2 }}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="80"
                            image={`http://localhost:5000${img}`}
                            alt={`Room ${idx + 1}`}
                            sx={{ objectFit: "cover" }}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              <Button variant="outlined" component="label" fullWidth>
                Add New Room Images
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  multiple
                  onChange={(event) => setRoomDetails(prev => ({ ...prev, roomImages: event.currentTarget.files }))}
                />
              </Button>
              {roomDetails.roomImages && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {roomDetails.roomImages.length} new file(s) selected
                </Typography>
              )}
            </Box>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button type="submit" variant="contained" color="primary" disabled={stepLoading}>
                {stepLoading ? <CircularProgress size={24} /> : "Save & Continue"}
              </Button>
            </Box>
          </form>
        )}

        {/* STEP 3: MATTRESS COST */}
        {activeStep === 2 && (
          <form onSubmit={handleStep3Submit}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Mattress Cost
            </Typography>

            {mattressCosts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No mattress costs added yet. Click "Add Mattress Cost" to add one.
              </Alert>
            ) : (
              mattressCosts.map((mattress, index) => (
                <Box key={index} border={1} borderRadius={1} p={2} mb={3} position="relative">
                  <Typography variant="subtitle1">Mattress Cost {index + 1}</Typography>
                  {index > 0 && (
                    <IconButton size="small" color="error" onClick={() => handleRemoveMattressCost(index)} sx={{ position: "absolute", top: 8, right: 8 }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <FormControl fullWidth size="small" required error={!!step3Errors[`roomType_${index}`]}>
                        <InputLabel>Room Type *</InputLabel>
                        <Select
                          value={mattress.roomType}
                          onChange={(e) => handleRoomTypeChangeStep3(index, e.target.value)}
                          label="Room Type *"
                        >
                          {getRoomTypeOptions().map((roomType) => (
                            roomType === "__add_new" ? (
                              <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                                + Add New Room Type
                              </MenuItem>
                            ) : (
                              <MenuItem key={roomType} value={roomType}>{roomType}</MenuItem>
                            )
                          ))}
                        </Select>
                        {step3Errors[`roomType_${index}`] && <FormHelperText error>{step3Errors[`roomType_${index}`]}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Meal Plan</InputLabel>
                        <Select
                          value={mattress.mealPlan}
                          onChange={(e) => handleMattressCostChange(index, "mealPlan", e.target.value)}
                          label="Meal Plan"
                        >
                          {mealPlans.map((plan) => (
                            <MenuItem key={plan.value} value={plan.value}>{plan.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Adult Cost"
                        type="number"
                        value={mattress.adult}
                        onChange={(e) => handleMattressCostChange(index, "adult", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Children Cost (6-12 yrs)"
                        type="number"
                        value={mattress.children}
                        onChange={(e) => handleMattressCostChange(index, "children", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Kid Without Mattress"
                        type="number"
                        value={mattress.kidWithoutMattress}
                        onChange={(e) => handleMattressCostChange(index, "kidWithoutMattress", e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  {step3Errors[`cost_${index}`] && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {step3Errors[`cost_${index}`]}
                    </Typography>
                  )}
                </Box>
              ))
            )}

            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddMattressCost} sx={{ mb: 2 }}>
              Add Mattress Cost
            </Button>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button type="submit" variant="contained" color="primary" disabled={stepLoading}>
                {stepLoading ? <CircularProgress size={24} /> : "Save & Continue"}
              </Button>
            </Box>
          </form>
        )}

        {/* STEP 4: PEAK COST */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Weekend / Seasonal Surcharge
            </Typography>

            <Box border={1} borderRadius={1} p={2} mb={3}>
              <Typography variant="subtitle1">Add New Peak Cost</Typography>
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small" error={!!peakCostErrors.roomType}>
                    <InputLabel>Room Type *</InputLabel>
                    <Select
                      value={peakCostForm.roomType}
                      onChange={(e) => handlePeakCostChange("roomType", e.target.value)}
                      label="Room Type *"
                    >
                      {getRoomTypeOptions().map((roomType) => (
                        roomType === "__add_new" ? (
                          <MenuItem key="add_new" value="__add_new" style={{ color: "#1976d2", fontWeight: 500 }}>
                            + Add New Room Type
                          </MenuItem>
                        ) : (
                          <MenuItem key={roomType} value={roomType}>{roomType}</MenuItem>
                        )
                      ))}
                    </Select>
                    {peakCostErrors.roomType && <FormHelperText error>{peakCostErrors.roomType}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Title *"
                    value={peakCostForm.title}
                    onChange={(e) => handlePeakCostChange("title", e.target.value)}
                    error={!!peakCostErrors.title}
                    helperText={peakCostErrors.title}
                    placeholder="e.g., Summer Peak, Festival Surcharge"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={<Checkbox checked={peakCostForm.weekendSurcharge} onChange={(e) => handlePeakCostChange("weekendSurcharge", e.target.checked)} />}
                    label={<Typography variant="body2" color="orange">Sat–Sun (Tick the checkbox for weekend surcharge)</Typography>}
                  />
                </Grid>
                {!peakCostForm.weekendSurcharge && (
                  <>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Valid From"
                          value={peakCostForm.validFrom}
                          onChange={(date) => handlePeakCostChange("validFrom", date)}
                          slotProps={{ textField: { fullWidth: true, size: "small" } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Valid Till"
                          value={peakCostForm.validTill}
                          onChange={(date) => handlePeakCostChange("validTill", date)}
                          slotProps={{ textField: { fullWidth: true, size: "small" } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Surcharge Amount *"
                    type="number"
                    value={peakCostForm.surcharge}
                    onChange={(e) => handlePeakCostChange("surcharge", e.target.value)}
                    error={!!peakCostErrors.surcharge}
                    helperText={peakCostErrors.surcharge}
                    placeholder="0.00"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Note (Optional)"
                    value={peakCostForm.note}
                    onChange={(e) => handlePeakCostChange("note", e.target.value)}
                    placeholder="Additional notes..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" color="primary" onClick={handleAddPeakCost}>
                    Add Peak Cost
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {peakCosts.length > 0 && (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>Added Peak Cost Details ({peakCosts.length})</Typography>
                {peakCosts.map((cost, index) => (
                  <Paper key={index} sx={{ p: 2, mt: 2, position: "relative", border: '1px solid #e0e0e0' }}>
                    <IconButton size="small" color="error" onClick={() => removePeakCost(index)} sx={{ position: "absolute", top: 8, right: 8 }}>
                      <DeleteIcon />
                    </IconButton>
                    <Typography><strong>Room Type:</strong> {cost.roomType}</Typography>
                    <Typography><strong>Title:</strong> {cost.title}</Typography>
                    {cost.validFrom && cost.validTill && (
                      <Typography>
                        <strong>Valid:</strong> {new Date(cost.validFrom).toLocaleDateString()} - {new Date(cost.validTill).toLocaleDateString()}
                      </Typography>
                    )}
                    {cost.weekendSurcharge && <Typography><strong>Type:</strong> Weekend Surcharge</Typography>}
                    <Typography><strong>Surcharge:</strong> ₹{cost.surcharge}</Typography>
                    {cost.note && <Typography><strong>Note:</strong> {cost.note}</Typography>}
                  </Paper>
                ))}
              </Box>
            )}

            <Box display="flex" justifyContent="space-between" mt={3} gap={2}>
              <Button variant="outlined" onClick={handleBack} disabled={stepLoading}>Back</Button>
              <Button variant="contained" color="success" onClick={handleStep4Submit} disabled={stepLoading}>
                {stepLoading ? <CircularProgress size={20} /> : (peakCosts.length === 0 ? "Finish (No Peak Cost)" : "Final Submit")}
              </Button>
              <Button variant="outlined" color="error" onClick={() => navigate("/hotel")} disabled={stepLoading}>Close</Button>
            </Box>

            {peakCosts.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You can add peak costs above, or click Finish to complete hotel registration without them.
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Add New Item Dialog */}
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
            onKeyPress={(e) => { if (e.key === 'Enter') handleAddNewItem(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddNewItem} variant="contained" disabled={!addMore.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HotelEditForm;