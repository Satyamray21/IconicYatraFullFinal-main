import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  alpha,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlightIcon from "@mui/icons-material/Flight";
import HotelIcon from "@mui/icons-material/Hotel";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CancelIcon from "@mui/icons-material/Cancel";
import ShareIcon from "@mui/icons-material/Share";

import { getAllVehicleQuotations } from "../../../features/quotation/vehicleQuotationSlice";
import { getAllFlightQuotations } from "../../../features/quotation/flightQuotationSlice";
import { fetchHotelQuotations, deleteHotelQuotation } from "../../../features/quotation/hotelQuotation";
import {
  fetchQuickQuotations,
  sendQuickQuotationMail,
  deleteQuickQuotation
} from "../../../features/quotation/quickQuotationSlice";
// Add Full and Custom Quotation imports
import { getAllQuotations as getAllFullQuotations } from "../../../features/quotation/fullQuotationSlice";
import {
  getAllCustomQuotations,
  deleteCustomQuotation,
} from "../../../features/quotation/customQuotationSlice";
import { deleteVehicleQuotation } from "../../../features/quotation/vehicleQuotationSlice";
import { deleteFlightQuotationById } from "../../../features/quotation/flightQuotationSlice";
import {
  inferLastCompletedCustomStep,
  formatCustomQuotationListStatus,
  formatQuickQuotationListStatus,
} from "../../../utils/inferCustomQuotationStep";

const stats = [
  { title: "Today's", confirmed: 0, inProcess: 0, cancelledIncomplete: 0 },
  { title: "This Month", confirmed: 0, inProcess: 0, cancelledIncomplete: 0 },
  { title: "Last 3 Months", confirmed: 0, inProcess: 0, cancelledIncomplete: 0 },
  { title: "Last 6 Months", confirmed: 0, inProcess: 0, cancelledIncomplete: 0 },
  { title: "Last 12 Months", confirmed: 15, inProcess: 0, cancelledIncomplete: 0 },
];

const QuotationCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    list: vehicleList,
    loading: vehicleLoading,
    error: vehicleError,
  } = useSelector((state) => state.vehicleQuotation);

  const { quotations: flightList } = useSelector((state) => state.flightQuotation);
  const { quotations: hotelList } = useSelector((state) => state.hotelQuotation);
  const {
    quotations: quickList,
    loading: quickLoading,
    error: quickError,
    successMessage
  } = useSelector((state) => state.quickQuotation);

  // Add Full and Custom Quotation selectors
  const {
    quotationsList: fullList,
    loading: fullLoading,
    error: fullError
  } = useSelector((state) => state.fullQuotation);

  const {
    quotations: customList,
    loading: customLoading,
    error: customError
  } = useSelector((state) => state.customQuotation);

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, quotationId: null, quotationType: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllVehicleQuotations());
    dispatch(getAllFlightQuotations());
    dispatch(fetchHotelQuotations());
    dispatch(fetchQuickQuotations());
    // Add Full and Custom Quotation fetches
    dispatch(getAllFullQuotations());
    dispatch(getAllCustomQuotations());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setSnackbar({
        open: true,
        message: successMessage,
        severity: "success"
      });
      // Refresh the list after successful operation
      dispatch(fetchQuickQuotations());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (quickError) {
      setSnackbar({
        open: true,
        message: quickError,
        severity: "error"
      });
    }
  }, [quickError]);

  const handleDeleteClick = (quotationId, quotationType) => {
    if (!quotationId) {
      setSnackbar({
        open: true,
        message: "Unable to delete: quotation id missing.",
        severity: "error"
      });
      return;
    }
    setDeleteConfirm({
      open: true,
      quotationId,
      quotationType
    });
  };

  const handleConfirmDelete = async () => {
    const { quotationId, quotationType } = deleteConfirm;

    try {
      setDeleteLoading(true);
      switch (quotationType) {
        case "Quick":
          await dispatch(deleteQuickQuotation(quotationId)).unwrap();
          await dispatch(fetchQuickQuotations()).unwrap();
          break;
        case "Vehicle":
          await dispatch(deleteVehicleQuotation(quotationId)).unwrap();
          await dispatch(getAllVehicleQuotations()).unwrap();
          break;
        case "Flight":
          await dispatch(deleteFlightQuotationById(quotationId)).unwrap();
          await dispatch(getAllFlightQuotations()).unwrap();
          break;
        case "Hotel":
          await dispatch(deleteHotelQuotation(quotationId)).unwrap();
          await dispatch(fetchHotelQuotations()).unwrap();
          break;
        case "Custom":
          await dispatch(deleteCustomQuotation(quotationId)).unwrap();
          await dispatch(getAllCustomQuotations()).unwrap();
          break;
        case "Full":
          setSnackbar({
            open: true,
            message: "Delete for Full quotation is not available yet.",
            severity: "warning"
          });
          setDeleteConfirm({ open: false, quotationId: null, quotationType: "" });
          setDeleteLoading(false);
          return;
        default:
          throw new Error("Unsupported quotation type");
      }

      setSnackbar({
        open: true,
        message: `${quotationType} quotation deleted successfully!`,
        severity: "success"
      });

      setDeleteConfirm({ open: false, quotationId: null, quotationType: "" });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || "Failed to delete quotation",
        severity: "error"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, quotationId: null, quotationType: "" });
  };

  const handleShareClick = async (quotationId) => {
    try {
      await dispatch(sendQuickQuotationMail(quotationId)).unwrap();
      setSnackbar({
        open: true,
        message: "Quotation shared successfully via email!",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || "Failed to share quotation",
        severity: "error"
      });
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleNext = () => {
    handleClose();
    switch (selectedType) {
      case "vehicle":
        navigate("/vehiclequotation");
        break;
      case "hotel":
        navigate("/hotelquotation");
        break;
      case "flight":
        navigate("/flightquotation");
        break;
      case "full":
        navigate("/fullquotation");
        break;
      case "quick":
        navigate("/quickquotation");
        break;
      case "custom":
        navigate("/customquotation");
        break;
      default:
        break;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Format Date Safely
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const getFirstValue = (...values) => {
    for (const value of values) {
      if (value === 0) return value;
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };

  const navigateToCustomQuotation = (row) => {
    const raw = row?.rawData;
    const qid = row?.quoteId;
    if (!raw || !qid) return;
    const fs = String(raw.finalizeStatus || "").toLowerCase();
    const rowStatus = String(raw.status || "").toLowerCase();
    if (fs === "finalized") {
      navigate(`/customfinalize/${qid}`, {
        state: { quotationData: raw },
      });
      return;
    }
    if (rowStatus === "confirmed" || rowStatus === "completed") {
      navigate(`/customfinalize/${qid}`, {
        state: { quotationData: raw },
      });
      return;
    }
    const lastCompleted = inferLastCompletedCustomStep(raw);
    if (lastCompleted >= 6) {
      navigate(`/customfinalize/${qid}`, {
        state: { quotationData: raw },
      });
      return;
    }
    const nextStep = Math.min(lastCompleted + 1, 6);
    navigate("/customquotation", {
      state: { resumeQuotationId: qid, resumeStep: nextStep },
    });
  };

  // Get Status Chip Color
  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.startsWith("draft")) return "warning";
    switch (s) {
      case "confirmed":
      case "finalized":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      case "draft":
        return "default";
      default:
        return "default";
    }
  };

  // Get Type Chip Color
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "vehicle":
        return "primary";
      case "flight":
        return "secondary";
      case "hotel":
        return "success";
      case "quick":
        return "warning";
      case "full":
        return "info";
      case "custom":
        return "error";
      default:
        return "default";
    }
  };

  // Table Columns
  const columns = [
    { field: "id", headerName: "Sr No.", width: 80 },
    { field: "quoteId", headerName: "Quote ID", width: 140 },
    { field: "clientName", headerName: "Client Name", width: 200 },
    { field: "arrival", headerName: "Arrival", width: 120 },
    { field: "departure", headerName: "Departure", width: 120 },
    { field: "sector", headerName: "Sector", width: 180 },
    { field: "title", headerName: "Title", width: 180 },
    { field: "noOfNight", headerName: "Nights", width: 100 },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getTypeColor(params.value)}
          variant="outlined"
        />
      )
    },
    {
      field: "quotationStatus",
      headerName: "Status",
      width: 200,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
          sx={{ maxWidth: 220, "& .MuiChip-label": { whiteSpace: "normal" } }}
        />
      )
    },
    {
      field: "action",
      headerName: "Action",
      width: 180,
      renderCell: (params) => (
        <Box display="flex" gap={1}>

          {/* 🔹 SHARE – Only for Quick */}
          {params.row.type === "Quick" && (
            <IconButton
              color="info"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleShareClick(params.row.originalId);
              }}
              sx={{
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.2),
                }
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          )}

          {/* ✏️ EDIT – For ALL (including Quick) */}
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();

              switch (params.row.type) {
                case "Quick":
                  navigate(`/quickquotation/edit/${params.row.originalId}`);
                  break;
                case "Full":
                  navigate(`/fullquotation/edit/${params.row.originalId}`);
                  break;
                case "Vehicle":
                  navigate(`/vehiclequotation/edit/${params.row.originalId}`);
                  break;
                case "Flight":
                  navigate(`/flightquotation/edit/${params.row.originalId}`);
                  break;
                case "Hotel":
                  navigate(`/hotelquotation/edit/${params.row.originalId}`);
                  break;
                case "Custom":
                  navigateToCustomQuotation(params.row);
                  break;
                default:
                  break;
              }
            }}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          {/* 🗑 DELETE – For ALL */}
          <IconButton
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              const idToDelete =
                params.row.type === "Quick"
                  ? params.row.originalId
                  : (params.row.originalId || params.row.id);
              handleDeleteClick(
                idToDelete,
                params.row.type
              );
            }}
            disabled={deleteLoading}
            sx={{
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.2),
              },
              '&:disabled': {
                opacity: 0.5,
              }
            }}
          >
            {deleteLoading ? (
              <CircularProgress size={16} />
            ) : (
              <DeleteIcon fontSize="small" />
            )}
          </IconButton>

        </Box>
      ),
    }

  ];

  // Combine Vehicle + Flight + Hotel + Quick + Full + Custom Quotations
  const combinedList = [
    ...(vehicleList || []).map((item, index) => ({
      id: `V-${index + 1}`,
      originalId: item?.vehicleQuotationId || item?._id,
      quoteId: item?.vehicleQuotationId || "N/A",
      clientName: item?.basicsDetails?.clientName || "N/A",
      arrival: formatDate(item?.pickupDropDetails?.pickupDate),
      departure: formatDate(item?.pickupDropDetails?.dropDate),
      sector:
        item?.pickupDropDetails?.pickupLocation && item?.pickupDropDetails?.dropLocation
          ? `${item.pickupDropDetails.pickupLocation} → ${item.pickupDropDetails.dropLocation}`
          : "N/A",
      title: item?.basicsDetails?.vehicleType || "Vehicle Booking",
      noOfNight: item?.basicsDetails?.noOfDays || "-",
      tourType: item?.basicsDetails?.tripType || "-",
      type: "Vehicle",
      quotationStatus:
        item?.status ||
        (item?.finalizeStatus === "finalized" ? "Finalized" : "Pending"),
      formStatus: "Completed",
      businessType: "Travel",
    })),

    ...(flightList || []).map((item, index) => ({
      id: `F-${index + 1}`,
      originalId: item?.flightQuotationId || item?._id,
      quoteId: item?.flightQuotationId || "N/A",
      clientName: item?.clientDetails?.clientName || "N/A",
      arrival: formatDate(item?.flightDetails?.[0]?.departureDate),
      departure: formatDate(
        item?.flightDetails?.[item?.flightDetails?.length - 1]?.departureDate
      ),
      sector: Array.isArray(item?.flightDetails)
        ? item.flightDetails.map((f) => `${f.from} → ${f.to}`).join(", ")
        : "N/A",
      title: item?.title || "Flight Booking",
      noOfNight: "-",
      tourType: item?.tripType || "-",
      type: "Flight",
      quotationStatus:
        item?.status ||
        (item?.finalizeStatus === "finalized" ? "Finalized" : "Pending"),
      formStatus: "Completed",
      businessType: "Travel",
    })),

    ...(hotelList || []).map((item, index) => {
      const firstStay = item?.stayLocation?.[0] || {};
      const hotelName =
        firstStay?.standard?.hotelName ||
        firstStay?.deluxe?.hotelName ||
        firstStay?.superior?.hotelName ||
        "N/A";

      return {
        id: `H-${index + 1}`,
        originalId: item?._id,
        quoteId: item?.hotelQuotationId || "N/A",
        clientName: item?.clientDetails?.clientName || "N/A",
        arrival: formatDate(item?.pickupDrop?.arrivalDate),
        departure: formatDate(item?.pickupDrop?.departureDate),
        sector: item?.clientDetails?.sector,
        title: item?.quotation?.quotationTitle || "Hotel Booking",
        noOfNight: item?.pickupDrop?.nights || "-",
        tourType: item?.clientDetails?.tourType || "-",
        type: "Hotel",
        quotationStatus:
          item?.status ||
          (item?.finalizeStatus === "finalized" ? "Finalized" : "Pending"),
        formStatus: "Completed",
        businessType: "Travel",
      };
    }),

    // Add Quick Quotations
    ...(quickList || []).map((item, index) => {
      const quickArrival = getFirstValue(
        item?.quotationDetails?.arrivalDate,
        item?.packageSnapshot?.quotationDetails?.arrivalDate,
        item?.packageSnapshot?.arrivalDate,
      );
      const quickDeparture = getFirstValue(
        item?.quotationDetails?.departureDate,
        item?.packageSnapshot?.quotationDetails?.departureDate,
        item?.packageSnapshot?.departureDate,
      );
      const quickSector = getFirstValue(
        item?.packageSnapshot?.sector,
        item?.sector,
        item?.clientLocation,
      );
      const quickNights = getFirstValue(
        item?.packageSnapshot?.nights,
        item?.nights,
        item?.quotationDetails?.destinations?.reduce(
          (sum, d) => sum + Number(d?.nights || 0),
          0,
        ),
        item?.packageSnapshot?.quotationDetails?.destinations?.reduce(
          (sum, d) => sum + Number(d?.nights || 0),
          0,
        ),
      );

      return {
        id: `Q-${index + 1}`,
        originalId: item?._id, // For API calls
        quoteId: `QT-${item?._id?.slice(-6) || "N/A"}`,
        clientName: item?.customerName || "N/A",
        arrival: formatDate(quickArrival),
        departure: formatDate(quickDeparture),
        sector: quickSector || "N/A",
        title: item?.packageSnapshot?.title || "Quick Quotation",
        noOfNight: getFirstValue(quickNights, "-"),
        tourType: item?.packageSnapshot?.tourType || "-",
        type: "Quick",
        quotationStatus: formatQuickQuotationListStatus(item),
        formStatus: "Completed",
        businessType: "Travel",
        rawData: item,
      };
    }),

    // Add Full Quotations
    ...(fullList || []).map((item, index) => ({
      id: `FU-${index + 1}`,
      originalId: item?._id,
      quoteId: item?.quotationId || "N/A",
      clientName: item?.clientDetails?.clientName || "N/A",
      arrival: formatDate(item?.pickupDrop?.arrivalDate),
      departure: formatDate(item?.pickupDrop?.departureDate),
      sector: item?.clientDetails?.sector || "N/A",
      title: item?.quotation?.quotationTitle || "Full Package",
      noOfNight: item?.pickupDrop?.nights || "-",
      tourType: item?.clientDetails?.tourType || "-",
      type: "Full",
      quotationStatus:
        item?.status ||
        (item?.finalizeStatus === "finalized" ? "Confirmed" : "Draft"),
      formStatus: "Completed",
      businessType: "Travel",
      rawData: item,
    })),

    // Add Custom Quotations
    ...(customList || []).map((item, index) => {
      const customArrival = getFirstValue(
        item?.tourDetails?.arrivalDate,
        item?.pickupDrop?.[0]?.arrivalDate,
        item?.travelDates?.startDate,
      );
      const customDeparture = getFirstValue(
        item?.tourDetails?.departureDate,
        item?.pickupDrop?.[0]?.departureDate,
        item?.travelDates?.endDate,
      );
      const customSector = getFirstValue(
        item?.clientDetails?.sector,
        item?.destination,
      );
      const customNights = getFirstValue(
        item?.tourDetails?.quotationDetails?.destinations?.reduce(
          (sum, d) => sum + Number(d?.nights || 0),
          0,
        ),
        item?.quotationDetails?.destinations?.reduce(
          (sum, d) => sum + Number(d?.nights || 0),
          0,
        ),
        item?.pickupDrop?.reduce((sum, d) => sum + Number(d?.nights || 0), 0),
        item?.tourDetails?.days
          ? Number(item.tourDetails.days) - 1
          : undefined,
        item?.days
          ? Number(item.days) - 1
          : undefined,
        item?.duration?.nights,
      );

      return {
        id: `C-${index + 1}`,
        originalId: item?._id,
        quoteId: item?.quotationId || `CUST-${item?._id?.slice(-6) || "N/A"}`,
        clientName: item?.clientDetails?.clientName || "N/A",
        arrival: formatDate(customArrival),
        departure: formatDate(customDeparture),
        sector: customSector || "N/A",
        title: item?.tourDetails?.quotationTitle || item?.quotationTitle || "Custom Package",
        noOfNight: getFirstValue(customNights, "-"),
        tourType: item?.clientDetails?.tourType || item?.tourType || "-",
        type: "Custom",
        quotationStatus: formatCustomQuotationListStatus(item),
        formStatus: "Completed",
        businessType: "Travel",
        rawData: item,
      };
    }),
  ];

  // Filter by type
  const filteredByType = filterType === "all"
    ? combinedList
    : combinedList.filter(item => item.type.toLowerCase() === filterType.toLowerCase());

  // Search Filter
  const filteredList = filteredByType.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Count by type for stats
  const typeCounts = {
    all: combinedList.length,
    vehicle: combinedList.filter(item => item.type === "Vehicle").length,
    flight: combinedList.filter(item => item.type === "Flight").length,
    hotel: combinedList.filter(item => item.type === "Hotel").length,
    quick: combinedList.filter(item => item.type === "Quick").length,
    full: combinedList.filter(item => item.type === "Full").length,
    custom: combinedList.filter(item => item.type === "Custom").length,
  };

  const handleRowClick = (params) => {
    switch (params.row.type) {
      case "Full":
        if (params.row.rawData.isDraft) {
          // Navigate to continue draft - use currentStep from API
          const nextStep = (params.row.rawData.currentStep || 0) + 1;
          navigate(`/fullquotation/${params.row.quoteId}/step/${nextStep}`, {
            state: { quotationData: params.row.rawData },
          });
        } else {
          // Navigate to view finalized quotation
          navigate(`/fullfinalize/${params.row.quoteId}`, {
            state: { quotationData: params.row.rawData },
          });
        }
        break;
      case "Flight":
        navigate(`/flightfinalize/${params.row.quoteId}`);
        break;
      case "Vehicle":
        navigate(`/vehiclefinalize/${params.row.quoteId}`);
        break;
      case "Custom":
        navigateToCustomQuotation(params.row);
        break;
      case "Quick":
        // Must use Mongo _id — quoteId is only a display label (QT-xxxxxx)
        if (params.row.originalId) {
          navigate(`/quickfinalize/${params.row.originalId}`);
        }
        break;
      default:
        break;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          gutterBottom
        >
          Quotation Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage and track all your quotations in one place
        </Typography>
      </Box>

      {/* Enhanced Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((item, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: "white",
                height: "100%",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                '&:hover': {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {item.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="body2">Confirmed: {item.confirmed}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="body2">In Process: {item.inProcess}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CancelIcon sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="body2">Cancelled: {item.cancelledIncomplete}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Actions Section */}
      <Card sx={{ mb: 3, boxShadow: theme.shadows[3] }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpen}
                fullWidth
                sx={{
                  py: 1.2,
                  background: `linear-gradient(45deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                  fontWeight: 'bold',
                }}
              >
                Create Quotation
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  label="Filter by Type"
                  onChange={(e) => setFilterType(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">
                    All Types ({typeCounts.all})
                  </MenuItem>
                  <MenuItem value="vehicle">
                    Vehicle ({typeCounts.vehicle})
                  </MenuItem>
                  <MenuItem value="flight">
                    Flight ({typeCounts.flight})
                  </MenuItem>
                  <MenuItem value="hotel">
                    Hotel ({typeCounts.hotel})
                  </MenuItem>
                  <MenuItem value="quick">
                    Quick ({typeCounts.quick})
                  </MenuItem>
                  <MenuItem value="full">
                    Full ({typeCounts.full})
                  </MenuItem>
                  <MenuItem value="custom">
                    Custom ({typeCounts.custom})
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search quotations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid Section */}
      <Card sx={{ boxShadow: theme.shadows[3] }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: "600px" }}>
              {filteredList.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography
                    variant="h6"
                    color="textSecondary"
                    gutterBottom
                  >
                    No quotations found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search || filterType !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by creating your first quotation"}
                  </Typography>
                </Box>
              ) : (
                <DataGrid
                  rows={filteredList}
                  columns={columns}
                  pageSize={7}
                  rowsPerPageOptions={[7, 25, 50, 100]}
                  autoHeight
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      cursor: 'pointer',
                    },
                  }}
                  onRowClick={handleRowClick}
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quotation Type Modal */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
          }
        }}
      >
        <DialogTitle sx={{
          color: "primary.main",
          fontWeight: 'bold',
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          Create New Quotation
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the type of quotation you want to create:
          </Typography>
          <RadioGroup
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <Grid container spacing={2}>
              {[
                { value: "full", icon: ShoppingBasketIcon, label: "Full Quotation" },
                { value: "quick", icon: QuestionAnswerIcon, label: "Quick Quotation" },
                { value: "hotel", icon: HotelIcon, label: "Hotel" },
                { value: "vehicle", icon: DirectionsCarIcon, label: "Vehicle" },
                { value: "flight", icon: FlightIcon, label: "Flight" },
                { value: "custom", label: "Custom Quotation", custom: true },
              ].map((item) => (
                <Grid size={{ xs: 12, md: 4 }} key={item.value}>
                  <Card
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      border: selectedType === item.value
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                      transition: "all 0.2s ease-in-out",
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.shadows[4],
                      },
                      backgroundColor: selectedType === item.value
                        ? alpha(theme.palette.primary.main, 0.04)
                        : 'transparent',
                    }}
                    onClick={() => setSelectedType(item.value)}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <FormControlLabel
                        value={item.value}
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box>
                            {item.custom ? (
                              <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{ color: "primary.main", mb: 1 }}
                              >
                                CQ
                              </Typography>
                            ) : (
                              <item.icon
                                fontSize="large"
                                sx={{
                                  color: "primary.main",
                                  mb: 1,
                                  fontSize: 40
                                }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              sx={{ color: 'text.primary' }}
                            >
                              {item.label}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!selectedType}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: 'bold' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteConfirm.quotationType.toLowerCase()} quotation?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCancelDelete} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QuotationCard;