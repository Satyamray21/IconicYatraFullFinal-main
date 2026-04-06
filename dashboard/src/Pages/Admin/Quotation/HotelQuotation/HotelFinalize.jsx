import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
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
    Alert,
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
    Route,
    Group,
    DomainVerification,
    CheckCircle,
    Cancel,
    Warning,
    Business,
    Language,
    ExpandMore,
    Edit,
    Receipt,
    Visibility,
    Hotel as HotelIcon,
    AddCircleOutline,
    Image as ImageIcon,
    FormatQuote,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import EmailQuotationDialog from "../VehicleQuotation/Dialog/EmailQuotationDialog";
import MakePaymentDialog from "../VehicleQuotation/Dialog/MakePaymentDialog";
import FinalizeDialog from "../VehicleQuotation/Dialog/FinalizeDialog";
import BankDetailsDialog from "../VehicleQuotation/Dialog/BankDetailsDialog";
import AddBankDialog from "../VehicleQuotation/Dialog/AddBankDialog";
import EditDialog from "../VehicleQuotation/Dialog/EditDialog";
import AddServiceDialog from "../VehicleQuotation/Dialog/AddServiceDialog";
import AddFlightDialog from "../HotelQuotation/Dialog/FlightDialog";
import { fetchHotelQuotationById } from "../../../../features/quotation/hotelQuotation";

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN");
    } catch {
        return "N/A";
    }
};

// Helper function to format time
const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
        const time = new Date(timeString);
        return time.toLocaleTimeString("en-IN", {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return "N/A";
    }
};

const HotelFinalize = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { quotation, loading, error } = useSelector((state) => state.hotelQuotation);

    // State management
    const [activeInfo, setActiveInfo] = useState(null);
    const [openFinalize, setOpenFinalize] = useState(false);
    const [vendor, setVendor] = useState("");
    const [isFinalized, setIsFinalized] = useState(false);
    const [invoiceGenerated, setInvoiceGenerated] = useState(false);

    // Dialog states
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
    const [openAddFlight, setOpenAddFlight] = useState(false);
    const [flights, setFlights] = useState([]);

    // Bank details state
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

    // Fetch quotation data when component mounts or ID changes
    useEffect(() => {
        if (id) {
            dispatch(fetchHotelQuotationById(id));
        }
    }, [dispatch, id]);

    // Transform API data to component format
    const transformQuotationData = (apiData) => {
        if (!apiData) return null;

        const clientDetails = apiData.clientDetails || {};
        const pickupDrop = apiData.pickupDrop || {};
        const quotationData = apiData.quotation || {};
        const vehicleDetails = apiData.vehicleDetails || {};
        const stayLocation = apiData.stayLocation || [];

        // Calculate total guests
        const adults = parseInt(clientDetails.adults) || 0;
        const children = parseInt(clientDetails.children) || 0;
        const infants = parseInt(clientDetails.infants) || 0;
        const kids = parseInt(clientDetails.kids) || 0;
        const totalGuests = adults + children + infants + kids;

        // Calculate total rooms
        const noOfRooms = parseInt(apiData.accommodationDetails?.noOfRooms) || 1;

        // Generate hotel pricing data from stay locations
        const hotelPricingData = stayLocation.map((location, index) => ({
            destination: location.city || `Location ${index + 1}`,
            nights: `${location.nights || 0} N`,
            standard: location.standard?.hotelName || "Not specified",
            deluxe: location.deluxe?.hotelName || "Not specified",
            superior: location.superior?.hotelName || "Not specified",
        }));

        // Add summary rows
        const totalNights = stayLocation.reduce((sum, loc) => sum + (loc.nights || 0), 0);
        hotelPricingData.push(
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
                nights: `${totalNights} N`,
                standard: "₹ 42,384",
                deluxe: "₹ 462,870",
                superior: "₹ 96,976",
            }
        );

        return {
            // Basic info
            date: formatDate(apiData.createdAt),
            reference: apiData.hotelQuotationId || "N/A",

            // Customer info
            customer: {
                name: clientDetails.clientName || "N/A",
                location: clientDetails.sector || "N/A",
                phone: "+91 7053900957", // Default phone
                email: "customer@example.com", // Default email
            },

            // Pickup details
            pickup: {
                arrival: `Arrival: ${pickupDrop.arrivalCity || "N/A"} (${formatDate(pickupDrop.arrivalDate)}) at ${pickupDrop.arrivalLocation || "N/A"}`,
                departure: `Departure: ${pickupDrop.departureCity || "N/A"} (${formatDate(pickupDrop.departureDate)}) from ${pickupDrop.departureLocation || "N/A"}`,
            },

            // Hotel details
            hotel: {
                guests: `${totalGuests} ${totalGuests === 1 ? 'Person' : 'Persons'} (${adults} Adults, ${children} Children, ${infants} Infants, ${kids} Kids)`,
                rooms: `${noOfRooms} ${noOfRooms === 1 ? 'Room' : 'Rooms'}`,
                mealPlan: apiData.accommodationDetails?.mealPlan || "Not specified",
                destination: stayLocation.map(loc => `${loc.nights || 0}N ${loc.city || ''}`).join(", ") || "N/A",
                itinerary: quotationData.initialNotes || "This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.",
            },

            // Vehicle details (if available)
            vehicles: vehicleDetails.pickupDropDetails ? [{
                pickup: {
                    date: formatDate(vehicleDetails.pickupDropDetails.pickupDate),
                    time: formatTime(vehicleDetails.pickupDropDetails.pickupTime),
                },
                drop: {
                    date: formatDate(vehicleDetails.pickupDropDetails.dropDate),
                    time: formatTime(vehicleDetails.pickupDropDetails.dropTime),
                },
            }] : [],

            // Pricing
            pricing: {
                discount: "₹ 200",
                gst: "₹ 140",
                total: "₹ 3,340",
            },

            // Policies
            policies: {
                inclusions: [
                    "All transfers tours in a Private AC cab.",
                    "Parking, Toll charges, Fuel and Driver expenses.",
                    "Hotel Taxes.",
                    "Car AC off during hill stations.",
                ],
                exclusions: apiData.quotationExculsion || "1. Any Cost change...",
                paymentPolicy: apiData.paymentPolicies || "50% amount to pay at confirmation, balance before 10 days.",
                cancellationPolicy: apiData.CancellationRefund || "1. Before 15 days: 50%. 2. Within 7 days: 100%.",
                terms: apiData.termsAndConditions || "1. This is only a Quote. Availability is checked only on confirmation...",
            },

            // Footer
            footer: {
                contact: `${clientDetails.clientName || "N/A"} | +91 7053900957 (Noida)`,
                phone: "+91 7053900957",
                email: "amit.jaiswal@example.com",
                received: "₹ 1,500",
                balance: "₹ 1,840",
                company: "Iconic Yatra",
                address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
                website: "https://www.iconicyatra.com",
            },

            // Additional data
            bannerImage: quotationData.selectBannerImage || "",
            hotelPricingData,
        };
    };

    const quotationData = transformQuotationData(quotation);

    // Show loading state
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading quotation data...
                </Typography>
            </Box>
        );
    }

    // Show error state
    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading quotation: {error}
                </Alert>
                <Button variant="contained" onClick={() => dispatch(fetchHotelQuotationById(id))}>
                    Retry
                </Button>
            </Box>
        );
    }

    // Show no data state
    if (!quotationData) {
        return (
            <Box p={3}>
                <Alert severity="warning">
                    No quotation data found for ID: {id}
                </Alert>
            </Box>
        );
    }

    // Rest of your existing helper functions and handlers remain the same...
    const handleEditOpen = (field, value, title, nested = false, nestedKey = "") => {
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
        // Here you would typically make an API call to update the quotation
        console.log("Updating quotation:", editDialog);
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
        setOpenAddService(false);
    };

    const handleGenerateInvoice = () => {
        console.log("Generate Invoice clicked");
        setOpenBankDialog(true);
    };

    const handleViewInvoice = () => {
        console.log("View Invoice clicked");
    };

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
    const handleEmailOpen = () => setOpenEmailDialog(true);
    const handleEmailClose = () => setOpenEmailDialog(false);
    const handlePaymentOpen = () => setOpenPaymentDialog(true);
    const handlePaymentClose = () => setOpenPaymentDialog(false);
    const handleFinalizeOpen = () => setOpenFinalize(true);
    const handleFinalizeClose = () => setOpenFinalize(false);

    // Add flight handlers
    const handleAddFlightOpen = () => setOpenAddFlight(true);
    const handleAddFlightClose = () => setOpenAddFlight(false);
    const handleAddFlight = (flightDetails) => {
        setFlights((prev) => [...prev, { ...flightDetails, id: Date.now() }]);
        console.log("Flight added:", flightDetails);
    };

    // Constants for UI rendering
    const infoMap = {
        call: `📞 ${quotationData.footer.phone}`,
        email: `✉️ ${quotationData.footer.email}`,
        payment: `Received: ${quotationData.footer.received}\n Balance: ${quotationData.footer.balance}`,
        quotation: `Total Quotation Cost: ${quotationData.pricing.total}`,
        guest: `No. of Guests: ${quotationData.hotel.guests}`,
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
                    {quotationData.policies.inclusions.map((i, k) => (
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
            content: quotationData.policies.exclusions,
            field: "policies.exclusions",
        },
        {
            title: "Payment Policy",
            icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
            content: quotationData.policies.paymentPolicy,
            field: "policies.paymentPolicy",
        },
        {
            title: "Cancellation & Refund",
            icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
            content: quotationData.policies.cancellationPolicy,
            field: "policies.cancellationPolicy",
        },
    ];

    const pickupDetails = [
        {
            icon: (
                <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
            ),
            text: quotationData.pickup.arrival,
            editable: true,
            field: "pickup",
            nestedKey: "arrival",
        },
        {
            icon: <Cancel sx={{ fontSize: 16, mr: 0.5, color: "error.main" }} />,
            text: quotationData.pickup.departure,
            editable: true,
            field: "pickup",
            nestedKey: "departure",
        },
        {
            icon: <Group sx={{ fontSize: 16, mr: 0.5 }} />,
            text: `No of Guest: ${quotationData.hotel.guests}`,
            editable: true,
            field: "hotel.guests",
        },
    ];

    const hotelTableHeaders = [
        "Destination",
        "Nights",
        "Standard",
        "Deluxe",
        "Superior",
    ];

    const initialActions = [
        "Finalize",
        "Add Service",
        "Email Quotation",
        "Preview PDF",
        "Make Payment",
        "Add Flight",
    ];

    // Action handlers
    const actionHandlers = {
        Finalize: handleFinalizeOpen,
        "Add Service": handleAddServiceOpen,
        "Email Quotation": handleEmailOpen,
        "Preview PDF": () => console.log("Preview PDF clicked"),
        "Make Payment": handlePaymentOpen,
        "Add Flight": handleAddFlightOpen,
    };

    return (
        <Box>
            <Box
                display="flex"
                justifyContent="flex-end"
                gap={1}
                mb={2}
                flexWrap="wrap"
            >
                {initialActions.map((a, i) => {
                    if (a === "Finalize" && isFinalized) return null;

                    return (
                        <Button key={i} variant="contained" onClick={actionHandlers[a]}>
                            {a}
                        </Button>
                    );
                })}

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
                <Grid
                    size={{ xs: 12, md: 3 }}
                    sx={{
                        borderRight: { md: "1px solid #ddd" },
                        pt: 3,
                        minHeight: "100vh",
                        bgcolor: "#f8f9fa",
                        textAlign: "center",
                    }}
                >
                    <Chip
                        icon={<HotelIcon />}
                        label="Hotel Quotation"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 3 }}
                    />
                    <Box sx={{ position: "sticky", top: 0 }}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Person color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                        {quotationData.customer.name}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <LocationOn
                                        sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {quotationData.customer.location}
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
                                        Date: {quotationData.date}
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
                                    Ref: {quotationData.reference}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" mt={2}>
                                <Person sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Kind Attention: {quotationData.customer.name}
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
                                    mb={1}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        display="flex"
                                        alignItems="center"
                                        sx={{ fontSize: "0.875rem" }}
                                    >
                                        <DomainVerification sx={{ mr: 0.5 }} />
                                        Check in Details
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

                            <Box mt={3}>
                                <Box display="flex" alignItems="center">
                                    <HotelIcon sx={{ mr: 1 }} />
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        color="warning.main"
                                    >
                                        Hotel Quotation For {quotationData.customer.name}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mt={1}>
                                    <Route sx={{ mr: 0.5 }} />
                                    <Typography variant="subtitle2">
                                        Destination : {quotationData.hotel.destination}
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
                                                    // Handle file upload here
                                                    console.log("Selected file:", file);
                                                }
                                            }}
                                        />
                                    </Button>
                                    {quotationData.bannerImage && (
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 2, fontStyle: "italic" }}
                                        >
                                            Selected: {quotationData.bannerImage}
                                        </Typography>
                                    )}
                                </Box>

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
                                            {quotationData.hotel.itinerary}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleEditOpen(
                                                    "hotel.itinerary",
                                                    quotationData.hotel.itinerary,
                                                    "Itinerary Note"
                                                )
                                            }
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>

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
                                        No of Guest : {quotationData.hotel.guests}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        No of Rooms : {quotationData.hotel.rooms}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                        Meal Plan : {quotationData.hotel.mealPlan}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Hotel Pricing Table */}
                            <Box mt={3}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead sx={{ backgroundColor: "primary.light" }}>
                                            <TableRow>
                                                {hotelTableHeaders.map((h) => (
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
                                            {quotationData.hotelPricingData.map((row, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        backgroundColor:
                                                            index >= quotationData.hotelPricingData.length - 2
                                                                ? "grey.50"
                                                                : "inherit",
                                                        fontWeight:
                                                            index === quotationData.hotelPricingData.length - 1
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
                                                        quotationData.policies.terms,
                                                        "Terms & Conditions"
                                                    )
                                                }
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2">
                                            {quotationData.policies.terms}
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
                                        {quotationData.footer.contact}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ color: "white" }}
                                        onClick={() =>
                                            handleEditOpen(
                                                "footer.contact",
                                                quotationData.footer.contact,
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
                                    {quotationData.footer.company}
                                </Typography>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                    <Business sx={{ mr: 0.5, fontSize: 18 }} />
                                    {quotationData.footer.address}
                                </Box>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                    <Language sx={{ mr: 0.5, fontSize: 18 }} />
                                    <a
                                        href={quotationData.footer.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "white", textDecoration: "underline" }}
                                    >
                                        {quotationData.footer.website}
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

            {/* Dialogs */}
            <FinalizeDialog
                open={openFinalize}
                onClose={handleFinalizeClose}
                vendor={vendor}
                setVendor={setVendor}
                onConfirm={handleConfirm}
            />

            <BankDetailsDialog
                open={openBankDialog}
                onClose={handleBankDialogClose}
                accountType={accountType}
                setAccountType={setAccountType}
                accountName={accountName}
                setAccountName={setAccountName}
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
                customer={quotationData.customer}
            />

            <MakePaymentDialog
                open={openPaymentDialog}
                onClose={handlePaymentClose}
            />
        </Box>
    );
};

export default HotelFinalize;