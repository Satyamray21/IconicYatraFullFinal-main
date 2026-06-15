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
    Undo as UndoIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
import axios from "../../../../../utils/axios";
import InvoiceView from "../../../../../Components/InvoiceView";
import html2pdf from "html2pdf.js";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { createHotelStep1, fetchHotels } from "../../../../../features/hotel/hotelSlice";
import { getLeadOptions } from "../../../../../features/leads/leadSlice";

const getQuotationSector = (q) => {
    if (!q) return "";
    return String(
        q.clientDetails?.sector ||
        q.packageSnapshot?.sector ||
        q.sector ||
        q.lead?.location?.state ||
        "",
    ).trim();
};

const getQuotationRoomType = (q) => {
    if (!q) return "";
    const qd =
        q.tourDetails?.quotationDetails ||
        q.packageSnapshot?.quotationDetails ||
        {};
    return String(
        qd.rooms?.roomType ||
        qd.roomType ||
        q.roomType ||
        "",
    ).trim();
};

const getQuotationRoomCount = (q) => {
    if (!q) return 1;
    const qd =
        q.tourDetails?.quotationDetails ||
        q.packageSnapshot?.quotationDetails ||
        {};
    return Number(
        qd.rooms?.numberOfRooms ||
        qd.noOfRooms ||
        qd.numberOfRooms ||
        q.noOfRooms ||
        1
    );
};

/** API expects category (standard/deluxe/superior); UI shows room type from quotation/options. */
const categoryForHotelPayload = (q, roomType = "") => {
    const pkg = String(q?.finalizedPackage || "").toLowerCase();
    if (["standard", "deluxe", "superior"].includes(pkg)) return pkg;
    const rt = String(roomType || getQuotationRoomType(q)).toLowerCase();
    if (rt.includes("superior")) return "superior";
    if (rt.includes("deluxe")) return "deluxe";
    return "standard";
};

