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
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon, Email as EmailIcon, Save as SaveIcon, Search as SearchIcon } from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
import axios from "../../../../../utils/axios";
import InvoiceView from "../../../../../Components/InvoiceView";
import html2pdf from "html2pdf.js";

const HotelConfirmationDialog = ({ open, onClose, quotation, type = "quick" }) => {
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
    const [receipts, setReceipts] = useState([]);
    const [selectedReceiptId, setSelectedReceiptId] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
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
                
                // If company was already selected or just fetched, try to set initial sender account
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
                // Use human-readable quotationId/quickQuotationId as the ref for payments
                const ref = quotation?.quotationId || quotation?.quickQuotationId || quotation?._id;
                if (!ref) return;

                const res = await axios.get(`/payment/by-quotation/${ref}`);
                const list = res.data?.data || [];
                // Filter only Receive Vouchers
                const receiveVouchers = list.filter(v => v.paymentType === "Receive Voucher");
                setReceipts(receiveVouchers);
                if (receiveVouchers.length > 0) {
                    setSelectedReceiptId(receiveVouchers[0]._id); // Latest first due to backend sort
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

    // Update sender account when company selection changes (and emailAccounts are already loaded)
    useEffect(() => {
        if (selectedCompanyId && emailAccounts.length > 0) {
            const firstAcc = emailAccounts.find(acc => (acc.companyId?._id || acc.companyId) === selectedCompanyId);
            if (firstAcc) setSenderAccount(firstAcc._id);
            else setSenderAccount("");
        }
    }, [selectedCompanyId, emailAccounts.length]);


    useEffect(() => {
        if (open && quotation) {
            setRecipientEmail(quotation.email || quotation.clientDetails?.email || "");
            // Pre-fill from existing confirmedHotels if any
            if (quotation.confirmedHotels && quotation.confirmedHotels.length > 0) {
                setHotels(quotation.confirmedHotels.map((h, i) => ({
                    ...h,
                    id: h.id || h._id || Date.now() + i
                })));
            } else {
                // Try to pre-fill from destinations
                const pkg = quotation.packageSnapshot || quotation.tourDetails || {};
                const qd = pkg.quotationDetails || quotation.tourDetails?.quotationDetails || {};
                const destinations = qd.destinations || pkg.destinationNights || pkg.stayLocations || [];

                const initialHotels = destinations.map((d, i) => {
                    const cityName = d.cityName || d.destination || d.city || "";
                    const nights = d.nights || 0;

                    // Try to guess hotel name from standard/deluxe/superior
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
                setHotels(initialHotels);
            }
        }
    }, [open, quotation]);

    const handleAddHotel = () => {
        setHotels([
            ...hotels,
            {
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
            },
        ]);
    };

    const handleRemoveHotel = (id) => {
        setHotels(hotels.filter((h) => h.id !== id));
    };

    const handleChange = (id, field, value) => {
        setHotels(
            hotels.map((h) => {
                if (h.id === id) {
                    const updated = { ...h, [field]: value };

                    // If city changed, fetch hotels for new city
                    if (field === "city" && value) {
                        fetchHotelsForCity(value);
                    }

                    // If hotelName changed, try to find and auto-fill details from this city's list
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
            })
        );
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
                // Wait for the hidden InvoiceView to potentially render/load
                // We'll give it a small timeout or just try to capture it
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
                // If we have the frontend PDF, we pass it. The backend should prioritize it.
                receiptPdf: receiptPdfAttachment,
                // Fallback for backend generation if frontend fails for some reason
                paymentVoucherId: selectedReceiptId,
                customText: { additionalNote: customMessage }
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
            <DialogTitle sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Hotel Confirmation Details
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddHotel}>
                    Add Destination
                </Button>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Fill in the details for each hotel. These will be used to generate the Hotel Confirmation Mailer.
                </Typography>

                <Box sx={{ mb: 3, p: 2, bgcolor: "#f0f7ff", borderRadius: 1, border: "1px solid #cce3ff" }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: "#1a237e", fontWeight: "bold" }}>
                        Email Configuration
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
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
                    </Grid>

                </Box>

                {hotels.map((hotel, index) => (
                    <Paper key={hotel.id || index} variant="outlined" sx={{ p: 2, mb: 2, position: "relative" }}>
                        <IconButton
                            size="small"
                            color="error"
                            sx={{ position: "absolute", top: 8, right: 8 }}
                            onClick={() => handleRemoveHotel(hotel.id)}
                        >
                            <DeleteIcon />
                        </IconButton>

                        <Grid container spacing={2}>
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
                            <Grid size={{ xs: 12, md: 2 }}>
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
                            <Grid size={{ xs: 12, md: 2 }}>
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
                            <Grid size={{ xs: 12, md: 2 }}>
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
                            <Grid size={{ xs: 12, md: 2 }}>
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
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Meal Plan"
                                    fullWidth
                                    size="small"
                                    value={hotel.mealPlan}
                                    onChange={(e) => handleChange(hotel.id, "mealPlan", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Contact No (Manager)"
                                    fullWidth
                                    size="small"
                                    value={hotel.contactNo}
                                    onChange={(e) => handleChange(hotel.id, "contactNo", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
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
                    <Box sx={{ textAlign: "center", py: 4, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                        <Typography color="text.secondary">No destinations added yet.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Save Details
                </Button>
                <Button
                    startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
                    variant="contained"
                    color="success"
                    onClick={handleSendMail}
                    disabled={sending || loading || hotels.length === 0}
                >
                    Send Mailer
                </Button>
            </DialogActions>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
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
        </Dialog>
    );
};

export default HotelConfirmationDialog;