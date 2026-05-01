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
    const [senderAccount, setSenderAccount] = useState("gmail1");
    const [htmlPreview, setHtmlPreview] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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
                if (list.length > 0) setSelectedCompanyId(list[0]._id);
            } catch (err) {
                console.error("Failed to fetch mail companies:", err);
            }
        };

        if (open) {
            fetchMailCompanies();
            const uniqueCities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
            uniqueCities.forEach(city => fetchHotelsForCity(city));
        }
    }, [open, hotels.length]);

    const fetchPreview = async () => {
        if (!quotation) return;
        setPreviewLoading(true);
        try {
            const endpoint = type === "quick" 
                ? `/quickQT/${quotation._id}/email/hotel-confirmation/preview`
                : `/customQT/${quotation._id}/email/hotel-confirmation/preview`;
            
            const res = await axios.post(endpoint, { 
                companyId: selectedCompanyId,
                customText: { additionalNote: customMessage } 
            });
            setHtmlPreview(type === "quick" ? res.data?.data?.html : res.data?.data?.html);
        } catch (err) {
            console.error("Failed to fetch preview:", err);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        if (open && quotation && selectedCompanyId) {
            fetchPreview();
        }
    }, [open, selectedCompanyId, customMessage, hotels]);

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
            const endpoint = type === "quick" 
                ? `/quickQT/${quotation._id}/email/hotel-confirmation`
                : `/customQT/${quotation._id}/email/hotel-confirmation`;
            
            await axios.post(endpoint, { 
                toEmail: recipientEmail,
                companyId: selectedCompanyId,
                senderAccount: senderAccount,
                customText: { additionalNote: customMessage } 
            });
            
            setSnackbar({ open: true, message: "Hotel confirmation mail sent!", severity: "success" });
        } catch (error) {
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
                        Email Configuration & Preview
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Sender Account"
                                value={senderAccount}
                                onChange={(e) => setSenderAccount(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            >
                                <MenuItem value="gmail1">Gmail Account 1</MenuItem>
                                <MenuItem value="gmail2">Gmail Account 2</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
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
                    </Grid>

                    <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: "bold", color: "text.secondary" }}>
                        LIVE PREVIEW
                    </Typography>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 1.5, 
                            maxHeight: 300, 
                            overflow: "auto", 
                            bgcolor: "#fff",
                            position: "relative",
                            minHeight: 100
                        }}
                    >
                        {previewLoading && (
                            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                        {htmlPreview ? (
                            <Box 
                                sx={{ zoom: 0.8 }}
                                dangerouslySetInnerHTML={{ __html: htmlPreview }} 
                            />
                        ) : (
                            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                No preview available. Fill details to generate.
                            </Typography>
                        )}
                    </Paper>
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
                            <Grid item xs={12} md={4}>
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
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="City"
                                    fullWidth
                                    size="small"
                                    value={hotel.city}
                                    onChange={(e) => handleChange(hotel.id, "city", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Nights"
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={hotel.nights}
                                    onChange={(e) => handleChange(hotel.id, "nights", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
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
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Room Type"
                                    fullWidth
                                    size="small"
                                    value={hotel.roomType}
                                    onChange={(e) => handleChange(hotel.id, "roomType", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="No of Rooms"
                                    fullWidth
                                    size="small"
                                    value={hotel.noOfRooms}
                                    onChange={(e) => handleChange(hotel.id, "noOfRooms", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Meal Plan"
                                    fullWidth
                                    size="small"
                                    value={hotel.mealPlan}
                                    onChange={(e) => handleChange(hotel.id, "mealPlan", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Contact No (Manager)"
                                    fullWidth
                                    size="small"
                                    value={hotel.contactNo}
                                    onChange={(e) => handleChange(hotel.id, "contactNo", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
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
        </Dialog>
    );
};

export default HotelConfirmationDialog;
