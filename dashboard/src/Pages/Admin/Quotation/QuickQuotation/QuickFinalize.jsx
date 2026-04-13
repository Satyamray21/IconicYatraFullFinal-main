import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
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
import FinalizeDialog from "../CustomQuotation/Dialog/FinalizeDialog";
import CostingEditDialog from "../CustomQuotation/Dialog/CostingEditDialog";
import FinalizeVehicleDialog from "../CustomQuotation/Dialog/FinalizeVehicleDialog";
import FinalizeHotelsPricingDialog from "../CustomQuotation/Dialog/FinalizeHotelsPricingDialog";
import HotelVendorDialog from "../CustomQuotation/Dialog/HotelVendor";
import {
    quickToHotelsFormData,
    quickToCostingQuotation,
    finalizeHotelsFormDataToQuickUpdate,
    vehicleStepPayloadToQuickUpdate,
    costingBodyToQuickUpdate,
} from "../../../../utils/quickQuotationFinalizeAdapters";
import {
    fetchQuickQuotationById,
    updateQuickQuotation,
    finalizeQuickQuotation,
} from "../../../../features/quotation/quickQuotationSlice";
import axios from "../../../../utils/axios";
import AddBankDialog from "../VehicleQuotation/Dialog/AddBankDialog";
import EditDialog from "../VehicleQuotation/Dialog/EditDialog";
import AddServiceDialog from "../VehicleQuotation/Dialog/AddServiceDialog";
import AddFlightDialog from "../HotelQuotation/Dialog/FlightDialog";
import InvoicePDF from "./Dialog/PDF/Invoice";
import QuotationPDFDialog from "./Dialog/PDF/PreviewPdf";

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

function buildQuickMongoSetFromEditDialog(editDialog, newValue) {
    if (editDialog.field === "pickup" && editDialog.nestedKey === "arrival") {
        return { pickupPoint: String(newValue) };
    }
    if (editDialog.field === "pickup" && editDialog.nestedKey === "departure") {
        return { dropPoint: String(newValue) };
    }
    switch (editDialog.field) {
        case "policies.inclusions":
            return { "policy.inclusionPolicy": linesToPolicyArray(newValue) };
        case "policies.exclusions":
            return { "policy.exclusionPolicy": linesToPolicyArray(newValue) };
        case "policies.paymentPolicy":
            return { "policy.paymentPolicy": linesToPolicyArray(newValue) };
        case "policies.cancellationPolicy":
            return { "policy.cancellationPolicy": linesToPolicyArray(newValue) };
        case "policies.terms":
            return { "policy.termsAndConditions": linesToPolicyArray(newValue) };
        case "hotel.itinerary":
            return { message: String(newValue) };
        case "customer.name":
            return { customerName: String(newValue) };
        case "customer.email":
            return { email: String(newValue) };
        case "customer.location":
            return { packageSnapshot: { clientLocation: String(newValue) } };
        case "footer.contact":
            return {
                packageSnapshot: {
                    quotationDetails: {
                        signatureDetails: { signedBy: String(newValue) },
                    },
                },
            };
        case "quotationHeaderTitle":
            return { packageSnapshot: { displayTitle: String(newValue) } };
        case "destinationLine":
            return { packageSnapshot: { displayDestination: String(newValue) } };
        default:
            return null;
    }
}

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

const QUICK_PACKAGE_LABEL = "Quick Package";

const normalizePolicyForEditor = (value) => {
    if (Array.isArray(value)) {
        if (value.length === 0) return "";
        return value.join("\n").trim().replace(/<[^>]*>/g, "");
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed.replace(/<[^>]*>/g, "") : "";
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
        cancellationPolicy: normalizePolicyForEditor(
            policySource?.cancellationPolicy
        ),
        termsAndConditions: normalizePolicyForEditor(
            policySource?.termsAndConditions
        ),
    };
};

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

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN");
};