const HotelConfirmationDialog = ({ open, onClose, quotation, type = "quick", quotationRef, onSaveSuccess }) => {
        const dispatch = useDispatch();
        const { options: leadOptions = [] } = useSelector((state) => state.leads);
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
    const [hotelsHistory, setHotelsHistory] = useState([]);
    const receiptHiddenRef = React.useRef();
    const prevOpenRef = React.useRef(false);

    // Add New Hotel Dialog states
    const [addHotelDialogOpen, setAddHotelDialogOpen] = useState(false);
    const [addHotelForStayId, setAddHotelForStayId] = useState(null);
    const [newHotelForm, setNewHotelForm] = useState({
        hotelName: "",
        city: "",
        state: "",
        country: "India",
        address: "",
        mobile: "",
        roomType: "",
    });

    const roomTypeOptions = React.useMemo(() => {
        const fromApi = (leadOptions || [])
            .filter((opt) => opt.fieldName === "roomType")
            .map((opt) => opt.value)
            .filter(Boolean);
        const fromQuotation = getQuotationRoomType(quotation);
        const merged = [...new Set([fromQuotation, ...fromApi].filter(Boolean))];
        return merged.length > 0 ? merged : ["Standard", "Deluxe", "Superior"];
    }, [leadOptions, quotation]);

    // Rich Booking Email states
    const [mailType, setMailType] = useState("booking"); // "hotel" or "booking"
    const [ccEmail, setCcEmail] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [salutation, setSalutation] = useState("");
    const [subject, setSubject] = useState("");
    const [greetLine, setGreetLine] = useState("");
    const [nextPayableAmount, setNextPayableAmount] = useState("");
    const [paymentDueDate, setPaymentDueDate] = useState(null);
    const [emailBody, setEmailBody] = useState("");

    const appendToMessage = (snippet) => {
        const current = emailBody || "";
        const separator = current && !current.endsWith("\n") ? "\n" : "";
        setEmailBody(`${current}${separator}${snippet}`);
    };

    const addPaymentReminderBlock = () => {
        const amount = String(nextPayableAmount || "").trim() || "2400";
        const dueDate = paymentDueDate
            ? dayjs(paymentDueDate).format("DD/MM/YYYY")
            : "DD/MM/YYYY";
        appendToMessage(
            `<p style="color:#d32f2f; font-weight:bold;"><b>Next Payable Amount:</b> INR ${amount}</p>`
        );
        appendToMessage(
            `<p><b>Payment Due Date:</b> ${dueDate}</p>`
        );
        appendToMessage(
            `<p style="color:#d32f2f; font-weight:bold;">Please clear your all dues as per the payment policy.</p>`
        );
        appendToMessage(
            `<p style="color:#2e7d32; font-weight:bold;">Kindly pay the next amount as per due date to avoid penalty or fine (10% on remaining amount).</p>`
        );
    };

    const saveToHistory = (currentHotels = hotels) => {
        setHotelsHistory((prev) => [...prev, JSON.parse(JSON.stringify(currentHotels))]);
    };

    const handleUndo = () => {
        if (hotelsHistory.length === 0) return;
        const previousState = hotelsHistory[hotelsHistory.length - 1];
        setHotels(previousState);
        setHotelsHistory((prev) => prev.slice(0, -1));
        setSnackbar({ open: true, message: "Last action undone successfully!", severity: "info" });
    };

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
            dispatch(getLeadOptions());
            const uniqueCities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
            uniqueCities.forEach(city => fetchHotelsForCity(city));
        }
    }, [open, hotels.length, quotation?._id, dispatch]);

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
        saveToHistory(currentHotels);
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

    const handleMoveHotel = (index, direction) => {
        saveToHistory();
        const nextHotels = [...hotels];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        
        // Swap elements
        const temp = nextHotels[index];
        nextHotels[index] = nextHotels[targetIndex];
        nextHotels[targetIndex] = temp;

        // Auto-recalculate dates for the new sequence if arrival date exists
        const arrivalDateStr = quotation?.tourDetails?.arrivalDate || quotation?.arrivalDate || quotation?.packageSnapshot?.quotationDetails?.arrivalDate;
        if (arrivalDateStr && !isNaN(new Date(arrivalDateStr).getTime())) {
            let currentDate = new Date(arrivalDateStr);
            const recalculated = nextHotels.map((h) => {
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
            setHotels(nextHotels);
        }
        setSnackbar({ open: true, message: `Stay moved ${direction}! Dates auto-synchronized.`, severity: "success" });
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
        saveToHistory();
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

    const fetchEmailPreview = async () => {
        if (!open || !quotation) return;
        try {
            if (mailType === "hotel") {
                const endpoint = type === "quick"
                    ? `/quickQT/${quotation._id}/email/hotel-confirmation/preview`
                    : `/customQT/${quotation._id}/email/hotel-confirmation/preview`;
                const res = await axios.post(endpoint, {
                    companyId: selectedCompanyId,
                    senderAccount: senderAccount,
                    customText: {
                        additionalNote: customMessage,
                        signature: signatureHtml,
                        nextPayableAmount: nextPayableAmount,
                        paymentDueDate: paymentDueDate ? dayjs(paymentDueDate).format("DD/MM/YYYY") : ""
                    },
                    nextPayableAmount: nextPayableAmount,
                    paymentDueDate: paymentDueDate ? dayjs(paymentDueDate).format("DD/MM/YYYY") : ""
                });
                if (res.data?.data?.html) {
                    setEmailBody(res.data.data.html);
                }
            } else if (mailType === "booking") {
                const endpoint = type === "quick"
                    ? `/quickQT/${quotation._id}/email/preview`
                    : `/customQT/${quotation.quotationId || quotation._id}/email/preview`;
                const res = await axios.post(endpoint, {
                    companyId: selectedCompanyId,
                    senderAccount: senderAccount,
                    customText: {
                        signature: signatureHtml,
                        booking: {
                            nextPayableAmount: nextPayableAmount,
                            dueDate: paymentDueDate ? dayjs(paymentDueDate).format("DD/MM/YYYY") : "",
                            signature: signatureHtml,
                        }
                    }
                });
                if (res.data?.data?.booking?.body) {
                    setEmailBody(res.data.data.booking.body);
                    if (res.data.data.booking.subject) {
                        setSubject(res.data.data.booking.subject);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch email preview:", err);
        }
    };

    useEffect(() => {
        if (open && quotation && selectedCompanyId && senderAccount) {
            fetchEmailPreview();
        }
    }, [open, mailType, selectedCompanyId, senderAccount, signatureHtml, nextPayableAmount, paymentDueDate]);

    useEffect(() => {
        if (open && quotation) {
            if (!prevOpenRef.current) {
                setRecipientEmail(quotation.email || quotation.clientDetails?.email || "");
                setRecipientName(quotation.clientDetails?.clientName || quotation.customerName || "");
                const qId = quotation.quotationId || quotation.quickQuotationId || quotation._id;
                setSubject(`Hotel Confirmation Voucher - ${qId || ""}`);
            }
            
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
                        roomType: qd.rooms?.roomType || qd.roomType || getQuotationRoomType(quotation),
                        noOfRooms: getQuotationRoomCount(quotation).toString(),
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
            prevOpenRef.current = open;
        } else {
            prevOpenRef.current = false;
        }
    }, [open, quotation]);

    const handleAddHotel = () => {
        saveToHistory();
        const newHotel = {
            id: Date.now(),
            hotelName: "",
            hotelAddress: "",
            city: "",
            nights: 1,
            roomType: getQuotationRoomType(quotation),
            noOfRooms: getQuotationRoomCount(quotation).toString(),
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
        saveToHistory();
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
                        updated.hotelAddress = matched.location?.address || matched.location?.address1 || "";
                        updated.contactNo = matched.contactDetails?.mobile || matched.contactDetails?.contactPerson || "";
                        updated.hotelState = matched.location?.state || "";
                        updated.hotelCountry = matched.location?.country || "India";
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

    const handleOpenAddHotelDialog = (stayId, cityName) => {
        setAddHotelForStayId(stayId);
        setNewHotelForm({
            hotelName: "",
            city: cityName || "",
            state: getQuotationSector(quotation),
            country: "India",
            address: "",
            mobile: "",
            roomType: getQuotationRoomType(quotation),
        });
        setAddHotelDialogOpen(true);
    };

    const handleCreateNewHotel = async () => {
        if (!newHotelForm.hotelName.trim()) {
            setSnackbar({ open: true, message: "Hotel name is required", severity: "warning" });
            return;
        }
        if (!newHotelForm.city.trim()) {
            setSnackbar({ open: true, message: "City is required", severity: "warning" });
            return;
        }

        try {
            const hotelFormData = new FormData();
            const locationData = {
                country: newHotelForm.country || "India",
                state: newHotelForm.state || "",
                city: newHotelForm.city,
                address: newHotelForm.address || "",
                pincode: "",
            };
            hotelFormData.append("location", JSON.stringify(locationData));
            hotelFormData.append("hotelName", newHotelForm.hotelName.trim());
            const roomType = String(newHotelForm.roomType || "").trim();
            if (roomType) {
                hotelFormData.append("roomType", roomType);
                hotelFormData.append("hotelType", JSON.stringify([roomType]));
            }
            hotelFormData.append(
                "category",
                categoryForHotelPayload(quotation, roomType),
            );

            const contactData = {
                mobile: newHotelForm.mobile || "",
                email: "",
            };
            hotelFormData.append("contactDetails", JSON.stringify(contactData));

            await dispatch(createHotelStep1(hotelFormData)).unwrap();

            // Refresh the global hotel list
            dispatch(fetchHotels());

            // Refresh the city-specific hotelsMap
            const trimmedCity = newHotelForm.city.trim();
            try {
                const res = await axios.get(`/all-hotel?city=${encodeURIComponent(trimmedCity)}`);
                const cityHotels = res.data?.data || [];
                setHotelsMap(prev => ({ ...prev, [trimmedCity]: cityHotels }));
            } catch (err) {
                console.error(`Failed to refresh hotels for ${trimmedCity}:`, err);
            }

            // Auto-fill the hotel fields in the stay
            if (addHotelForStayId) {
                setHotels(prev => prev.map(h => {
                    if (h.id === addHotelForStayId) {
                        return {
                            ...h,
                            hotelName: newHotelForm.hotelName.trim(),
                            hotelAddress: newHotelForm.address || "",
                            contactNo: newHotelForm.mobile || "",
                            city: newHotelForm.city || h.city,
                            roomType: roomType || h.roomType,
                        };
                    }
                    return h;
                }));
            }

            setSnackbar({ open: true, message: `Hotel "${newHotelForm.hotelName}" created successfully!`, severity: "success" });
            setAddHotelDialogOpen(false);
        } catch (err) {
            console.error("Failed to create hotel:", err);
            setSnackbar({ open: true, message: `Failed to create hotel: ${err.message || err}`, severity: "error" });
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const endpoint = type === "quick"
                ? `/quickQT/${quotation._id}/save-confirmed-hotels`
                : `/customQT/${quotation._id}/save-confirmed-hotels`;

            await axios.post(endpoint, { confirmedHotels: hotels });

            setSnackbar({ open: true, message: "Hotel details saved successfully", severity: "success" });
            if (onSaveSuccess) {
                onSaveSuccess();
            }
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

            if (selectedReceiptId && mailType === "booking") {
                // Wait 2500ms for async InvoiceView data to fully load
                await new Promise((resolve) => setTimeout(resolve, 2500));
                const element = document.getElementById("hotel-dialog-hidden-receipt-container");
                if (element) {
                    try {
                        const opt = {
                            margin: 0.2,
                            filename: `Receipt_${selectedReceiptId}.pdf`,
                            image: { type: "jpeg", quality: 0.98 },
                            html2canvas: { scale: 1.5, useCORS: true, logging: false },
                            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
                        };
                        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf("blob");
                        if (pdfBlob && pdfBlob.size >= 100) {
                            const reader = new FileReader();
                            receiptPdfAttachment = await new Promise((resolve, reject) => {
                                reader.onloadend = () =>
                                    resolve({
                                        filename: "Payment_Receipt.pdf",
                                        contentBase64: reader.result.split(",")[1],
                                        mimeType: "application/pdf",
                                    });
                                reader.onerror = reject;
                                reader.readAsDataURL(pdfBlob);
                            });
                        }
                    } catch (captureErr) {
                        console.error("Failed to capture receipt PDF:", captureErr);
                    }
                }
            }

            const endpoint = type === "quick"
                ? `/quickQT/${quotation._id}/email/hotel-confirmation`
                : `/customQT/${quotation._id}/email/hotel-confirmation`;

            await axios.post(endpoint, {
                toEmail: recipientEmail,
                cc: ccEmail || undefined,
                subject: subject,
                bodyHtml: emailBody,
                mailType: mailType,
                companyId: selectedCompanyId,
                senderAccount: senderAccount,
                receiptPdf: receiptPdfAttachment,
                paymentVoucherId: mailType === "booking" ? selectedReceiptId : undefined,
                nextPayableAmount: nextPayableAmount,
                paymentDueDate: paymentDueDate ? dayjs(paymentDueDate).format("DD/MM/YYYY") : "",
                customText: { 
                    additionalNote: customMessage, 
                    signature: signatureHtml,
                    nextPayableAmount: nextPayableAmount,
                    paymentDueDate: paymentDueDate ? dayjs(paymentDueDate).format("DD/MM/YYYY") : "",
                }
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                    {hotelsHistory.length > 0 && (
                        <Tooltip title="Undo last structural action (Split, Delete, Sync)">
                            <Button 
                                startIcon={<UndoIcon />} 
                                variant="contained" 
                                size="small" 
                                onClick={handleUndo}
                                sx={{ 
                                    bgcolor: "#e65100", 
                                    color: "#fff",
                                    '&:hover': { bgcolor: "#bf360c" },
                                    textTransform: "none",
                                    fontWeight: "bold"
                                }}
                            >
                                Undo Action
                            </Button>
                        </Tooltip>
                    )}
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
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Mail Type"
                                value={mailType}
                                onChange={(e) => setMailType(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            >
                                <MenuItem value="booking">Booking Confirmation</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
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
                        <Grid size={{ xs: 12, md: 4 }}>
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
                                label="Recipient Email (To)"
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
                                label="CC Email"
                                placeholder="Enter CC email"
                                value={ccEmail}
                                onChange={(e) => setCcEmail(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Recipient Name"
                                placeholder="Enter recipient name"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Salutation"
                                placeholder="Enter salutation (e.g. Mr., Ms.)"
                                value={salutation}
                                onChange={(e) => setSalutation(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Subject"
                                placeholder="Enter email subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Greet Line"
                                placeholder="Enter greet line"
                                value={greetLine}
                                onChange={(e) => setGreetLine(e.target.value)}
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

                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Next Payable Amount (INR)"
                                value={nextPayableAmount}
                                onChange={(e) => setNextPayableAmount(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <DatePicker
                                label="Payment Due Date"
                                value={paymentDueDate}
                                onChange={(newDate) => setPaymentDueDate(newDate)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        sx: { bgcolor: "#fff" }
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: "#1a237e", fontWeight: "bold" }}>
                                    Email Body (Editable HTML)
                                </Typography>
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="info" 
                                    onClick={fetchEmailPreview}
                                    sx={{ textTransform: "none", fontWeight: "bold", py: 0.25 }}
                                >
                                    Reset/Load Default Template
                                </Button>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => appendToMessage('<h3 style="color:#d32f2f; font-weight:bold;">YOUR HEADING</h3>')}
                                    sx={{ textTransform: "none", py: 0.25 }}
                                >
                                    Add Red Heading
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => appendToMessage("<p>Write your line here...</p>")}
                                    sx={{ textTransform: "none", py: 0.25 }}
                                >
                                    Add Line
                                </Button>
                                {mailType === "booking" && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={addPaymentReminderBlock}
                                        sx={{ textTransform: "none", py: 0.25 }}
                                    >
                                        Add Payment Reminder Block
                                    </Button>
                                )}
                            </Box>
                            <TextField
                                fullWidth
                                label="Message HTML"
                                multiline
                                minRows={8}
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ color: "#1a237e", fontWeight: "bold", mb: 1 }}>
                                Live Preview
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: "auto", bgcolor: "#fff" }}>
                                <Box
                                    sx={{ "& p": { m: 0, mb: 1 } }}
                                    dangerouslySetInnerHTML={{ __html: emailBody || "<p style='color: #666;'>No preview available</p>" }}
                                />
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ color: "#1a237e", fontWeight: "bold", mb: 1 }}>
                                Generated Signature (HTML)
                            </Typography>
                            <TextField
                                multiline
                                minRows={3}
                                fullWidth
                                size="small"
                                value={signatureHtml}
                                onChange={(e) => setSignatureHtml(e.target.value)}
                                sx={{ bgcolor: "#fff" }}
                            />
                        </Grid>
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
                                {index > 0 && (
                                    <Tooltip title="Move this stay up">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleMoveHotel(index, "up")}
                                            sx={{ 
                                                border: "1px solid #1e3c72", 
                                                color: "#1e3c72",
                                                borderRadius: 1.5,
                                                '&:hover': { bgcolor: "rgba(30, 60, 114, 0.04)" }
                                            }}
                                        >
                                            <ArrowUpwardIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {index < hotels.length - 1 && (
                                    <Tooltip title="Move this stay down">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleMoveHotel(index, "down")}
                                            sx={{ 
                                                border: "1px solid #1e3c72", 
                                                color: "#1e3c72",
                                                borderRadius: 1.5,
                                                '&:hover': { bgcolor: "rgba(30, 60, 114, 0.04)" }
                                            }}
                                        >
                                            <ArrowDownwardIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
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
                                    options={[
                                        ...(hotelsMap[hotel.city] || []).map((h) => h.hotelName),
                                        "__add_new"
                                    ]}
                                    value={hotel.hotelName}
                                    disabled={!hotel.city}
                                    onChange={(event, newValue) => {
                                        if (newValue === "__add_new") {
                                            handleOpenAddHotelDialog(hotel.id, hotel.city);
                                        } else {
                                            handleChange(hotel.id, "hotelName", newValue);
                                        }
                                    }}
                                    renderOption={(props, option) => {
                                        if (option === "__add_new") {
                                            return (
                                                <li {...props} key="__add_new" style={{ color: "#1976d2", fontWeight: 600, backgroundColor: "#f0f7ff", borderTop: "2px solid #1976d2" }}>
                                                    + Add New Hotel
                                                </li>
                                            );
                                        }
                                        return <li {...props} key={option}>{option}</li>;
                                    }}
                                    filterOptions={(options, params) => {
                                        const filtered = options.filter(opt => {
                                            if (opt === "__add_new") return true;
                                            return opt.toLowerCase().includes((params.inputValue || "").toLowerCase());
                                        });
                                        return filtered;
                                    }}
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
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={roomTypeOptions}
                                    inputValue={hotel.roomType || ""}
                                    onInputChange={(_event, newInputValue) =>
                                        handleChange(hotel.id, "roomType", newInputValue)
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Room Type"
                                            placeholder="Select or type room type"
                                        />
                                    )}
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

            {/* Add New Hotel Dialog */}
            <Dialog
                open={addHotelDialogOpen}
                onClose={() => setAddHotelDialogOpen(false)}
                maxWidth="sm"
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
                    Add New Hotel
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Create a new hotel entry. It will be saved to the database and available in the hotel list.
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Hotel Name *"
                                fullWidth
                                size="small"
                                value={newHotelForm.hotelName}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, hotelName: e.target.value }))}
                                autoFocus
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="City *"
                                fullWidth
                                size="small"
                                value={newHotelForm.city}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, city: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="State"
                                fullWidth
                                size="small"
                                value={newHotelForm.state}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, state: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Country"
                                fullWidth
                                size="small"
                                value={newHotelForm.country}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, country: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                freeSolo
                                size="small"
                                options={roomTypeOptions}
                                inputValue={newHotelForm.roomType || ""}
                                onInputChange={(_event, newInputValue) =>
                                    setNewHotelForm((prev) => ({
                                        ...prev,
                                        roomType: newInputValue,
                                    }))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Room Type"
                                        placeholder="Select or type room type"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Address"
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                value={newHotelForm.address}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Contact / Mobile"
                                fullWidth
                                size="small"
                                value={newHotelForm.mobile}
                                onChange={(e) => setNewHotelForm(prev => ({ ...prev, mobile: e.target.value }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f1f3f5" }}>
                    <Button onClick={() => setAddHotelDialogOpen(false)} color="inherit" sx={{ fontWeight: "bold", textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreateNewHotel}
                        sx={{ 
                            fontWeight: "bold", 
                            textTransform: "none", 
                            bgcolor: "#1e3c72", 
                            '&:hover': { bgcolor: "#122c5a" } 
                        }}
                    >
                        Create Hotel
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>

        {/* Hidden container for PDF generation */}
        <Box sx={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1000px" }}>
            {selectedReceiptId && (
                <div id="hotel-dialog-hidden-receipt-container">
                    <InvoiceView id={selectedReceiptId} hideButtons={true} />
                </div>
            )}
        </Box>
    </LocalizationProvider>
);
};

export default HotelConfirmationDialog;