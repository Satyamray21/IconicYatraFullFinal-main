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
} from "@mui/icons-material";
import Add from '@mui/icons-material/Add';
import EmailQuotationDialog from "./Dialog/EmailQuotationDialog";
import MakePaymentDialog from "./Dialog/MakePaymentDialog";
import FinalizeDialog from "./Dialog/FinalizeDialog";
import BankDetailsDialog from "./Dialog/BankDetailsDialog";
import AddBankDialog from "./Dialog/AddBankDialog";
import EditDialog from "./Dialog/EditDialog";
import AddServiceDialog from "./Dialog/AddServiceDialog";
import { getVehicleQuotationById, addItinerary, editItinerary } from "../../../../features/quotation/vehicleQuotationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useRef } from "react";
import logo from "../../../../assets/Logo/logoiconic.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const VehicleQuotationPage = () => {
  const [logoBase64, setLogoBase64] = useState(null);
  const [activeInfo, setActiveInfo] = useState(null);
  const [openFinalize, setOpenFinalize] = useState(false);
  const [vendor, setVendor] = useState("");
  const [isFinalized, setIsFinalized] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [itineraryDialog, setItineraryDialog] = useState({
    open: false,
    mode: 'add',
    day: null,
    title: "",
    description: "",
    id: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [localItinerary, setLocalItinerary] = useState([]);

  const dispatch = useDispatch();
  const { id } = useParams();
  const pdfRef = useRef();
  const { viewedVehicleQuotation: q, loading } = useSelector(
    (state) => state.vehicleQuotation
  );

  // Initialize local itinerary from API data
  useEffect(() => {
    if (q?.vehicle?.itinerary) {
      setLocalItinerary(q.vehicle.itinerary);
    }
  }, [q?.vehicle?.itinerary]);

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
    const convertImageToBase64 = (img) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    };

    const img = new Image();
    img.onload = () => {
      setLogoBase64(convertImageToBase64(img));
    };
    img.src = logo;
  }, []);

  const actions = [
    "Finalize",
    "Add Service",
    "Email Quotation",
    "Preview PDF",
    "Client PDF",
    "Make Payment",
  ];

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

  const handlePreviewPdf = async () => {
    const element = pdfRef.current;
    if (!element) {
      console.error("PDF ref not available");
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const vehicleQuotationId = q?.vehicle?.vehicleQuotationId || "preview";
    pdf.save(`quotation_${vehicleQuotationId}.pdf`);
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

  const calculateTotalAmount = () => {
    return services.reduce((total, service) => total + service.totalAmount, 0);
  };



  const handleInvoicePdf = (logoBase64) => {
    const pdf = new jsPDF("p", "mm", "a4");

    // ---------- HEADER ----------
    if (logoBase64) {
      pdf.addImage(logoBase64, "PNG", 15, 8, 30, 18);
    }

    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 100);
    pdf.text("ICONIC YATRA", 105, 18, { align: "center" });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text("Noida - 201301, Uttar Pradesh - India", 105, 25, { align: "center" });
    pdf.text(
      "Phone : +91 7053900957   Email : info@iconicyatra.com   State : 9 - Uttar Pradesh",
      105,
      31,
      { align: "center" }
    );

    // Decorative line
    pdf.setDrawColor(180, 180, 180);
    pdf.line(15, 36, 195, 36);

    // ---------- INVOICE NO & TITLE ----------
    const invoiceNo = `I-${new Date().toISOString().slice(0, 7).replace("-", "")}`;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Invoice No : ${invoiceNo}`, 15, 45);

    pdf.setFontSize(14);
    pdf.setTextColor(200, 0, 0);
    pdf.text("INVOICE", 105, 50, { align: "center" });

    // ---------- BILLING TO & INVOICE DETAILS ----------
    const invoiceDate = "29/09/2025"
    //const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB");

    autoTable(pdf, {
      startY: 55,
      theme: "grid",
      styles: { fontSize: 9, halign: "left", valign: "middle" },
      headStyles: { fillColor: [220, 230, 250], textColor: 20, fontStyle: "bold" },
      body: [
        [
          {
            content: `Billing To\n\n${lead.personalDetails.title || "Mr"} ${basicsDetails.clientName || "Client Name"
              }\nMobile No : ${lead.personalDetails.mobile || "N/A"}\nState : ${lead.location.state || "N/A"
              }`,
          },
          {
            content: `Invoice Details\n\nPlace of supply : 9 - Uttar Pradesh\nGST No : 09EYCPK8832C1ZC\nInvoice No : ${invoiceNo}\nDate : ${invoiceDate}\n`,
          },
        ],
      ],
      columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 95 } },
    });

    // ---------- ITEMS TABLE ----------
    const subtotal = vehicle.basicsDetails?.perDayCost || 3500;

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [220, 230, 250], textColor: 20, fontStyle: "bold" },
      head: [["#", "Particulars", "HSN/SAC", "Amount"]],
      body: [
        [
          "1",
          `Vehicle Quotation For ${basicsDetails.clientName || "Client"}`,
          "998552",
          subtotal.toLocaleString("en-IN"),
        ],
      ],
    });

    // ---------- AMOUNT SUMMARY ----------
    const igstRate = 0.05;
    const cost = vehicle.costDetails?.totalCost
    const igstAmount = cost * igstRate;
    const totalWithTax = cost;

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, halign: "left" },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      body: [
        ["Sub Total", `${subtotal.toLocaleString("en-IN")}`],
        ["IGST (5%)", `${igstAmount.toLocaleString("en-IN")}`],
        ["Total", `${totalWithTax.toLocaleString("en-IN")}`],
        // ["Received", "₹ 0"],
        // ["Balance", `₹ ${totalWithTax.toLocaleString("en-IN")}`],
      ],
      columnStyles: {
        0: { cellWidth: 100, fontStyle: "bold" },
        1: { cellWidth: 90, halign: "right", fontStyle: "bold" },
      },
    });

    // ---------- INVOICE AMOUNT IN WORDS + DESCRIPTION ----------
    const amountInWords = convertNumberToWords(totalWithTax);

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 9, valign: "middle" },
      headStyles: { fillColor: [245, 245, 245], textColor: 20 },
      head: [["Invoice Amount In Words", "Description"]],
      body: [
        [
          {
            content: `${amountInWords} INR`,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: `Vehicle Quotation For ${basicsDetails.clientName || "Client"}`,
            styles: { fontStyle: "bold", halign: "left" },
          },
        ],
      ],
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 95 },
      },
    });

    // ---------- TERMS & CONDITIONS ----------
    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 8,
      theme: "plain",
      styles: { fontSize: 9 },
      body: [
        [
          {
            content:
              "Terms & Conditions\nThis is invoice payment. Thanks for doing business with us!",
          },
        ],
      ],
    });

    // ---------- FOOTER ----------
    const pageHeight = pdf.internal.pageSize.height;
    const footerY = pageHeight - 50;

    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, pageHeight - 50, 195, pageHeight - 50);

    // Add logo to footer (left side)
    if (logoBase64) {
      pdf.addImage(logoBase64, "PNG", 15, footerY + 2, 30, 20);
    }

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("For, Iconic Yatra", 150, pageHeight - 40);
    pdf.text("Authorized Signatory", 150, pageHeight - 25);

    // GST info
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(80, 80, 80);

    // Footer Notes
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120, 120, 120);
    pdf.text("This document is digitally signed.", 15, pageHeight - 20);
    pdf.text("Powered by Iconic Yatra", 15, pageHeight - 15);

    // Page Number
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.text("Page 1 of 1", 105, pageHeight - 10, { align: "center" });

    pdf.save(`${invoiceNo}_IconicYatra.pdf`);
  };


  // ---------- NUMBER TO WORDS ----------
  const convertNumberToWords = (amount) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (amount === 0) return "Zero";

    let num = amount;
    let words = "";

    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      if (thousands > 0) {
        if (thousands >= 20) {
          words += tens[Math.floor(thousands / 10)] + " ";
          if (thousands % 10 > 0) words += ones[thousands % 10] + " ";
        } else if (thousands >= 10) {
          words += teens[thousands - 10] + " ";
        } else {
          words += ones[thousands] + " ";
        }
        words += "Thousand ";
      }
      num %= 1000;
    }

    if (num >= 100) {
      words += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num >= 10) {
      words += teens[num - 10] + " ";
      num = 0;
    }

    if (num > 0) {
      words += ones[num] + " ";
    }

    return words.trim();
  };


  const handleViewInvoice = () => {
    handleInvoicePdf(logoBase64);
  };

  const handleActionClick = (action) => {
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
        handleInvoicePdf();
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

  const handleAddItinerary = () => {
    const maxDays = parseInt(q?.vehicle?.basicsDetails?.noOfDays) || 0;
    const currentDays = localItinerary.length;

    if (maxDays > 0 && currentDays >= maxDays) {
      alert(`Cannot add more than ${maxDays} days as specified in the quotation.`);
      return;
    }

    setItineraryDialog({
      open: true,
      mode: 'add',
      day: currentDays + 1,
      title: `Day ${currentDays + 1}`,
      description: "",
      id: null
    });
  };

  const handleEditItinerary = (item, index) => {
    setItineraryDialog({
      open: true,
      mode: 'edit',
      day: index + 1,
      title: item.title || `Day ${index + 1}`,
      description: item.description,
      id: item._id
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
        // Add to local state immediately
        const newItineraryItem = {
          _id: `temp_${Date.now()}`,
          title,
          description
        };

        setLocalItinerary(prev => [...prev, newItineraryItem]);

        // Call API in background without waiting
        dispatch(addItinerary({
          vehicleQuotationId: q.vehicle.vehicleQuotationId,
          itinerary: [{ title, description }]
        }));

      } else if (mode === 'edit') {
        // Update local state immediately
        setLocalItinerary(prev =>
          prev.map(item =>
            item._id === id ? { ...item, title, description } : item
          )
        );

        // Call API in background without waiting
        dispatch(editItinerary({
          vehicleQuotationId: q.vehicle.vehicleQuotationId,
          itineraryId: id,
          data: { title, description }
        }));
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

  if (loading || !q) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
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

  const infoMap = {
    call: `📞 ${personalDetails.mobile || "N/A"}`,
    email: `✉️ ${personalDetails.emailId || "N/A"}`,
    payment: `Received: 0\n Balance: ${costDetails.totalCost || "N/A"}`,
    quotation: `Total Quotation Cost: ${costDetails.totalCost || "N/A"}`,
    guest: `No. of Guests: ${members.adults || 0}`,
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
  const defaultPolicies = {
    inclusions: [
      "All transfers and tours in a Private AC cab or similar vehicle.",
      "Parking, toll charges, fuel, and driver expenses.",
      "Hotel taxes.",
      "Car AC will be off during hill station tours due to low temperatures."
    ],
    exclusions: [
      "Any extra costs arising due to unavoidable circumstances like natural calamities, lockdowns, heavy snowfall/rains, local political issues, strikes, riots, bandh, bad weather conditions, vehicle malfunctions, or law & order problems.",
      "Cancellations of flight, train, bus, etc. No refunds or adjustments possible if sightseeing is affected due to such reasons. Extra costs to be borne by the guest on the spot.",
      "Any costs for COVID testing before, during, or after the tour. Mandatory quarantine expenses to be borne by guests.",
      "Sightseeing entry tickets are not included in the package cost."
    ],
    paymentPolicy: "50% amount to be paid at the time of confirmation, balance 50% to be paid at least 10 days before the start date.",
    cancellationPolicy: [
      "Cancellations before 15 days: 50% of the total tour cost will be deducted.",
      "Cancellations within 7 days: No refunds, 100% charges applicable."
    ]
  };

  const Policies = [
    {
      title: "Inclusion Policy",
      icon: <CheckCircle sx={{ mr: 0.5, color: "success.main" }} />,
      content: defaultPolicies.inclusions,
      field: "inclusions",
      isArray: true,
    },
    {
      title: "Exclusion Policy",
      icon: <Cancel sx={{ mr: 0.5, color: "error.main" }} />,
      content: defaultPolicies.exclusions,
      field: "exclusions",
      isArray: false,
    },
    {
      title: "Payment Policy",
      icon: <Payment sx={{ mr: 0.5, color: "primary.main" }} />,
      content: defaultPolicies.paymentPolicy,
      field: "paymentPolicy",
      isArray: false,
    },
    {
      title: "Cancellation & Refund",
      icon: <Warning sx={{ mr: 0.5, color: "warning.main" }} />,
      content: defaultPolicies.cancellationPolicy,
      field: "cancellationPolicy",
      isArray: false,
    },
  ];

  const pickupDetails = [
    {
      icon: <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />,
      text: `Arrival: ${pickupDropDetails.pickupLocation || "N/A"} (${pickupDropDetails.pickupDate ? new Date(pickupDropDetails.pickupDate).toLocaleDateString() : "N/A"})`,
      editable: true,
      field: "pickup",
      nestedKey: "arrival",
    },
    {
      icon: <Cancel sx={{ fontSize: 16, mr: 0.5, color: "error.main" }} />,
      text: `Departure: ${pickupDropDetails.dropLocation || "N/A"} (${pickupDropDetails.dropDate ? new Date(pickupDropDetails.dropDate).toLocaleDateString() : "N/A"})`,
      editable: true,
      field: "pickup",
      nestedKey: "departure",
    },
    {
      icon: <Group sx={{ fontSize: 16, mr: 0.5 }} />,
      text: `No of Guest: ${members.adults || 0}`,
      editable: true,
      field: "guests",
    },
  ];

  const tableHeaders = ["Vehicle Name", "Pickup", "Drop", "Cost"];

  const terms = "1. This is only a Quote. Availability is checked only on confirmation.\n2. Rates are subject to change without prior notice.\n3. All disputes are subject to Noida Jurisdiction only.";

  const footer = {
    contact: `${personalDetails.fullName || "N/A"} | ${personalDetails.mobile || "N/A"}`,
    phone: personalDetails.mobile || "N/A",
    email: personalDetails.emailId || "N/A",
    received: "₹ 0",
    balance: `₹ ${costDetails.totalCost || "N/A"}`,
    company: "Iconic Yatra",
    address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
    website: "https://www.iconicyatra.com",
  };

  const handleClientPdf = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 20;

    // Colors
    const primaryColor = [0, 102, 204]; // Blue
    const secondaryColor = [255, 153, 0]; // Orange
    const darkColor = [51, 51, 51]; // Dark gray
    const lightBlue = [240, 248, 255];
    const borderColor = [220, 220, 220];

    // Safe setFillColor
    const safeSetFillColor = (color) => {
      if (Array.isArray(color) && color.length === 3) {
        pdf.setFillColor(...color);
      } else if (typeof color === 'string') {
        pdf.setFillColor(color);
      } else {
        pdf.setFillColor(0, 0, 0); // fallback black
      }
    };

    // Add logo function
    const addLogo = (x, y, width = 40) => {
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', x, y, width, width * 0.3);
      } else {
        safeSetFillColor([240, 240, 240]);
        pdf.rect(x, y, width, width / 3, 'F'); // filled rect
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont(undefined, 'bold');
        pdf.text("ICONIC YATRA", x + width / 2, y + width / 6, { align: 'center' });
        pdf.setFontSize(6);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text("TRAVEL AND TOURISM AGENCY", x + width / 2, y + width / 4, { align: 'center' });
      }
    };

    // ---------- HEADER WITH CENTERED LOGO AND TITLE ----------
    const logoWidth = 40;
    const logoX = (210 - logoWidth) / 2;

    addLogo(logoX, 15, logoWidth);

    pdf.setFontSize(16);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("VEHICLE QUOTATION", 105, 15 + logoWidth * 0.3 + 10, { align: 'center' });

    y = 15 + logoWidth * 0.3 + 20;

    // ---------- Client Details ----------
    safeSetFillColor([250, 250, 250]);
    pdf.rect(15, y, 180, 45, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.rect(15, y, 180, 45);

    // Left side - Client info
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text("QUOTATION FOR", 20, y + 8);

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...darkColor);
    pdf.text(basicsDetails.clientName || "CLIENT NAME", 20, y + 16);

    // Add tour destination
    pdf.text(`Destination: ${lead.tourDetails.tourDestination || "N/A"}`, 20, y + 28);

    // Right side - Quotation details
    const today = new Date();
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);

    pdf.text(`Date: ${today.toLocaleDateString()}`, 120, y + 8);
    pdf.text(`Ref: ${vehicle.vehicleQuotationId || "N/A"}`, 120, y + 13);
    pdf.text(`Valid Until: ${pickupDropDetails.validTo || "N/A"}`, 120, y + 18);

    pdf.text(`Mobile: ${lead.personalDetails.mobile || "N/A"}`, 160, y + 8);
    if (lead.personalDetails.alternateNumber) {
      pdf.text(`Alt: ${lead.personalDetails.alternateNumber}`, 160, y + 13);
    }
    pdf.text(`Email:`, 160, y + 18);

    pdf.setFontSize(8);
    pdf.text(lead.personalDetails.emailId || "N/A", 160, y + 22, { maxWidth: 40 });

    y += 55;

    // ---------- About Us ----------
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("About Us", 15, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(undefined, 'normal');
    pdf.text("Iconic Yatra is a premier online tour operator platform specializing in both Domestic and", 15, y, { maxWidth: 180 });
    y += 5;
    pdf.text("International tour packages. We offer comprehensive travel services tailored to meet your needs.", 15, y, { maxWidth: 180 });
    y += 10;

    // ---------- Travel Details ----------
    safeSetFillColor([248, 248, 248]);
    pdf.rect(15, y, 180, 60, 'F');
    pdf.setDrawColor(...borderColor);
    pdf.rect(15, y, 180, 60);

    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("TRAVEL ITINERARY", 20, y + 8);

    pdf.setFontSize(10);
    pdf.setTextColor(...darkColor);

    // Calculate duration
    const pickupDate = pickupDropDetails.pickupDate ? new Date(pickupDropDetails.pickupDate) : null;
    const dropDate = pickupDropDetails.dropDate ? new Date(pickupDropDetails.dropDate) : null;
    let duration = "N/A";

    if (pickupDate && dropDate) {
      const timeDiff = dropDate.getTime() - pickupDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      duration = `${dayDiff} Days`;
    }

    // Arrival
    pdf.text("Arrival", 20, y + 18);
    pdf.setTextColor(80, 80, 80);
    pdf.text(pickupDropDetails.pickupLocation || "N/A", 20, y + 24, { maxWidth: 70 });
    pdf.text(pickupDate ? pickupDate.toLocaleDateString() : "N/A", 20, y + 30, { maxWidth: 70 });

    // Departure
    pdf.setTextColor(...darkColor);
    pdf.text("Departure", 110, y + 18);
    pdf.setTextColor(80, 80, 80);
    pdf.text(pickupDropDetails.dropLocation || "N/A", 110, y + 24, { maxWidth: 70 });
    pdf.text(dropDate ? dropDate.toLocaleDateString() : "N/A", 110, y + 30, { maxWidth: 70 });

    // Duration
    pdf.setTextColor(...darkColor);
    pdf.text("Duration", 20, y + 40);
    pdf.setTextColor(80, 80, 80);
    pdf.text(duration, 20, y + 46);

    // Guests
    pdf.setTextColor(...darkColor);
    pdf.text("Guests", 110, y + 40);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${members.adults || 0} Adults`, 110, y + 46);

    y += 70;

    // ---------- ITINERARY SECTION (NEW) ----------
    if (vehicle.itinerary && vehicle.itinerary.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(...primaryColor);
      pdf.setFont(undefined, 'bold');
      pdf.text("Daily Itinerary", 15, y);
      y += 8;

      // Itinerary header
      safeSetFillColor(primaryColor);
      pdf.rect(15, y, 180, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text("Day", 25, y + 5);
      pdf.text("Activities & Description", 60, y + 5);
      y += 8;

      // Itinerary items
      vehicle.itinerary.forEach((day, index) => {
        // Check if we need a new page
        if (y > 250) {
          pdf.addPage();
          addLogo(logoX, 15, logoWidth);
          y = 35;

          // Add header again on new page
          safeSetFillColor(primaryColor);
          pdf.rect(15, y, 180, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text("Day", 25, y + 5);
          pdf.text("Activities & Description", 60, y + 5);
          y += 8;
        }

        // Alternate row colors
        const rowColor = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        safeSetFillColor(rowColor);
        pdf.rect(15, y, 180, 25, 'F');
        pdf.setDrawColor(...borderColor);
        pdf.rect(15, y, 180, 25);

        // Day number with circle background
        safeSetFillColor(secondaryColor);
        pdf.circle(25, y + 12.5, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.text(day.title || `Day ${index + 1}`, 25, y + 13.5, { align: 'center' });

        // Description
        pdf.setTextColor(...darkColor);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');

        // Split description into multiple lines if too long
        const description = day.description || "Day activities will be shared separately";
        const lines = pdf.splitTextToSize(description, 120);

        // Calculate vertical position for centered text
        const textY = y + 8 + (25 - (lines.length * 4)) / 2;

        pdf.text(lines, 40, textY, { maxWidth: 120, lineHeightFactor: 1.2 });

        y += 27; // Increased height for better spacing
      });

      y += 5;
    }

    // ---------- Vehicle & Pricing ----------
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Vehicle & Pricing Details", 15, y);
    y += 8;

    const tableTop = y;

    // Table header
    safeSetFillColor(primaryColor);
    pdf.rect(15, tableTop, 180, 8, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, 'bold');
    pdf.text("Vehicle", 25, tableTop + 5);
    pdf.text("Pickup Date", 70, tableTop + 5);
    pdf.text("Drop Date", 115, tableTop + 5);
    pdf.text("Cost ", 160, tableTop + 5);

    // Table row
    pdf.setTextColor(...darkColor);
    pdf.setFont(undefined, 'normal');
    pdf.text(basicsDetails.vehicleType || "N/A", 25, tableTop + 15);
    pdf.text(pickupDropDetails.pickupDate ? new Date(pickupDropDetails.pickupDate).toLocaleDateString() : "N/A", 70, tableTop + 15);
    pdf.text(pickupDropDetails.dropDate ? new Date(pickupDropDetails.dropDate).toLocaleDateString() : "N/A", 115, tableTop + 15);

    pdf.text("INR" + (costDetails.totalCost || "0").toLocaleString('en-IN'), 160, tableTop + 15);

    // Total row
    safeSetFillColor([240, 240, 240]);
    pdf.rect(15, tableTop + 20, 180, 10, 'F');
    safeSetFillColor(secondaryColor);
    pdf.rect(135, tableTop + 20, 60, 10, 'F');

    pdf.setTextColor(...darkColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Total Package Cost", 25, tableTop + 26);

    pdf.setTextColor(255, 255, 255);
    pdf.text("INR" + (costDetails.totalCost || "0").toLocaleString('en-IN'), 160, tableTop + 26);

    y = tableTop + 35;

    if (y > 180) {
      pdf.addPage();
      addLogo(logoX, 15, logoWidth);
      y = 35;
    }

    // ---------- Policies ----------
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Package Policies", 15, y);
    y += 8;

    // Inclusions
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Inclusions:", 15, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(undefined, 'normal');
    defaultPolicies.inclusions.forEach(item => {
      pdf.text(`• ${item}`, 18, y);
      y += 5;
    });

    pdf.text("* Due to low temperature, AC will be off during hill station tours.", 18, y);
    y += 8;

    // Exclusions
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Exclusions:", 15, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(undefined, 'normal');
    defaultPolicies.exclusions.forEach(item => {
      pdf.text(`• ${item}`, 18, y);
      y += 5;
    });

    // Payment Terms
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Payment Terms:", 15, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text("• 50% advance at confirmation", 18, y);
    y += 5;
    pdf.text("• 50% balance 10 days before tour start", 18, y);
    y += 8;

    // Cancellation Policy
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Cancellation Policy:", 15, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text("• Before 15 days: 50% retention", 18, y);
    y += 5;
    pdf.text("• Within 7 days: 100% charges applicable", 18, y);
    y += 15;

    // ---------- Terms & Conditions ----------
    if (y > 170) {
      pdf.addPage();
      addLogo(logoX, 15, logoWidth);
      y = 35;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Terms & Conditions", 15, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(70, 70, 70);

    const terms = [
      "1. This quotation is subject to vehicle availability at the time of confirmation.",
      "2. Any route deviations or extra kilometers will incur additional charges payable directly to the driver.",
      "3. Additional sightseeing locations require separate payment to local operators.",
      "4. During peak seasons, traffic delays may occur. During winter, road conditions may be affected by snow.",
      "5. We recommend keeping buffer time for connections to avoid missing flights/trains.",
      "6. Company is not liable for missed connections due to unforeseen circumstances.",
      "7. Please inform in advance if you require GST invoice."
    ];

    terms.forEach((term, index) => {
      pdf.text(term, 18, y, { maxWidth: 175 });
      y += 6;
    });

    // Footer
    const pageHeight = pdf.internal.pageSize.height;
    y = pageHeight - 40;

    safeSetFillColor(primaryColor);
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, 195, y);
    y += 5;

    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.setFont(undefined, 'bold');
    pdf.text("Thanks & Regards,", 15, y);
    y += 5;

    pdf.setTextColor(...darkColor);
    pdf.setFont(undefined, 'normal');
    pdf.text("Amit Jaiswal | +91 7053900957", 15, y);
    y += 5;

    // Fix footer logo placement
    if (logoBase64) {
      const footerLogoWidth = 20;
      const footerLogoHeight = footerLogoWidth * 0.3;
      pdf.addImage(logoBase64, 'PNG', 15, y, footerLogoWidth, footerLogoHeight);
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.setFont(undefined, 'bold');
      pdf.text("ICONIC YATRA", 15 + footerLogoWidth + 5, y + footerLogoHeight / 2);
    } else {
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.setFont(undefined, 'bold');
      pdf.text("ICONIC YATRA", 15, y);
    }

    y += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("B-25 2nd Floor Sector 64, Noida, Uttar Pradesh – 201301", 15, y);
    y += 4;
    pdf.setTextColor(...primaryColor);
    pdf.text("https://www.iconicyatra.com | GST: 09EYCPK8832CIZC", 15, y);

    // Page numbers
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`IconicYatra_Quotation_${vehicle.vehicleQuotationId || "0000"}.pdf`);
  };


  return (
    <Box ref={pdfRef} sx={{ backgroundColor: 'white', minHeight: '100vh' }} >
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

        {isFinalized && !invoiceGenerated && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Receipt />}
            onClick={handleInvoicePdf(logoBase64)}
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
        <Grid item xs={12} md={3}>
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
                          <Typography variant="h5" color="primary" gutterBottom>
                            {Number(costDetails.totalCost || 0).toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            })}
                          </Typography>

                          <Typography variant="body1">
                            Pickup :{" "}
                            {pickupDropDetails.pickupDate
                              ? new Date(pickupDropDetails.pickupDate).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "2-digit", year: "numeric" }
                              )
                              : "N/A"}
                          </Typography>

                          <Typography variant="body1">
                            Drop :{" "}
                            {pickupDropDetails.dropDate
                              ? new Date(pickupDropDetails.dropDate).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "2-digit", year: "numeric" }
                              )
                              : "N/A"}
                          </Typography>
                        </Box>
                      ) : a.title === "Company Margin" ? (
                        <Typography variant="body2">
                          Company Margin details go here...
                        </Typography>
                      ) : (
                        <Typography variant="body2">Details go here.</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12} md={9}>
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
                  <DirectionsCar sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
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
                    This is only tentative schedule for sightseeing and travel. The actual sequence might change depending on the local conditions.
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleEditOpen(
                        "itineraryNote",
                        "This is only tentative schedule for sightseeing and travel. The actual sequence might change depending on the local conditions.",
                        "Itinerary Note"
                      )
                    }
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>

                {/* Fixed Itinerary Days Section - Uses local state */}
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

                      {localItinerary.length > 0 ? (
                        localItinerary.map((item, index) => (
                          <Box key={item._id || index} mb={2} p={1} sx={{ border: '1px dashed #ddd', borderRadius: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Typography variant="subtitle1" fontWeight="bold">
                                {item.title}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleEditItinerary(item, index)}
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
                        <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                          No itinerary added yet. Click "Add Day" to create your itinerary.
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
                      <TableRow>
                        <TableCell>
                          <DirectionsCar
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          {basicsDetails.vehicleType || "N/A"}
                        </TableCell>
                        <TableCell>
                          <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                          {pickupDropDetails.pickupDate ? new Date(pickupDropDetails.pickupDate).toLocaleDateString() : "N/A"}
                          <br />
                          <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                          {pickupDropDetails.pickupTime ? new Date(pickupDropDetails.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                          {pickupDropDetails.dropDate ? new Date(pickupDropDetails.dropDate).toLocaleDateString() : "N/A"}
                          <br />
                          <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                          {pickupDropDetails.dropTime ? new Date(pickupDropDetails.dropTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </TableCell>
                        <TableCell>₹{costDetails.totalCost || "N/A"}</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "grey.50" }}>
                        <TableCell>Discount</TableCell>
                        <TableCell colSpan={2} />
                        <TableCell>-₹{vehicle.discount || "0"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>GST ({vehicle.tax?.applyGst || "0%"})</TableCell>
                        <TableCell colSpan={2} />
                        <TableCell>
                          ₹{vehicle.tax?.applyGst ? (parseInt(costDetails.totalCost || 0) * parseInt(vehicle.tax.applyGst) / 100) : "0"}
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
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                          ₹{costDetails.totalCost || "N/A"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Grid container spacing={2} mt={1}>
                {Policies.map((p, i) => (
                  <Grid item xs={12} key={i}>
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
                          handleEditOpen("terms", terms, "Terms & Conditions")
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
                        "contact"
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

      {/* Finalize Dialog */}
      <FinalizeDialog
        open={openFinalize}
        onClose={handleFinalizeClose}
        vendor={vendor}
        setVendor={setVendor}
        onConfirm={handleConfirm}
      />

      {/* Bank Details Dialog */}
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

      {/* Add New Bank Dialog */}
      <AddBankDialog
        open={openAddBankDialog}
        onClose={handleAddBankClose}
        newBankDetails={newBankDetails}
        onNewBankChange={handleNewBankChange}
        onAddBank={handleAddBank}
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
        onClearService={handleClearService}
        onRemoveService={handleRemoveService}
        onSaveServices={handleSaveServices}
        taxOptions={taxOptions}
      />

      {/* Email Quotation Dialog */}
      <EmailQuotationDialog
        open={openEmailDialog}
        onClose={handleEmailClose}
        customer={{ name: basicsDetails.clientName || "N/A" }}
      />

      {/* Payment Dialog */}
      <MakePaymentDialog
        open={openPaymentDialog}
        onClose={handlePaymentClose}
      />

      {/* Itinerary Dialog - No loading state */}
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

export default VehicleQuotationPage;