function transformQuickApiToDisplay(apiData, company) {
    if (!apiData) return null;
    const pkg = apiData.packageSnapshot || apiData.packageId || {};
    const policy = apiData.policy || {};
    const adults = Number(apiData.adults) || 0;
    const children = Number(apiData.children) || 0;
    const kids = Number(apiData.kids) || 0;
    const infants = Number(apiData.infants) || 0;
    const totalGuests = adults + children + kids + infants;
    const totalCost = Number(apiData.totalCost) || 0;
    const destLine =
        pkg.displayDestination ||
        pkg.sector ||
        pkg.destinationCountry ||
        (Array.isArray(pkg.stayLocations)
            ? pkg.stayLocations.map((l) => `${l.nights || 0}N ${l.city || ""}`).join(", ")
            : "") ||
        "—";

    const pickHotel = (nightBlock, cat) => {
        const c = String(cat).toLowerCase();
        const h = (nightBlock?.hotels || []).find(
            (x) =>
                String(x.category).toLowerCase() === c &&
                x.hotelName &&
                !/^TBD$/i.test(String(x.hotelName).trim())
        );
        return h?.hotelName || "—";
    };

    let hotelPricingData = [];
    if (Array.isArray(pkg.destinationNights) && pkg.destinationNights.length) {
        hotelPricingData = pkg.destinationNights.map((d) => ({
            destination: d.destination || "—",
            nights: `${d.nights || 0} N`,
            standard: pickHotel(d, "standard"),
            deluxe: pickHotel(d, "deluxe"),
            superior: pickHotel(d, "superior"),
        }));
    } else if (Array.isArray(pkg.stayLocations) && pkg.stayLocations.length) {
        hotelPricingData = pkg.stayLocations.map((l) => ({
            destination: l.city || "—",
            nights: `${l.nights || 0} N`,
            standard: "—",
            deluxe: "—",
            superior: "—",
        }));
    }
    if (totalCost > 0) {
        hotelPricingData.push({
            destination: "Total package cost",
            nights: "-",
            standard: `₹ ${Math.round(totalCost).toLocaleString("en-IN")}`,
            deluxe: "—",
            superior: "—",
        });
    }

    const itineraryDays = Array.isArray(pkg.days)
        ? pkg.days.map((day, index) => ({
            id: index + 1,
            date: formatDate(apiData.createdAt),
            title: day.title || `Day ${index + 1}`,
            description: day.notes || day.aboutCity || "",
            image: day.dayImage
                ? {
                      preview: day.dayImage,
                      url: day.dayImage,
                      name: "Itinerary",
                  }
                : null,
        }))
        : [];

    return {
        date: formatDate(apiData.createdAt),
        reference: String(apiData._id || ""),
        actions: [
            "Finalize",
            "Add Service",
            "Email Quotation",
            "Preview PDF",
            "Make Payment",
            "Add Flight",
            "Transaction",
        ],
        bannerImage: pkg.bannerImage || "",
        customer: {
            name: apiData.customerName || "",
            location: pkg.clientLocation || "",
            phone: apiData.phone || "",
            email: apiData.email || "",
        },
        pickup: {
            arrival: apiData.pickupPoint
                ? `Pickup: ${apiData.pickupPoint}`
                : "Pickup: —",
            departure: apiData.dropPoint
                ? `Drop: ${apiData.dropPoint}`
                : "Drop: —",
        },
        quotationTitle: pkg.displayTitle || pkg.title || "",
        destinationSummary: destLine,
        hotel: {
            guests: `${totalGuests} (${adults} Adults, ${children} Children${kids ? `, ${kids} Kids` : ""}${infants ? `, ${infants} Infants` : ""})`,
            rooms: (() => {
                const r = pkg.quotationDetails?.rooms;
                if (!r) return "—";
                const n = r.numberOfRooms ?? "—";
                const sh = r.sharingType || "";
                return `${n}${sh ? ` · ${sh}` : ""}`;
            })(),
            mealPlan: pkg.quotationDetails?.mealPlan || pkg.mealPlan?.planType || "—",
            destination: destLine,
            itinerary:
                apiData.message ||
                "This is only a tentative schedule for sightseeing and travel...",
        },
        finalizedVendorDetails: {
            vendorType: apiData.vendorDetails?.vendorType || "",
            hotelVendorName: apiData.vendorDetails?.hotelVendorName || "",
            vehicleVendorName: apiData.vendorDetails?.vehicleVendorName || "",
        },
        vehicles: [],
        pricing: {
            discount: "—",
            gst: "—",
            total:
                totalCost > 0
                    ? `₹ ${Math.round(totalCost).toLocaleString("en-IN")}`
                    : "—",
        },
        policies: {
            inclusions: policy.inclusionPolicy || [],
            exclusions:
                (policy.exclusionPolicy || []).join("\n") ||
                "No exclusions specified",
            paymentPolicy:
                (policy.paymentPolicy || []).join("\n") ||
                "No payment policy specified",
            cancellationPolicy:
                (policy.cancellationPolicy || []).join("\n") ||
                "No cancellation policy specified",
            terms:
                (policy.termsAndConditions || []).join("\n") ||
                "No terms and conditions specified",
        },
        footer: {
            contact:
                pkg.quotationDetails?.signatureDetails?.signedBy ||
                company?.company?.contactPerson ||
                "",
            phone: company?.company?.phone || apiData.phone || "",
            email: company?.company?.email || apiData.email || "",
            received: "₹ 0",
            balance: "₹ 0",
            company: company?.company?.companyName || "Iconic Yatra",
            address: company?.company?.address || "",
            website: company?.company?.website || "",
            gst: company?.company?.gst || "",
        },
        hotelPricingData,
        days: itineraryDays,
    };
}

