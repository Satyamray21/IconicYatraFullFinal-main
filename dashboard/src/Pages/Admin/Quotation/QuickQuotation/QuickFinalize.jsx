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
} from "@mui/icons-material";

import EmailQuotationDialog from "../VehicleQuotation/Dialog/EmailQuotationDialog";
import MakePaymentDialog from "../VehicleQuotation/Dialog/MakePaymentDialog";
import FinalizeDialog from "./Dialog/FinalizeDialog";
import HotelVendorDialog from "./Dialog/HotelVendor";
import AddBankDialog from "../VehicleQuotation/Dialog/AddBankDialog";
import EditDialog from "../VehicleQuotation/Dialog/EditDialog";
import AddServiceDialog from "../VehicleQuotation/Dialog/AddServiceDialog";
import AddFlightDialog from "../HotelQuotation/Dialog/FlightDialog";
import InvoicePDF from "./Dialog/PDF/Invoice";
import QuotationPDFDialog from "./Dialog/PDF/PreviewPdf";

// Transaction Summary Dialog Component
const TransactionSummaryDialog = ({ open, onClose }) => {
    const tableHeaders = [
        "Sr No.",
        "Receipt",
        "Invoice",
        "Party Name",
        "Transaction Remark",
        "Transaction...",
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
                    Transaction Summary
                </Typography>
            </DialogTitle>
            <DialogContent>
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
                                    No data
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
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

const QuickFinalize = () => {
    // State
    const [activeInfo, setActiveInfo] = useState(null);
    const [openFinalize, setOpenFinalize] = useState(false);
    const [openAddFlight, setOpenAddFlight] = useState(false);
    const [vendor, setVendor] = useState("");
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
        date: "27/08/2025",
        reference: "41",
        actions: ["Finalize", "Add Service", "Email Quotation", "Preview PDF", "Make Payment", "Add Flight", "Transaction"],
        bannerImage: "",
        customer: {
            name: "Amit Jaiswal",
            location: "Andhya Pradesh",
            phone: "+91 7053900957",
            email: "amit.jaiswal@example.com",
        },
        pickup: {
            arrival: "Arrival: Lucknow (22/08/2025) at Airport, 3:35PM",
            departure: "Departure: Delhi (06/09/2025) from Local Address, 6:36PM",
        },
        hotel: {
            guests: "6 Adults",
            rooms: "3 Bedroom",
            mealPlan: "CP, AP, EP",
            destination: "3N Borong, 2N Damthang",
            itinerary: "This is only tentative schedule for sightseeing and travel...",
        },
        vehicles: [
            {
                pickup: { date: "22/08/2025", time: "3:35PM" },
                drop: { date: "06/09/2025", time: "6:36PM" },
            },
        ],
        pricing: { discount: "₹ 200", gst: "₹ 140", total: "₹ 3,340" },
        policies: {
            inclusions: [
                "All transfers tours in a Private AC cab.",
                "Parking, Toll charges, Fuel and Driver expenses.",
                "Hotel Taxes.",
                "Car AC off during hill stations.",
            ],
            exclusions: "1. Any Cost change...",
            paymentPolicy: "50% amount to pay at confirmation, balance before 10 days.",
            cancellationPolicy: "1. Before 15 days: 50%. 2. Within 7 days: 100%.",
            terms: "1. This is only a Quote. Availability is checked only on confirmation...",
        },
        footer: {
            contact: "Amit Jaiswal | +91 7053900957 (Noida)",
            phone: "+91 7053900957",
            email: "amit.jaiswal@example.com",
            received: "₹ 1,500",
            balance: "₹ 1,840",
            company: "Iconic Yatra",
            address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
            website: "https://www.iconicyatra.com",
        },
        hotelPricingData: [
            {
                destination: "Borong",
                nights: "3 N",
                standard: "Tempo Heritage Resort",
                deluxe: "Tempo Heritage Resort",
                superior: "Yovage The Aryan Regency",
            },
            {
                destination: "Damthang",
                nights: "2 N",
                standard: "Tempo Heritage Resort",
                deluxe: "Tempo Heritage Resort",
                superior: "Yovage The Aryan Regency",
            },
            {
                destination: "Quotation Cost",
                nights: "-",
                standard: "₹ 40,366",
                deluxe: "₹ 440,829",
                superior: "₹ 92,358",
            },
            {
                destination: "IGST",
                nights: "-",
                standard: "₹ 2,018.3",
                deluxe: "₹ 22,041.4",
                superior: "₹ 4,617.9",
            },
            {
                destination: "Total Quotation Cost",
                nights: "5 N",
                standard: "₹ 42,384",
                deluxe: "₹ 462,870",
                superior: "₹ 96,976",
            },
        ],
        days: [
            { id: 1, date: "11/09/2025", title: "About Day 1", description: "Arrival and check-in process" },
        ],
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
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openBankDialog, setOpenBankDialog] = useState(false);
    const [flights, setFlights] = useState([]);
    const [openAddBankDialog, setOpenAddBankDialog] = useState(false);
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
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
    const handleEmailOpen = () => setOpenEmailDialog(true);
    const handleEmailClose = () => setOpenEmailDialog(false);

    const handlePaymentOpen = () => setOpenPaymentDialog(true);
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

    const handleEditSave = () => {
        setQuotation((prev) => ({
            ...prev,
            [editDialog.field]: editDialog.nested
                ? {
                    ...prev[editDialog.field],
                    [editDialog.nestedKey]: editDialog.value,
                }
                : editDialog.value,
        }));
        handleEditClose();
    };

    const handleEditValueChange = (e) => {
        setEditDialog({ ...editDialog, value: e.target.value });
    };

    const handleConfirm = () => {
        setIsFinalized(true);
        setOpenFinalize(false);
        setOpenBankDialog(true);
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

    const handleBankConfirm = () => {
        console.log("Bank details:", {
            accountType,
            accountName,
            accountNumber,
            ifscCode,
            bankName,
            branchName,
        });
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

    const handleDayImageUpload = (dayId, file) => {
        if (file) {
            setDays((prev) =>
                prev.map((day) =>
                    day.id === dayId
                        ? {
                            ...day,
                            image: {
                                file,
                                preview: URL.createObjectURL(file),
                                name: file.name,
                            },
                        }
                        : day
                )
            );
            console.log(`Image uploaded for Day ${dayId}:`, file.name);
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

    const handleRemoveDay = (dayId) => {
        if (days.length > 1) {
            setDays((prev) => prev.filter((day) => day.id !== dayId));
        } else {
            alert("At least one day is required");
        }
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

        try {
            if (mode === 'add') {
                const newDay = {
                    id: Date.now(),
                    date: new Date().toLocaleDateString(),
                    title,
                    description,
                    image: null
                };

                setDays(prev => [...prev, newDay]);
            } else if (mode === 'edit') {
                setDays(prev =>
                    prev.map(day =>
                        day.id === id ? { ...day, title, description } : day
                    )
                );
            }

            setItineraryDialog({ open: false, mode: 'add', day: null, title: "", description: "", id: null });

            setSnackbar({
                open: true,
                message: `Itinerary ${mode === 'add' ? 'added' : 'updated'} successfully`,
                severity: "success"
            });

        } catch (error) {
            setSnackbar({
                open: true,
                message: "Failed to save itinerary",
                severity: "error"
            });
        }
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
            content: (
                <List dense>
                    {quotation.policies.inclusions.map((i, k) => (
                        <ListItem key={k}>
                            <ListItemText primary={i} />
                        </ListItem>
                    ))}
                </List>
            ),
            field: "policies.inclusions",
            isArray: true,
        },
        {
            title: "Exclusion Policy",
            icon: <Cancel sx={{ mr: 0.5, color: "error.main" }} />,
            content: quotation.policies.exclusions,
            field: "policies.exclusions",
        },
        {
            title: "Payment Policy",
            icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
            content: quotation.policies.paymentPolicy,
            field: "policies.paymentPolicy",
        },
        {
            title: "Cancellation & Refund",
            icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
            content: quotation.policies.cancellationPolicy,
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
            field: "hotel.guests",
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
                                {Accordions.map((a, i) => (
                                    <Accordion key={i}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography color="primary" fontWeight="bold">
                                                {a.title}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2">Details go here.</Typography>
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
                                                    handleEditOpen(
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
                                <Box display="flex" alignItems="center">
                                    <FormatQuoteIcon sx={{ mr: 1 }} />
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        color="warning.main"
                                    >
                                        Quick Quotation For {quotation.customer.name}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" mt={1}>
                                    <Route sx={{ mr: 0.5 }} />
                                    <Typography variant="subtitle2">
                                        Destination : {quotation.hotel.destination}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" mt={1}>
                                    <ImageIcon sx={{ mr: 0.5 }} />
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                        Add Banner Image
                                    </Typography>
                                    <Button component="label" sx={{ textTransform: "none" }}>
                                        <AddCircleOutline />
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setQuotation((prev) => ({
                                                        ...prev,
                                                        bannerImage: file.name,
                                                    }));
                                                    console.log("Selected file:", file);
                                                }
                                            }}
                                        />
                                    </Button>
                                    {quotation.bannerImage && (
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 2, fontStyle: "italic" }}
                                        >
                                            Selected: {quotation.bannerImage}
                                        </Typography>
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
                                                                    onClick={() => handleEditItinerary(day, index)}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                {days.length > 1 && (
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
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
                                            {quotation.hotelPricingData.map((row, index) => (
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
                                            ))}
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
                                                                    ? JSON.stringify(p.content)
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
                                            {quotation.policies.terms}
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
            <FinalizeDialog
                open={openFinalize}
                onClose={handleFinalizeClose}
                vendor={vendor}
                setVendor={setVendor}
                onConfirm={handleConfirm}
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
            />
            <MakePaymentDialog
                open={openPaymentDialog}
                onClose={handlePaymentClose}
            />
            <TransactionSummaryDialog
                open={openTransactionDialog}
                onClose={() => setOpenTransactionDialog(false)}
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