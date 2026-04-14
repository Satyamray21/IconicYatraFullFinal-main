import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
    FormatQuote as FormatQuoteIcon,
    Payment,
    Phone,
    AlternateEmail,
    CreditCard,
    Description,
    Person,
    LocationOn,
    CalendarToday,
    CheckCircle,
    Cancel,
    Warning,
    Business,
    Language,
    ExpandMore,
    Edit,
    Group,
    Receipt,
    Route,
    Route as RouteIcon,
    Visibility,
    AddCircleOutline,
    Image as ImageIcon,
    FormatQuote,
    Delete,
    Add,
    Download,
    Error,
    Calculate,
} from "@mui/icons-material";

import EmailQuotationDialog from "../VehicleQuotation/Dialog/EmailQuotationDialog";
import FinalizeDialog from "./Dialog/FinalizeDialog";
import CostingEditDialog from "./Dialog/CostingEditDialog";
import HotelVendorDialog from "./Dialog/HotelVendor";
import AddBankDialog from "../VehicleQuotation/Dialog/AddBankDialog";
import EditDialog from "../VehicleQuotation/Dialog/EditDialog";
import AddServiceDialog from "../VehicleQuotation/Dialog/AddServiceDialog";
import AddFlightDialog from "../HotelQuotation/Dialog/FlightDialog";
import InvoicePDF from "./Dialog/PDF/Invoice";
import QuotationPDFDialog from "./Dialog/PDF/PreviewPdf";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getCustomQuotationById,
    finalizeCustomQuotation,
    updateCustomQuotation,
    updateQuotationStep,
} from "../../../../features/quotation/customQuotationSlice";
import { saveCustomQuotationItinerary } from "../../../../utils/syncCustomQuotationItinerary";
import FinalizeVehicleDialog from "./Dialog/FinalizeVehicleDialog";
import FinalizeHotelsPricingDialog from "./Dialog/FinalizeHotelsPricingDialog";
import axios from "../../../../utils/axios";
import {
    sumBillableAdditionalServices,
    mapApiAdditionalServicesToState,
    serializeAdditionalServicesForApi,
} from "../../../../utils/quotationAdditionalServices";

function setQuotationValueByPath(prev, path, value) {
    const parts = path.split(".");
    if (parts.length === 1) {
        return { ...prev, [path]: value };
    }
    const next = { ...prev };
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = cur[p] && typeof cur[p] === "object" ? { ...cur[p] } : {};
        cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
    return next;
}

function linesToPolicyArray(v) {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") {
        return v.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    return [String(v)];
}

/** Maps UI field paths to Mongo $set keys on CustomQuotation */
function buildMongoSetFromDisplayField(field, value) {
    const P = "tourDetails.policies";
    switch (field) {
        case "policies.inclusions":
            return { [`${P}.inclusionPolicy`]: linesToPolicyArray(value) };
        case "policies.exclusions":
            return { [`${P}.exclusionPolicy`]: linesToPolicyArray(value) };
        case "policies.paymentPolicy":
            return { [`${P}.paymentPolicy`]: linesToPolicyArray(value) };
        case "policies.cancellationPolicy":
            return { [`${P}.cancellationPolicy`]: linesToPolicyArray(value) };
        case "policies.terms":
            return { [`${P}.termsAndConditions`]: linesToPolicyArray(value) };
        case "hotel.itinerary":
            return { "tourDetails.initalNotes": String(value) };
        case "customer.name":
            return { "clientDetails.clientName": String(value) };
        case "customer.location":
            return { "clientDetails.sector": String(value) };
        case "footer.contact":
            return {
                "tourDetails.quotationDetails.signatureDetails.signedBy":
                    String(value),
            };
        case "quotationHeaderTitle":
            return { "tourDetails.quotationTitle": String(value) };
        case "destinationLine":
            return { "tourDetails.destinationSummary": String(value) };
        default:
            return null;
    }
}

/** Resolves $set payload including nested pickup (arrival / departure) edits */
function buildMongoSetFromEditDialog(editDialog, newValue) {
    if (editDialog.field === "pickup" && editDialog.nestedKey === "arrival") {
        return { "tourDetails.pickupArrivalNote": String(newValue) };
    }
    if (editDialog.field === "pickup" && editDialog.nestedKey === "departure") {
        return { "tourDetails.pickupDepartureNote": String(newValue) };
    }
    return buildMongoSetFromDisplayField(editDialog.field, newValue);
}

/** Receive Voucher → Cr = money received from client; Payment Voucher → Dr = money paid to vendor */
function summarizeVoucherAmounts(vouchers) {
    let receivedFromClient = 0;
    let paidToVendor = 0;
    (vouchers || []).forEach((v) => {
        const n = Number(v.amount) || 0;
        const isReceive =
            v.drCr === "Cr" || v.paymentType === "Receive Voucher";
        const isPayment =
            v.drCr === "Dr" || v.paymentType === "Payment Voucher";
        if (isReceive) receivedFromClient += n;
        else if (isPayment) paidToVendor += n;
    });
    return {
        receivedFromClient,
        paidToVendor,
        net: receivedFromClient - paidToVendor,
        cr: receivedFromClient,
        dr: paidToVendor,
    };
}

// Transaction Summary — vouchers linked to this quotation (Receive = Cr, Payment = Dr)
const TransactionSummaryDialog = ({
    open,
    onClose,
    loading,
    rows,
    quotationRef,
}) => {
    const totals = summarizeVoucherAmounts(rows);

    const tableHeaders = [
        "Sr.",
        "Receipt #",
        "Voucher id",
        "Type",
        "Party",
        "Particulars",
        "Payment Bank",
        "Dr/Cr",
        "Amount",
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: "400px" } }}
        >
            <DialogTitle>
                <Typography variant="h6" component="div" fontWeight="bold">
                    Payment history{quotationRef ? ` — ${quotationRef}` : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Receive vouchers count as money from the client; payment vouchers count as money paid to vendors.
                </Typography>
            </DialogTitle>
            <DialogContent>
                {!loading && rows?.length > 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Paper
                            variant="outlined"
                            sx={{
                                flex: "1 1 200px",
                                p: 2,
                                borderLeft: "4px solid",
                                borderColor: "success.main",
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Received from client
                            </Typography>
                            <Typography variant="h6" color="success.main" fontWeight="bold">
                                ₹{totals.receivedFromClient.toLocaleString("en-IN")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Receive vouchers (Cr)
                            </Typography>
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                flex: "1 1 200px",
                                p: 2,
                                borderLeft: "4px solid",
                                borderColor: "warning.main",
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Paid to vendors
                            </Typography>
                            <Typography variant="h6" color="warning.main" fontWeight="bold">
                                ₹{totals.paidToVendor.toLocaleString("en-IN")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Payment vouchers (Dr)
                            </Typography>
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                flex: "1 1 200px",
                                p: 2,
                                borderLeft: "4px solid",
                                borderColor: "info.main",
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Net (client in − vendor out)
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                ₹{totals.net.toLocaleString("en-IN")}
                            </Typography>
                        </Paper>
                    </Box>
                )}
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ border: "1px solid #e0e0e0" }}
                >
                    <Table sx={{ minWidth: 800 }} aria-label="transaction summary table">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                {tableHeaders.map((header, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{
                                            fontWeight: "bold",
                                            borderRight:
                                                index < tableHeaders.length - 1
                                                    ? "1px solid #e0e0e0"
                                                    : "none",
                                        }}
                                    >
                                        {header}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : rows?.length ? (
                                rows.map((v, index) => (
                                    <TableRow key={v._id || index} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{v.receiptNumber}</TableCell>
                                        <TableCell>{v.invoiceId}</TableCell>
                                        <TableCell>{v.paymentType}</TableCell>
                                        <TableCell>{v.partyName}</TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>{v.particulars}</TableCell>
                                        <TableCell>{v.paymentMode}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={v.drCr || "—"}
                                                color={v.drCr === "Cr" ? "success" : v.drCr === "Dr" ? "warning" : "default"}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{(Number(v.amount) || 0).toLocaleString("en-IN")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={tableHeaders.length}
                                        align="center"
                                        sx={{
                                            height: 120,
                                            color: "text.secondary",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        No vouchers linked to this quotation yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// Invoice PDF Dialog Component
const InvoicePdfDialog = ({ open, onClose, quotation, invoiceData }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([document.getElementById('invoice-content').innerHTML], { type: 'text/html' });
        element.href = URL.createObjectURL(file);
        element.download = `invoice-${quotation.reference}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: "80vh", width: "90vw" } }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div" fontWeight="bold">
                        Invoice - {quotation.reference}
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handlePrint}
                            startIcon={<Visibility />}
                        >
                            Print
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDownload}
                            startIcon={<Download />}
                        >
                            Download
                        </Button>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {loading && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bgcolor="rgba(255,255,255,0.8)"
                        zIndex={1}
                    >
                        <Box textAlign="center">
                            <CircularProgress size={40} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Loading invoice...
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Box sx={{ height: "70vh", width: "100%", overflow: 'auto' }} id="invoice-content">
                    <InvoicePDF invoiceData={invoiceData} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
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
        // Return plain text joined with newlines, not HTML
        return merged;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "";
        // Strip HTML tags if any, or just return plain text
        return trimmed.replace(/<[^>]*>/g, '');
    }

    return "";
};

const normalizePolicyState = (source = {}) => {
    const policySource = source?.policy || source || {};
    return {
        inclusionPolicy: normalizePolicyForEditor(
            policySource?.inclusionPolicy ?? policySource?.inclusions
        ),
        exclusionPolicy: normalizePolicyForEditor(
            policySource?.exclusionPolicy ?? policySource?.exclusions
        ),
        paymentPolicy: normalizePolicyForEditor(policySource?.paymentPolicy),
        cancellationPolicy: normalizePolicyForEditor(policySource?.cancellationPolicy),
        termsAndConditions: normalizePolicyForEditor(policySource?.termsAndConditions),
    };
};
const CustomFinalize = () => {
    // State
    const dispatch = useDispatch();
    const [activeInfo, setActiveInfo] = useState(null);
    const [openFinalize, setOpenFinalize] = useState(false);
    const [openAddFlight, setOpenAddFlight] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);
    const [invoiceGenerated, setInvoiceGenerated] = useState(false);
    const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
    const [openPdfDialog, setOpenPdfDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });
    const { data: company, status } = useSelector((state) => state.companyUI);
    const [itineraryDialog, setItineraryDialog] = useState({
        open: false,
        mode: 'add',
        day: null,
        title: "",
        description: "",
        dayDate: "",
        editIndex: null,
    });
    const [openVehicleFinalizeDialog, setOpenVehicleFinalizeDialog] = useState(false);
    const [openHotelsPricingDialog, setOpenHotelsPricingDialog] = useState(false);
    const [itinerarySaving, setItinerarySaving] = useState(false);
    const [guestCountsDialog, setGuestCountsDialog] = useState({
        open: false,
        adults: 0,
        children: 0,
        kids: 0,
        infants: 0,
    });
    const [bannerUploading, setBannerUploading] = useState(false);
    const { id } = useParams(); // business quotationId e.g. ICYR_CQ_0001
    const navigate = useNavigate();
    // ========== EDIT 1: Add this with your other state declarations ==========


 // Add dependencies if needed (e.g., initialData)
    const { selectedQuotation, loading: reduxLoading, error } = useSelector(state => state.customQuotation);
    // ========== EDIT 1: Add these in correct order ==========

// 1. First declare policyInputs
const [policyInputs, setPolicyInputs] = useState(normalizePolicyState(selectedQuotation));

// 2. Then declare globalSettings
const [globalSettings, setGlobalSettings] = useState({
    inclusionPolicy: "",
    exclusionPolicy: "",
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: ""
});

const [isLoadingGlobalSettings, setIsLoadingGlobalSettings] = useState(false);

// 3. Then declare fetchGlobalSettings (after both states exist)
const fetchGlobalSettings = async () => {
    try {
        setIsLoadingGlobalSettings(true);
        const res = await axios.get("/global-settings");
        const settings = normalizePolicyState(res.data);
        setGlobalSettings(settings);
        
        // Now policyInputs exists
        setPolicyInputs(prev => ({
            inclusionPolicy: prev.inclusionPolicy || settings.inclusionPolicy,
            exclusionPolicy: prev.exclusionPolicy || settings.exclusionPolicy,
            paymentPolicy: prev.paymentPolicy || settings.paymentPolicy,
            cancellationPolicy: prev.cancellationPolicy || settings.cancellationPolicy,
            termsAndConditions: prev.termsAndConditions || settings.termsAndConditions
        }));
    } catch (err) {
        console.error("Failed to fetch global settings:", err);
    } finally {
        setIsLoadingGlobalSettings(false);
    }
};

// 4. useEffect
useEffect(() => {
    fetchGlobalSettings();
}, []);
useEffect(() => {
    const fetchMailCompanies = async () => {
        try {
            const res = await axios.get("/company");
            const list = res?.data?.data || [];
            setMailCompanies(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Failed to fetch companies for email:", err);
            setMailCompanies([]);
        }
    };
    fetchMailCompanies();
}, []);
    // Dynamic quotation state from API
    const [quotation, setQuotation] = useState({
        date: "",
        reference: "",
        actions: ["Finalize", "Add Service", "Email Quotation", "Preview PDF", "Make Payment", "Add Flight", "Transaction"],
        bannerImage: "",
        customer: {
            name: "",
            location: "",
            phone: "",
            email: "",
        },
        pickup: {
            arrival: "",
            departure: "",
        },
        quotationTitle: "",
        destinationSummary: "",
        hotel: {
            guests: "",
            rooms: "",
            mealPlan: "",
            destination: "",
            itinerary: "",
        },
        finalizedVendorDetails: {
            vendorType: "",
            hotelVendorName: "",
            vehicleVendorName: "",
        },
        vehicles: [],
        pricing: { discount: "", gst: "", total: "" },
        policies: {
            inclusions: [],
            exclusions: "",
            paymentPolicy: "",
            cancellationPolicy: "",
            terms: "",
        },
        footer: {
            contact: "",
            phone: "",
            email: "",
            received: "",
            balance: "",
            company: "Iconic Yatra",
            address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
            website: "https://www.iconicyatra.com",
        },
        hotelPricingData: [],
        days: [],
    });

    const [invoiceData, setInvoiceData] = useState(null);

    const [editDialog, setEditDialog] = useState({
        open: false,
        field: "",
        value: "",
        title: "",
        nested: false,
        nestedKey: "",
    });
    const [openAddService, setOpenAddService] = useState(false);
    const [services, setServices] = useState([]);
    const [currentService, setCurrentService] = useState({
        included: "no",
        particulars: "",
        amount: "",
        taxType: "",
    });
    const [openEmailDialog, setOpenEmailDialog] = useState(false);
    const [emailTemplateType, setEmailTemplateType] = useState("normal");
    const [emailTemplateBodies, setEmailTemplateBodies] = useState({
        normal: { subject: "", message: "" },
        booking: { subject: "", message: "" },
    });
    const [mailCompanies, setMailCompanies] = useState([]);
    const [openBankDialog, setOpenBankDialog] = useState(false);
    const [flights, setFlights] = useState([]);
    const [openAddBankDialog, setOpenAddBankDialog] = useState(false);
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
    const [openCostingEdit, setOpenCostingEdit] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
    const [days, setDays] = useState([]);
    const [accountType, setAccountType] = useState("company");
    const [accountName, setAccountName] = useState("Iconic Yatra");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [bankName, setBankName] = useState("");
    const [branchName, setBranchName] = useState("");
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





    // Fetch quotation data from actual API
    useEffect(() => {
        const fetchQuotationData = async () => {
            try {
                if (id) {
                    // Dispatch the thunk to fetch quotation by ID
                    const result = await dispatch(getCustomQuotationById(id)).unwrap();

                    // Transform the API response to component format
                    const transformedData = transformApiData(result);
                    if (transformedData) {
                        setQuotation(transformedData);
                        setDays(transformedData.days);
                    }
                } else {
                    setSnackbar({
                        open: true,
                        message: "No quotation ID provided",
                        severity: "error"
                    });
                }
            } catch (error) {
                console.error("Error fetching quotation data:", error);
                setSnackbar({
                    open: true,
                    message: error || "Failed to load quotation data",
                    severity: "error"
                });
            }
        };

        fetchQuotationData();
    }, [dispatch, id]);

    const loadPaymentHistory = React.useCallback(async () => {
        if (!id) return;
        setPaymentHistoryLoading(true);
        try {
            const res = await axios.get(
                `/payment/by-quotation/${encodeURIComponent(id)}`
            );
            setPaymentHistory(res.data?.data || []);
        } catch (e) {
            console.error(e);
            setPaymentHistory([]);
        } finally {
            setPaymentHistoryLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadPaymentHistory();
    }, [loadPaymentHistory]);

    useEffect(() => {
        if (selectedQuotation?.finalizeStatus === "finalized") {
            setIsFinalized(true);
        }
    }, [selectedQuotation?.finalizeStatus]);

    useEffect(() => {
        if (!selectedQuotation) return;
        setServices(
            mapApiAdditionalServicesToState(
                selectedQuotation?.tourDetails?.quotationDetails
                    ?.additionalServices
            )
        );
    }, [selectedQuotation]);

    const billableServicesSum = React.useMemo(
        () => sumBillableAdditionalServices(services),
        [services]
    );

    const packageTotalForFooter = React.useMemo(() => {
        const calc =
            selectedQuotation?.tourDetails?.quotationDetails
                ?.packageCalculations;
        if (!calc) return null;
        const pkg = String(selectedQuotation?.finalizedPackage || "").toLowerCase();
        const key = ["standard", "deluxe", "superior"].includes(pkg)
            ? pkg
            : "standard";
        const t = calc[key]?.finalTotal;
        if (typeof t !== "number" || Number.isNaN(t)) return null;
        return t + billableServicesSum;
    }, [selectedQuotation, billableServicesSum]);

    const quotationForPdf = React.useMemo(() => {
        const persistedSum = sumBillableAdditionalServices(
            selectedQuotation?.tourDetails?.quotationDetails
                ?.additionalServices
        );
        const draftDelta = billableServicesSum - persistedSum;
        const base = { ...quotation };
        if (!draftDelta) return base;
        const hpd = [...(base.hotelPricingData || [])];
        const bumpCell = (cell) => {
            if (!cell || cell === "-") return cell;
            const n = Number(String(cell).replace(/[^0-9.-]/g, ""));
            if (!Number.isFinite(n)) return cell;
            return `₹ ${Math.round(n + draftDelta).toLocaleString("en-IN")}`;
        };
        const bumpRow = (row) => ({
            ...row,
            standard: bumpCell(row.standard),
            deluxe: bumpCell(row.deluxe),
            superior: bumpCell(row.superior),
        });
        const nextHpd = hpd.map((row) =>
            row.destination === "Quotation Cost" ||
            row.destination === "Total Quotation Cost"
                ? bumpRow(row)
                : row
        );
        const prevTotalStr = base.pricing?.total || "";
        const prevNum = Number(String(prevTotalStr).replace(/[^0-9.-]/g, ""));
        const nextTotal =
            Number.isFinite(prevNum) && prevTotalStr
                ? `₹ ${Math.round(prevNum + draftDelta).toLocaleString("en-IN")}`
                : base.pricing?.total;
        return {
            ...base,
            hotelPricingData: nextHpd,
            pricing: {
                ...base.pricing,
                total: nextTotal || base.pricing?.total,
            },
        };
    }, [quotation, billableServicesSum, selectedQuotation]);

    const finalizedVendors = React.useMemo(() => {
        const savedNames = [
            quotation?.finalizedVendorDetails?.hotelVendorName,
            quotation?.finalizedVendorDetails?.vehicleVendorName,
        ]
            .map((n) => String(n || "").trim())
            .filter(Boolean);
        const rows = paymentHistory || [];
        const paymentNames = rows
            .filter(
                (v) =>
                    v?.paymentType === "Payment Voucher" ||
                    v?.drCr === "Dr"
            )
            .map((v) => String(v?.partyName || "").trim())
            .filter(Boolean);
        return Array.from(new Set([...savedNames, ...paymentNames]));
    }, [paymentHistory, quotation?.finalizedVendorDetails]);

    useEffect(() => {
        const { receivedFromClient } = summarizeVoucherAmounts(paymentHistory);
        setQuotation((prev) => ({
            ...prev,
            footer: {
                ...prev.footer,
                received: `₹ ${receivedFromClient.toLocaleString("en-IN")}`,
                balance:
                    packageTotalForFooter != null
                        ? `₹ ${Math.max(0, packageTotalForFooter - receivedFromClient).toLocaleString("en-IN")}`
                        : prev.footer.balance,
            },
        }));
    }, [paymentHistory, packageTotalForFooter]);

    // Update the transformApiData function to handle the actual API response structure
    const transformApiData = (apiData) => {
        if (!apiData) return null;

        const { clientDetails, tourDetails, quotationId, createdAt, pickupDrop, finalizedPackage } = apiData;
        const { quotationDetails, arrivalCity, departureCity, arrivalDate, departureDate, itinerary, policies, vehicleDetails } = tourDetails;

        const pkgCalc = quotationDetails?.packageCalculations;
        const additionalServicesSum = sumBillableAdditionalServices(
            quotationDetails?.additionalServices
        );
        const readPackageFinalTotal = (key) => {
            if (!key || !pkgCalc) return null;
            const v = pkgCalc[key]?.finalTotal;
            return typeof v === "number" && !Number.isNaN(v) ? v : null;
        };
        const finalizedKey = (finalizedPackage || "").toLowerCase();
        const sumDestinationTotalCost =
            quotationDetails.destinations?.reduce(
                (sum, dest) => sum + (Number(dest.totalCost) || 0),
                0
            ) || 0;
        const pkgOrder = ["standard", "deluxe", "superior"];
        const tryKeys =
            finalizedKey && pkgOrder.includes(finalizedKey)
                ? [finalizedKey, ...pkgOrder.filter((k) => k !== finalizedKey)]
                : pkgOrder;
        let quotationCostNumber = null;
        for (const k of tryKeys) {
            const t = readPackageFinalTotal(k);
            if (t != null) {
                quotationCostNumber = t;
                break;
            }
        }
        if (quotationCostNumber == null) {
            quotationCostNumber = sumDestinationTotalCost;
        }
        quotationCostNumber =
            (Number(quotationCostNumber) || 0) + additionalServicesSum;

        // Calculate total guests
        const totalGuests = quotationDetails.adults + quotationDetails.children + quotationDetails.kids + quotationDetails.infants;

        // Format destinations (auto); optional tourDetails.destinationSummary overrides display
        const destinationString =
            quotationDetails.destinations
                ?.map((dest) => `${dest.nights}N ${dest.cityName}`)
                .join(", ") || "";
        const destinationDisplay =
            tourDetails.destinationSummary &&
            String(tourDetails.destinationSummary).trim()
                ? String(tourDetails.destinationSummary).trim()
                : destinationString;

        // Transform hotel pricing data
        const hotelPricingData = quotationDetails.destinations?.map(dest => ({
            destination: dest.cityName,
            nights: `${dest.nights} N`,
            standard: dest.standardHotels?.join(', ') || '-',
            deluxe: dest.deluxeHotels?.join(', ') || '-',
            superior: dest.superiorHotels?.join(', ') || '-',
        })) || [];

        // Add summary rows from packageCalculations (authoritative API totals).
        if (quotationDetails.destinations?.length > 0) {
            const totalNights = quotationDetails.destinations.reduce(
                (sum, dest) => sum + (Number(dest.nights) || 0),
                0
            );

            const standardFinal =
                Number(pkgCalc?.standard?.finalTotal || 0) +
                additionalServicesSum;
            const deluxeFinal =
                Number(pkgCalc?.deluxe?.finalTotal || 0) +
                additionalServicesSum;
            const superiorFinal =
                Number(pkgCalc?.superior?.finalTotal || 0) +
                additionalServicesSum;

            hotelPricingData.push(
                {
                    destination: "Quotation Cost",
                    nights: "-",
                    standard: standardFinal > 0 ? `₹ ${Math.round(standardFinal).toLocaleString("en-IN")}` : "-",
                    deluxe: deluxeFinal > 0 ? `₹ ${Math.round(deluxeFinal).toLocaleString("en-IN")}` : "-",
                    superior: superiorFinal > 0 ? `₹ ${Math.round(superiorFinal).toLocaleString("en-IN")}` : "-",
                },
                {
                    destination: "Total Quotation Cost",
                    nights: `${totalNights} N`,
                    standard: standardFinal > 0 ? `₹ ${Math.round(standardFinal).toLocaleString("en-IN")}` : "-",
                    deluxe: deluxeFinal > 0 ? `₹ ${Math.round(deluxeFinal).toLocaleString("en-IN")}` : "-",
                    superior: superiorFinal > 0 ? `₹ ${Math.round(superiorFinal).toLocaleString("en-IN")}` : "-",
                }
            );
        }

        // Transform itinerary days (use array index for edits; optional dayDate from API)
        const transformedDays = itinerary?.map((day, index) => ({
            id: index,
            dayDate: day.dayDate || "",
            date: day.dayDate || formatDate(arrivalDate),
            title: day.dayTitle || `Day ${index + 1}`,
            description: day.dayNote || "",
            image: day.image ? { preview: day.image, name: "Itinerary Image" } : null,
        })) || [];

        // Format pickup/drop details
        const arrivalText = `Arrival: ${arrivalCity} (${formatDate(arrivalDate)}) at Airport`;
        const departureText = `Departure: ${departureCity} (${formatDate(departureDate)}) from Airport`;

        // If vehicle details exist, use them with time
        let vehicleArrival = arrivalText;
        let vehicleDeparture = departureText;
        if (vehicleDetails && vehicleDetails.pickupDropDetails) {
            const pickupDetails = vehicleDetails.pickupDropDetails;
            const dropDetails = vehicleDetails.pickupDropDetails;

            // Format pickup date and time
            const pickupDateTime = `${formatDate(pickupDetails.pickupDate)} at ${formatTime(pickupDetails.pickupTime)}`;
            const dropDateTime = `${formatDate(dropDetails.dropDate)} at ${formatTime(dropDetails.dropTime)}`;

            vehicleArrival = `Arrival: ${pickupDetails.pickupLocation} (${pickupDateTime})`;
            vehicleDeparture = `Departure: ${dropDetails.dropLocation} (${dropDateTime})`;
        }

        if (tourDetails.pickupArrivalNote) {
            vehicleArrival = tourDetails.pickupArrivalNote;
        }
        if (tourDetails.pickupDepartureNote) {
            vehicleDeparture = tourDetails.pickupDepartureNote;
        }

        return {
            date: formatDate(createdAt),
            reference: quotationId,
            quotationTitle: tourDetails.quotationTitle || "",
            destinationSummary: tourDetails.destinationSummary || "",
            actions: ["Finalize", "Add Service", "Email Quotation", "Preview PDF", "Make Payment", "Add Flight", "Transaction"],
            bannerImage: tourDetails.bannerImage || "",
            customer: {
                name: clientDetails.clientName,
                location: clientDetails.sector,
                phone: "+91 7053900957", // You might want to get this from API if available
                email: "customer@example.com", // You might want to get this from API if available
            },
            pickup: {
                arrival: vehicleArrival,
                departure: vehicleDeparture,
            },
            hotel: {
                guests: `${totalGuests} Guests (${quotationDetails.adults} Adults, ${quotationDetails.children} Children ,${quotationDetails.kids} Kids , ${quotationDetails.infants} Infants)`,
                rooms: `${quotationDetails.rooms.numberOfRooms}  (${quotationDetails.rooms.sharingType})`,
                hotelType: `${quotationDetails.rooms.roomType}`,
                mealPlan: quotationDetails.mealPlan,
                destination: destinationDisplay,
                itinerary: tourDetails.initalNotes || "This is only tentative schedule for sightseeing and travel...",
            },
            finalizedVendorDetails: {
                vendorType: tourDetails?.vendorDetails?.vendorType || "",
                hotelVendorName: tourDetails?.vendorDetails?.hotelVendorName || "",
                vehicleVendorName: tourDetails?.vendorDetails?.vehicleVendorName || "",
            },
            vehicles: vehicleDetails ? [{
                pickup: {
                    date: formatDate(vehicleDetails.pickupDate),
                    time: formatDateTime(vehicleDetails.pickupTime).split(', ')[1]
                },
                drop: {
                    date: formatDate(vehicleDetails.dropDate),
                    time: formatDateTime(vehicleDetails.dropTime).split(', ')[1]
                },
            }] : [],
            pricing: {
                discount: `₹ ${quotationDetails.discount || 0}`,
                gst: `₹ ${quotationDetails.taxes?.applyGST ? 'Calculated' : 0}`,
                total: `₹ ${quotationCostNumber.toLocaleString("en-IN")}`,
            },
            policies: {
                inclusions: policies.inclusionPolicy || [],
                exclusions: policies.exclusionPolicy?.join('\n') || "No exclusions specified",
                paymentPolicy: policies.paymentPolicy?.join('\n') || "No payment policy specified",
                cancellationPolicy: policies.cancellationPolicy?.join('\n') || "No cancellation policy specified",
                terms: policies.termsAndConditions?.join('\n') || "No terms and conditions specified",
            },
            footer: {
                contact: company?.company?.contactPerson,
                phone: "+91 7053900957",
                email: "info@iconicyatra.com",
                received: "₹ 0",
                balance: "₹ 0",
                company: company?.company?.companyName,
                address: company?.company?.address,
                website: company?.company?.website,
                gst:company?.company?.gst,
            },
            hotelPricingData,
            days: transformedDays,
        };
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    // Add this near your other helper functions
    const formatTime = (timeString) => {
        if (!timeString) return "N/A";
        // If it's already in a readable format, return as is
        if (timeString.includes(':')) return timeString;
        // Otherwise try to parse it
        try {
            return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return timeString;
        }
    };

    const refreshQuotationFromApi = async (quotationRef = id) => {
        if (!quotationRef) return;
        const refreshed = await dispatch(getCustomQuotationById(quotationRef)).unwrap();
        const t = transformApiData(refreshed);
        if (t) {
            setQuotation(t);
            setDays(t.days);
        }
    };

    const persistItineraryToServer = async (nextDays) => {
        if (!id) {
            setSnackbar({
                open: true,
                message: "Cannot sync itinerary: no quotation id",
                severity: "error",
            });
            return;
        }
        setItinerarySaving(true);
        try {
            await saveCustomQuotationItinerary(
                dispatch,
                updateQuotationStep,
                id,
                nextDays
            );
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Itinerary saved to server",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message:
                    typeof e === "string"
                        ? e
                        : e?.message || "Failed to save itinerary",
                severity: "error",
            });
        } finally {
            setItinerarySaving(false);
        }
    };

    const handleStep5Or6Saved = async () => {
        try {
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Saved to server",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Saved; reload if the page looks stale",
                severity: "warning",
            });
        }
    };

    // Generate invoice data
    const generateInvoiceData = () => {
        return {
            company: {
                name: quotation.footer.company,
                address: quotation.footer.address,
                phone: quotation.footer.phone,
                email: quotation.footer.email,
                state: "9 - Uttar Pradesh",
                gstin: "09EYCPK8832C1ZC",
            },
            customer: {
                name: quotation.customer.name,
                mobile: quotation.customer.phone,
                email: quotation.customer.email,
                state: "28 - Andhra Pradesh (Old)",
                gstin: "28ABCDE1234F1Z2",
            },
            invoice: {
                number: `INV-${quotation.reference}`,
                date: new Date().toLocaleDateString("en-IN"),
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
                placeOfSupply: "9 - Uttar Pradesh",
            },
            items: [
                {
                    id: 1,
                    particulars: "Hotel Booking Services",
                    hsnSac: "998314",
                    price: 2500,
                    amount: 2500,
                },
                {
                    id: 2,
                    particulars: "Transportation Services",
                    hsnSac: "996411",
                    price: 840,
                    amount: 840,
                },
            ],
            summary: {
                subTotal: 3340,
                total: 3340,
                received: 1500,
                balance: 1840,
            },
            description: `Travel services for ${quotation.hotel.destination} - ${quotation.hotel.guests}`,
            terms: "Payment due within 15 days. Thanks for choosing our services.",
        };
    };

    // Dialog handlers
    const refreshEmailTemplates = async (companyId) => {
        const selectedCompany = mailCompanies.find((c) => c?._id === companyId);
        const res = await axios.post(
            `/customQT/${encodeURIComponent(id)}/email/preview`,
            {
                companyId: companyId || undefined,
                companyName: selectedCompany?.companyName || undefined,
            }
        );
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

    const handleEmailOpen = async () => {
        if (!id) {
            setSnackbar({
                open: true,
                message: "Missing quotation reference",
                severity: "error",
            });
            return;
        }
        setEmailTemplateType("normal");
        const defaultCompany = mailCompanies?.[0];
        try {
            await refreshEmailTemplates(defaultCompany?._id);
        } catch (e) {
            setSnackbar({
                open: true,
                message:
                    e?.response?.data?.message ||
                    "Failed to load email templates",
                severity: "warning",
            });
        }
        setOpenEmailDialog(true);
    };
    const handleEmailClose = () => setOpenEmailDialog(false);
    const handleEmailSend = async (values) => {
        const to = String(values?.to || "").trim();
        const cc = String(values?.cc || "").trim();
        const subject = String(values?.subject || "");
        const isBookingMail = values?.mailType === "booking";
        const nextPayableRaw = String(values?.nextPayableAmount || "").trim();
        const parsedNextPayable = Number(
            nextPayableRaw.replace(/[^0-9.-]/g, "")
        );
        const dueDateRaw = String(values?.paymentDueDate || "").trim();
        const nextPayableAmount =
            nextPayableRaw === "" || !Number.isFinite(parsedNextPayable)
                ? undefined
                : parsedNextPayable;
        const hasBookingOverrides =
            isBookingMail &&
            (dueDateRaw !== "" || Number.isFinite(nextPayableAmount));
        const selectedCompany =
            mailCompanies.find((c) => c?._id === values?.companyId) || null;
        if (!to) {
            setSnackbar({
                open: true,
                message: "Please enter receiver email",
                severity: "warning",
            });
            return;
        }
        try {
            await axios.post(
                `/customQT/${encodeURIComponent(id)}/email/send`,
                {
                    to,
                    cc: cc || undefined,
                    type: isBookingMail ? "booking" : "normal",
                    subject: subject || undefined,
                    // For booking mails, always let backend build from template with latest payment data/overrides.
                    bodyHtml:
                        isBookingMail
                            ? undefined
                            : values?.message || undefined,
                    senderAccount: values?.senderAccount || "gmail1",
                    companyId: values?.companyId || undefined,
                    companyName: selectedCompany?.companyName || undefined,
                    customText: isBookingMail
                        ? {
                            booking: {
                                ...(Number.isFinite(nextPayableAmount)
                                    ? { nextPayableAmount }
                                    : {}),
                                ...(dueDateRaw ? { dueDate: dueDateRaw } : {}),
                            },
                        }
                        : undefined,
                }
            );
            setSnackbar({
                open: true,
                message: "Email sent successfully",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message:
                    e?.response?.data?.message || "Failed to send email",
                severity: "error",
            });
        }
    };

    const emailInitialValues = React.useMemo(() => {
        const source = selectedQuotation || {};
        const type = emailTemplateType === "booking" ? "booking" : "normal";
        const tpl = emailTemplateBodies[type];
        return {
            to: "",
            cc: "",
            recipientName: source?.clientDetails?.clientName || quotation.customer?.name || "",
            salutation: "Dear",
            subject: tpl?.subject || "",
            greetLine: "Please find below details:",
            message: tpl?.message || "",
            signature: "Warm Regards,\nReservation Team\nIconic Travel",
            mailType: type,
            senderAccount: "gmail1",
            companyId: mailCompanies?.[0]?._id || "",
            nextPayableAmount: "",
            paymentDueDate: "",
        };
    }, [selectedQuotation, quotation.customer?.name, emailTemplateType, emailTemplateBodies, mailCompanies]);

    // Add loading state handling (keep after all hooks to avoid hook-order mismatch)
    if (reduxLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading quotation data...
                </Typography>
            </Box>
        );
    }

    const handlePaymentOpen = () => {
        if (!id) {
            setSnackbar({
                open: true,
                message: "Missing quotation reference",
                severity: "error",
            });
            return;
        }
        const clientName =
            quotation.customer?.name?.trim() ||
            selectedQuotation?.clientDetails?.clientName?.trim() ||
            "";
        try {
            sessionStorage.setItem(
                "paymentFormPartyPrefill",
                JSON.stringify({
                    quotationRef: id,
                    partyName: clientName,
                })
            );
        } catch {
            /* ignore quota / private mode */
        }
        const party = encodeURIComponent(clientName);
        navigate(
            `/payments-form?quotationRef=${encodeURIComponent(id)}&party=${party}`
        );
    };

    const handleFinalizeOpen = () => setOpenFinalize(true);
    const handleFinalizeClose = () => setOpenFinalize(false);

    const handleAddServiceOpen = () => setOpenAddService(true);
    const handleAddServiceClose = () => {
        setOpenAddService(false);
        setCurrentService({
            included: "no",
            particulars: "",
            amount: "",
            taxType: "",
        });
    };

    const handleAddFlightOpen = () => setOpenAddFlight(true);
    const handleAddFlightClose = () => setOpenAddFlight(false);

    const handleEditOpen = (
        field,
        value,
        title,
        nested = false,
        nestedKey = ""
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

        if (editDialog.field === "policies.inclusions") {
            try {
                const parsed = JSON.parse(editDialog.value);
                newValue = Array.isArray(parsed) ? parsed : [String(parsed)];
            } catch {
                newValue = linesToPolicyArray(editDialog.value);
            }
        } else if (editDialog.field.startsWith("policies.")) {
            newValue = linesToPolicyArray(editDialog.value);
        }

        if (editDialog.field === "quotationHeaderTitle") {
            const t = String(newValue).trim();
            if (!t) {
                const name =
                    selectedQuotation?.clientDetails?.clientName ||
                    quotation.customer?.name ||
                    "Guest";
                newValue = `Custom Quotation For ${name}`;
            } else {
                newValue = t;
            }
        }

        setQuotation((prev) => {
            if (editDialog.field === "quotationHeaderTitle") {
                return { ...prev, quotationTitle: newValue };
            }
            if (editDialog.field === "destinationLine") {
                return {
                    ...prev,
                    destinationSummary: newValue,
                    hotel: { ...prev.hotel, destination: newValue },
                };
            }
            if (editDialog.nested && editDialog.nestedKey) {
                return {
                    ...prev,
                    [editDialog.field]: {
                        ...prev[editDialog.field],
                        [editDialog.nestedKey]: newValue,
                    },
                };
            }
            return setQuotationValueByPath(prev, editDialog.field, newValue);
        });

        const mongoSet = buildMongoSetFromEditDialog(editDialog, newValue);
        if (mongoSet && id) {
            try {
                await dispatch(
                    updateCustomQuotation({
                        quotationId: id,
                        formData: mongoSet,
                    })
                ).unwrap();
                const refreshed = await dispatch(
                    getCustomQuotationById(id)
                ).unwrap();
                const t = transformApiData(refreshed);
                if (t) {
                    setQuotation(t);
                    setDays(t.days);
                }
                setSnackbar({
                    open: true,
                    message: "Saved to server",
                    severity: "success",
                });
            } catch (e) {
                setSnackbar({
                    open: true,
                    message:
                        typeof e === "string"
                            ? e
                            : e?.message || "Saved locally; server update failed",
                    severity: "warning",
                });
            }
        } else if (mongoSet && !id) {
            setSnackbar({
                open: true,
                message: "Cannot sync: no quotation id in URL",
                severity: "warning",
            });
        }

        handleEditClose();
    };

    const openGuestCountsDialog = () => {
        const qd = selectedQuotation?.tourDetails?.quotationDetails;
        setGuestCountsDialog({
            open: true,
            adults: Number(qd?.adults) || 0,
            children: Number(qd?.children) || 0,
            kids: Number(qd?.kids) || 0,
            infants: Number(qd?.infants) || 0,
        });
    };

    const handleSaveGuestCounts = async () => {
        const { adults, children, kids, infants } = guestCountsDialog;
        const a = Math.max(0, Number(adults) || 0);
        const c = Math.max(0, Number(children) || 0);
        const k = Math.max(0, Number(kids) || 0);
        const inf = Math.max(0, Number(infants) || 0);
        const mongoSet = {
            "tourDetails.quotationDetails.adults": a,
            "tourDetails.quotationDetails.children": c,
            "tourDetails.quotationDetails.kids": k,
            "tourDetails.quotationDetails.infants": inf,
        };
        if (!id) {
            setSnackbar({
                open: true,
                message: "Cannot sync: no quotation id",
                severity: "warning",
            });
            return;
        }
        try {
            await dispatch(
                updateCustomQuotation({ quotationId: id, formData: mongoSet })
            ).unwrap();
            await refreshQuotationFromApi();
            setGuestCountsDialog({
                open: false,
                adults: 0,
                children: 0,
                kids: 0,
                infants: 0,
            });
            setSnackbar({
                open: true,
                message: "Guest counts saved",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message:
                    typeof e === "string"
                        ? e
                        : e?.message || "Failed to save guest counts",
                severity: "error",
            });
        }
    };

    const handleBannerFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!id) {
            setSnackbar({
                open: true,
                message: "Cannot upload: no quotation id",
                severity: "error",
            });
            return;
        }
        const td = selectedQuotation?.tourDetails;
        if (!td) {
            setSnackbar({
                open: true,
                message: "Quotation data not loaded yet; try again.",
                severity: "warning",
            });
            return;
        }
        setBannerUploading(true);
        try {
            const stepDataObj = {
                arrivalCity: td.arrivalCity,
                departureCity: td.departureCity,
                arrivalDate: td.arrivalDate,
                departureDate: td.departureDate,
                quotationTitle: td.quotationTitle,
                notes: td.notes,
                transport: td.transport || "Yes",
                validFrom: td.validFrom,
                validTill: td.validTill,
            };
            const fd = new FormData();
            fd.append("stepData", JSON.stringify(stepDataObj));
            fd.append("bannerImage", file);
            await dispatch(
                updateQuotationStep({
                    quotationId: id,
                    stepNumber: 3,
                    stepData: fd,
                })
            ).unwrap();
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Banner image uploaded",
                severity: "success",
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message:
                    typeof err === "string"
                        ? err
                        : err?.message || "Banner upload failed",
                severity: "error",
            });
        } finally {
            setBannerUploading(false);
        }
    };

    const handleCostingSaved = async () => {
        if (!id) return;
        try {
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Costing updated",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Costing saved; reload the page if totals look stale",
                severity: "warning",
            });
        }
    };

    const handleEditValueChange = (e) => {
        setEditDialog({ ...editDialog, value: e.target.value });
    };

    const handleConfirm = async (values) => {
        const pkg = values?.quotation;
        if (!pkg || !id) {
            setSnackbar({
                open: true,
                message: "Select a package to finalize",
                severity: "error",
            });
            return;
        }
        try {
            await dispatch(
                finalizeCustomQuotation({
                    quotationId: id,
                    finalizedPackage: pkg,
                })
            ).unwrap();
            await dispatch(getCustomQuotationById(id)).unwrap();
            setIsFinalized(true);
            setOpenFinalize(false);
            setOpenBankDialog(true);
            setSnackbar({
                open: true,
                message: `Quotation finalized — ${pkg}`,
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message: e || "Could not finalize quotation",
                severity: "error",
            });
        }
    };

    const handleBankDialogClose = () => {
        setOpenBankDialog(false);
        setAccountType("company");
        setAccountName("Iconic Yatra");
        setAccountNumber("");
        setIfscCode("");
        setBankName("");
        setBranchName("");
    };

    const handleBankConfirm = async (vendorPayload = {}) => {
        console.log("Bank details:", {
            accountType,
            accountName,
            accountNumber,
            ifscCode,
            bankName,
            branchName,
        });
        if (id) {
            try {
                await dispatch(
                    updateCustomQuotation({
                        quotationId: id,
                        formData: {
                            "tourDetails.vendorDetails.vendorType":
                                vendorPayload.vendorType || "",
                            "tourDetails.vendorDetails.hotelVendorName":
                                vendorPayload.hotelVendorName || "",
                            "tourDetails.vendorDetails.vehicleVendorName":
                                vendorPayload.vehicleVendorName || "",
                        },
                    })
                ).unwrap();
                await refreshQuotationFromApi();
            } catch (e) {
                setSnackbar({
                    open: true,
                    message:
                        typeof e === "string"
                            ? e
                            : e?.message || "Vendor details save failed",
                    severity: "warning",
                });
            }
        }
        setInvoiceGenerated(true);
        handleBankDialogClose();
    };

    // Add New Bank Functions
    const handleAddBankOpen = () => {
        setOpenAddBankDialog(true);
    };

    const handleAddBankClose = () => {
        setOpenAddBankDialog(false);
        setNewBankDetails({
            bankName: "",
            branchName: "",
            accountHolderName: "",
            accountNumber: "",
            ifscCode: "",
            openingBalance: "",
        });
    };

    const handleNewBankChange = (field, value) => {
        setNewBankDetails((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddBank = () => {
        if (
            !newBankDetails.bankName ||
            !newBankDetails.accountHolderName ||
            !newBankDetails.accountNumber
        ) {
            alert("Please fill in all required fields");
            return;
        }

        const newAccount = {
            value: newBankDetails.bankName,
            label: `${newBankDetails.bankName} - ${newBankDetails.accountHolderName}`,
        };

        setAccountOptions((prev) => [...prev, newAccount]);
        setAccountName(newAccount.value);
        handleAddBankClose();
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
            (currentService.included === "yes" &&
                (!currentService.amount || !currentService.taxType))
        ) {
            alert("Please fill in all required fields (amount and tax when included)");
            return;
        }

        const selectedTax = taxOptions.find(
            (option) => option.value === currentService.taxType
        );
        const taxRate = selectedTax ? selectedTax.rate : 0;

        const amount =
            currentService.included === "yes" ? parseFloat(currentService.amount) : 0;
        const taxAmount = amount * (taxRate / 100) || 0;

        const newService = {
            ...currentService,
            id: Date.now(),
            amount: amount,
            taxRate,
            taxAmount,
            totalAmount: amount + taxAmount,
            taxLabel: selectedTax ? selectedTax.label : "Non",
        };

        setServices((prev) => [...prev, newService]);
        setCurrentService({
            included: "no",
            particulars: "",
            amount: "",
            taxType: "",
        });
    };

    const handleClearService = () => {
        setCurrentService({
            included: "no",
            particulars: "",
            amount: "",
            taxType: "",
        });
    };

    const handleRemoveService = (id) => {
        setServices((prev) => prev.filter((service) => service.id !== id));
    };

    const handleSaveServices = async () => {
        const quotationRef = id || selectedQuotation?.quotationId;
        if (!quotationRef) {
            setSnackbar({
                open: true,
                message: "Cannot save services: no quotation id",
                severity: "error",
            });
            return;
        }
        try {
            await dispatch(
                updateCustomQuotation({
                    quotationId: quotationRef,
                    formData: {
                        "tourDetails.quotationDetails.additionalServices":
                            serializeAdditionalServicesForApi(services),
                    },
                })
            ).unwrap();
            await refreshQuotationFromApi(quotationRef);
            setSnackbar({
                open: true,
                message: "Services saved",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message:
                    typeof e === "string"
                        ? e
                        : e?.message || "Failed to save services",
                severity: "error",
            });
        }
        handleAddServiceClose();
    };

    const handleAddFlight = (flightDetails) => {
        setFlights((prev) => [...prev, { ...flightDetails, id: Date.now() }]);
        console.log("Flight added:", flightDetails);
        handleAddFlightClose();
    };

    const handleDayImageUpload = async (dayIndex, file) => {
        if (file) {
            const next = days.map((day, i) =>
                i === dayIndex
                    ? {
                          ...day,
                          image: {
                              file,
                              preview: URL.createObjectURL(file),
                              name: file.name,
                          },
                      }
                    : day
            );
            setDays(next);
            await persistItineraryToServer(next);
            return;
        }
        const next = days.map((day, i) =>
            i === dayIndex ? { ...day, image: null } : day
        );
        setDays(next);
        await persistItineraryToServer(next);
    };

    const handleAddDay = () => {
        const newDayId = days.length + 1;
        setDays((prev) => [
            ...prev,
            {
                id: newDayId,
                date: new Date().toLocaleDateString('en-IN'),
                title: `About Day ${newDayId}`,
                image: null,
            },
        ]);
    };

    const handleRemoveDay = async (removeIndex) => {
        if (days.length <= 1) {
            alert("At least one day is required");
            return;
        }
        const next = days.filter((_, i) => i !== removeIndex);
        setDays(next);
        await persistItineraryToServer(next);
    };

    // PDF Dialog Handlers - FIXED VERSION
    const handlePreviewPdf = () => {
        console.log("Opening PDF dialog...");
        setOpenPdfDialog(true);
    };

    const handleClosePdfDialog = () => {
        console.log("Closing PDF dialog...");
        setOpenPdfDialog(false);
    };

    const handleViewInvoice = () => {
        setOpenInvoiceDialog(true);
    };

    // Generate Invoice Function
    const handleGenerateInvoice = () => {
        console.log("Generating invoice...");

        setSnackbar({
            open: true,
            message: "Generating invoice...",
            severity: "info"
        });

        const generatedInvoiceData = generateInvoiceData();
        setInvoiceData(generatedInvoiceData);

        setTimeout(() => {
            setInvoiceGenerated(true);
            setOpenInvoiceDialog(true);
            setSnackbar({
                open: true,
                message: "Invoice generated successfully!",
                severity: "success"
            });
        }, 1500);
    };

    const handleActionClick = (action) => {
        console.log("Action clicked:", action);
        switch (action) {
            case "Finalize":
                handleFinalizeOpen();
                break;
            case "Add Service":
                handleAddServiceOpen();
                break;
            case "Email Quotation":
                setEmailTemplateType("normal");
                handleEmailOpen();
                break;
            case "Preview PDF":
                handlePreviewPdf();
                break;
            case "Make Payment":
                handlePaymentOpen();
                break;
            case "Add Flight":
                handleAddFlightOpen();
                break;
            case "Transaction":
                loadPaymentHistory();
                setOpenTransactionDialog(true);
                break;
            default:
                console.log("Unknown action:", action);
        }
    };

    const resetItineraryDialog = () =>
        setItineraryDialog({
            open: false,
            mode: "add",
            day: null,
            title: "",
            description: "",
            dayDate: "",
            editIndex: null,
        });

    const handleAddItinerary = () => {
        const currentDays = days.length;
        setItineraryDialog({
            open: true,
            mode: "add",
            day: currentDays + 1,
            title: `Day ${currentDays + 1}`,
            description: "",
            dayDate: "",
            editIndex: null,
        });
    };

    const handleEditItinerary = (day, index) => {
        setItineraryDialog({
            open: true,
            mode: "edit",
            day: index + 1,
            title: day.title || `Day ${index + 1}`,
            description: day.description || "",
            dayDate: day.dayDate || day.date || "",
            editIndex: index,
        });
    };

    const handleSaveItinerary = async () => {
        const { mode, title, description, dayDate, editIndex } = itineraryDialog;

        if (!title.trim()) {
            setSnackbar({
                open: true,
                message: "Please enter a day title",
                severity: "error",
            });
            return;
        }

        const trimmedDate = (dayDate || "").trim();
        let nextDays;
        if (mode === "add") {
            nextDays = [
                ...days,
                {
                    id: days.length,
                    dayDate: trimmedDate,
                    date:
                        trimmedDate ||
                        new Date().toLocaleDateString("en-IN"),
                    title: title.trim(),
                    description: (description || "").trim(),
                    image: null,
                },
            ];
        } else if (mode === "edit" && editIndex != null) {
            nextDays = days.map((day, i) =>
                i === editIndex
                    ? {
                          ...day,
                          title: title.trim(),
                          description: (description || "").trim(),
                          dayDate: trimmedDate,
                          date:
                              trimmedDate ||
                              day.date ||
                              new Date().toLocaleDateString("en-IN"),
                      }
                    : day
            );
        } else {
            return;
        }

        setDays(nextDays);
        resetItineraryDialog();
        await persistItineraryToServer(nextDays);
    };

    const handleCloseItineraryDialog = () => {
        resetItineraryDialog();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleCloseInvoiceDialog = () => {
        setOpenInvoiceDialog(false);
    };

    // UI Data
    const infoMap = {
        call: `📞 ${quotation.footer.phone}`,
        email: `✉️ ${quotation.footer.email}`,
        payment: `Received from client: ${quotation.footer.received}\n Balance due: ${quotation.footer.balance}`,
        quotation: `Total Quotation Cost: ${
            packageTotalForFooter != null
                ? `₹ ${Math.round(packageTotalForFooter).toLocaleString("en-IN")}`
                : quotation.pricing.total
        }`,
        guest: `No. of Guests: ${quotation.hotel.guests}`,
    };

    const infoChips = [
        { k: "call", icon: <Phone /> },
        { k: "email", icon: <AlternateEmail /> },
        { k: "payment", icon: <CreditCard /> },
        { k: "quotation", icon: <Description /> },
        { k: "guest", icon: <Person /> },
    ];

    const Accordions = [
        { title: "Hotel Details" },
        { title: "Vehicle Details" },
        { title: "Company Margin" },
        { title: "Agent Margin" },
    ];

    const Policies = [
        {
            title: "Inclusion Policy",
            icon: <CheckCircle sx={{ mr: 0.5, color: "success.main" }} />,
            content: policyInputs.inclusionPolicy,
            field: "policies.inclusions",
            isArray: true,
        },
        {
            title: "Exclusion Policy",
            icon: <Cancel sx={{ mr: 0.5, color: "error.main" }} />,
            content: policyInputs.exclusionPolicy,
            field: "policies.exclusions",
        },
        {
            title: "Payment Policy",
            icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
            content: policyInputs.paymentPolicy,
            field: "policies.paymentPolicy",
        },
        {
            title: "Cancellation & Refund",
            icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
            content: policyInputs.cancellationPolicy,
            field: "policies.cancellationPolicy",
        },
    ];

    const pickupDetails = [
        {
            icon: (
                <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
            ),
            text: quotation.pickup.arrival,
            editable: true,
            field: "pickup",
            nestedKey: "arrival",
        },
        {
            icon: <Cancel sx={{ fontSize: 16, mr: 0.5, color: "error.main" }} />,
            text: quotation.pickup.departure,
            editable: true,
            field: "pickup",
            nestedKey: "departure",
        },
        {
            icon: <Group sx={{ fontSize: 16, mr: 0.5 }} />,
            text: `No of Guest: ${quotation.hotel.guests}`,
            editable: true,
            editGuestCounts: true,
        },
    ];


    return (
        <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
            {/* Action Buttons */}
            <Box
                display="flex"
                justifyContent="flex-end"
                gap={1}
                mb={2}
                flexWrap="wrap"
            >
                {quotation.actions
                    .filter(
                        (a) =>
                            !(a === "Finalize" && isFinalized) &&
                            !(a === "Transaction" && !isFinalized)
                    )
                    .map((a, i) => (
                        <Button key={i} variant="contained" onClick={() => handleActionClick(a)}>
                            {a}
                        </Button>
                    ))}
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Calculate />}
                    disabled={!selectedQuotation}
                    onClick={() => setOpenCostingEdit(true)}
                >
                    Edit costing
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Route />}
                    disabled={!selectedQuotation || !id}
                    onClick={() => setOpenVehicleFinalizeDialog(true)}
                >
                    Edit vehicle & pickup
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Business />}
                    disabled={!selectedQuotation || !id}
                    onClick={() => setOpenHotelsPricingDialog(true)}
                >
                    Edit hotels & pricing
                </Button>
                {isFinalized && !invoiceGenerated && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<Receipt />}
                        onClick={handleGenerateInvoice}
                    >
                        Generate Invoice
                    </Button>
                )}
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

            <Grid container spacing={2}>
                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{ position: "sticky", top: 0 }}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Person color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                        {quotation.customer.name}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <LocationOn
                                        sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {quotation.customer.location}
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
                                <Typography>
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
                                                        {selectedQuotation?.tourDetails?.vehicleDetails ? (
                                                            <>
                                                                <Typography variant="body2">
                                                                    <strong>Vehicle Type:</strong> {selectedQuotation.tourDetails.vehicleDetails.basicsDetails?.vehicleType || 'N/A'}
                                                                </Typography>

                                                                <Typography variant="body2">
                                                                    <strong>Per Day Cost:</strong> ₹{selectedQuotation.tourDetails.vehicleDetails.basicsDetails?.perDayCost || 'N/A'}
                                                                </Typography>

                                                                <Typography variant="body2">
                                                                    <strong>Trip Type:</strong> {selectedQuotation.tourDetails.vehicleDetails.basicsDetails?.tripType || 'N/A'}
                                                                </Typography>

                                                                <Typography variant="body2">
                                                                    <strong>Number of Days:</strong> {selectedQuotation.tourDetails.vehicleDetails.basicsDetails?.noOfDays || 'N/A'}
                                                                </Typography>

                                                                <Typography variant="body2" mt={1}>
                                                                    <strong>Total Cost:</strong> ₹{selectedQuotation.tourDetails.vehicleDetails.costDetails?.totalCost || 'N/A'}
                                                                </Typography>

                                                                <Divider sx={{ my: 1 }} />

                                                                <Typography variant="body2" fontWeight="bold" mt={1}>
                                                                    Pickup Details:
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Date:</strong> {formatDate(selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.pickupDate)}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Time:</strong> {selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.pickupTime || 'N/A'}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Location:</strong> {selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.pickupLocation || 'N/A'}
                                                                </Typography>

                                                                <Typography variant="body2" fontWeight="bold" mt={1}>
                                                                    Drop Details:
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Date:</strong> {formatDate(selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.dropDate)}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Time:</strong> {selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.dropTime || 'N/A'}
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    <strong>Location:</strong> {selectedQuotation.tourDetails.vehicleDetails.pickupDropDetails?.dropLocation || 'N/A'}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="textSecondary">
                                                                No vehicle details available
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : a.title === "Hotel Details" ? (
                                                    <Box>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Typography variant="body2" component="span">
                                                                <strong>Guests:</strong> {quotation.hotel.guests}
                                                            </Typography>
                                                            <IconButton size="small" onClick={openGuestCountsDialog}>
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                        <Typography variant="body2">
                                                            <strong>Rooms:</strong> {quotation.hotel.rooms}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Hotel Type:</strong> {quotation.hotel.hotelType}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <strong>Meal Plan:</strong> {quotation.hotel.mealPlan}
                                                        </Typography>
                                                        <Box display="flex" alignItems="flex-start" gap={0.5}>
                                                            <Typography variant="body2" component="span">
                                                                <strong>Destination:</strong> {quotation.hotel.destination}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleEditOpen(
                                                                        "destinationLine",
                                                                        quotation.hotel.destination,
                                                                        "Destination line"
                                                                    )
                                                                }
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ) : a.title === "Company Margin" ? (
                                                    <Box>
                                                        {selectedQuotation?.tourDetails?.quotationDetails?.companyMargin ? (
                                                            <>
                                                                <Typography variant="body2" gutterBottom>
                                                                    <strong>Margin Percentage:</strong> {selectedQuotation.tourDetails.quotationDetails.companyMargin.marginPercent}%
                                                                </Typography>

                                                                {/* Standard Package Margin */}
                                                                <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                        Standard Package Margin
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Base Cost:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.baseCost?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Margin Amount:</strong> ₹{
                                                                            (selectedQuotation.tourDetails.quotationDetails.companyMargin.marginAmount > 0
                                                                                ? selectedQuotation.tourDetails.quotationDetails.companyMargin.marginAmount
                                                                                : (selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.baseCost * selectedQuotation.tourDetails.quotationDetails.companyMargin.marginPercent) / 100
                                                                            ).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>After Margin:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.afterMargin?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>After Discount:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.afterDiscount?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Final Total:</strong> ₹{(
                                                                            (Number(selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.finalTotal) || 0) +
                                                                            billableServicesSum
                                                                        ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </Typography>
                                                                </Box>

                                                                {/* Deluxe Package Margin */}
                                                                <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                        Deluxe Package Margin
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Base Cost:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.baseCost?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Margin Amount:</strong> ₹{
                                                                            (selectedQuotation.tourDetails.quotationDetails.companyMargin.marginAmount > 0
                                                                                ? selectedQuotation.tourDetails.quotationDetails.companyMargin.marginAmount
                                                                                : (selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.baseCost * selectedQuotation.tourDetails.quotationDetails.companyMargin.marginPercent) / 100
                                                                            ).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>After Margin:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.afterMargin?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>After Discount:</strong> ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.afterDiscount?.toLocaleString() || '0'}
                                                                    </Typography>
                                                                    <Typography variant="body2">
                                                                        <strong>Final Total:</strong> ₹{(
                                                                            (Number(selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.finalTotal) || 0) +
                                                                            billableServicesSum
                                                                        ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </Typography>
                                                                </Box>

                                                                {/* GST Information */}
                                                                {selectedQuotation.tourDetails.quotationDetails.taxes.applyGST && (
                                                                    <Box sx={{ mt: 2, p: 1, backgroundColor: 'warning.light', borderRadius: 1 }}>
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            GST Information
                                                                        </Typography>
                                                                        <Typography variant="body2">
                                                                            <strong>GST Applied On:</strong> {selectedQuotation.tourDetails.quotationDetails.taxes.gstOn}
                                                                        </Typography>
                                                                        <Typography variant="body2">
                                                                            <strong>GST Percentage:</strong> {selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.gstPercentage || 0}%
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2">No margin details available</Typography>
                                                        )}
                                                    </Box>
                                                ) : a.title === "Agent Margin" ? (
                                                    <Box>
                                                        <Typography variant="body2">
                                                            Agent margin details would be displayed here if available in the API response.
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2">Details go here.</Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}

                                </Typography>

                            </CardContent>
                        </Card>
                    </Box>
                </Grid>

                {/* Main Content */}
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
                                        Date: {quotation.date}
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
                                    Ref: {quotation.reference}
                                </Typography>
                            </Box>

                            <Box display="flex" alignItems="center" mt={2}>
                                <Person sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Kind Attention: {quotation.customer.name}
                                </Typography>
                            </Box>

                            {/* Pickup/Drop Details */}
                            <Box
                                mt={2}
                                p={2}
                                sx={{ backgroundColor: "grey.50", borderRadius: 1 }}
                            >
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    mb={1}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        display="flex"
                                        alignItems="center"
                                        sx={{ fontSize: "0.875rem" }}
                                    >
                                        <RouteIcon sx={{ mr: 0.5 }} />
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
                                                    i.editGuestCounts
                                                        ? openGuestCountsDialog()
                                                        : handleEditOpen(
                                                              i.field,
                                                              i.text,
                                                              i.nestedKey || i.field,
                                                              !!i.nestedKey,
                                                              i.nestedKey
                                                          )
                                                }
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {/* Finalized Vendors */}
                            {isFinalized && (
                                <Box
                                    mt={2}
                                    p={2}
                                    sx={{
                                        backgroundColor: "grey.50",
                                        borderRadius: 1,
                                        borderLeft: "4px solid",
                                        borderColor: "success.main",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        color="success.main"
                                        sx={{ mb: 1 }}
                                    >
                                        Finalized Vendors
                                    </Typography>

                                    {finalizedVendors.length ? (
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            {finalizedVendors.map((name) => (
                                                <Chip
                                                    key={name}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    label={name}
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No vendor payment vouchers linked yet.
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Quotation Details */}
                            <Box mt={3}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={1}
                                >
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                                        <FormatQuoteIcon sx={{ mr: 1 }} />
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            color="warning.main"
                                        >
                                            {quotation.quotationTitle?.trim()
                                                ? quotation.quotationTitle
                                                : `Custom Quotation For ${quotation.customer.name}`}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        aria-label="Edit quotation title"
                                        onClick={() =>
                                            handleEditOpen(
                                                "quotationHeaderTitle",
                                                quotation.quotationTitle?.trim() ||
                                                    `Custom Quotation For ${quotation.customer.name}`,
                                                "Quotation title (shown in header)"
                                            )
                                        }
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box
                                    display="flex"
                                    alignItems="center"
                                    mt={1}
                                    justifyContent="space-between"
                                    gap={1}
                                >
                                    <Box display="flex" alignItems="center" flexWrap="wrap">
                                        <Route sx={{ mr: 0.5 }} />
                                        <Typography variant="subtitle2">
                                            Destination : {quotation.hotel.destination}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        aria-label="Edit destination line"
                                        onClick={() =>
                                            handleEditOpen(
                                                "destinationLine",
                                                quotation.hotel.destination,
                                                "Destination line (e.g. 1N City A, 2N City B)"
                                            )
                                        }
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box display="flex" flexDirection="column" gap={1} mt={1}>
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                                        <ImageIcon sx={{ mr: 0.5 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            Banner image
                                        </Typography>
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            size="small"
                                            startIcon={
                                                bannerUploading ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    <AddCircleOutline />
                                                )
                                            }
                                            disabled={bannerUploading || !id}
                                            sx={{ textTransform: "none" }}
                                        >
                                            {bannerUploading ? "Uploading…" : "Upload image"}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleBannerFileChange}
                                            />
                                        </Button>
                                    </Box>
                                    {typeof quotation.bannerImage === "string" &&
                                        /^https?:\/\//i.test(quotation.bannerImage) && (
                                            <Box display="flex" alignItems="flex-start" gap={2}>
                                                <Box
                                                    component="img"
                                                    src={quotation.bannerImage}
                                                    alt="Quotation banner"
                                                    sx={{
                                                        maxHeight: 140,
                                                        maxWidth: "100%",
                                                        objectFit: "contain",
                                                        borderRadius: 1,
                                                        border: "1px solid #e0e0e0",
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Saved on server. Choose a new file to replace it.
                                                </Typography>
                                            </Box>
                                        )}
                                </Box>

                                {/* Itinerary */}
                                <Box display="flex" flexDirection="column" mt={2}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Warning sx={{ mr: 1, color: "warning.main" }} />
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            color="warning.main"
                                        >
                                            Day Wise Itinerary
                                        </Typography>
                                    </Box>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                            {quotation.hotel.itinerary}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleEditOpen(
                                                    "hotel.itinerary",
                                                    quotation.hotel.itinerary,
                                                    "Itinerary Note"
                                                )
                                            }
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Itinerary Days Section */}
                                <Box mt={2}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="h6">Itinerary Details</Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={handleAddItinerary}
                                                    startIcon={<Add />}
                                                    disabled={itinerarySaving}
                                                >
                                                    Add Day
                                                </Button>
                                            </Box>

                                            {days.length > 0 ? (
                                                days.map((day, index) => (
                                                    <Box key={`itinerary-day-${index}`} mb={2} p={1} sx={{ border: '1px dashed #ddd', borderRadius: 1 }}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight="bold">
                                                                    {day.title}
                                                                </Typography>
                                                                {(day.dayDate || day.date) && (
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Date: {day.dayDate || day.date}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Box>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleEditItinerary(day, index)}
                                                                    disabled={itinerarySaving}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                {days.length > 1 && (
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleRemoveDay(index)}
                                                                        disabled={itinerarySaving}
                                                                    >
                                                                        <Delete />
                                                                    </IconButton>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            {day.description || "No description added."}
                                                        </Typography>

                                                        {/* Image Section */}
                                                        <Box display="flex" alignItems="center" gap={2} mt={2}>
                                                            <ImageIcon sx={{ color: "primary.main" }} />
                                                            <Typography variant="body1">Add Image</Typography>
                                                            <Button
                                                                component="label"
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<AddCircleOutline />}
                                                                disabled={itinerarySaving}
                                                            >
                                                                Upload Image
                                                                <input
                                                                    type="file"
                                                                    hidden
                                                                    accept="image/*"
                                                                    onChange={(e) =>
                                                                        handleDayImageUpload(index, e.target.files[0])
                                                                    }
                                                                />
                                                            </Button>
                                                        </Box>

                                                        {day.image && (
                                                            <Box mt={2} display="flex" alignItems="center" gap={2}>
                                                                <Box
                                                                    component="img"
                                                                    src={day.image.preview}
                                                                    alt={`Day ${index + 1}`}
                                                                    sx={{
                                                                        width: 100,
                                                                        height: 100,
                                                                        objectFit: "cover",
                                                                        borderRadius: 1,
                                                                        border: "1px solid #e0e0e0",
                                                                    }}
                                                                />
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {day.image.name || "Image"}
                                                                    </Typography>
                                                                    <Button
                                                                        size="small"
                                                                        color="error"
                                                                        disabled={itinerarySaving}
                                                                        onClick={() => handleDayImageUpload(index, null)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                                                    No itinerary added yet. Click "Add Day" to create your itinerary.
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>

                            {/* Quotation Details */}
                            <Box display="flex" flexDirection="column" mt={2}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <FormatQuote sx={{ mr: 1, color: "warning.main" }} />
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        color="warning.main"
                                    >
                                        Quotation Details
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        No of Guest : {quotation.hotel.guests}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        No of Rooms : {quotation.hotel.rooms}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        Hotel Type : {quotation.hotel.hotelType}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        Meal Plan : {quotation.hotel.mealPlan}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Hotel Pricing Table */}
                            <Box mt={3}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead sx={{ backgroundColor: "primary.light" }}>
                                            <TableRow>
                                                {[
                                                    "Destination",
                                                    "Nights",
                                                    "Standard",
                                                    "Deluxe",
                                                    "Superior",
                                                ].map((h) => (
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
                                            {quotation.hotelPricingData
                                                .filter((row, index) => index < quotation.hotelPricingData.length - 2) // Remove the last two summary rows
                                                .map((row, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{row.destination}</TableCell>
                                                        <TableCell>{row.nights}</TableCell>
                                                        <TableCell>{row.standard}</TableCell>
                                                        <TableCell>{row.deluxe}</TableCell>
                                                        <TableCell>{row.superior}</TableCell>
                                                    </TableRow>
                                                ))}

                                            {/* Show Total Nights */}
                                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Total Nights</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    {selectedQuotation?.tourDetails?.quotationDetails?.destinations?.reduce((total, dest) => total + dest.nights, 0) || 0} N
                                                </TableCell>
                                                <TableCell colSpan={3}></TableCell>
                                            </TableRow>

                                            {/* Add Total Cost After Discount Row */}
                                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                                    Total Cost After Discount
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    ₹{selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.standard?.afterDiscount?.toLocaleString() || '0'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    ₹{selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.deluxe?.afterDiscount?.toLocaleString() || '0'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    ₹{selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.superior?.afterDiscount?.toLocaleString() || '0'}
                                                </TableCell>
                                            </TableRow>

                                            {/* Add GST Row if applicable */}
                                            {selectedQuotation?.tourDetails?.quotationDetails?.taxes?.applyGST && (
                                                <TableRow sx={{ backgroundColor: 'warning.50' }}>
                                                    <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                                        GST ({selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.gstPercentage || 0}%)
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.standard?.gstAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.deluxe?.gstAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        ₹{selectedQuotation.tourDetails.quotationDetails.packageCalculations.superior?.gstAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Add Final Total Row */}
                                            <TableRow sx={{ backgroundColor: 'success.50', fontWeight: 'bold' }}>
                                                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                    Final Total (Incl. GST)
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'success.main' }}>
                                                    ₹{(
                                                        (Number(selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.standard?.finalTotal) || 0) +
                                                        billableServicesSum
                                                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'success.main' }}>
                                                    ₹{(
                                                        (Number(selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.deluxe?.finalTotal) || 0) +
                                                        billableServicesSum
                                                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'success.main' }}>
                                                    ₹{(
                                                        (Number(selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations?.superior?.finalTotal) || 0) +
                                                        billableServicesSum
                                                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {/* Policies */}
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
                                                                p.field === "policies.inclusions"
                                                                    ? JSON.stringify(quotation.policies.inclusions)
                                                                    : p.content,
                                                                p.title
                                                            )
                                                        }
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="body2">{p.content}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Terms & Conditions */}
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
                                                        quotation.policies.terms,
                                                        "Terms & Conditions"
                                                    )
                                                }
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2">
                                            {policyInputs.termsAndConditions}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Footer */}
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
                                        {quotation.footer.contact}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ color: "white" }}
                                        onClick={() =>
                                            handleEditOpen(
                                                "footer.contact",
                                                quotation.footer.contact,
                                                "Footer Contact",
                                                false
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
                                    {quotation.footer.company}
                                </Typography>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                    <Business sx={{ mr: 0.5, fontSize: 18 }} />
                                    {quotation.footer.address}
                                </Box>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                    <Language sx={{ mr: 0.5, fontSize: 18 }} />
                                    <a
                                        href={quotation.footer.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "white", textDecoration: "underline" }}
                                    >
                                        {quotation.footer.website}
                                    </a>
                                    <Typography variant="subtitle1" sx={{ ml: 2 }}>
                                        {quotation.footer.gst}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Dialogs */}
            <CostingEditDialog
                open={openCostingEdit}
                onClose={() => setOpenCostingEdit(false)}
                quotation={selectedQuotation}
                quotationId={id}
                onSaved={handleCostingSaved}
            />
            <FinalizeVehicleDialog
                open={openVehicleFinalizeDialog}
                onClose={() => setOpenVehicleFinalizeDialog(false)}
                quotation={selectedQuotation}
                quotationId={id}
                onSaved={handleStep5Or6Saved}
            />
            <FinalizeHotelsPricingDialog
                open={openHotelsPricingDialog}
                onClose={() => setOpenHotelsPricingDialog(false)}
                quotation={selectedQuotation}
                quotationId={id}
                onSaved={handleStep5Or6Saved}
            />
            <FinalizeDialog
                open={openFinalize}
                onClose={handleFinalizeClose}
                onConfirm={handleConfirm}
                additionalServicesSum={billableServicesSum}
            />
            <HotelVendorDialog
                open={openBankDialog}
                onClose={handleBankDialogClose}
                accountType={accountType}
                setAccountType={setAccountType}
                accountName={accountName}
                setAccountName={accountName}
                accountOptions={accountOptions}
                onAddBankOpen={handleAddBankOpen}
                onConfirm={handleBankConfirm}
            />
            <AddBankDialog
                open={openAddBankDialog}
                onClose={handleAddBankClose}
                newBankDetails={newBankDetails}
                onNewBankChange={handleNewBankChange}
                onAddBank={handleAddBank}
            />
            <EditDialog
                open={editDialog.open}
                onClose={handleEditClose}
                title={editDialog.title}
                value={editDialog.value}
                onValueChange={handleEditValueChange}
                onSave={handleEditSave}
            />
            <Dialog
                open={guestCountsDialog.open}
                onClose={() =>
                    setGuestCountsDialog((s) => ({ ...s, open: false }))
                }
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit guest counts</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Updates adults, children, kids, and infants on the quotation (same as Step 6).
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            { key: "adults", label: "Adults" },
                            { key: "children", label: "Children" },
                            { key: "kids", label: "Kids" },
                            { key: "infants", label: "Infants" },
                        ].map(({ key, label }) => (
                            <Grid size={{ xs: 6 }} key={key}>
                                <TextField
                                    label={label}
                                    type="number"
                                    fullWidth
                                    inputProps={{ min: 0 }}
                                    value={guestCountsDialog[key]}
                                    onChange={(e) =>
                                        setGuestCountsDialog((s) => ({
                                            ...s,
                                            [key]: e.target.value,
                                        }))
                                    }
                                />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() =>
                            setGuestCountsDialog((s) => ({ ...s, open: false }))
                        }
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSaveGuestCounts}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            <AddServiceDialog
                open={openAddService}
                onClose={handleAddServiceClose}
                currentService={currentService}
                onServiceChange={handleServiceChange}
                services={services}
                onAddService={handleAddService}
                onClearService={handleClearService}
                onRemoveService={handleRemoveService}
                onSaveServices={handleSaveServices}
                taxOptions={taxOptions}
            />
            <AddFlightDialog
                open={openAddFlight}
                onClose={handleAddFlightClose}
                onSave={handleAddFlight}
            />
            <EmailQuotationDialog
                open={openEmailDialog}
                onClose={handleEmailClose}
                customer={quotation.customer}
                onSend={handleEmailSend}
                onCompanyChange={async (companyId, mailType) => {
                    const templates = await refreshEmailTemplates(companyId);
                    const type = mailType === "booking" ? "booking" : "normal";
                    return templates?.[type] || { subject: "", message: "" };
                }}
                initialValuesOverride={emailInitialValues}
                templateBodies={emailTemplateBodies}
                companyOptions={mailCompanies}
            />
            <TransactionSummaryDialog
                open={openTransactionDialog}
                onClose={() => setOpenTransactionDialog(false)}
                loading={paymentHistoryLoading}
                rows={paymentHistory}
                quotationRef={id}
            />

            {/* Invoice PDF Dialog */}
            <InvoicePdfDialog
                open={openInvoiceDialog}
                onClose={handleCloseInvoiceDialog}
                quotation={quotation}
                invoiceData={invoiceData}
            />

            {/* Preview PDF Dialog - Using imported component */}
            {QuotationPDFDialog && (
                <QuotationPDFDialog
                    open={openPdfDialog}
                    onClose={handleClosePdfDialog}
                    quotation={quotationForPdf}
                />
            )}

            {/* Itinerary Dialog */}
            <Dialog open={itineraryDialog.open} onClose={handleCloseItineraryDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {itineraryDialog.mode === 'add' ? 'Add' : 'Edit'} Itinerary - Day {itineraryDialog.day}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        variant="outlined"
                        value={itineraryDialog.title}
                        onChange={(e) => setItineraryDialog({ ...itineraryDialog, title: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Date (optional)"
                        placeholder="e.g. 15 Apr 2026"
                        fullWidth
                        variant="outlined"
                        value={itineraryDialog.dayDate}
                        onChange={(e) => setItineraryDialog({ ...itineraryDialog, dayDate: e.target.value })}
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
                        onChange={(e) => setItineraryDialog({ ...itineraryDialog, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseItineraryDialog} disabled={itinerarySaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveItinerary}
                        variant="contained"
                        disabled={itinerarySaving}
                    >
                        {itinerarySaving ? "Saving…" : itineraryDialog.mode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CustomFinalize;