const QuickFinalize = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const { data: company } = useSelector((state) => state.companyUI);
    const { currentQuotation, loading: reduxLoading } = useSelector(
        (state) => state.quickQuotation
    );

    /** Canonical Mongo id for APIs (payments, PATCH). URL may still be QT-xxxxxx until backend resolves. */
    const apiEntityId = useMemo(() => {
        if (currentQuotation?._id) return String(currentQuotation._id);
        if (id && /^[a-f\d]{24}$/i.test(String(id))) return String(id);
        return id;
    }, [currentQuotation?._id, id]);

    const costingQuotation = useMemo(
        () =>
            currentQuotation ? quickToCostingQuotation(currentQuotation) : null,
        [currentQuotation]
    );

    const hotelsDialogQuotation = useMemo(
        () =>
            currentQuotation ? quickToHotelsFormData(currentQuotation) : null,
        [currentQuotation]
    );

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
    const [itineraryDialog, setItineraryDialog] = useState({
        open: false,
        mode: 'add',
        day: null,
        title: "",
        description: "",
        id: null
    });

    const [quotation, setQuotation] = useState({
        date: "",
        reference: "",
        actions: [
            "Finalize",
            "Add Service",
            "Email Quotation",
            "Preview PDF",
            "Make Payment",
            "Add Flight",
            "Transaction",
        ],
        bannerImage: "",
        quotationTitle: "",
        destinationSummary: "",
        customer: { name: "", location: "", phone: "", email: "" },
        pickup: { arrival: "", departure: "" },
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
            received: "₹ 0",
            balance: "₹ 0",
            company: "Iconic Yatra",
            address: "",
            website: "",
            gst: "",
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
    const [policyInputs, setPolicyInputs] = useState({
        inclusionPolicy: "",
        exclusionPolicy: "",
        paymentPolicy: "",
        cancellationPolicy: "",
        termsAndConditions: "",
    });
    const [openBankDialog, setOpenBankDialog] = useState(false);
    const [flights, setFlights] = useState([]);
    const [openAddBankDialog, setOpenAddBankDialog] = useState(false);
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
    const [openCostingEdit, setOpenCostingEdit] = useState(false);
    const [openVehicleFinalizeDialog, setOpenVehicleFinalizeDialog] =
        useState(false);
    const [openHotelsPricingDialog, setOpenHotelsPricingDialog] =
        useState(false);
    const [guestCountsDialog, setGuestCountsDialog] = useState({
        open: false,
        adults: 0,
        children: 0,
        kids: 0,
        infants: 0,
    });
    const [bannerUploading, setBannerUploading] = useState(false);
    const [itinerarySaving, setItinerarySaving] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
    const [days, setDays] = useState([
        { id: 1, date: "11/09/2025", title: "About Day 1", image: null },
    ]);
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

    const loadPaymentHistory = useCallback(async () => {
        if (!apiEntityId) return;
        setPaymentHistoryLoading(true);
        try {
            const res = await axios.get(
                `/payment/by-quotation/${encodeURIComponent(apiEntityId)}`
            );
            setPaymentHistory(res.data?.data || []);
        } catch (e) {
            console.error(e);
            setPaymentHistory([]);
        } finally {
            setPaymentHistoryLoading(false);
        }
    }, [apiEntityId]);

    const refreshQuotationFromApi = async () => {
        if (!id) return;
        const refreshed = await dispatch(fetchQuickQuotationById(id)).unwrap();
        const t = transformQuickApiToDisplay(refreshed, company);
        if (t) {
            setQuotation(t);
            setDays(t.days?.length ? t.days : []);
            setPolicyInputs(normalizePolicyState(refreshed));
        }
    };

    const persistItineraryForDays = async (nextDays) => {
        if (!apiEntityId || !Array.isArray(nextDays)) return;
        const pkgDays = nextDays.map((d) => ({
            title: d.title || "",
            notes: d.description || d.notes || "",
            aboutCity: "",
            dayImage:
                typeof d.image?.url === "string" && d.image.url
                    ? d.image.url
                    : typeof d.image === "string"
                      ? d.image
                      : "",
        }));
        setItinerarySaving(true);
        try {
            await dispatch(
                updateQuickQuotation({
                    id: apiEntityId,
                    formData: { packageSnapshot: { days: pkgDays } },
                })
            ).unwrap();
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Itinerary saved",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message: String(e?.message || e || "Failed to save itinerary"),
                severity: "error",
            });
        } finally {
            setItinerarySaving(false);
        }
    };

    const openGuestCountsDialog = () => {
        const q = currentQuotation;
        if (!q) return;
        const qd = q.packageSnapshot?.quotationDetails;
        setGuestCountsDialog({
            open: true,
            adults: Number(q.adults) || 0,
            children: Number(q.children) || 0,
            kids: Number(q.kids) || Number(qd?.kids) || 0,
            infants: Number(q.infants) || Number(qd?.infants) || 0,
        });
    };

    const handleSaveGuestCounts = async () => {
        const { adults, children, kids, infants } = guestCountsDialog;
        const a = Math.max(0, Number(adults) || 0);
        const c = Math.max(0, Number(children) || 0);
        const k = Math.max(0, Number(kids) || 0);
        const inf = Math.max(0, Number(infants) || 0);
        if (!apiEntityId) {
            setSnackbar({
                open: true,
                message: "Missing quotation id",
                severity: "error",
            });
            return;
        }
        setGuestCountsDialog((s) => ({ ...s, open: false }));
        try {
            await dispatch(
                updateQuickQuotation({
                    id: apiEntityId,
                    formData: {
                        adults: a,
                        children: c,
                        kids: k,
                        infants: inf,
                        packageSnapshot: {
                            quotationDetails: { kids: k, infants: inf },
                        },
                    },
                })
            ).unwrap();
            await refreshQuotationFromApi();
            setSnackbar({
                open: true,
                message: "Guest counts saved",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message: String(e?.message || e || "Save failed"),
                severity: "error",
            });
        }
    };

    const handleBannerFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!apiEntityId) {
            setSnackbar({
                open: true,
                message: "Cannot upload: no quotation id",
                severity: "error",
            });
            return;
        }
        setBannerUploading(true);
        try {
            const fd = new FormData();
            fd.append("bannerImage", file);
            await axios.post(
                `/quickQT/${encodeURIComponent(apiEntityId)}/banner`,
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
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
                    err?.response?.data?.message ||
                    err?.message ||
                    "Banner upload failed",
                severity: "error",
            });
        } finally {
            setBannerUploading(false);
        }
    };

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await axios.get("/company");
                const list = res?.data?.data || [];
                setMailCompanies(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error(err);
                setMailCompanies([]);
            }
        };
        loadCompanies();
    }, []);

    useEffect(() => {
        const loadGlobal = async () => {
            try {
                const res = await axios.get("/global-settings");
                const settings = normalizePolicyState(res.data);
                setPolicyInputs((prev) => ({
                    inclusionPolicy:
                        prev.inclusionPolicy || settings.inclusionPolicy,
                    exclusionPolicy:
                        prev.exclusionPolicy || settings.exclusionPolicy,
                    paymentPolicy:
                        prev.paymentPolicy || settings.paymentPolicy,
                    cancellationPolicy:
                        prev.cancellationPolicy || settings.cancellationPolicy,
                    termsAndConditions:
                        prev.termsAndConditions || settings.termsAndConditions,
                }));
            } catch (err) {
                console.error(err);
            }
        };
        loadGlobal();
    }, []);

    useEffect(() => {
        if (!id) {
            setSnackbar({
                open: true,
                message: "No quotation ID in URL",
                severity: "error",
            });
            return;
        }
        dispatch(fetchQuickQuotationById(id))
            .unwrap()
            .catch((err) => {
                setSnackbar({
                    open: true,
                    message: err || "Failed to load quotation",
                    severity: "error",
                });
            });
    }, [dispatch, id]);

    useEffect(() => {
        if (!currentQuotation) return;
        const t = transformQuickApiToDisplay(currentQuotation, company);
        if (t) {
            setQuotation(t);
            setDays(t.days?.length ? t.days : []);
            setPolicyInputs(normalizePolicyState(currentQuotation));
        }
        setIsFinalized(currentQuotation.finalizeStatus === "finalized");
    }, [currentQuotation, company]);

    useEffect(() => {
        loadPaymentHistory();
    }, [loadPaymentHistory]);

    const packageTotalForFooter = useMemo(() => {
        const n = Number(currentQuotation?.totalCost);
        return Number.isFinite(n) ? n : null;
    }, [currentQuotation]);

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

    const finalizePackageOptions = useMemo(() => {
        const pkg = currentQuotation?.packageSnapshot || currentQuotation?.packageId || {};
        const title = pkg.packageName || pkg.title || "Package";
        const total = Number(currentQuotation?.totalCost) || 0;
        return [
            {
                label: QUICK_PACKAGE_LABEL,
                hotel: String(title),
                cost:
                    total > 0
                        ? `₹ ${Math.round(total).toLocaleString("en-IN")}`
                        : "—",
            },
        ];
    }, [currentQuotation]);

    const generateInvoiceData = () => {
        const total = Number(currentQuotation?.totalCost) || 0;
        const { receivedFromClient } = summarizeVoucherAmounts(paymentHistory);
        const balance = Math.max(0, total - receivedFromClient);
        return {
            company: {
                name: quotation.footer.company,
                address: quotation.footer.address,
                phone: quotation.footer.phone,
                email: quotation.footer.email,
                state: "9 - Uttar Pradesh",
                gstin: quotation.footer.gst || "09EYCPK8832C1ZC",
            },
            customer: {
                name: quotation.customer.name,
                mobile: quotation.customer.phone,
                email: quotation.customer.email,
                state: "",
                gstin: "",
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
                    particulars: `Package — ${quotation.hotel.destination}`,
                    hsnSac: "998314",
                    price: total,
                    amount: total,
                },
            ],
            summary: {
                subTotal: total,
                total,
                received: receivedFromClient,
                balance,
            },
            description: `Travel services for ${quotation.hotel.destination} - ${quotation.hotel.guests}`,
            terms: "Payment due within 15 days. Thanks for choosing our services.",
        };
    };

    const emailInitialValues = useMemo(() => {
        const type = emailTemplateType === "booking" ? "booking" : "normal";
        const tpl = emailTemplateBodies[type];
        return {
            to: currentQuotation?.email || quotation.customer?.email || "",
            cc: "",
            recipientName:
                currentQuotation?.customerName || quotation.customer?.name || "",
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
    }, [
        currentQuotation,
        quotation.customer?.name,
        quotation.customer?.email,
        emailTemplateType,
        emailTemplateBodies,
        mailCompanies,
    ]);

    if (reduxLoading && !currentQuotation) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading quotation data...
                </Typography>
            </Box>
        );
    }

    const refreshEmailTemplates = async (companyId) => {
        const selectedCompany = mailCompanies.find((c) => c?._id === companyId);
        const res = await axios.post(
            `/quickQT/${encodeURIComponent(apiEntityId)}/email/preview`,
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
        if (!apiEntityId) {
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
            await axios.post(`/quickQT/${encodeURIComponent(apiEntityId)}/email/send`, {
                to,
                cc: cc || undefined,
                type: isBookingMail ? "booking" : "normal",
                subject: subject || undefined,
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
                    : hasBookingOverrides
                        ? {
                            booking: {
                                ...(Number.isFinite(nextPayableAmount)
                                    ? { nextPayableAmount }
                                    : {}),
                                ...(dueDateRaw ? { dueDate: dueDateRaw } : {}),
                            },
                        }
                        : undefined,
            });
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

    const handlePaymentOpen = () => {
        if (!apiEntityId) {
            setSnackbar({
                open: true,
                message: "Missing quotation reference",
                severity: "error",
            });
            return;
        }
        const clientName =
            quotation.customer?.name?.trim() ||
            currentQuotation?.customerName?.trim() ||
            "";
        try {
            sessionStorage.setItem(
                "paymentFormPartyPrefill",
                JSON.stringify({
                    quotationRef: apiEntityId,
                    partyName: clientName,
                })
            );
        } catch {
            /* ignore */
        }
        const party = encodeURIComponent(clientName);
        navigate(
            `/payments-form?quotationRef=${encodeURIComponent(apiEntityId)}&party=${party}`
        );
    };

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
            const name =
                currentQuotation?.customerName ||
                quotation.customer?.name ||
                "Guest";
            newValue = t || `Quick Quotation For ${name}`;
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
            if (editDialog.field === "customer.location") {
                return {
                    ...prev,
                    customer: { ...prev.customer, location: newValue },
                };
            }
            if (editDialog.field === "footer.contact") {
                return {
                    ...prev,
                    footer: { ...prev.footer, contact: newValue },
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

        const mongoSet = buildQuickMongoSetFromEditDialog(editDialog, newValue);
        if (mongoSet && apiEntityId) {
            try {
                await dispatch(
                    updateQuickQuotation({ id: apiEntityId, formData: mongoSet })
                ).unwrap();
                await refreshQuotationFromApi();
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
        } else if (mongoSet && !apiEntityId) {
            setSnackbar({
                open: true,
                message: "Cannot sync: no quotation id in URL",
                severity: "warning",
            });
        }

        handleEditClose();
    };

    const handleEditValueChange = (e) => {
        setEditDialog({ ...editDialog, value: e.target.value });
    };

    const handleConfirm = async (values) => {
        const pkg = values?.quotation;
        if (!pkg || !apiEntityId) {
            setSnackbar({
                open: true,
                message: "Confirm package selection to finalize",
                severity: "error",
            });
            return;
        }
        try {
            await dispatch(
                finalizeQuickQuotation({
                    id: apiEntityId,
                    finalizedPackage: pkg,
                })
            ).unwrap();
            await dispatch(fetchQuickQuotationById(id)).unwrap();
            setIsFinalized(true);
            setOpenFinalize(false);
            setOpenBankDialog(true);
            setSnackbar({
                open: true,
                message: "Quotation finalized",
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
        if (apiEntityId) {
            try {
                await dispatch(
                    updateQuickQuotation({
                        id: apiEntityId,
                        formData: {
                            vendorDetails: {
                                vendorType: vendorPayload.vendorType || "",
                                hotelVendorName: vendorPayload.hotelVendorName || "",
                                vehicleVendorName:
                                    vendorPayload.vehicleVendorName || "",
                            },
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
            (currentService.included === "no" && !currentService.amount)
        ) {
            alert("Please fill in all required fields");
            return;
        }

        const selectedTax = taxOptions.find(
            (option) => option.value === currentService.taxType
        );
        const taxRate = selectedTax ? selectedTax.rate : 0;

        const amount =
            currentService.included === "yes" ? 0 : parseFloat(currentService.amount);
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
            included: "yes",
            particulars: "",
            amount: "",
            taxType: "",
        });
    };

    const handleClearService = () => {
        setCurrentService({
            included: "yes",
            particulars: "",
            amount: "",
            taxType: "",
        });
    };

    const handleRemoveService = (id) => {
        setServices((prev) => prev.filter((service) => service.id !== id));
    };

    const handleSaveServices = () => {
        console.log("Services saved:", services);
        handleAddServiceClose();
    };

    const handleAddFlight = (flightDetails) => {
        setFlights((prev) => [...prev, { ...flightDetails, id: Date.now() }]);
        console.log("Flight added:", flightDetails);
        handleAddFlightClose();
    };

    const handleDayImageUpload = async (dayId, file) => {
        if (!file) {
            const next = days.map((day) =>
                day.id === dayId ? { ...day, image: null } : day
            );
            setDays(next);
            await persistItineraryForDays(next);
            return;
        }
        if (!apiEntityId) {
            setSnackbar({
                open: true,
                message: "Cannot upload: no quotation id",
                severity: "error",
            });
            return;
        }
        try {
            const fd = new FormData();
            fd.append("image", file);
            const { data } = await axios.post(
                `/quickQT/${encodeURIComponent(apiEntityId)}/day-image`,
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            const url = data?.url;
            if (!url) throw new Error("No image URL returned");
            const next = days.map((day) =>
                day.id === dayId
                    ? {
                          ...day,
                          image: {
                              preview: url,
                              url,
                              name: file.name,
                          },
                      }
                    : day
            );
            setDays(next);
            await persistItineraryForDays(next);
        } catch (e) {
            setSnackbar({
                open: true,
                message: String(e?.message || e || "Upload failed"),
                severity: "error",
            });
        }
    };

    const handleAddDay = () => {
        const newDayId = days.length + 1;
        setDays((prev) => [
            ...prev,
            {
                id: newDayId,
                date: "12/09/2025",
                title: `About Day ${newDayId}`,
                image: null,
            },
        ]);
    };

    const handleRemoveDay = async (dayId) => {
        if (days.length <= 1) {
            alert("At least one day is required");
            return;
        }
        const next = days.filter((day) => day.id !== dayId);
        setDays(next);
        await persistItineraryForDays(next);
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

    const handleAddItinerary = () => {
        const currentDays = days.length;
        setItineraryDialog({
            open: true,
            mode: 'add',
            day: currentDays + 1,
            title: `Day ${currentDays + 1}`,
            description: "",
            id: null
        });
    };

    const handleEditItinerary = (day, index) => {
        setItineraryDialog({
            open: true,
            mode: 'edit',
            day: index + 1,
            title: day.title || `Day ${index + 1}`,
            description: day.description || "",
            id: day.id
        });
    };

    const handleSaveItinerary = async () => {
        const { mode, title, description, id } = itineraryDialog;

        if (!title.trim() || !description.trim()) {
            setSnackbar({
                open: true,
                message: "Please fill in both title and description",
                severity: "error"
            });
            return;
        }

        let nextDays;
        if (mode === "add") {
            const newDay = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                title,
                description,
                image: null,
            };
            nextDays = [...days, newDay];
            setDays(nextDays);
        } else if (mode === "edit") {
            nextDays = days.map((day) =>
                day.id === id ? { ...day, title, description } : day
            );
            setDays(nextDays);
        } else {
            return;
        }

        setItineraryDialog({
            open: false,
            mode: "add",
            day: null,
            title: "",
            description: "",
            id: null,
        });

        await persistItineraryForDays(nextDays);
    };

    const handleCloseItineraryDialog = () => {
        setItineraryDialog({ open: false, mode: 'add', day: null, title: "", description: "", id: null });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleCloseInvoiceDialog = () => {
        setOpenInvoiceDialog(false);
    };

    const handleStep5Or6Saved = async () => {
        await refreshQuotationFromApi();
        setSnackbar({
            open: true,
            message: "Saved",
            severity: "success",
        });
    };

    // UI Data
    const infoMap = {
        call: `📞 ${quotation.footer.phone}`,
        email: `✉️ ${quotation.footer.email}`,
        payment: `Received: ${quotation.footer.received}\n Balance: ${quotation.footer.balance}`,
        quotation: `Total Quotation Cost: ${quotation.pricing.total}`,
        guest: `No. of Guests: ${quotation.hotel.guests}`,
    };

    const infoChips = [
        { k: "call", icon: <Phone /> },
        { k: "email", icon: <AlternateEmail /> },
        { k: "payment", icon: <CreditCard /> },
        { k: "quotation", icon: <Description /> },
        { k: "guest", icon: <Person /> },
    ];

    const snap = currentQuotation?.packageSnapshot || {};
    const qdSnap = snap.quotationDetails || {};
    const vehicleSnap = snap.vehicleDetails;

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
                    disabled={!currentQuotation}
                    onClick={() => setOpenCostingEdit(true)}
                >
                    Edit costing
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Route />}
                    disabled={!currentQuotation || !apiEntityId}
                    onClick={() => setOpenVehicleFinalizeDialog(true)}
                >
                    Edit vehicle & pickup
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Business />}
                    disabled={!currentQuotation || !apiEntityId}
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
                                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                        {quotation.customer.location || "—"}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            handleEditOpen(
                                                "customer.location",
                                                quotation.customer.location || "",
                                                "Customer location"
                                            )
                                        }
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
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
                                                    <Typography variant="body2">
                                                        <strong>Type:</strong>{" "}
                                                        {vehicleSnap?.basicsDetails?.vehicleType ||
                                                            currentQuotation?.transportation ||
                                                            "—"}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Trip:</strong>{" "}
                                                        {vehicleSnap?.basicsDetails?.tripType || "—"}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Vehicle cost:</strong> ₹
                                                        {vehicleSnap?.costDetails?.totalCost ?? "0"}
                                                    </Typography>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="body2">
                                                        <strong>Pickup:</strong>{" "}
                                                        {vehicleSnap?.pickupDropDetails
                                                            ?.pickupLocation ||
                                                            currentQuotation?.pickupPoint ||
                                                            "—"}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Drop:</strong>{" "}
                                                        {vehicleSnap?.pickupDropDetails
                                                            ?.dropLocation ||
                                                            currentQuotation?.dropPoint ||
                                                            "—"}
                                                    </Typography>
                                                </Box>
                                            ) : a.title === "Hotel Details" ? (
                                                <Box>
                                                    {(snap.destinationNights || []).length === 0 ? (
                                                        <Typography variant="body2">
                                                            No destination nights on snapshot.
                                                        </Typography>
                                                    ) : (
                                                        (snap.destinationNights || []).map((d, idx) => (
                                                            <Typography key={idx} variant="body2">
                                                                {d.destination} — {d.nights}N
                                                            </Typography>
                                                        ))
                                                    )}
                                                </Box>
                                            ) : a.title === "Company Margin" ? (
                                                <Typography variant="body2">
                                                    Margin %:{" "}
                                                    {qdSnap.companyMargin?.marginPercent ?? "—"} ·
                                                    Margin ₹:{" "}
                                                    {qdSnap.companyMargin?.marginAmount ?? "—"} ·
                                                    Discount: {qdSnap.discount ?? "—"} · GST:{" "}
                                                    {qdSnap.taxes?.taxPercent ?? "—"}% (
                                                    {qdSnap.taxes?.gstOn ?? "—"})
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Not used for quick quotations.
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
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
                                                : `Quick Quotation For ${quotation.customer.name}`}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        aria-label="Edit quotation title"
                                        onClick={() =>
                                            handleEditOpen(
                                                "quotationHeaderTitle",
                                                quotation.quotationTitle?.trim() ||
                                                    `Quick Quotation For ${quotation.customer.name}`,
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
                                                "Destination line"
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
                                            disabled={bannerUploading || !apiEntityId}
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
                                    {quotation.bannerImage &&
                                        String(quotation.bannerImage).startsWith("http") && (
                                            <Box
                                                component="img"
                                                src={quotation.bannerImage}
                                                alt="Banner"
                                                sx={{ maxWidth: 360, maxHeight: 120, borderRadius: 1 }}
                                            />
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
                                            disabled={itinerarySaving}
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
                                                    <Box key={day.id} mb={2} p={1} sx={{ border: '1px dashed #ddd', borderRadius: 1 }}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {day.title}
                                                            </Typography>
                                                            <Box>
                                                                <IconButton
                                                                    size="small"
                                                                    disabled={itinerarySaving}
                                                                    onClick={() => handleEditItinerary(day, index)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                {days.length > 1 && (
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        disabled={itinerarySaving}
                                                                        onClick={() => handleRemoveDay(day.id)}
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
                                                                disabled={itinerarySaving || !apiEntityId}
                                                            >
                                                                Upload Image
                                                                <input
                                                                    type="file"
                                                                    hidden
                                                                    accept="image/*"
                                                                    onChange={(e) =>
                                                                        handleDayImageUpload(day.id, e.target.files[0])
                                                                    }
                                                                />
                                                            </Button>
                                                        </Box>

                                                        {day.image && (
                                                            <Box mt={2} display="flex" alignItems="center" gap={2}>
                                                                <Box
                                                                    component="img"
                                                                    src={day.image.preview}
                                                                    alt={`Day ${day.id}`}
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
                                                                        {day.image.name}
                                                                    </Typography>
                                                                    <Button
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDayImageUpload(day.id, null)}
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
                                            {(quotation.hotelPricingData || []).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center">
                                                        <Typography variant="body2" color="text.secondary">
                                                            No destination rows for this package.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                            (quotation.hotelPricingData || []).map((row, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        backgroundColor:
                                                            index >= quotation.hotelPricingData.length - 2
                                                                ? "grey.50"
                                                                : "inherit",
                                                        fontWeight:
                                                            index === quotation.hotelPricingData.length - 1
                                                                ? "bold"
                                                                : "normal",
                                                    }}
                                                >
                                                    <TableCell>{row.destination}</TableCell>
                                                    <TableCell>{row.nights}</TableCell>
                                                    <TableCell>{row.standard}</TableCell>
                                                    <TableCell>{row.deluxe}</TableCell>
                                                    <TableCell>{row.superior}</TableCell>
                                                </TableRow>
                                            )))}
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
                                                                p.isArray
                                                                    ? typeof p.content === "string"
                                                                        ? p.content
                                                                        : JSON.stringify(p.content)
                                                                    : p.content,
                                                                p.title
                                                            )
                                                        }
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                                {p.isArray && typeof p.content === "string" ? (
                                                    <List dense>
                                                        {linesToPolicyArray(p.content).map((line, k) => (
                                                            <ListItem key={k}>
                                                                <ListItemText primary={line} />
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
                                                        policyInputs.termsAndConditions,
                                                        "Terms & Conditions"
                                                    )
                                                }
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2" whiteSpace="pre-line">
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
                                        GST : 09EYCPK8832C1ZC
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
                quotation={costingQuotation}
                quotationId={apiEntityId}
                onSaved={handleStep5Or6Saved}
                saveCostingOverride={async (body) => {
                    if (!apiEntityId || !currentQuotation) return;
                    const formData = costingBodyToQuickUpdate(currentQuotation, body);
                    await dispatch(
                        updateQuickQuotation({ id: apiEntityId, formData })
                    ).unwrap();
                }}
            />
            <FinalizeVehicleDialog
                open={openVehicleFinalizeDialog}
                onClose={() => setOpenVehicleFinalizeDialog(false)}
                quotation={hotelsDialogQuotation}
                quotationId={apiEntityId}
                onSaved={handleStep5Or6Saved}
                onSaveVehicle={async (vehiclePayload) => {
                    if (!apiEntityId || !currentQuotation) return;
                    const formData = vehicleStepPayloadToQuickUpdate(
                        currentQuotation,
                        vehiclePayload
                    );
                    await dispatch(
                        updateQuickQuotation({ id: apiEntityId, formData })
                    ).unwrap();
                }}
            />
            <FinalizeHotelsPricingDialog
                open={openHotelsPricingDialog}
                onClose={() => setOpenHotelsPricingDialog(false)}
                quotation={hotelsDialogQuotation}
                quotationId={apiEntityId}
                onSaved={handleStep5Or6Saved}
                onSaveHotelsPricing={async (finalData) => {
                    if (!apiEntityId || !currentQuotation) return;
                    const formData = finalizeHotelsFormDataToQuickUpdate(
                        currentQuotation,
                        finalData
                    );
                    await dispatch(
                        updateQuickQuotation({ id: apiEntityId, formData })
                    ).unwrap();
                }}
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
                        Updates adults, children, kids, and infants (stored on this quick
                        quotation).
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
            <FinalizeDialog
                open={openFinalize}
                onClose={handleFinalizeClose}
                onConfirm={handleConfirm}
                packageOptionsOverride={finalizePackageOptions}
                preselectedPackageLabel={currentQuotation?.finalizedPackage}
            />
            <HotelVendorDialog
                open={openBankDialog}
                onClose={handleBankDialogClose}
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
                quotationRef={apiEntityId}
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
                    quotation={quotation}
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
                    <Button onClick={handleCloseItineraryDialog}>Cancel</Button>
                    <Button onClick={handleSaveItinerary} variant="contained">
                        {itineraryDialog.mode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuickFinalize;