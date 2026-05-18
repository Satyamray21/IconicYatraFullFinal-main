import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Snackbar,
    Alert,
    MenuItem,
    Chip,
    Tooltip,
    Divider,
} from "@mui/material";
import { 
    Delete as DeleteIcon, 
    Add as AddIcon, 
    Email as EmailIcon, 
    Save as SaveIcon, 
    Search as SearchIcon,
    CallSplit as SplitIcon,
    Sync as SyncIcon,
    Hotel as HotelIcon,
    CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
import axios from "../../../../../utils/axios";
import InvoiceView from "../../../../../Components/InvoiceView";
import html2pdf from "html2pdf.js";

const HotelConfirmationDialog = ({ open, onClose, quotation, type = "quick", quotationRef }) => {
    const [hotels, setHotels] = useState([]);
    const [hotelsMap, setHotelsMap] = useState({}); // { city: [hotels] }
    const [loading, setLoading] = useState(false);
    const [fetchingHotels, setFetchingHotels] = useState(false);
    const [sending, setSending] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [mailCompanies, setMailCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [emailAccounts, setEmailAccounts] = useState([]);
    const [senderAccount, setSenderAccount] = useState("");
    const [signatureHtml, setSignatureHtml] = useState("");
    const [receipts, setReceipts] = useState([]);
    const [selectedReceiptId, setSelectedReceiptId] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [splitTargetHotel, setSplitTargetHotel] = useState(null);
    const [splitFirstNights, setSplitFirstNights] = useState(1);
    const receiptHiddenRef = React.useRef();

    const fetchHotelsForCity = async (city) => {
        const trimmedCity = (city || "").trim();
        if (!trimmedCity || hotelsMap[trimmedCity]) return;

        try {
            const res = await axios.get(`/all-hotel?city=${encodeURIComponent(trimmedCity)}`);
            const cityHotels = res.data?.data || [];
            setHotelsMap(prev => ({ ...prev, [trimmedCity]: cityHotels }));
        } catch (err) {
            console.error(`Failed to fetch hotels for ${trimmedCity}:`, err);
        }
    };

    useEffect(() => {
        const fetchMailCompanies = async () => {
            try {
                const res = await axios.get("/company");
                const list = res.data?.data || [];
                setMailCompanies(list);
                if (list.length > 0) {
                    const firstCompanyId = list[0]._id;
                    setSelectedCompanyId(firstCompanyId);
                }
            } catch (err) {
                console.error("Failed to fetch mail companies:", err);
            }
        };

        const fetchEmailAccounts = async () => {
            try {
                const res = await axios.get("/email-accounts");
                const accounts = Array.isArray(res?.data?.data) ? res.data.data : [];
                setEmailAccounts(accounts);
                
                if (selectedCompanyId) {
                    const firstAcc = accounts.find(acc => (acc.companyId?._id || acc.companyId) === selectedCompanyId);
                    if (firstAcc) setSenderAccount(firstAcc._id);
                }
            } catch (err) {
                console.error("Failed to fetch email accounts:", err);
            }
        };

        const fetchReceipts = async () => {
            try {
                const ref = quotationRef || quotation?.quotationId || quotation?.quickQuotationId || quotation?._id;
                if (!ref) return;

                const res = await axios.get(`/payment/by-quotation/${ref}`);
                const list = res.data?.data || [];
                const receiveVouchers = list.filter(v => v.paymentType === "Receive Voucher");
                setReceipts(receiveVouchers);
                if (receiveVouchers.length > 0) {
                    setSelectedReceiptId(receiveVouchers[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch receipts:", err);
            }
        };

        if (open) {
            fetchMailCompanies();
            fetchEmailAccounts();
            fetchReceipts();
            const uniqueCities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
            uniqueCities.forEach(city => fetchHotelsForCity(city));
        }
    }, [open, hotels.length, quotation?._id]);

    useEffect(() => {
        if (selectedCompanyId && emailAccounts.length > 0) {
            const firstAcc = emailAccounts.find(acc => (acc.companyId?._id || acc.companyId) === selectedCompanyId);
            if (firstAcc) setSenderAccount(firstAcc._id);
            else setSenderAccount("");
        }
    }, [selectedCompanyId, emailAccounts.length]);

    useEffect(() => {
        const acc = emailAccounts.find(a => a._id === senderAccount);
        if (acc && acc.signature && (acc.signature.name || (acc.signature.mobile && acc.signature.mobile.some(m => m)) || (acc.signature.links && acc.signature.links.some(l => l)))) {
            let sigHtml = `<div style="margin-top: 15px; font-family: Arial, sans-serif;">`;
            sigHtml += `<p style="margin: 0;"><b>Warm Regards,</b></p>`;
            if (acc.signature.name) sigHtml += `<p style="margin: 0;"><b>${acc.signature.name}</b></p>`;
            if (acc.signature.mobile && acc.signature.mobile.length > 0) {
                const mobs = acc.signature.mobile.filter(m => m.trim());
                if (mobs.length > 0) sigHtml += `<p style="margin: 0;">Mobile: ${mobs.join(", ")}</p>`;
            }
            if (acc.signature.links && acc.signature.links.length > 0) {
                const links = acc.signature.links.filter(l => l.trim());
                if (links.length > 0) {
                    sigHtml += `<p style="margin: 0;">${links.map(l => `<a href="${l}" style="color: #0b5394; text-decoration: none;">${l}</a>`).join(" | ")}</p>`;
                }
            }
            sigHtml += `</div>`;
            setSignatureHtml(sigHtml);
        } else {
            setSignatureHtml("");
        }
    }, [senderAccount, emailAccounts]);

    const handleAutoFillDates = (currentHotels = hotels) => {
        const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
        if (!arrivalDateStr) {
            setSnackbar({ open: true, message: "Arrival date is missing in quotation to auto-fill dates", severity: "warning" });
            return;
        }

        let currentDate = new Date(arrivalDateStr);
        if (isNaN(currentDate.getTime())) {
            setSnackbar({ open: true, message: "Invalid arrival date in quotation", severity: "error" });
            return;
        }

        const updated = currentHotels.map((h) => {
            const checkIn = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
            const checkOut = new Date(currentDate);

            return {
                ...h,
                checkInDate: checkIn.toISOString().split('T')[0],
                checkOutDate: checkOut.toISOString().split('T')[0]
            };
        });

        setHotels(updated);
        setSnackbar({ open: true, message: "Dates synchronized successfully!", severity: "success" });
    };

    const handleSplitClick = (hotel) => {
        const nights = Number(hotel.nights || 1);
        if (nights <= 1) {
            setSnackbar({ open: true, message: "Cannot split a stay of 1 night", severity: "warning" });
            return;
        }
        setSplitTargetHotel(hotel);
        setSplitFirstNights(Math.max(1, nights - 1));
        setSplitDialogOpen(true);
    };

    const handleConfirmSplit = () => {
        if (!splitTargetHotel) return;
        const index = hotels.findIndex(h => h.id === splitTargetHotel.id);
        if (index === -1) return;

        const totalNights = Number(splitTargetHotel.nights || 2);
        const firstNights = Number(splitFirstNights);

        if (firstNights < 1 || firstNights >= totalNights) {
            setSnackbar({ open: true, message: `Please enter nights between 1 and ${totalNights - 1}`, severity: "warning" });
            return;
        }

        const secondNights = totalNights - firstNights;

        const updatedTarget = {
            ...splitTargetHotel,
            nights: firstNights
        };

        const newHotel = {
            ...splitTargetHotel,
            id: Date.now(),
            hotelName: "", // Let user select the new hotel name
            hotelAddress: "",
            contactNo: "",
            bookingPnr: "",
            nights: secondNights
        };

        const newHotels = [...hotels];
        newHotels.splice(index, 1, updatedTarget);
        newHotels.splice(index + 1, 0, newHotel);

        // Auto-recalculate dates for the new sequence
        const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
        if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
            let currentDate = new Date(arrivalDateStr);
            const recalculated = newHotels.map((h) => {
                const checkIn = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
                const checkOut = new Date(currentDate);

                return {
                    ...h,
                    checkInDate: checkIn.toISOString().split('T')[0],
                    checkOutDate: checkOut.toISOString().split('T')[0]
                };
            });
            setHotels(recalculated);
        } else {
            setHotels(newHotels);
        }

        setSplitDialogOpen(false);
        setSplitTargetHotel(null);
        setSnackbar({ open: true, message: `Stay split successfully: ${firstNights} Nights and ${secondNights} Nights!`, severity: "success" });
    };

    useEffect(() => {
        if (open && quotation) {
            setRecipientEmail(quotation.email || quotation.clientDetails?.email || "");
            
            if (quotation.confirmedHotels && quotation.confirmedHotels.length > 0) {
                setHotels(quotation.confirmedHotels.map((h, i) => ({
                    ...h,
                    id: h.id || h._id || Date.now() + i
                })));
            } else {
                const pkg = quotation.packageSnapshot || quotation.tourDetails || {};
                const qd = pkg.quotationDetails || quotation.tourDetails?.quotationDetails || {};
                const destinations = qd.destinations || pkg.destinationNights || pkg.stayLocations || [];

                let initialHotels = destinations.map((d, i) => {
                    const cityName = d.cityName || d.destination || d.city || "";
                    const nights = d.nights || 0;

                    const finalizedCat = (quotation.finalizedPackage || "Standard").toLowerCase();
                    const hotelNames = d[`${finalizedCat}Hotels`] || [];
                    const hotelName = hotelNames[0] || "";

                    return {
                        id: Date.now() + i,
                        hotelName: hotelName,
                        hotelAddress: "",
                        city: cityName,
                        nights: nights,
                        roomType: qd.rooms?.roomType || "",
                        noOfRooms: qd.rooms?.numberOfRooms?.toString() || "1",
                        checkInDate: "",
                        checkInTime: "12:00",
                        checkOutDate: "",
                        checkOutTime: "10:00",
                        mealPlan: qd.mealPlan || "CP Plan",
                        contactNo: "",
                        bookingPnr: "",
                    };
                });

                // Auto-fill dates on initial loading if arrival date exists
                const arrivalDateStr = quotation.tourDetails?.arrivalDate || quotation.arrivalDate || quotation.packageSnapshot?.quotationDetails?.arrivalDate;
                if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
                    let currentDate = new Date(arrivalDateStr);
                    initialHotels = initialHotels.map((h) => {
                        const checkIn = new Date(currentDate);
                        currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
                        const checkOut = new Date(currentDate);

                        return {
                            ...h,
                            checkInDate: checkIn.toISOString().split('T')[0],
                            checkOutDate: checkOut.toISOString().split('T')[0]
                        };
                    });
                }

                setHotels(initialHotels);
            }
        }
    }, [open, quotation]);

    const handleAddHotel = () => {
        const newHotel = {
            id: Date.now(),
            hotelName: "",
            hotelAddress: "",
            city: "",
            nights: 1,
            roomType: "",
            noOfRooms: "1",
            checkInDate: "",
            checkInTime: "12:00",
            checkOutDate: "",
            checkOutTime: "10:00",
            mealPlan: "",
            contactNo: "",
            bookingPnr: "",
        };

        const updatedHotels = [...hotels, newHotel];

        // Recalculate dates automatically for the whole sequence including the new stay
        const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
        if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
            let currentDate = new Date(arrivalDateStr);
            const recalculated = updatedHotels.map((h) => {
                const checkIn = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
                const checkOut = new Date(currentDate);

                return {
                    ...h,
                    checkInDate: checkIn.toISOString().split('T')[0],
                    checkOutDate: checkOut.toISOString().split('T')[0]
                };
            });
            setHotels(recalculated);
        } else {
            setHotels(updatedHotels);
        }
    };

    const handleRemoveHotel = (id) => {
        const remaining = hotels.filter((h) => h.id !== id);
        
        // Auto-recalculate dates for the remaining sequence
        const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
        if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
            let currentDate = new Date(arrivalDateStr);
            const recalculated = remaining.map((h) => {
                const checkIn = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
                const checkOut = new Date(currentDate);

                return {
                    ...h,
                    checkInDate: checkIn.toISOString().split('T')[0],
                    checkOutDate: checkOut.toISOString().split('T')[0]
                };
            });
            setHotels(recalculated);
        } else {
            setHotels(remaining);
        }
    };

    const handleChange = (id, field, value) => {
        let updatedHotels = hotels.map((h) => {
            if (h.id === id) {
                const updated = { ...h, [field]: value };

                if (field === "city" && value) {
                    fetchHotelsForCity(value);
                }

                if (field === "hotelName") {
                    const cityHotels = hotelsMap[h.city] || [];
                    const matched = cityHotels.find(ah => ah.hotelName === value);
                    if (matched) {
                        updated.hotelAddress = matched.location?.address || "";
                        updated.contactNo = matched.contactDetails?.mobile || matched.contactDetails?.contactPerson || "";
                    }
                }
                return updated;
            }
            return h;
        });

        // Recalculate check-in and check-out dates dynamically when nights change
        if (field === "nights") {
            const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
            if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
                let currentDate = new Date(arrivalDateStr);
                updatedHotels = updatedHotels.map((h) => {
                    const checkIn = new Date(currentDate);
                    currentDate.setDate(currentDate.getDate() + Number(h.nights || 1));
                    const checkOut = new Date(currentDate);

                    return {
                        ...h,
                        checkInDate: checkIn.toISOString().split('T')[0],
                        checkOutDate: checkOut.toISOString().split('T')[0]
                    };
                });
            }
        }

        setHotels(updatedHotels);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const endpoint = type === "quick"
                ? `/quickQT/${quotation._id}/save-confirmed-hotels`
                : `/customQT/${quotation._id}/save-confirmed-hotels`;

            await axios.post(endpoint, { confirmedHotels: hotels });

            setSnackbar({ open: true, message: "Hotel details saved successfully", severity: "success" });
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || "Failed to save", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSendMail = async () => {
        setSending(true);
        try {
            let receiptPdfAttachment = null;

            if (selectedReceiptId) {
                const element = document.getElementById("hidden-receipt-container");
                if (element) {
                    const opt = {
                        margin: 0.3,
                        filename: `Receipt_${selectedReceiptId}.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, logging: false },
                        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
                    };
                    
                    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
                    const reader = new FileReader();
                    receiptPdfAttachment = await new Promise((resolve) => {
                        reader.onloadend = () => resolve({
                            filename: `Payment_Receipt.pdf`,
                            contentBase64: reader.result.split(',')[1],
                            mimeType: "application/pdf"
                        });
                        reader.readAsDataURL(pdfBlob);
                    });
                }
            }

            const endpoint = type === "quick"
                ? `/quickQT/${quotation._id}/email/hotel-confirmation`
                : `/customQT/${quotation._id}/email/hotel-confirmation`;

            await axios.post(endpoint, {
                toEmail: recipientEmail,
                companyId: selectedCompanyId,
                senderAccount: senderAccount,
                receiptPdf: receiptPdfAttachment,
                paymentVoucherId: selectedReceiptId,
                customText: { additionalNote: customMessage, signature: signatureHtml }
            });

            setSnackbar({ open: true, message: "Hotel confirmation mail sent!", severity: "success" });
        } catch (error) {
            console.error("Failed to send mail:", error);
            setSnackbar({ open: true, message: error.response?.data?.message || "Failed to send mail", severity: "error" });
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ 
                fontWeight: "bold", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                color: "#fff",
                py: 2.25,
                px: 3,
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}>
                <Box display="flex" alignItems="center" gap={1.25}>
                    <HotelIcon sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>Hotel Confirmation Details</Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Tooltip title="Recalculate and fill check-in/out dates sequentially based on arrival date">
                        <Button 
                            startIcon={<SyncIcon />} 
                            variant="contained" 
                            size="small" 
                            onClick={() => handleAutoFillDates()}
                            sx={{ 
                                bgcolor: "rgba(255,255,255,0.15)", 
                                color: "#fff",
                                '&:hover': { bgcolor: "rgba(255,255,255,0.25)" },
                                textTransform: "none",
                                fontWeight: "bold"
                            }}
                        >
                            Sync Dates
                        </Button>
                    </Tooltip>
                    <Button 
                        startIcon={<AddIcon />} 
                        variant="contained" 
                        size="small" 
                        onClick={handleAddHotel}
                        sx={{ 
                            bgcolor: "#4caf50", 
                            color: "#fff",
                            '&:hover': { bgcolor: "#45a049" },
                            textTransform: "none",
                            fontWeight: "bold"
                        }}
                    >
                        Add Stay
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3, bgcolor: "#f8f9fa", mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Fill in the details for each hotel stay. Use <b>Sync Dates</b> to auto-calculate the dates sequentially based on package arrival date, or <b>Split Stay</b> to divide any multi-night destination stay.
                </Typography>

                <Box sx={{ mb: 4, p: 2.5, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e0e6ed", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                    <Typography variant="subtitle2" sx={{ mb: 2.5, color: "#1a237e", fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ display: "inline-block", width: 6, height: 16, backgroundColor: "#1e3c72", borderRadius: 2 }}></span>
                        Email & Receipt Configuration
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Send As Company"
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            >
                                {mailCompanies.map((c) => (
                                    <MenuItem key={c._id} value={c._id}>
                                        {c.companyName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Sender Account"
                                value={senderAccount}
                                onChange={(e) => setSenderAccount(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                                SelectProps={{
                                    renderValue: (selected) => {
                                        const acc = emailAccounts.find((a) => a._id === selected);
                                        return acc ? `${acc.label || acc.displayName} <${acc.email}>` : "Select Sender";
                                    },
                                }}
                                helperText={
                                    senderAccount && emailAccounts.find((a) => a._id === senderAccount)
                                        ? `Selected: ${emailAccounts.find((a) => a._id === senderAccount)?.email}`
                                        : ""
                                }
                            >
                                {emailAccounts
                                    .filter((acc) => {
                                        const accCompanyId = acc.companyId?._id || acc.companyId;
                                        if (selectedCompanyId) {
                                            return accCompanyId === selectedCompanyId;
                                        }
                                        return !accCompanyId;
                                    })
                                    .map((account) => (
                                        <MenuItem key={account._id} value={account._id}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {account.label || account.displayName || "No Label"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {account.email}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                {emailAccounts.filter(acc => (acc.companyId?._id || acc.companyId) === selectedCompanyId).length === 0 && (
                                    <MenuItem disabled>No email accounts configured for this company</MenuItem>
                                )}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Recipient Email"
                                placeholder="Enter recipient email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Additional Notes"
                                multiline
                                rows={1}
                                placeholder="Add a special message..."
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Attach Payment Receipt"
                                value={selectedReceiptId}
                                onChange={(e) => setSelectedReceiptId(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                                helperText={receipts.length === 0 ? "No receipts found for this quotation" : "Attach a receipt to the email"}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {receipts.map((r) => (
                                    <MenuItem key={r._id} value={r._id}>
                                        {r.invoiceId || r.receiptNumber} - ₹{r.amount} ({new Date(r.date).toLocaleDateString()})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        {signatureHtml && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ color: "#1a237e", fontWeight: "bold", mb: 1 }}>
                                    Signature Preview
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fff" }}>
                                    <Box dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: "#1e3c72", fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ display: "inline-block", width: 6, height: 16, backgroundColor: "#4caf50", borderRadius: 2 }}></span>
                        Stay Destinations & Hotels
                    </Typography>
                </Box>

                {hotels.map((hotel, index) => (
                    <Paper 
                        key={hotel.id || index} 
                        variant="outlined" 
                        sx={{ 
                            p: 3, 
                            mb: 3, 
                            position: "relative",
                            borderRadius: 2.5,
                            border: "1px solid #e0e6ed",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                            transition: "all 0.3s ease",
                            '&:hover': {
                                boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
                                borderColor: "#1e3c72"
                            },
                            borderLeft: "6px solid #1e3c72",
                            bgcolor: "#fff"
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} pb={1.5} borderBottom="1px solid #f0f4f8">
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Typography variant="subtitle1" fontWeight="bold" color="#1e3c72">
                                    🏨 Stay #${index + 1}
                                </Typography>
                                {hotel.city && (
                                    <Chip 
                                        label={hotel.city} 
                                        size="small" 
                                        sx={{ bgcolor: "#e8eaf6", color: "#1e3c72", fontWeight: "bold" }} 
                                    />
                                )}
                                <Chip 
                                    label={`${hotel.nights || 1} Night${(hotel.nights || 1) > 1 ? 's' : ''}`} 
                                    size="small" 
                                    color="secondary" 
                                    variant="outlined" 
                                    sx={{ fontWeight: "bold" }}
                                />
                            </Box>
                            
                            <Box display="flex" gap={1.25}>
                                {Number(hotel.nights || 1) > 1 && (
                                    <Tooltip title={`Split this ${hotel.nights}-night stay into two separate hotel bookings`}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<SplitIcon />}
                                            onClick={() => handleSplitClick(hotel)}
                                            sx={{ 
                                                textTransform: "none", 
                                                py: 0.25, 
                                                fontWeight: "bold",
                                                borderRadius: 1.5,
                                                borderColor: "#1e3c72",
                                                color: "#1e3c72",
                                                '&:hover': {
                                                    borderColor: "#122c5a",
                                                    bgcolor: "rgba(30, 60, 114, 0.04)"
                                                }
                                            }}
                                        >
                                            Split Stay
                                        </Button>
                                    </Tooltip>
                                )}
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveHotel(hotel.id)}
                                    sx={{ 
                                        bgcolor: "#ffebee", 
                                        color: "#d32f2f",
                                        '&:hover': { bgcolor: "#ffcdd2" },
                                        borderRadius: 1.5
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={(hotelsMap[hotel.city] || []).map((h) => h.hotelName)}
                                    value={hotel.hotelName}
                                    disabled={!hotel.city}
                                    onChange={(event, newValue) => handleChange(hotel.id, "hotelName", newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={hotel.city ? "Hotel Name" : "Select City First"}
                                            fullWidth
                                            onChange={(e) => handleChange(hotel.id, "hotelName", e.target.value)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="City"
                                    fullWidth
                                    size="small"
                                    value={hotel.city}
                                    onChange={(e) => handleChange(hotel.id, "city", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Nights"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={hotel.nights}
                                    onChange={(e) => handleChange(hotel.id, "nights", e.target.value)}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Hotel Address"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={hotel.hotelAddress}
                                    onChange={(e) => handleChange(hotel.id, "hotelAddress", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Room Type"
                                    fullWidth
                                    size="small"
                                    value={hotel.roomType}
                                    onChange={(e) => handleChange(hotel.id, "roomType", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="No of Rooms"
                                    fullWidth
                                    size="small"
                                    value={hotel.noOfRooms}
                                    onChange={(e) => handleChange(hotel.id, "noOfRooms", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Check-in Date"
                                    fullWidth
                                    size="small"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={hotel.checkInDate}
                                    onChange={(e) => handleChange(hotel.id, "checkInDate", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Check-in Time"
                                    fullWidth
                                    size="small"
                                    type="time"
                                    InputLabelProps={{ shrink: true }}
                                    value={hotel.checkInTime}
                                    onChange={(e) => handleChange(hotel.id, "checkInTime", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Check-out Date"
                                    fullWidth
                                    size="small"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={hotel.checkOutDate}
                                    onChange={(e) => handleChange(hotel.id, "checkOutDate", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    label="Check-out Time"
                                    fullWidth
                                    size="small"
                                    type="time"
                                    InputLabelProps={{ shrink: true }}
                                    value={hotel.checkOutTime}
                                    onChange={(e) => handleChange(hotel.id, "checkOutTime", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Meal Plan"
                                    fullWidth
                                    size="small"
                                    value={hotel.mealPlan}
                                    onChange={(e) => handleChange(hotel.id, "mealPlan", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Contact No (Manager)"
                                    fullWidth
                                    size="small"
                                    value={hotel.contactNo}
                                    onChange={(e) => handleChange(hotel.id, "contactNo", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Booking PNR / Confirmation"
                                    fullWidth
                                    size="small"
                                    value={hotel.bookingPnr}
                                    onChange={(e) => handleChange(hotel.id, "bookingPnr", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                ))}

                {hotels.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: 3, border: "1px dashed #ced4da" }}>
                        <Typography color="text.secondary" variant="body1">No hotel stays added yet. Click <b>Add Stay</b> to start.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "#f1f3f5", borderTop: "1px solid #e9ecef" }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: "bold", textTransform: "none" }}>Cancel</Button>
                <Button
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ fontWeight: "bold", textTransform: "none", bgcolor: "#1e3c72", '&:hover': { bgcolor: "#122c5a" } }}
                >
                    Save Details
                </Button>
                <Button
                    startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
                    variant="contained"
                    color="success"
                    onClick={handleSendMail}
                    disabled={sending || loading || hotels.length === 0}
                    sx={{ fontWeight: "bold", textTransform: "none", bgcolor: "#2e7d32", '&:hover': { bgcolor: "#1b5e20" } }}
                >
                    Send Mailer
                </Button>
            </DialogActions>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%', fontWeight: "bold", boxShadow: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Hidden container for PDF generation */}
            <Box sx={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1000px" }}>
                {selectedReceiptId && (
                    <div id="hidden-receipt-container">
                        <InvoiceView id={selectedReceiptId} hideButtons={true} />
                    </div>
                )}
            </Box>

            {/* Split Stay Dialog */}
            <Dialog 
                open={splitDialogOpen} 
                onClose={() => setSplitDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    }
                }}
            >
                <DialogTitle sx={{ 
                    fontWeight: "bold", 
                    textAlign: "center", 
                    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                    color: "#fff",
                    py: 2
                }}>
                    Split Stay Duration
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Choose how many nights to allocate to each split stay for <b>{splitTargetHotel?.city}</b>.
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Nights for First Stay"
                            type="number"
                            fullWidth
                            size="small"
                            inputProps={{ 
                                min: 1, 
                                max: splitTargetHotel ? Number(splitTargetHotel.nights || 2) - 1 : 1 
                            }}
                            value={splitFirstNights}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setSplitFirstNights(val);
                            }}
                            helperText={`Max nights for first stay: ${splitTargetHotel ? Number(splitTargetHotel.nights || 2) - 1 : 1}`}
                        />

                        <Divider />

                        <Box sx={{ bgcolor: "#f8f9fa", p: 2, borderRadius: 2, border: "1px dashed #ced4da" }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
                                Split Preview:
                            </Typography>
                            <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                    🏨 <b>Stay 1:</b> {splitFirstNights} Night{splitFirstNights > 1 ? 's' : ''}
                                </Typography>
                                <Typography variant="body2">
                                    🏨 <b>Stay 2:</b> {splitTargetHotel ? Number(splitTargetHotel.nights) - splitFirstNights : 0} Night{splitTargetHotel && (Number(splitTargetHotel.nights) - splitFirstNights) > 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f1f3f5" }}>
                    <Button onClick={() => setSplitDialogOpen(false)} color="inherit" sx={{ fontWeight: "bold", textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleConfirmSplit}
                        disabled={!splitFirstNights || splitFirstNights < 1 || (splitTargetHotel && splitFirstNights >= Number(splitTargetHotel.nights))}
                        sx={{ 
                            fontWeight: "bold", 
                            textTransform: "none", 
                            bgcolor: "#1e3c72", 
                            '&:hover': { bgcolor: "#122c5a" } 
                        }}
                    >
                        Split Now
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default HotelConfirmationDialog;