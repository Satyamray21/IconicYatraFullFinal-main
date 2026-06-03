import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TextField,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  DirectionsCar,
  Payment,
  Phone,
  AlternateEmail,
  CreditCard,
  Description,
  Person,
  LocationOn,
  CalendarToday,
  AccessTime,
  Group,
  Route,
  CheckCircle,
  Cancel,
  Warning,
  Business,
  Language,
  ExpandMore,
  Edit,
  Receipt,
  Visibility,
  Save,
} from "@mui/icons-material";
import Add from "@mui/icons-material/Add";
import EmailQuotationDialog from "./Dialog/EmailQuotationDialog";
import MakePaymentDialog from "./Dialog/MakePaymentDialog";
import FinalizeDialog from "./Dialog/FinalizeDialog";
import EditDialog from "./Dialog/EditDialog";
import AddServiceDialog from "./Dialog/AddServiceDialog";
import VehicleQuotationPDFDialog from "./Dialog/PDF/PreviewPdf";
import TransactionHistoryDialog from "./Dialog/TransactionHistoryDialog";
import VendorManagementDialog from "./Dialog/VendorManagementDialog";
import InvoiceView from "../../../../Components/InvoiceView";
import html2pdf from "html2pdf.js";
import {
  getVehicleQuotationById,
  addItinerary,
  editItinerary,
} from "../../../../features/quotation/vehicleQuotationSlice";
import { fetchPackages } from "../../../../features/package/packageSlice";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../../utils/axios";
import logo from "../../../../assets/Logo/logoiconic.jpg";

/** Flatten policy data (array, JSON string, newline text) into display lines. */
function flattenPolicyLines(value) {
  const lines = [];
  const pushLine = (line) => {
    const s = String(line ?? "")
      .replace(/<[^>]*>/g, "")
      .trim();
    if (s) lines.push(s);
  };

  const ingest = (item) => {
    if (item == null) return;
    if (Array.isArray(item)) {
      item.forEach(ingest);
      return;
    }
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(ingest);
            return;
          }
        } catch {
          // treat as plain text
        }
      }
      if (trimmed.includes("\n")) {
        trimmed.split(/\r?\n/).forEach((part) => pushLine(part));
        return;
      }
      pushLine(trimmed);
      return;
    }
    pushLine(item);
  };

  ingest(value);
  return lines;
}

const resolveVehiclePolicyLines = (...sources) => {
  for (const source of sources) {
    const lines = flattenPolicyLines(source);
    if (lines.length > 0) return lines;
  }
  return [];
};

// Helper function to normalize policy for editor
const normalizePolicyForEditor = (value) => {
  return flattenPolicyLines(value).join("\n");
};

// Helper function to normalize policy state from source
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

// Helper to convert lines to policy array (handles JSON-in-one-string from legacy saves)
function linesToPolicyArray(v) {
  return flattenPolicyLines(v);
}

// Convert any value to array of non-empty strings (mirrors backend toPolicyArray)
function toPolicyArray(value) {
  return flattenPolicyLines(value);
}

// Maps UI field paths to Mongo $set keys
function buildMongoSetFromDisplayField(field, value) {
  const P = "policies";
  switch (field) {
    case "policies.inclusions":
      return { inclusions: linesToPolicyArray(value) };
    case "policies.exclusions":
      return { exclusions: linesToPolicyArray(value) };
    case "policies.paymentPolicy":
      return { [`${P}.paymentPolicy`]: linesToPolicyArray(value) };
    case "policies.cancellationPolicy":
      return { [`${P}.cancellationPolicy`]: linesToPolicyArray(value) };
    case "policies.terms":
      return { [`${P}.termsAndConditions`]: linesToPolicyArray(value) };
    case "quotationTitle":
      return { quotationTitle: String(value) };
    case "destinationSummary":
      return { destinationSummary: String(value) };
    case "costDetails.totalCost":
      return { "costDetails.totalCost": String(value) };
    case "discount":
      return { discount: String(value) };
    case "tax.applyGst":
      return { "tax.applyGst": String(value) };
    case "additionalServices":
      return { additionalServices: Array.isArray(value) ? value : [] };
    default:
      return null;
  }
}

/** Total nights from package (stayLocations / destinationNights / days length). */
function getPackageTotalNights(pkg) {
  if (!pkg) return 0;
  if (Array.isArray(pkg.stayLocations) && pkg.stayLocations.length > 0) {
    return pkg.stayLocations.reduce(
      (sum, loc) => sum + (Number(loc?.nights) || 0),
      0,
    );
  }
  if (Array.isArray(pkg.destinationNights) && pkg.destinationNights.length > 0) {
    return pkg.destinationNights.reduce(
      (sum, dest) => sum + (Number(dest?.nights) || 0),
      0,
    );
  }
  return Array.isArray(pkg.days) ? pkg.days.length : 0;
}

function packageMatchesDestination(pkg, destination) {
  if (!destination) return true;
  const dest = String(destination).trim().toLowerCase();
  if (!dest) return true;
  if (String(pkg?.sector || "").trim().toLowerCase() === dest) return true;
  if (
    pkg?.stayLocations?.some(
      (loc) => String(loc?.city || "").trim().toLowerCase() === dest,
    )
  ) {
    return true;
  }
  if (
    pkg?.destinationNights?.some(
      (d) => String(d?.destination || "").trim().toLowerCase() === dest,
    )
  ) {
    return true;
  }
  return false;
}

/** Exact nights match — 5 nights on quotation shows only 5-night packages. */
function packageMatchesTripNights(pkg, targetNights) {
  const nights = Number(targetNights) || 0;
  if (!nights) return true;
  return getPackageTotalNights(pkg) === nights;
}

// Resolves $set payload including nested pickup (arrival / departure) edits
function buildMongoSetFromEditDialog(editDialog, newValue) {
  if (editDialog.field === "pickup" && editDialog.nestedKey === "arrival") {
    return { "pickupDropDetails.pickupArrivalNote": String(newValue) };
  }
  if (editDialog.field === "pickup" && editDialog.nestedKey === "departure") {
    return { "pickupDropDetails.pickupDepartureNote": String(newValue) };
  }
  return buildMongoSetFromDisplayField(editDialog.field, newValue);
}

const VehicleQuotationPage = () => {
  const [logoBase64, setLogoBase64] = useState(null);
  const [activeInfo, setActiveInfo] = useState(null);
  const [openFinalize, setOpenFinalize] = useState(false);
  const [vendor, setVendor] = useState("");
  const [isFinalized, setIsFinalized] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [emailContentType, setEmailContentType] = useState("short");
  const [itineraryDialog, setItineraryDialog] = useState({
    open: false,
    mode: "add",
    day: null,
    title: "",
    description: "",
    id: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedReceiptIdForPdf, setSelectedReceiptIdForPdf] = useState("");
  const [localItinerary, setLocalItinerary] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const { items: tourPackages = [], loading: packagesLoading } = useSelector(
    (state) => state.packages,
  );

  // Policy states for editing
  const [policyInputs, setPolicyInputs] = useState({
    inclusionPolicy: "",
    exclusionPolicy: "",
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: "",
  });

  const [globalSettings, setGlobalSettings] = useState({
    inclusionPolicy: "",
    exclusionPolicy: "",
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: "",
  });

  const [isLoadingGlobalSettings, setIsLoadingGlobalSettings] = useState(false);

  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const { viewedVehicleQuotation: q, loading } = useSelector(
    (state) => state.vehicleQuotation,
  );
  const { data: company, status } = useSelector((state) => state.companyUI);

  /** Mongo _id preferred for payments (matches QuotationSelector in Payments form). */
  const apiEntityId = React.useMemo(() => {
    if (q?.vehicle?._id) return String(q.vehicle._id);
    if (id && /^[a-f\d]{24}$/i.test(String(id))) return String(id);
    if (q?.vehicle?.vehicleQuotationId) return String(q.vehicle.vehicleQuotationId);
    return id;
  }, [q?.vehicle?._id, q?.vehicle?.vehicleQuotationId, id]);

  /** All ids that may appear on payment vouchers for this quotation. */
  const paymentQuotationRefs = React.useMemo(() => {
    const refs = [
      q?.vehicle?._id,
      q?.vehicle?.vehicleQuotationId,
      id,
    ]
      .filter(Boolean)
      .map((r) => String(r));
    return [...new Set(refs)];
  }, [q?.vehicle?._id, q?.vehicle?.vehicleQuotationId, id]);
  // Initialize local itinerary from API data
  useEffect(() => {
    if (q?.vehicle?.itinerary) {
      setLocalItinerary(q.vehicle.itinerary);
    }
  }, [q?.vehicle?.itinerary]);

  useEffect(() => {
    setIsFinalized(q?.vehicle?.finalizeStatus === "finalized");
    setServices(
      Array.isArray(q?.vehicle?.additionalServices)
        ? q.vehicle.additionalServices.map((s) => ({
          ...s,
          id: s?.id || s?._id || `${Date.now()}_${Math.random()}`,
        }))
        : [],
    );
  }, [q?.vehicle?.finalizeStatus, q?.vehicle?.additionalServices]);

  const [editDialog, setEditDialog] = useState({
    open: false,
    field: "",
    value: "",
    title: "",
    nested: false,
    nestedKey: "",
  });

  const [openAddService, setOpenAddService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [services, setServices] = useState([]);
  const [currentService, setCurrentService] = useState({
    included: "no",
    particulars: "",
    amount: "",
    taxType: "",
  });
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openVendorDialog, setOpenVendorDialog] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [mailCompanies, setMailCompanies] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [selectedMailCompanyId, setSelectedMailCompanyId] = useState("");
  const [emailTemplateBodies, setEmailTemplateBodies] = useState({
    normal: { subject: "", message: "" },
    booking: { subject: "", message: "" },
  });
  const [emailTemplateType, setEmailTemplateType] = useState("normal");
  const [pdfAttachmentForMail, setPdfAttachmentForMail] = useState(null);
  const [previewPdfModeForMail, setPreviewPdfModeForMail] = useState(false);
  const [autoGeneratePdfForMail, setAutoGeneratePdfForMail] = useState(false);
  const [emailToPrefill, setEmailToPrefill] = useState("");

  const [openBankDialog, setOpenBankDialog] = useState(false);
  const [accountType, setAccountType] = useState("company");
  const [accountName, setAccountName] = useState("Iconic Yatra");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");

  const [openAddBankDialog, setOpenAddBankDialog] = useState(false);
  const [newBankDetails, setNewBankDetails] = useState({
    bankName: "",
    branchName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    openingBalance: "",
  });

  const [accountOptions, setAccountOptions] = useState([
    { value: "Cash", label: "Cash" },
    { value: "KOTAK Bank", label: "KOTAK Bank" },
    { value: "YES Bank", label: "YES Bank" },
  ]);

  const taxOptions = [
    { value: "gst5", label: "GST 5%", rate: 5 },
    { value: "gst18", label: "GST 18%", rate: 18 },
    { value: "non", label: "Non", rate: 0 },
  ];

  useEffect(() => {
    if (id) {
      dispatch(getVehicleQuotationById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!q?.vehicle) return;
    setPolicyInputs(normalizePolicyState(q.vehicle));
  }, [q?.vehicle]);

  useEffect(() => {
    dispatch(fetchPackages({ page: 1, limit: 100 }));
  }, [dispatch]);

  const loadPaymentHistory = React.useCallback(async () => {
    if (!paymentQuotationRefs.length) return;
    setPaymentHistoryLoading(true);
    try {
      const lists = await Promise.all(
        paymentQuotationRefs.map((ref) =>
          axios
            .get(`/payment/by-quotation/${encodeURIComponent(ref)}`)
            .then((res) => res.data?.data || [])
            .catch(() => []),
        ),
      );
      const seen = new Set();
      const merged = [];
      for (const list of lists) {
        for (const row of list) {
          const key = row?._id ? String(row._id) : `${row?.invoiceId}-${row?.date}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(row);
        }
      }
      merged.sort((a, b) => {
        const da = new Date(a?.date || a?.createdAt || 0).getTime();
        const db = new Date(b?.date || b?.createdAt || 0).getTime();
        return db - da;
      });
      setPaymentHistory(merged);
    } catch {
      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [paymentQuotationRefs]);

  const loadMailCompanies = async () => {
    try {
      const res = await axios.get("/company");
      setMailCompanies(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      setMailCompanies([]);
    }
  };

  useEffect(() => {
    const convertImageToBase64 = (img) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/png");
    };

    const img = new Image();
    img.onload = () => {
      setLogoBase64(convertImageToBase64(img));
    };
    img.src = logo;
  }, []);

  // Fetch global settings for policy defaults
  const fetchGlobalSettings = async () => {
    try {
      setIsLoadingGlobalSettings(true);
      const res = await axios.get("/global-settings");
      const settings = normalizePolicyState(res.data);
      setGlobalSettings(settings);

      // Update policyInputs with global defaults if not already set
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
    } finally {
      setIsLoadingGlobalSettings(false);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const fetchEmailAccounts = async () => {
    try {
      const res = await axios.get("/email-accounts");
      setEmailAccounts(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      setEmailAccounts([]);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
    loadMailCompanies();
    fetchEmailAccounts();
  }, [loadPaymentHistory]);

  useEffect(() => {
    if (!id) return undefined;
    const refresh = () => loadPaymentHistory();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id, loadPaymentHistory]);

  const actions = [
    "Finalize",
    "Booking Confirmation Mail",
    "Transaction History",
    "Add Service",
    "Email Quotation",
    "Preview PDF",

    "Make Payment",
  ];

  // Dialog handlers
  const refreshEmailTemplates = async (companyId) => {
    if (!id) return { normal: {}, booking: {} };
    const selectedCompany = mailCompanies.find((c) => c?._id === companyId);
    const res = await axios.get(`/vehicleQT/email/preview/${id}`, {
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
    } catch {
      // keep dialog usable with defaults
    }
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

  const handlePaymentOpen = () => {
    const clientName = q?.vehicle?.basicsDetails?.clientName?.trim() || "";
    const paymentRef = apiEntityId || id;
    try {
      sessionStorage.setItem(
        "paymentFormPartyPrefill",
        JSON.stringify({
          quotationRef: paymentRef,
          partyName: clientName,
        }),
      );
    } catch {
      // ignore browser storage errors
    }
    const party = encodeURIComponent(clientName);
    navigate(
      `/payments-form?quotationRef=${encodeURIComponent(paymentRef)}&party=${party}`,
    );
  };
  const handlePaymentClose = () => setOpenPaymentDialog(false);

  const handleFinalizeOpen = () => setOpenFinalize(true);
  const handleFinalizeClose = () => setOpenFinalize(false);

  const handleAddServiceOpen = () => setOpenAddService(true);
  const handleAddServiceClose = () => {
    setOpenAddService(false);
    setCurrentService({
      included: "yes",
      particulars: "",
      amount: "",
      taxType: "",
    });
  };

  const handleEditOpen = (
    field,
    value,
    title,
    nested = false,
    nestedKey = "",
  ) => {
    setEditDialog({ open: true, field, value, title, nested, nestedKey });
  };

  const handleEditClose = () => {
    setEditDialog({
      open: false,
      field: "",
      value: "",
      title: "",
      nested: false,
      nestedKey: "",
    });
  };

  const handleEditSave = async () => {
    let newValue = editDialog.value;

    if (editDialog.field.startsWith("policies.")) {
      newValue = linesToPolicyArray(editDialog.value);
    }

    // Update local policyInputs state (keep editor fields as newline text)
    if (editDialog.field.startsWith("policies.")) {
      const policyKey = editDialog.field.split(".")[1];
      const editorValue = normalizePolicyForEditor(newValue);
      setPolicyInputs((prev) => ({
        ...prev,
        [policyKey === "inclusions"
          ? "inclusionPolicy"
          : policyKey === "exclusions"
            ? "exclusionPolicy"
            : policyKey === "terms"
              ? "termsAndConditions"
              : policyKey]: editorValue,
      }));
    }

    // Build mongo set and update backend
    const mongoSet = buildMongoSetFromEditDialog(editDialog, newValue);
    if (mongoSet && q?.vehicle?.vehicleQuotationId) {
      try {
        await axios.patch(
          `/vehicleQT/${q.vehicle.vehicleQuotationId}`,
          mongoSet,
        );

        // Refresh the data
        await dispatch(getVehicleQuotationById(q.vehicle.vehicleQuotationId));

        setSnackbar({
          open: true,
          message: "Saved successfully",
          severity: "success",
        });
      } catch (e) {
        setSnackbar({
          open: true,
          message: typeof e === "string" ? e : e?.message || "Failed to save",
          severity: "error",
        });
      }
    }

    handleEditClose();
  };

  const handleEditValueChange = (e) => {
    setEditDialog({ ...editDialog, value: e.target.value });
  };

  const handleConfirm = async ({ bank, companyId, companyName }) => {
    if (q?.vehicle?.vehicleQuotationId) {
      try {
        const selectedVendorName = String(vendor || "").trim();
        const existingVendors = Array.isArray(
          q?.vehicle?.finalizedVendorsWithAmounts,
        )
          ? q.vehicle.finalizedVendorsWithAmounts
          : [];

        const hasSelectedVendor = existingVendors.some(
          (item) =>
            String(item?.vendorName || "")
              .trim()
              .toLowerCase() === selectedVendorName.toLowerCase(),
        );

        const finalizedVendorsWithAmounts =
          selectedVendorName && !hasSelectedVendor
            ? [
              ...existingVendors,
              {
                vendorName: selectedVendorName,
                vendorType: "Vehicle",
                amount: 0,
                remarks: "Finalized from quotation screen",
              },
            ]
            : existingVendors;

        await axios.post(
          `/vehicleQT/${q.vehicle.vehicleQuotationId}/finalize`,
          {
            finalizedVendorsWithAmounts,
            companyId,
            companyName
          },
        );
        await dispatch(getVehicleQuotationById(q.vehicle.vehicleQuotationId));
      } catch {
        setSnackbar({
          open: true,
          message: "Could not finalize quotation",
          severity: "error",
        });
        return;
      }
    }

    if (selectedBank) {
      setAccountType("company");
      setAccountName(selectedBank.accountHolderName || "Iconic Yatra");
      setAccountNumber(selectedBank.accountNumber || "");
      setIfscCode(selectedBank.ifscCode || "");
      setBankName(selectedBank.bankName || "");
      setBranchName(selectedBank.branchName || "");
    }

    setIsFinalized(true);
    setOpenFinalize(false);
    setInvoiceGenerated(true);
  };

  const handlePreviewDialogOpen = () => {
    setAutoGeneratePdfForMail(false);
    setEmailContentType("short");
    setOpenPreviewDialog(true);
  };

  const handlePreviewDialogClose = () => {
    setAutoGeneratePdfForMail(false);
    setOpenPreviewDialog(false);
  };

  // Add Service Functions
  const handleServiceChange = (field, value) => {
    setCurrentService((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddService = () => {
    if (
      !currentService.particulars ||
      (currentService.included === "yes" && !currentService.amount)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedTax = taxOptions.find(
      (option) => option.value === currentService.taxType,
    );
    const taxRate = selectedTax ? selectedTax.rate : 0;

    const amount = parseFloat(currentService.amount) || 0;
    const taxAmount = amount * (taxRate / 100) || 0;

    const newService = {
      ...currentService,
      id: editingServiceId || Date.now(),
      amount: amount,
      taxRate,
      taxAmount,
      totalAmount: amount + taxAmount,
      taxLabel: selectedTax ? selectedTax.label : "Non",
    };

    if (editingServiceId) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingServiceId ? newService : s)),
      );
      setEditingServiceId(null);
    } else {
      setServices((prev) => [...prev, newService]);
    }

    handleClearService();
  };

  const handleEditService = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setCurrentService({
        included: service.included,
        particulars: service.particulars,
        amount: String(service.amount || ""),
        taxType: service.taxType || "",
      });
      setEditingServiceId(serviceId);
    }
  };

  const handleClearService = () => {
    setCurrentService({
      included: "yes",
      particulars: "",
      amount: "",
      taxType: "",
    });
    setEditingServiceId(null);
  };

  const handleRemoveService = (id) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const handleSaveServices = async () => {
    if (!id) return;
    try {
      // Calculate the services total for the database
      const servicesTotal = services
        .filter((s) => s.included === "yes")
        .reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0);

      await axios.patch(`/vehicleQT/${encodeURIComponent(id)}`, {
        additionalServices: services.map(({ id: _id, ...rest }) => rest),
        "costDetails.additionalServicesTotal": String(servicesTotal),
      });

      await dispatch(getVehicleQuotationById(id));
      setSnackbar({
        open: true,
        message: "Services saved successfully",
        severity: "success",
      });
      handleAddServiceClose();
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || "Failed to save services",
        severity: "error",
      });
    }
  };

  const handleViewInvoice = () => {
    const data = {
      lead: q.lead || {},
      vehicle: q.vehicle || {},
      basicsDetails: q.vehicle?.basicsDetails || {},
    };
    generateInvoicePDF(data, logoBase64);
  };

  const handleActionClick = (action) => {
    switch (action) {
      case "Finalize":
        handleFinalizeOpen();
        break;
      case "Booking Confirmation Mail":
        handleEmailOpen("booking");
        break;
      case "Transaction History":
        setOpenTransactionDialog(true);
        break;
      case "Vendor Management":
        setOpenVendorDialog(true);
        break;
      case "Add Service":
        handleAddServiceOpen();
        break;
      case "Email Quotation":
        handleEmailOpen("normal");
        break;
      case "Preview PDF":
        handlePreviewDialogOpen();
        break;
      case "Client PDF":
        handleClientPdf();
        break;
      case "Make Payment":
        handlePaymentOpen();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const handleClientPdf = () => {
    const vehicle = q.vehicle || {};
    const lead = q.lead || {};
    const basicsDetails = vehicle.basicsDetails || {};
    const pickupDropDetails = vehicle.pickupDropDetails || {};
    const costDetails = vehicle.costDetails || {};
    const tourDetails = lead.tourDetails || {};
    const members = tourDetails.members || {};

    const defaultPolicies = {
      inclusions: [
        "Pick-up & drop from / to the airport or railway station as per the itinerary",
        "All sightseeing & transfers in a well-maintained Private AC vehicle (sedan / SUV / tempo traveller as per group size)",
        "Driver's batta (allowance), fuel charges, parking fees, toll taxes & state permit charges",
        "Vehicle available from 08:00 AM to 08:00 PM daily (extended hours on extra charges)",
        "Note: AC will be switched off in hilly areas & during steep ascents/descents for safety",
      ],
      exclusions: [
        "Travel insurance",
        "Emergency evacuation",
        "Trip cancellation costs",
        "Personal Expenses: Laundry, Room service, Tips, Shopping, Medical expenses",
        "Flight / Train tickets",
        "Entry fees to sightseeing places",
        "Camera / video charges",
        "Ropeway / boating / adventure activities",
        "Meals: Lunch / Dinner / Snacks / Beverages (unless specifically mentioned)",
        "Any extra costs due to unavoidable circumstances (natural calamities, strikes, lockdowns, bad weather, etc.)",
        "Anything not mentioned in Inclusions",
      ],
      paymentPolicy:
        "At the time of reservation, a non-refundable booking amount of 20% of package cost + 5% GST is required.\n20% at reservation + 100% Flight / Train cost\n60% after booking confirmation\nBalance before departure",
      cancellationPolicy: [
        "Cancellations before 15 days: 50% of the total tour cost will be deducted.",
        "Cancellations within 7 days: No refunds, 100% charges applicable.",
      ],
    };

    const data = {
      vehicle,
      lead,
      basicsDetails,
      pickupDropDetails,
      costDetails,
      members,
      defaultPolicies,
    };

    generateClientPDF(data, logoBase64);
  };

  const handleEmailSend = async (values) => {
    try {
      const isBookingMail = values?.mailType === "booking";
      if (!isBookingMail && !pdfAttachmentForMail?.contentBase64) {
        setSnackbar({
          open: true,
          message:
            "PDF not attached. Use Preview PDF > Send Mail to attach PDF.",
          severity: "warning",
        });
        return false;
      }
      const selectedCompany =
        mailCompanies.find((c) => c?._id === values?.companyId) || null;

      const payload = {
        to: String(values?.to || "").trim(),
        cc: String(values?.cc || "").trim() || undefined,
        type: isBookingMail ? "booking" : "normal",
        subject: values?.subject || undefined,
        bodyHtml: isBookingMail ? undefined : values?.message || undefined,
        senderAccount: values?.senderAccount || "gmail1",
        companyId: values?.companyId || undefined,
        companyName: selectedCompany?.companyName || undefined,
        customText: {
          signature: values?.signature || undefined,
          normal: {
            signature: values?.signature || undefined,
          },
          booking: {
            signature: values?.signature || undefined,
            ...(values?.nextPayableAmount
              ? { nextPayableAmount: Number(values.nextPayableAmount) }
              : {}),
            ...(values?.paymentDueDate
              ? { dueDate: values.paymentDueDate }
              : {}),
          },
        },
        previewPdfMode:
          !isBookingMail &&
          !!pdfAttachmentForMail?.contentBase64 &&
          previewPdfModeForMail,
        ...(!isBookingMail && pdfAttachmentForMail?.contentBase64
          ? { pdfAttachment: pdfAttachmentForMail }
          : {}),
      };

      // Handle Payment Receipt Attachment
      if (values.selectedReceiptId && isBookingMail) {
        console.log("Starting receipt capture for ID:", values.selectedReceiptId);
        // Wait for InvoiceView to render and fetch data
        await new Promise((resolve) => setTimeout(resolve, 2500));
        
        const element = document.getElementById("hidden-receipt-container");
        if (element) {
          try {
            const opt = {
              margin: 0.2,
              filename: `Receipt_${values.selectedReceiptId}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 1.5, useCORS: true, logging: true },
              jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };

            const pdfBlob = await html2pdf().set(opt).from(element).outputPdf("blob");
            
            if (pdfBlob && pdfBlob.size >= 100) {
              // Convert Blob to Base64
              const reader = new FileReader();
              const receiptAttachment = await new Promise((resolve, reject) => {
                reader.onloadend = () =>
                  resolve({
                    filename: "Payment_Receipt.pdf",
                    contentBase64: reader.result.split(",")[1],
                    mimeType: "application/pdf",
                  });
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
              });

              payload.receiptPdf = receiptAttachment;
              payload.paymentVoucherId = values.selectedReceiptId;
              console.log("Receipt captured and added to payload");
            }
          } catch (captureErr) {
            console.error("Failed to capture receipt PDF:", captureErr);
          }
        }
      }

      await axios.post(`/vehicleQT/${encodeURIComponent(id)}/email/send`, payload);
      setSnackbar({
        open: true,
        message: "Email sent successfully",
        severity: "success",
      });
      return true;
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || "Failed to send email",
        severity: "error",
      });
      return false;
    }
  };

  const handleAddItinerary = () => {
    const maxDays = parseInt(q?.vehicle?.basicsDetails?.noOfDays) || 0;
    const currentDays = localItinerary.length;

    if (maxDays > 0 && currentDays >= maxDays) {
      alert(
        `Cannot add more than ${maxDays} days as specified in the quotation.`,
      );
      return;
    }

    setItineraryDialog({
      open: true,
      mode: "add",
      day: currentDays + 1,
      title: `Day ${currentDays + 1}`,
      description: "",
      id: null,
    });
  };

  const handleEditItinerary = (item, index) => {
    setItineraryDialog({
      open: true,
      mode: "edit",
      day: index + 1,
      title: item.title || `Day ${index + 1}`,
      description: item.description,
      id: item._id,
    });
  };

  const handleSaveItinerary = async (keepOpen = false) => {
    const { mode, title, description, id } = itineraryDialog;

    if (!title.trim() || !description.trim()) {
      setSnackbar({
        open: true,
        message: "Please fill in both title and description",
        severity: "error",
      });
      return;
    }

    try {
      if (mode === "add") {
        const newItineraryItem = {
          _id: `temp_${Date.now()}`,
          title,
          description,
        };
        setLocalItinerary((prev) => [...prev, newItineraryItem]);

        if (keepOpen) {
          const maxDays = parseInt(q?.vehicle?.basicsDetails?.noOfDays) || 0;
          const nextDay = localItinerary.length + 2; // +1 for added, +1 for next

          if (maxDays > 0 && nextDay > maxDays) {
            handleCloseItineraryDialog();
            setSnackbar({
              open: true,
              message: `Day ${nextDay - 1} added locally. Day limit reached (${maxDays} days).`,
              severity: "success",
            });
            return;
          }

          // Open next day automatically
          setItineraryDialog({
            open: true,
            mode: "add",
            day: nextDay,
            title: `Day ${nextDay}`,
            description: "",
            id: null,
          });
          setSnackbar({
            open: true,
            message: `Day ${nextDay - 1} added locally. Enter Day ${nextDay} details.`,
            severity: "success",
          });
          return;
        }
      } else if (mode === "edit") {
        setLocalItinerary((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, title, description } : item,
          ),
        );
      }

      handleCloseItineraryDialog();
      setSnackbar({
        open: true,
        message: `Itinerary ${mode === "add" ? "added" : "updated"} locally. Don't forget to 'Save All'.`,
        severity: "info",
      });
    } catch (error) {
      console.error("Itinerary error:", error);
    }
  };

  const handleBulkSaveItinerary = async () => {
    const saveId = q?.vehicle?.vehicleQuotationId || id;
    if (!saveId || localItinerary.length === 0) return;

    try {
      const cleanedItinerary = localItinerary.map((item) => ({
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
      }));

      const res = await axios.patch(
        `/vehicleQT/${encodeURIComponent(saveId)}`,
        { itinerary: cleanedItinerary },
      );

      const savedItinerary =
        res.data?.data?.vehicle?.itinerary || cleanedItinerary;
      setLocalItinerary(savedItinerary);

      await dispatch(getVehicleQuotationById(saveId));

      setSnackbar({
        open: true,
        message: "Itinerary saved successfully to database",
        severity: "success",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || "Failed to save itinerary",
        severity: "error",
      });
    }
  };

  const handleCloseItineraryDialog = () => {
    setItineraryDialog({
      open: false,
      mode: "add",
      day: null,
      title: "",
      description: "",
      id: null,
    });
  };

  const tripDestination = React.useMemo(() => {
    const lead = q?.lead || {};
    const vehicleData = q?.vehicle || {};
    return (
      lead?.tourDetails?.tourDestination ||
      vehicleData?.destinationSummary ||
      lead?.location?.state ||
      ""
    );
  }, [q]);

  /** Lead stores nights; vehicle noOfDays is typically nights + 1. */
  const tripNights = React.useMemo(() => {
    const fromLead = parseInt(
      q?.lead?.tourDetails?.accommodation?.noOfNights,
      10,
    );
    if (fromLead > 0) return fromLead;
    const vehicleDays = parseInt(q?.vehicle?.basicsDetails?.noOfDays, 10) || 0;
    return vehicleDays > 1 ? vehicleDays - 1 : vehicleDays;
  }, [q]);

  const matchingTourPackages = React.useMemo(() => {
    if (!Array.isArray(tourPackages) || tourPackages.length === 0) return [];
    return tourPackages.filter(
      (pkg) =>
        packageMatchesDestination(pkg, tripDestination) &&
        packageMatchesTripNights(pkg, tripNights),
    );
  }, [tourPackages, tripDestination, tripNights]);

  const handleImportPackageItinerary = async (packageId) => {
    if (!packageId) return;
    let pkg = tourPackages.find((p) => String(p._id) === String(packageId));
    try {
      if (!pkg?.days?.length) {
        const res = await axios.get(`/packages/${encodeURIComponent(packageId)}`);
        pkg =
          res.data?.package ||
          res.data?.data?.package ||
          res.data?.data ||
          res.data;
      }
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to load package details",
        severity: "error",
      });
      return;
    }
    if (!pkg) {
      setSnackbar({
        open: true,
        message: "Package not found",
        severity: "error",
      });
      return;
    }
    const days = Array.isArray(pkg.days) ? pkg.days : [];
    if (days.length === 0) {
      setSnackbar({
        open: true,
        message: "This package has no itinerary days",
        severity: "warning",
      });
      return;
    }
    const imported = days.map((day, index) => ({
      _id: `temp_${Date.now()}_${index}`,
      title: day.title?.trim() || `Day ${index + 1}`,
      description: (day.notes || day.aboutCity || "").trim(),
    }));
    setLocalItinerary(imported);
    setSelectedPackageId(String(packageId));
    setSnackbar({
      open: true,
      message: `Imported ${imported.length} day(s) from "${pkg.title || pkg.packageId || "package"}". Click Save All to persist.`,
      severity: "info",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const emailInitialValues = React.useMemo(() => {
    const type = emailTemplateType === "booking" ? "booking" : "normal";
    const tpl = emailTemplateBodies[type];
    return {
      to: emailToPrefill || "",
      cc: "",
      recipientName: q?.vehicle?.basicsDetails?.clientName || "",
      salutation: "Dear",
      subject: tpl?.subject || "",
      greetLine: "Please find below details:",
      message: tpl?.message || "",
      signature: "",
      mailType: type,
      senderAccount: "gmail1",
      companyId: selectedMailCompanyId || mailCompanies?.[0]?._id || "",
      nextPayableAmount: "",
      paymentDueDate: "",
    };
  }, [
    emailTemplateType,
    emailTemplateBodies,
    mailCompanies,
    selectedMailCompanyId,
    q,
    emailToPrefill,
  ]);

  // Helper function to extract GST percentage
  const extractGstPercentage = (gstValue) => {
    if (typeof gstValue === "string") {
      const match = gstValue.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        return parseFloat(match[1]);
      }
      const num = parseFloat(gstValue.replace(/[^0-9.-]/g, ""));
      if (!isNaN(num)) return num;
    }
    if (typeof gstValue === "number") return gstValue;
    return 5; // Default 5% GST
  };

  if (loading || !q) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Extract data with proper fallbacks for API response structure
  const vehicle = q.vehicle || {};
  const lead = q.lead || {};
  const basicsDetails = vehicle.basicsDetails || {};
  const costDetails = vehicle.costDetails || {};
  const pickupDropDetails = vehicle.pickupDropDetails || {};
  const personalDetails = lead.personalDetails || {};
  const location = lead.location || {};
  const tourDetails = lead.tourDetails || {};
  const members = tourDetails.members || {};
  const tourPickupDrop = tourDetails.pickupDrop || {};

  // Helper to format date/time
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "N/A";
  const fmtTime = (t) =>
    t
      ? new Date(t).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "N/A";

  // Calculate correct amounts with GST percentage
  // Note: totalCost from DB is the BASE cost. additionalServicesTotal is stored separately.
  const totalCost = parseFloat(costDetails.totalCost) || 0;
  const dbServicesTotal = parseFloat(costDetails.additionalServicesTotal) || 0;
  const discountAmount = parseFloat(vehicle.discount) || 0;
  const amountAfterDiscount = totalCost - discountAmount;

  // Get GST percentage from tax.applyGst
  const gstPercentage = extractGstPercentage(vehicle.tax?.applyGst || "5%");
  const gstAmount = (amountAfterDiscount * gstPercentage) / 100;

  // Grand Total = (Base - Discount + GST) + Additional Services
  const finalTotal = amountAfterDiscount + gstAmount + dbServicesTotal;

  // For display in breakdown only
  const additionalServicesTotal = dbServicesTotal;

  // Calculate total received from payment history
  const totalReceived = paymentHistory.reduce((acc, v) => {
    const isReceive = v?.drCr === "Cr" || v?.paymentType === "Receive Voucher" || v?.particulars?.toLowerCase().includes("receive");
    return isReceive ? acc + (parseFloat(v.amount) || 0) : acc;
  }, 0);
  const balanceAmount = finalTotal - totalReceived;

  // Format guest information string - ALWAYS show both adults and children
  const getGuestInfoString = () => {
    const adults = members.adults || 0;
    const children = members.children || 0;
    return `Adults: ${adults} | Children: ${children}`;
  };

  const infoMap = {
    call: `📞 ${personalDetails.mobile || "N/A"}`,
    email: `✉️ ${personalDetails.emailId || "N/A"}`,
    payment: `Received: ${formatCurrency(totalReceived)}\n Balance: ${formatCurrency(balanceAmount)}`,
    quotation: `Total Quotation Cost: ${formatCurrency(finalTotal)}`,
    guest: getGuestInfoString(),
  };

  const infoChips = [
    { k: "call", icon: <Phone /> },
    { k: "email", icon: <AlternateEmail /> },
    { k: "payment", icon: <CreditCard /> },
    { k: "quotation", icon: <Description /> },
    { k: "guest", icon: <Person /> },
  ];

  const Accordions = [
    { title: "Vehicle Details" },
    { title: "Company Margin" },
  ];

  // Default policies if not provided in API response
  const DEFAULT_PAYMENT_POLICY_LINES = [
    "At the time of reservation, a non-refundable booking amount of 20% of package cost + 5% GST is required.",
    "20% at reservation + 100% Flight / Train cost",
    "60% after booking confirmation",
    "Balance before departure",
  ];

  const defaultPolicies = {
    inclusions: [
      "Pick-up & drop from / to the airport or railway station as per the itinerary",
      "All sightseeing & transfers in a well-maintained Private AC vehicle (sedan / SUV / tempo traveller as per group size)",
      "Driver's batta (allowance), fuel charges, parking fees, toll taxes & state permit charges",
      "Vehicle available from 08:00 AM to 08:00 PM daily (extended hours on extra charges)",
      "Note: AC will be switched off in hilly areas & during steep ascents/descents for safety",
    ],
    exclusions: [
      "Travel insurance",
      "Emergency evacuation",
      "Trip cancellation costs",
      "Personal Expenses: Laundry, Room service, Tips, Shopping, Medical expenses",
      "Flight / Train tickets",
      "Entry fees to sightseeing places",
      "Camera / video charges",
      "Ropeway / boating / adventure activities",
      "Meals: Lunch / Dinner / Snacks / Beverages (unless specifically mentioned)",
      "Any extra costs due to unavoidable circumstances (natural calamities, strikes, lockdowns, bad weather, etc.)",
      "Anything not mentioned in Inclusions",
    ],
    paymentPolicy: DEFAULT_PAYMENT_POLICY_LINES.join("\n"),
    cancellationPolicy: [
      "Cancellations before 15 days: 50% of the total tour cost will be deducted.",
      "Cancellations within 7 days: No refunds, 100% charges applicable.",
    ],
  };

  const Policies = [
    {
      title: "Inclusion Policy",
      icon: <CheckCircle sx={{ mr: 0.5, color: "success.main" }} />,
      content: [
        ...resolveVehiclePolicyLines(
          vehicle.inclusions,
          vehicle.policies?.inclusionPolicy,
          policyInputs.inclusionPolicy,
          defaultPolicies.inclusions,
        ),
        ...(Array.isArray(vehicle.additionalServices)
          ? vehicle.additionalServices
            .filter((s) => s.included === "yes")
            .map((s) => s.particulars)
          : []),
      ],
      field: "policies.inclusions",
      isArray: true,
    },
    {
      title: "Exclusion Policy",
      icon: <Cancel sx={{ mr: 0.5, color: "error.main" }} />,
      content: [
        ...resolveVehiclePolicyLines(
          vehicle.exclusions,
          vehicle.policies?.exclusionPolicy,
          policyInputs.exclusionPolicy,
          defaultPolicies.exclusions,
        ),
        ...(Array.isArray(vehicle.additionalServices)
          ? vehicle.additionalServices
            .filter((s) => s.included === "no")
            .map((s) => `${s.particulars} (Extra: ${formatCurrency(s.totalAmount)})`)
          : []),
      ],
      field: "policies.exclusions",
      isArray: true,
    },
    {
      title: "Payment Policy",
      icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
      content: (() => {
        const fromVehicle = toPolicyArray(vehicle.policies?.paymentPolicy);
        if (fromVehicle.length > 0) return fromVehicle.join("\n");
        const fromInput = Array.isArray(policyInputs.paymentPolicy)
          ? policyInputs.paymentPolicy.join("\n")
          : String(policyInputs.paymentPolicy || "").trim();
        return fromInput || DEFAULT_PAYMENT_POLICY_LINES.join("\n");
      })(),
      field: "policies.paymentPolicy",
      isArray: false,
    },
    {
      title: "Cancellation & Refund",
      icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
      content:
        linesToPolicyArray(policyInputs.cancellationPolicy).length > 0
          ? linesToPolicyArray(policyInputs.cancellationPolicy)
          : defaultPolicies.cancellationPolicy,
      field: "policies.cancellationPolicy",
      isArray: true,
    },
  ];

  const pickupDetails = [
    {
      icon: (
        <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
      ),
      text:
        pickupDropDetails.pickupArrivalNote ||
        `Arrival: ${tourPickupDrop.arrivalCity || ""} ${pickupDropDetails.pickupLocation || ""
        } (${fmtDate(pickupDropDetails.pickupDate)}) (${fmtTime(
          pickupDropDetails.pickupTime,
        )})`,
      editable: true,
      field: "pickup",
      nestedKey: "arrival",
    },
    {
      icon: <Cancel sx={{ fontSize: 16, mr: 0.5, color: "error.main" }} />,
      text:
        pickupDropDetails.pickupDepartureNote ||
        `Departure: ${tourPickupDrop.departureCity || ""} ${pickupDropDetails.dropLocation || ""
        } (${fmtDate(pickupDropDetails.dropDate)}) (${fmtTime(
          pickupDropDetails.dropTime,
        )})`,
      editable: true,
      field: "pickup",
      nestedKey: "departure",
    },
    {
      icon: <Group sx={{ fontSize: 16, mr: 0.5 }} />,
      text: `No of Guest: ${getGuestInfoString()}`,
      editable: true,
      field: "guests",
    },
  ];

  const tableHeaders = ["Vehicle Name", "Pickup", "Drop", "Cost"];

  const terms =
    (Array.isArray(policyInputs.termsAndConditions)
      ? policyInputs.termsAndConditions.join("\n")
      : String(policyInputs.termsAndConditions || "").trim()) ||
    "1. This is only a Quote. Availability is checked only on confirmation.\n2. Rates are subject to change without prior notice.\n3. All disputes are subject to Noida Jurisdiction only.";

  const footer = {
    contact: company?.company?.contactPerson,
    phone: "",
    email: "",
    received: formatCurrency(totalReceived),
    balance: formatCurrency(balanceAmount),
    company: company?.company?.companyName,
    address: company?.company?.address,
    website: company?.company?.website,
  };

  // Helper function to format currency
  function formatCurrency(amount) {
    if (!amount && amount !== 0) return "₹ 0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Prepare data for PDF dialog
  const quotationForPdf = {
    customer: {
      name: basicsDetails.clientName || "N/A",
      location: location.state || "N/A",
      phone: personalDetails.mobile || "N/A",
      email: personalDetails.emailId || "N/A",
    },
    pickup: {
      arrival: pickupDetails[0].text,
      departure: pickupDetails[1].text,
    },
    hotel: {
      guests: getGuestInfoString(),
      rooms: "N/A",
      mealPlan: "N/A",
      hotelType: basicsDetails.vehicleType || "N/A",
      vehiclesSameOrDifferent: basicsDetails.vehiclesSameOrDifferent || "Same",
      multipleVehicles: q?.vehicle?.multipleVehicles || [],
      destination: tourDetails.tourDestination || "N/A",
      itinerary:
        "This is only tentative schedule for sightseeing and travel. The actual sequence might change depending on the local conditions.",
    },
    quotationTitle: `Vehicle Quotation For ${basicsDetails.clientName || "N/A"}`,
    destinationSummary: tourDetails.tourDestination || "N/A",
    reference: vehicle.vehicleQuotationId || "N/A",
    date: new Date().toLocaleDateString(),
    pricing: {
      baseTotal: totalCost,
      discount: discountAmount,
      subtotal: amountAfterDiscount,
      gstPercent: gstPercentage,
      gstAmount,
      additionalServicesTotal: dbServicesTotal,
      grandTotal: finalTotal,
      total: finalTotal,
      gst: `${gstPercentage}%`,
    },
    policies: {
      inclusions: [
        ...resolveVehiclePolicyLines(
          vehicle.inclusions,
          vehicle.policies?.inclusionPolicy,
          policyInputs.inclusionPolicy,
          defaultPolicies.inclusions,
        ),
        ...(Array.isArray(vehicle.additionalServices)
          ? vehicle.additionalServices
            .filter((s) => s.included === "yes")
            .map((s) => s.particulars)
          : []),
      ],
      exclusions: [
        ...resolveVehiclePolicyLines(
          vehicle.exclusions,
          vehicle.policies?.exclusionPolicy,
          policyInputs.exclusionPolicy,
          defaultPolicies.exclusions,
        ),
        ...(Array.isArray(vehicle.additionalServices)
          ? vehicle.additionalServices
            .filter((s) => s.included === "no")
            .map((s) => `${s.particulars} (Extra: ${formatCurrency(s.totalAmount)})`)
          : []),
      ],
      paymentPolicy: (() => {
        const fromVehicle = toPolicyArray(vehicle.policies?.paymentPolicy);
        if (fromVehicle.length > 0) return fromVehicle.join("\n");
        const fromInput = Array.isArray(policyInputs.paymentPolicy)
          ? policyInputs.paymentPolicy.join("\n")
          : String(policyInputs.paymentPolicy || "").trim();
        return fromInput || DEFAULT_PAYMENT_POLICY_LINES.join("\n");
      })(),
      cancellationPolicy: defaultPolicies.cancellationPolicy,
      terms: terms,
    },
    footer: footer,
    days: localItinerary.map((item, index) => ({
      title: item.title ? (/^Day\s*\d+/i.test(item.title.trim()) ? item.title : `Day ${index + 1} - ${item.title}`) : `Day ${index + 1}`,
      description: item.description,
      date: "",
      dayDate: "",
    })),
    bannerImage: "",
    logo: logoBase64,
    hotelPricingData: [
      {
        destination: "Vehicle",
        nights: `${basicsDetails.noOfDays || 0} Days`,
        standard: formatCurrency(totalCost),
        deluxe: "-",
        superior: "-",
      },
      {
        destination: "Quotation Cost",
        nights: "-",
        standard: formatCurrency(amountAfterDiscount),
        deluxe: "-",
        superior: "-",
      },
      {
        destination: `GST @ ${gstPercentage}%`,
        nights: "-",
        standard: formatCurrency(gstAmount),
        deluxe: "-",
        superior: "-",
      },
      {
        destination: "Total Quotation Cost",
        nights: "-",
        standard: formatCurrency(finalTotal),
        deluxe: "-",
        superior: "-",
      },
    ],
  };

  return (
    <Box sx={{ backgroundColor: "white", minHeight: "100vh" }}>
      <Box
        display="flex"
        justifyContent="flex-end"
        gap={1}
        mb={2}
        flexWrap="wrap"
      >
        {actions.map((a, i) => {
          if (a === "Finalize" && isFinalized) return null;
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

        {/* {isFinalized && !invoiceGenerated && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Receipt />}
            onClick={() => handleViewInvoice()}
          >
            Generate Invoice
          </Button>
        )} */}

        {invoiceGenerated && (
          <Button
            variant="contained"
            color="info"
            startIcon={<Visibility />}
            onClick={handleViewInvoice}
          >
            View Invoice
          </Button>
        )}
      </Box>

      {isFinalized &&
        Array.isArray(vehicle?.finalizedVendorsWithAmounts) &&
        vehicle.finalizedVendorsWithAmounts.length > 0 && (
          <Card
            sx={{ mb: 2, borderLeft: "4px solid", borderColor: "success.main" }}
          >
            <CardContent sx={{ py: 1.5 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={0.5}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="success.main"
                  gutterBottom
                >
                  Finalized Vendors
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setOpenVendorDialog(true)}
                >
                  Edit Vendors
                </Button>
              </Box>
              {vehicle.finalizedVendorsWithAmounts.map((v, idx) => (
                <Typography key={v?._id || idx} variant="body2">
                  {v?.vendorName || "Vendor"} ({v?.vendorType || "Other"}) -{" "}
                  {formatCurrency(v?.amount || 0)}
                </Typography>
              ))}
            </CardContent>
          </Card>
        )}

      {/* Main Content */}
      <Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: "sticky", top: 0 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {basicsDetails.clientName || "N/A"}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocationOn
                      sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {location.state || "N/A"}
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
                    mt={8}
                    textAlign="center"
                  >
                    Margin & Taxes (B2C)
                  </Typography>
                  {Accordions.map((a, i) => (
                    <Accordion key={i}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography color="primary" fontWeight="bold">
                          {a.title}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {a.title === "Vehicle Details" ? (
                          <Box>
                            <Typography
                              variant="h5"
                              color="primary"
                              gutterBottom
                            >
                              {formatCurrency(finalTotal)}
                            </Typography>

                            <Typography variant="body1">
                              Pickup :{" "}
                              {tourPickupDrop.arrivalCity || ""}{" "}
                              {pickupDropDetails.pickupLocation || ""}{" "}
                              ({fmtDate(pickupDropDetails.pickupDate)}) (
                              {fmtTime(pickupDropDetails.pickupTime)})
                            </Typography>

                            <Typography variant="body1">
                              Drop : {tourPickupDrop.departureCity || ""}{" "}
                              {pickupDropDetails.dropLocation || ""}{" "}
                              ({fmtDate(pickupDropDetails.dropDate)}) (
                              {fmtTime(pickupDropDetails.dropTime)})
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Base Cost: {formatCurrency(totalCost)}
                            </Typography>
                            {discountAmount > 0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Discount: -{formatCurrency(discountAmount)}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Subtotal: {formatCurrency(amountAfterDiscount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              GST @ {gstPercentage}%:{" "}
                              {formatCurrency(gstAmount)}
                            </Typography>
                            {additionalServicesTotal > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                Additional Services: {formatCurrency(additionalServicesTotal)}
                              </Typography>
                            )}
                            <Typography
                              variant="body1"
                              color="primary"
                              fontWeight="bold"
                              sx={{ mt: 1 }}
                            >
                              Grand Total: {formatCurrency(finalTotal)}
                            </Typography>
                          </Box>
                        ) : a.title === "Company Margin" ? (
                          <Typography variant="body2">
                            Company Margin details go here...
                          </Typography>
                        ) : (
                          <Typography variant="body2">
                            Details go here.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Grid>

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
                    Ref: {vehicle.vehicleQuotationId || "N/A"}
                  </Typography>
                </Box>
                {vehicle.bookingId && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <CheckCircle sx={{ fontSize: 18, mr: 0.5, color: "error.main" }} />
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      Booking ID: {vehicle.bookingId}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" mt={2}>
                  <Person sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Kind Attention: {basicsDetails.clientName || "N/A"}
                  </Typography>
                </Box>

                <Box
                  mt={2}
                  p={2}
                  sx={{ backgroundColor: "grey.50", borderRadius: 1 }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                      display="flex"
                      alignItems="center"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      <Route sx={{ mr: 0.5 }} />
                      Pickup/Drop Details
                    </Typography>
                  </Box>
                  {pickupDetails.map((i, k) => (
                    <Box key={k} display="flex" alignItems="center" mb={0.5}>
                      {i.icon}
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {i.text}
                      </Typography>
                      {i.editable && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleEditOpen(
                              i.field,
                              i.text,
                              i.nestedKey || i.field,
                              !!i.nestedKey,
                              i.nestedKey,
                            )
                          }
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>

                <Box mt={3}>
                  <Box display="flex" alignItems="center">
                    <DirectionsCar sx={{ mr: 1 }} />
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="warning.main"
                    >
                      Vehicle Quotation For {basicsDetails.clientName || "N/A"}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Route sx={{ mr: 0.5 }} />
                    <Typography variant="subtitle2">
                      Itinerary Route Plan
                    </Typography>
                  </Box>
                  <Box display="flex" mt={1}>
                    <Warning sx={{ mr: 1, color: "warning.main", mt: 0.2 }} />
                    <Typography variant="body2">
                      This is only tentative schedule for sightseeing and
                      travel. The actual sequence might change depending on the
                      local conditions.
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleEditOpen(
                          "itineraryNote",
                          "This is only tentative schedule for sightseeing and travel. The actual sequence might change depending on the local conditions.",
                          "Itinerary Note",
                        )
                      }
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box mt={2}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={2}
                          flexWrap="wrap"
                          gap={1}
                        >
                          <Typography variant="h6">
                            Itinerary Details
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                            <FormControl
                              size="small"
                              sx={{ minWidth: 320 }}
                              disabled={packagesLoading}
                            >
                              <InputLabel
                                id="vehicle-package-itinerary-label"
                                shrink
                              >
                                Import from package
                              </InputLabel>
                              <Select
                                labelId="vehicle-package-itinerary-label"
                                label="Import from package"
                                value={selectedPackageId}
                                onChange={(e) => {
                                  const pkgId = e.target.value;
                                  setSelectedPackageId(pkgId);
                                  handleImportPackageItinerary(pkgId);
                                }}
                                displayEmpty
                                notched
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        component="span"
                                        sx={{ fontStyle: "italic" }}
                                      >
                                        {packagesLoading
                                          ? "Loading packages…"
                                          : matchingTourPackages.length === 0
                                            ? `No packages (${tripNights || "?"}N, ${tripDestination || "any destination"})`
                                            : "Select package to import itinerary"}
                                      </Typography>
                                    );
                                  }
                                  const pkg = matchingTourPackages.find(
                                    (p) => String(p._id) === String(selected),
                                  );
                                  if (!pkg) return "Package selected";
                                  const nights = getPackageTotalNights(pkg);
                                  const label =
                                    pkg.title ||
                                    pkg.packageId ||
                                    pkg.sector ||
                                    "Package";
                                  return `${label}${nights > 0 ? ` (${nights}N)` : ""}${pkg.sector ? ` — ${pkg.sector}` : ""}`;
                                }}
                              >
                                {matchingTourPackages.map((pkg) => {
                                  const nights = getPackageTotalNights(pkg);
                                  const label =
                                    pkg.title ||
                                    pkg.packageId ||
                                    pkg.sector ||
                                    "Package";
                                  return (
                                    <MenuItem key={pkg._id} value={String(pkg._id)}>
                                      {label}
                                      {nights > 0 ? ` (${nights}N)` : ""}
                                      {pkg.sector ? ` — ${pkg.sector}` : ""}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleAddItinerary}
                              startIcon={<Add />}
                            >
                              Add Day
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={handleBulkSaveItinerary}
                              startIcon={<Save />}
                              disabled={localItinerary.length === 0}
                            >
                              Save All
                            </Button>
                          </Box>
                        </Box>

                        {localItinerary.length > 0 ? (
                          localItinerary.map((item, index) => (
                            <Box
                              key={item._id || index}
                              mb={2}
                              p={1}
                              sx={{
                                border: "1px dashed #ddd",
                                borderRadius: 1,
                              }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {item.title ? (/^Day\s*\d+/i.test(item.title.trim()) ? item.title : `Day ${index + 1} - ${item.title}`) : `Day ${index + 1}`}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleEditItinerary(item, index)
                                  }
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {item.description}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            textAlign="center"
                            py={2}
                          >
                            No itinerary added yet. Click "Add Day" to create
                            your itinerary.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                <Box mt={3}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead sx={{ backgroundColor: "primary.light" }}>
                        <TableRow>
                          {tableHeaders.map((h) => (
                            <TableCell
                              key={h}
                              sx={{ color: "white", fontWeight: "bold" }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {basicsDetails.vehiclesSameOrDifferent === "Different" && Array.isArray(q?.vehicle?.multipleVehicles) ? (
                          q.vehicle.multipleVehicles.map((mv, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <DirectionsCar sx={{ mr: 1, color: "primary.main", verticalAlign: "middle" }} />
                                {mv.vehicleType || "N/A"} ({mv.tripType || "N/A"})
                              </TableCell>
                              <TableCell>
                                {idx === 0 ? (
                                  <>
                                    <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                    {pickupDropDetails.pickupDate
                                      ? new Date(pickupDropDetails.pickupDate).toLocaleDateString()
                                      : "N/A"}
                                    <br />
                                    <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                    {pickupDropDetails.pickupTime
                                      ? new Date(pickupDropDetails.pickupTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                      : "N/A"}
                                  </>
                                ) : <Typography variant="caption" color="textSecondary">Same as above</Typography>}
                              </TableCell>
                              <TableCell>
                                {idx === 0 ? (
                                  <>
                                    <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                    {pickupDropDetails.dropDate
                                      ? new Date(pickupDropDetails.dropDate).toLocaleDateString()
                                      : "N/A"}
                                    <br />
                                    <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                    {pickupDropDetails.dropTime
                                      ? new Date(pickupDropDetails.dropTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                      : "N/A"}
                                  </>
                                ) : <Typography variant="caption" color="textSecondary">Same as above</Typography>}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(mv.totalCost)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell>
                              <DirectionsCar sx={{ mr: 1, color: "primary.main", verticalAlign: "middle" }} />
                              {basicsDetails.vehicleType || "N/A"}
                            </TableCell>
                            <TableCell>
                              <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                              {pickupDropDetails.pickupDate
                                ? new Date(pickupDropDetails.pickupDate).toLocaleDateString()
                                : "N/A"}
                              <br />
                              <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                              {pickupDropDetails.pickupTime
                                ? new Date(pickupDropDetails.pickupTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                              {pickupDropDetails.dropDate
                                ? new Date(pickupDropDetails.dropDate).toLocaleDateString()
                                : "N/A"}
                              <br />
                              <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                              {pickupDropDetails.dropTime
                                ? new Date(pickupDropDetails.dropTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(totalCost)}
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen("costDetails.totalCost", String(costDetails.totalCost || totalCost || ""), "Total Cost")}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow sx={{ backgroundColor: "grey.50" }}>
                          <TableCell>Discount</TableCell>
                          <TableCell colSpan={2} />
                          <TableCell>
                            -{formatCurrency(discountAmount)}
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEditOpen(
                                  "discount",
                                  String(
                                    vehicle.discount || discountAmount || "",
                                  ),
                                  "Discount",
                                )
                              }
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                          <TableCell>Subtotal (After Discount)</TableCell>
                          <TableCell colSpan={2} />
                          <TableCell
                            sx={{ fontWeight: "bold", color: "#2e7d32" }}
                          >
                            {formatCurrency(amountAfterDiscount)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>GST @ {gstPercentage}%</TableCell>
                          <TableCell colSpan={2} />
                          <TableCell>
                            {formatCurrency(gstAmount)}
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEditOpen(
                                  "tax.applyGst",
                                  String(
                                    vehicle?.tax?.applyGst ||
                                    `${gstPercentage}%`,
                                  ),
                                  "GST %",
                                )
                              }
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: "primary.main" }}>
                          <TableCell
                            colSpan={3}
                            align="left"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Total Quotation Cost
                          </TableCell>
                          <TableCell
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            {formatCurrency(finalTotal)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                              onClick={() =>
                                handleEditOpen(
                                  p.field,
                                  normalizePolicyForEditor(p.content),
                                  p.title,
                                )
                              }
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
                            handleEditOpen(
                              "policies.terms",
                              terms,
                              "Terms & Conditions",
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
                    <IconButton
                      size="small"
                      sx={{ color: "white" }}
                      onClick={() =>
                        handleEditOpen(
                          "footer",
                          footer.contact,
                          "Footer Contact",
                          true,
                          "contact",
                        )
                      }
                    >
                      <Edit fontSize="small" />
                    </IconButton>
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
                      GST : {company?.company?.gst}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Vehicle Quotation PDF Dialog */}
      <VehicleQuotationPDFDialog
        open={openPreviewDialog}
        onClose={handlePreviewDialogClose}
        quotation={quotationForPdf}
        pdfHeading="VEHICLE QUOTATION"
        autoSendForMail={autoGeneratePdfForMail}
        onSendMail={(payload) => {
          const attachment = payload?.pdfAttachment || payload || null;
          setPdfAttachmentForMail(attachment);
          setPreviewPdfModeForMail(Boolean(payload?.previewPdfMode));
          setEmailToPrefill(String(payload?.to || "").trim());
          setAutoGeneratePdfForMail(false);
          setOpenPreviewDialog(false);
          setEmailTemplateType("normal");
          openEmailDialogWithTemplates();
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Finalize Dialog */}
      <FinalizeDialog
        open={openFinalize}
        onClose={handleFinalizeClose}
        vendor={vendor}
        setVendor={setVendor}
        onConfirm={handleConfirm}
        companyOptions={mailCompanies}
      />

      {/* Edit Dialog */}
      <EditDialog
        open={editDialog.open}
        onClose={handleEditClose}
        title={editDialog.title}
        value={editDialog.value}
        onValueChange={handleEditValueChange}
        onSave={handleEditSave}
      />

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={openAddService}
        onClose={handleAddServiceClose}
        currentService={currentService}
        onServiceChange={handleServiceChange}
        services={services}
        onAddService={handleAddService}
        onEditService={handleEditService}
        onClearService={handleClearService}
        onRemoveService={handleRemoveService}
        onSaveServices={handleSaveServices}
        taxOptions={taxOptions}
        isEditingService={!!editingServiceId}
      />

      {/* Email Quotation Dialog */}
      <EmailQuotationDialog
        open={openEmailDialog}
        onClose={handleEmailClose}
        onSend={handleEmailSend}
        onCompanyChange={async (companyId, mailType) => {
          setSelectedMailCompanyId(companyId);
          const templates = await refreshEmailTemplates(companyId);
          const type = mailType === "booking" ? "booking" : "normal";
          return templates?.[type] || { subject: "", message: "" };
        }}
        initialValuesOverride={emailInitialValues}
        templateBodies={emailTemplateBodies}
        companyOptions={mailCompanies}
        emailAccountOptions={emailAccounts}
        hasPdfAttachment={!!pdfAttachmentForMail}
        receiptOptions={paymentHistory.filter(v => v?.drCr === "Cr" || v?.paymentType === "Receive Voucher" || v?.particulars?.toLowerCase().includes("receive"))}
        onReceiptChange={(receiptId) => setSelectedReceiptIdForPdf(receiptId)}
      />

      <Box sx={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1000px" }}>
        <div id="hidden-receipt-container">
           {selectedReceiptIdForPdf && (
              <InvoiceView id={selectedReceiptIdForPdf} hideButtons={true} />
           )}
        </div>
      </Box>

      <TransactionHistoryDialog
        open={openTransactionDialog}
        onClose={() => setOpenTransactionDialog(false)}
        loading={paymentHistoryLoading}
        rows={paymentHistory}
        quotationRef={apiEntityId || id}
      />

      <VendorManagementDialog
        open={openVendorDialog}
        onClose={() => setOpenVendorDialog(false)}
        vehicle={q?.vehicle}
        vehicleQuotationId={q?.vehicle?.vehicleQuotationId}
        onSaved={async () => {
          await dispatch(
            getVehicleQuotationById(q?.vehicle?.vehicleQuotationId),
          );
          setSnackbar({
            open: true,
            message: "Vendor details saved",
            severity: "success",
          });
        }}
      />

      {/* Payment Dialog */}
      <MakePaymentDialog
        open={openPaymentDialog}
        onClose={handlePaymentClose}
      />

      {/* Itinerary Dialog */}
      <Dialog
        open={itineraryDialog.open}
        onClose={handleCloseItineraryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {itineraryDialog.mode === "add" ? "Add" : "Edit"} Itinerary - Day{" "}
          {itineraryDialog.day}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={itineraryDialog.title}
            onChange={(e) =>
              setItineraryDialog({ ...itineraryDialog, title: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={itineraryDialog.description}
            onChange={(e) =>
              setItineraryDialog({
                ...itineraryDialog,
                description: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItineraryDialog}>Cancel</Button>
          {itineraryDialog.mode === "add" ? (
            <>
              {(() => {
                const maxDays = parseInt(q?.vehicle?.basicsDetails?.noOfDays) || 0;
                const isLastDay = maxDays > 0 && (localItinerary.length + 1) >= maxDays;

                if (isLastDay) return null;

                return (
                  <Button
                    onClick={() => handleSaveItinerary(true)}
                    variant="outlined"
                    color="primary"
                  >
                    Add & Next
                  </Button>
                );
              })()}
              <Button
                onClick={() => handleSaveItinerary(false)}
                variant="contained"
                color="primary"
              >
                Save & Close
              </Button>
            </>
          ) : (
            <Button
              onClick={() => handleSaveItinerary(false)}
              variant="contained"
              color="primary"
            >
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleQuotationPage;
