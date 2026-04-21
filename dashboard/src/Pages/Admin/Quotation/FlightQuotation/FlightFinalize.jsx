import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Flight,
  Person,
  LocationOn,
  CheckCircle,
  Payment,
  Phone,
  AlternateEmail,
  CreditCard,
  Description,
  CalendarToday,
  Group,
  Cancel,
  Warning,
  Business,
  Language,
  ExpandMore,
  Receipt,
  Visibility,
  FlightTakeoff,
  PictureAsPdf,
  Edit,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../../../utils/axios";
import {
  getFlightQuotationById,
  confirmFlightQuotation,
  updateFlightQuotationById,
} from "../../../../features/quotation/flightQuotationSlice";
import FlightQuotationPDFDialog from "./PDF/PreviewPdf";
import EmailQuotationDialog from "../VehicleQuotation/Dialog/EmailQuotationDialog";

const FlightFinalize = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [pnrList, setPnrList] = useState([]);
  const [finalFareList, setFinalFareList] = useState([]);
  const [totalFinalFare, setTotalFinalFare] = useState(0);
  const [flightData, setFlightData] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [activeInfo, setActiveInfo] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [emailContentType, setEmailContentType] = useState("short");
  const [mailMode, setMailMode] = useState("normal");
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [mailCompanies, setMailCompanies] = useState([]);
  const [emailTemplateBodies, setEmailTemplateBodies] = useState({
    normal: { subject: "", message: "" },
    booking: { subject: "", message: "" },
  });
  const [emailTemplateType, setEmailTemplateType] = useState("normal");
  const [pdfAttachmentForMail, setPdfAttachmentForMail] = useState(null);
  const [previewPdfModeForMail, setPreviewPdfModeForMail] = useState(false);
  const [autoGeneratePdfForMail, setAutoGeneratePdfForMail] = useState(false);
  const [emailToPrefill, setEmailToPrefill] = useState("");
  const [editDialog, setEditDialog] = useState({
    open: false,
    field: "",
    title: "",
    value: "",
  });
  
  const { id } = useParams();
  const dispatch = useDispatch();
  const { quotationDetails, loading } = useSelector(
    (state) => state.flightQuotation
  );
  const quotation = quotationDetails?.quotation || null;
  const lead = quotationDetails?.lead || null; 
  // Load flight data whenever quotation changes
  useEffect(() => {
    if (quotation) {
      setFlightData(quotation.flightDetails || []);
      setPnrList(quotation.pnrList || []);
      const sourceFareList =
        Array.isArray(quotation.finalFareList) && quotation.finalFareList.length > 0
          ? quotation.finalFareList
          : quotation.flightDetails?.map((f) => f.fare) || [];
      setFinalFareList(sourceFareList);
      const computedTotal = sourceFareList.reduce(
        (sum, fare) => sum + Number(fare || 0),
        0,
      );
      setTotalFinalFare(Number(quotation.finalFare || 0) || computedTotal);
      setIsFinalized(quotation.status === "Confirmed");
      setInvoiceGenerated(quotation.status === "Confirmed");
    }
  }, [quotation]);

  // Fetch quotation on mount or ID change
  useEffect(() => {
    if (id) {
      dispatch(getFlightQuotationById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    const loadMailCompanies = async () => {
      try {
        const res = await axios.get("/company");
        setMailCompanies(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch {
        setMailCompanies([]);
      }
    };
    loadMailCompanies();
  }, []);

  if (!quotation || !quotation.flightDetails) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="warning">No flight quotation found!</Alert>
      </Box>
    );
  }

  // Handle Confirm Finalization
  const getComputedFareTotal = (fareList = finalFareList) =>
    (fareList || []).reduce((sum, fare) => sum + Number(fare || 0), 0);

  const handleConfirmFinalize = async () => {
    if (pnrList.some((pnr) => !pnr) || finalFareList.some((fare) => !fare)) {
      alert("Please enter PNR and Final Fare for all flights before confirming!");
      return;
    }

    try {
      const response = await dispatch(
        confirmFlightQuotation({
          flightQuotationId: quotation.flightQuotationId,
          pnrList,
          finalFareList,
          finalFare: getComputedFareTotal(),
        })
      ).unwrap();

      const updatedQuotation = response?.data;
      dispatch(getFlightQuotationById(quotation.flightQuotationId));

      setFlightData(
        flightData.map((f, index) => ({
          ...f,
          fare: finalFareList[index],
        }))
      );

      setTotalFinalFare(updatedQuotation?.finalFare || getComputedFareTotal());
      setIsFinalized(true);
      setInvoiceGenerated(true);
      setOpenDialog(false);
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Error confirming quotation:", err);
    }
  };

  const handleSaveFinalizedEdits = async () => {
    if (pnrList.some((pnr) => !pnr) || finalFareList.some((fare) => !fare)) {
      alert("Please enter PNR and Final Fare for all flights before saving!");
      return;
    }
    const computedTotal = getComputedFareTotal();
    try {
      await dispatch(
        updateFlightQuotationById({
          flightQuotationId: quotation.flightQuotationId,
          formData: {
            pnrList,
            finalFareList,
            finalFare: computedTotal,
          },
        }),
      ).unwrap();
      await dispatch(getFlightQuotationById(quotation.flightQuotationId));
      setTotalFinalFare(computedTotal);
      setOpenDialog(false);
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Failed to save finalized flight edits:", err);
    }
  };

  const handlePreviewPDF = () => {
    setSelectedCompany("");
    setEmailContentType(mailMode === "booking" ? "full" : "short");
    setOpenPreviewDialog(true);
  };

  const handlePreviewDialogClose = () => {
    setAutoGeneratePdfForMail(false);
    setOpenPreviewDialog(false);
  };

  const refreshEmailTemplates = async (companyId) => {
    if (!quotation?.flightQuotationId) return { normal: {}, booking: {} };
    const selectedCompany = mailCompanies.find((c) => c?._id === companyId);
    const res = await axios.get(`/flightQT/email/preview/${quotation.flightQuotationId}`, {
      params: {
        companyId: companyId || undefined,
        companyName: selectedCompany?.companyName || undefined,
      },
    });
    const data = res?.data?.data || {};
    const nextTemplates = {
      normal: {
        subject: data?.normal?.subject || "",
        message: data?.normal?.body || "",
      },
      booking: {
        subject: data?.booking?.subject || "",
        message: data?.booking?.body || "",
      },
    };
    setEmailTemplateBodies(nextTemplates);
    return nextTemplates;
  };

  const openEmailDialogWithTemplates = async (mailType = "normal") => {
    const defaultCompany = mailCompanies?.[0];
    setEmailTemplateType(mailType === "booking" ? "booking" : "normal");
    try {
      await refreshEmailTemplates(defaultCompany?._id);
    } catch {}
    setOpenEmailDialog(true);
  };

  const handleEmailOpen = async (mailType = "normal") => {
    if (mailType === "booking") {
      setAutoGeneratePdfForMail(false);
      await openEmailDialogWithTemplates("booking");
      return;
    }
    if (!pdfAttachmentForMail?.contentBase64) {
      setAutoGeneratePdfForMail(true);
      setMailMode("normal");
      setEmailContentType("short");
      setOpenPreviewDialog(true);
      return;
    }
    await openEmailDialogWithTemplates("normal");
  };

  const handleEmailClose = () => {
    setOpenEmailDialog(false);
    setPdfAttachmentForMail(null);
    setPreviewPdfModeForMail(false);
    setEmailToPrefill("");
  };

  const handleEmailSend = async (values) => {
    try {
      const isBookingMail = values?.mailType === "booking";
      const selectedCompany =
        mailCompanies.find((c) => c?._id === values?.companyId) || null;

      if (!isBookingMail && !pdfAttachmentForMail?.contentBase64) {
        return false;
      }

      await axios.post(`/flightQT/${quotation.flightQuotationId}/email/send`, {
        to: String(values?.to || "").trim(),
        cc: String(values?.cc || "").trim() || undefined,
        type: isBookingMail ? "booking" : "normal",
        subject: values?.subject || undefined,
        bodyHtml: isBookingMail ? undefined : values?.message || undefined,
        senderAccount: values?.senderAccount || "gmail1",
        companyId: values?.companyId || undefined,
        companyName: selectedCompany?.companyName || undefined,
        customText: isBookingMail
          ? {
              booking: {
                ...(values?.nextPayableAmount
                  ? { nextPayableAmount: Number(values.nextPayableAmount) }
                  : {}),
                ...(values?.paymentDueDate ? { dueDate: values.paymentDueDate } : {}),
              },
            }
          : undefined,
        previewPdfMode:
          !isBookingMail &&
          !!pdfAttachmentForMail?.contentBase64 &&
          previewPdfModeForMail,
        ...(!isBookingMail && pdfAttachmentForMail?.contentBase64
          ? { pdfAttachment: pdfAttachmentForMail }
          : {}),
      });

      setOpenSnackbar(true);
      return true;
    } catch (err) {
      console.error("Failed to send flight quotation mail:", err);
      return false;
    }
  };

  const handleViewInvoice = () => {
    console.log("View Invoice clicked");
    alert("Invoice view functionality - Implement your logic here");
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹ 0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get guest info string
  const getGuestInfoString = () => {
    const adults = quotation.adults || 0;
    const children = quotation.childs || 0;
    const infants = quotation.infants || 0;
    return `Adults: ${adults} | Children: ${children} | Infants: ${infants}`;
  };

  // Get customer mobile number - using the correct field name 'mobileNumber'
  const getCustomerMobile = () => {
    return quotation?.personalDetails?.mobileNumber || 
           quotation?.clientDetails?.mobileNumber ||
           quotation?.lead?.personalDetails?.mobileNumber ||
           "N/A";
  };

  // Get customer email - using the correct field name 'emailId'
  const getCustomerEmail = () => {
    return quotation?.personalDetails?.emailId || 
           quotation?.clientDetails?.email ||
           quotation?.lead?.personalDetails?.emailId ||
           "N/A";
  };

  // Get customer name - using the correct field names
  const getCustomerName = () => {
    return quotation?.personalDetails?.fullName ||
           quotation?.clientDetails?.clientName || 
           quotation?.lead?.personalDetails?.fullName ||
           "N/A";
  };

  const getCustomerLocation = () => {
  const location = lead?.location; // ✅ FIXED

  if (!location) return "N/A";

  const { city, state, country } = location;

  return [city, state, country].filter(Boolean).join(", ");
};

  const linesToPolicyArray = (v) => {
    if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof v === "string") {
      return v.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const buildFlightUpdatePayload = (field, value) => {
    switch (field) {
      case "policies.inclusionPolicy":
        return { policies: { ...(quotation?.policies || {}), inclusionPolicy: linesToPolicyArray(value) } };
      case "policies.exclusionPolicy":
        return { policies: { ...(quotation?.policies || {}), exclusionPolicy: linesToPolicyArray(value) } };
      case "policies.paymentPolicy":
        return { policies: { ...(quotation?.policies || {}), paymentPolicy: linesToPolicyArray(value) } };
      case "policies.cancellationPolicy":
        return { policies: { ...(quotation?.policies || {}), cancellationPolicy: linesToPolicyArray(value) } };
      case "policies.termsAndConditions":
        return { policies: { ...(quotation?.policies || {}), termsAndConditions: linesToPolicyArray(value) } };
      default:
        return null;
    }
  };

  const handlePolicyEditOpen = (field, title, value) => {
    setEditDialog({
      open: true,
      field,
      title,
      value: Array.isArray(value) ? value.join("\n") : String(value || ""),
    });
  };

  const handlePolicyEditSave = async () => {
    const payload = buildFlightUpdatePayload(editDialog.field, editDialog.value);
    if (!payload) return setEditDialog({ open: false, field: "", title: "", value: "" });
    try {
      await dispatch(
        updateFlightQuotationById({
          flightQuotationId: quotation.flightQuotationId,
          formData: payload,
        }),
      ).unwrap();
      await dispatch(getFlightQuotationById(quotation.flightQuotationId));
      setEditDialog({ open: false, field: "", title: "", value: "" });
    } catch (err) {
      console.error("Failed to update flight policy:", err);
    }
  };

  const infoMap = {
    call: `📞 ${getCustomerMobile()}`,
    email: `✉️ ${getCustomerEmail()}`,
    payment: `Received: 0\n Balance: ${formatCurrency(totalFinalFare)}`,
    quotation: `Total Quotation Cost: ${formatCurrency(totalFinalFare)}`,
    guest: getGuestInfoString(),
    location: `📍 ${getCustomerLocation()}`,
  };

  const infoChips = [
    { k: "call", icon: <Phone /> },
    { k: "email", icon: <AlternateEmail /> },
    { k: "location", icon: <LocationOn /> },
    { k: "payment", icon: <CreditCard /> },
    { k: "quotation", icon: <Description /> },
    { k: "guest", icon: <Person /> },
  ];

  const actions = [
    "Finalize Booking",
    "Edit Finalized Booking",
    "Normal Mail",
    "Booking Mail",
  ];

  const handleActionClick = (action) => {
    switch (action) {
      case "Finalize Booking":
        setOpenDialog(true);
        break;
      case "Edit Finalized Booking":
        setOpenDialog(true);
        break;
      case "Normal Mail":
        setMailMode("normal");
        handleEmailOpen("normal");
        break;
      case "Booking Mail":
        setMailMode("booking");
        handleEmailOpen("booking");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const flightDetailsList = [
    {
      icon: <FlightTakeoff sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />,
      text: `Trip Type: ${quotation?.tripType === "oneway" ? "One Way" : quotation?.tripType === "roundtrip" ? "Round Trip" : "Multi City"}`,
    },
    {
      icon: <Group sx={{ fontSize: 16, mr: 0.5 }} />,
      text: getGuestInfoString(),
    },
    {
      icon: <Phone sx={{ fontSize: 16, mr: 0.5 }} />,
      text: `Mobile: ${getCustomerMobile()}`,
    },
    {
      icon: <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />,
      text: `Location: ${getCustomerLocation()}`,
    },
  ];

  const tableHeaders = ["Flight", "From", "To", "Airline", "Flight No", "PNR", "Departure Date", "Departure Time", "Fare"];

  const footer = {
    contact: `${getCustomerName()} | ${getCustomerMobile()}`,
    phone: getCustomerMobile(),
    email: getCustomerEmail(),
    received: "₹ 0",
    balance: formatCurrency(totalFinalFare),
    company: "Iconic Yatra",
    address: "B-38 2nd floor, Sector 64, Noida, Uttar Pradesh – 201301",
    website: "https://www.iconicyatra.com",
  };

  const flightPolicies = quotation?.policies || {};
  const Policies = [
    {
      title: "Inclusion Policy",
      icon: <CheckCircle sx={{ mr: 0.5, color: "success.main" }} />,
      content: (flightPolicies?.inclusionPolicy?.length ? flightPolicies.inclusionPolicy : [
        "All flights as per itinerary.",
        "Airport taxes and fees included.",
        "24/7 customer support during travel.",
        "Flight changes allowed as per airline policy."
      ]),
      field: "policies.inclusionPolicy",
      isArray: true,
    },
    {
      title: "Exclusion Policy",
      icon: <Cancel sx={{ mr: 0.5, color: "error.main" }} />,
      content: (flightPolicies?.exclusionPolicy?.length ? flightPolicies.exclusionPolicy : [
        "Meals on board (unless specified).",
        "Extra baggage charges.",
        "Travel insurance.",
        "Airport transfers."
      ]),
      field: "policies.exclusionPolicy",
      isArray: true,
    },
    {
      title: "Payment Policy",
      icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
      content: (flightPolicies?.paymentPolicy?.length
        ? flightPolicies.paymentPolicy.join("\n")
        : "100% payment required at the time of booking confirmation."),
      field: "policies.paymentPolicy",
      isArray: false,
    },
    {
      title: "Cancellation & Refund",
      icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
      content: (flightPolicies?.cancellationPolicy?.length ? flightPolicies.cancellationPolicy : [
        "Cancellations before 15 days: 50% of the total fare will be deducted.",
        "Cancellations within 7 days: No refunds, 100% charges applicable.",
        "No-show: 100% cancellation charges apply."
      ]),
      field: "policies.cancellationPolicy",
      isArray: true,
    },
  ];

  const terms = flightPolicies?.termsAndConditions?.length
    ? flightPolicies.termsAndConditions.join("\n")
    : "1. This is only a Quote. Availability is checked only on confirmation.\n2. Rates are subject to change without prior notice.\n3. All disputes are subject to Noida Jurisdiction only.\n4. Passengers must carry valid ID proof and booking reference.";

  // Prepare data for PDF dialog
  const quotationForPdf = {
    customer: {
      name: getCustomerName(),
      location: getCustomerLocation(),
      phone: getCustomerMobile(),
      email: getCustomerEmail(),
    },
    flightDetails: flightData.map((flight, index) => ({
      flightNo: index + 1,
      from: flight.from,
      to: flight.to,
      airline: flight.preferredAirline,
      flightNumber: flight.flightNo,
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      fare: finalFareList[index] || flight.fare,
      pnr: pnrList[index] || "N/A",
    })),
    tripType: quotation?.tripType,
    guestInfo: getGuestInfoString(),
    adults: quotation.adults || 0,
    children: quotation.childs || 0,
    infants: quotation.infants || 0,
    quotationTitle: `Flight Quotation For ${getCustomerName()}`,
    destinationSummary: getCustomerLocation(),
    reference: quotation.flightQuotationId,
    date: new Date().toLocaleDateString(),
    totalFare: totalFinalFare,
    formattedTotalFare: formatCurrency(totalFinalFare),
    policies: {
      inclusions: Policies[0].content,
      exclusions: Policies[1].content,
      paymentPolicy: Policies[2].content,
      cancellationPolicy: Policies[3].content,
      terms: terms,
    },
    footer: footer,
  };

  const emailType = emailTemplateType === "booking" ? "booking" : "normal";
  const emailTemplate = emailTemplateBodies[emailType];
  const emailInitialValues = {
    to: emailToPrefill || "",
    cc: "",
    recipientName: getCustomerName(),
    salutation: "Dear",
    subject: emailTemplate?.subject || "",
    greetLine: "Please find below details:",
    message: emailTemplate?.message || "",
    signature: "Warm Regards,\nReservation Team\nIconic Travel",
    mailType: emailType,
    senderAccount: "gmail1",
    companyId: mailCompanies?.[0]?._id || "",
    nextPayableAmount: "",
    paymentDueDate: "",
  };

  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }} >
      <Box
        display="flex"
        justifyContent="flex-end"
        gap={1}
        mb={2}
        flexWrap="wrap"
      >
        {actions.map((a, i) => {
          if (a === "Finalize Booking" && isFinalized) return null;
          if (a === "Edit Finalized Booking" && !isFinalized) return null;
          return (
            <Button
              key={i}
              variant="contained"
              onClick={() => handleActionClick(a)}
            >
              {a}
            </Button>
          );
        })}

        {isFinalized && !invoiceGenerated && (
          <>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdf />}
              onClick={() => handlePreviewPDF()}
            >
              Preview PDF
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Receipt />}
              onClick={() => handleViewInvoice()}
            >
              Generate Invoice
            </Button>
          </>
        )}

        {invoiceGenerated && (
          <>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdf />}
              onClick={() => handlePreviewPDF()}
            >
              Preview PDF
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<Visibility />}
              onClick={handleViewInvoice}
            >
              View Invoice
            </Button>
          </>
        )}
      </Box>

      {/* Main Content */}
      <Box>
        <Grid container spacing={2}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: "sticky", top: 0 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {getCustomerName()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn
                      sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getCustomerLocation()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone
                      sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getCustomerMobile()}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} sx={{ flexWrap: "wrap", mb: 2 }}>
                    {infoChips.map(({ k, icon }) => (
                      <Chip
                        key={k}
                        icon={icon}
                        label={k}
                        size="small"
                        variant="outlined"
                        onClick={() => setActiveInfo(k)}
                      />
                    ))}
                  </Box>
                  {activeInfo && (
                    <Typography variant="body2" whiteSpace="pre-line">
                      {infoMap[activeInfo]}
                    </Typography>
                  )}
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="warning.main"
                    mt={3}
                    textAlign="center"
                  >
                    Booking Summary
                  </Typography>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography color="primary" fontWeight="bold">
                        Flight Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="h5" color="primary" gutterBottom>
                          {formatCurrency(totalFinalFare)}
                        </Typography>
                        <Typography variant="body1">
                          Reference No: {quotation.flightQuotationId}
                        </Typography>
                        <Typography variant="body1">
                          Date: {new Date(quotation.createdAt).toLocaleDateString("en-GB")}
                        </Typography>
                        <Typography variant="body1">
                          Status: {quotation.status}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Total Flights: {flightData.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Fare: {formatCurrency(totalFinalFare)}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Main Content Area */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center">
                    <CalendarToday sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Date: {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>

                  {isFinalized && (
                    <Typography
                      variant="h6"
                      color="success.main"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                    >
                      <CheckCircle sx={{ mr: 1 }} />
                      Confirmation Voucher
                    </Typography>
                  )}
                </Box>

                <Box display="flex" alignItems="center" mt={1}>
                  <Description sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Ref: {quotation.flightQuotationId}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mt={2}>
                  <Person sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Kind Attention: {getCustomerName()}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <Phone sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Mobile: {getCustomerMobile()}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Location: {getCustomerLocation()}
                  </Typography>
                </Box>

                <Box
                  mt={2}
                  p={2}
                  sx={{ backgroundColor: "grey.50", borderRadius: 1 }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                    display="flex"
                    alignItems="center"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    <Flight sx={{ mr: 0.5 }} />
                    Flight Details
                  </Typography>
                  {flightDetailsList.map((i, k) => (
                    <Box key={k} display="flex" alignItems="center" mb={0.5}>
                      {i.icon}
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {i.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box mt={3}>
                  <Box display="flex" alignItems="center">
                    <Flight sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      Flight Booking Details - {quotation?.tripType === "oneway" ? "One Way Trip" : quotation?.tripType === "roundtrip" ? "Round Trip" : "Multi City Trip"}
                    </Typography>
                  </Box>

                  <Box mt={2}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead sx={{ backgroundColor: "primary.light" }}>
                          <TableRow>
                            {tableHeaders.map((h) => (
                              <TableCell
                                key={h}
                                sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem", padding: "8px" }}
                              >
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {flightData.map((flight, index) => (
                            <TableRow key={index}>
                              <TableCell>Flight {index + 1}</TableCell>
                              <TableCell>{flight.from || "N/A"}</TableCell>
                              <TableCell>{flight.to || "N/A"}</TableCell>
                              <TableCell>{flight.preferredAirline || "N/A"}</TableCell>
                              <TableCell>{flight.flightNo || "N/A"}</TableCell>
                              <TableCell>{pnrList[index] || "N/A"}</TableCell>
                              <TableCell>
                                {flight.departureDate ? new Date(flight.departureDate).toLocaleDateString() : "N/A"}
                              </TableCell>
                              <TableCell>
                                {flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                              </TableCell>
                              <TableCell>{formatCurrency(finalFareList[index] || flight.fare)}</TableCell>
                              
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableRow sx={{ backgroundColor: "primary.main" }}>
                          <TableCell
                            colSpan={8}
                            align="right"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Total Fare
                          </TableCell>
                          <TableCell colSpan={2} sx={{ color: "white", fontWeight: "bold" }}>
                            {formatCurrency(totalFinalFare)}
                          </TableCell>
                        </TableRow>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>

                <Grid container spacing={2} mt={1}>
                  {Policies.map((p, i) => (
                    <Grid size={{ xs: 12 }} key={i}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              display="flex"
                              alignItems="center"
                              sx={{ fontSize: "0.875rem" }}
                            >
                              {p.icon}
                              {p.title}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handlePolicyEditOpen(p.field, p.title, p.content)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Box>
                          {p.isArray ? (
                            <List dense>
                              {p.content.map((item, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={item} />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" whiteSpace="pre-line">
                              {p.content}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box mt={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          display="flex"
                          alignItems="center"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          <Description sx={{ mr: 0.5 }} />
                          Terms & Condition
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handlePolicyEditOpen(
                              "policies.termsAndConditions",
                              "Terms & Conditions",
                              terms,
                            )
                          }
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" whiteSpace="pre-line">
                        {terms}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  mt={4}
                  p={2}
                  sx={{
                    backgroundColor: "primary.light",
                    borderRadius: 1,
                    color: "white",
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      Thanks & Regards,
                      <br />
                      <Person sx={{ mr: 0.5, fontSize: 18 }} />
                      {footer.contact}
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, fontWeight: "bold" }}
                  >
                    {footer.company}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Business sx={{ mr: 0.5, fontSize: 18 }} />
                    {footer.address}
                  </Box>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Language sx={{ mr: 0.5, fontSize: 18 }} />
                    <a
                      href={footer.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "white", textDecoration: "underline" }}
                    >
                      {footer.website}
                    </a>
                    <Typography variant="subtitle1" sx={{ ml: 2 }}>
                      GST : 09EYCPK8832C1ZC
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Flight Quotation PDF Dialog */}
      <FlightQuotationPDFDialog
        open={openPreviewDialog}
        onClose={handlePreviewDialogClose}
        quotation={quotationForPdf}
        pdfHeading="FLIGHT QUOTATION"
        initialEmailContentMode={emailContentType}
        includePdfOnSend={mailMode !== "booking"}
        autoSendForMail={autoGeneratePdfForMail}
        onSendMail={(payload) => {
          const attachment = payload?.pdfAttachment || payload || null;
          setPdfAttachmentForMail(attachment);
          setPreviewPdfModeForMail(Boolean(payload?.previewPdfMode));
          setEmailToPrefill(String(payload?.to || "").trim());
          setAutoGeneratePdfForMail(false);
          setOpenPreviewDialog(false);
          setEmailTemplateType("normal");
          openEmailDialogWithTemplates(mailMode === "booking" ? "booking" : "normal");
        }}
      />

      <EmailQuotationDialog
        open={openEmailDialog}
        onClose={handleEmailClose}
        onSend={handleEmailSend}
        hasPdfAttachment={!!pdfAttachmentForMail?.contentBase64}
        onCompanyChange={async (companyId, nextMailType) => {
          const templates = await refreshEmailTemplates(companyId);
          const type = nextMailType === "booking" ? "booking" : "normal";
          return templates?.[type] || { subject: "", message: "" };
        }}
        initialValuesOverride={emailInitialValues}
        templateBodies={emailTemplateBodies}
        companyOptions={mailCompanies}
      />

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          Finalize Flight Booking
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {flightData.map((flight, index) => (
              <Grid key={index} container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={`PNR (Flight ${index + 1})`}
                    fullWidth
                    value={pnrList[index] || ""}
                    onChange={(e) => {
                      const updated = [...pnrList];
                      updated[index] = e.target.value;
                      setPnrList(updated);
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Final Fare (₹)"
                    type="number"
                    fullWidth
                    value={finalFareList[index] || ""}
                    onChange={(e) => {
                      const updated = [...finalFareList];
                      updated[index] = e.target.value;
                      setFinalFareList(updated);
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            ))}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <TextField
                label="Total Final Fare (₹)"
                type="number"
                fullWidth
                value={totalFinalFare}
                onChange={(e) => setTotalFinalFare(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={isFinalized ? handleSaveFinalizedEdits : handleConfirmFinalize}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} /> : <CheckCircle />}
            disabled={loading}
          >
            {loading ? "Saving..." : isFinalized ? "Save Changes" : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Flight booking has been successfully confirmed!
        </Alert>
      </Snackbar>

      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, field: "", title: "", value: "" })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editDialog.title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={8}
            fullWidth
            value={editDialog.value}
            onChange={(e) => setEditDialog((prev) => ({ ...prev, value: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, field: "", title: "", value: "" })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handlePolicyEditSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlightFinalize;