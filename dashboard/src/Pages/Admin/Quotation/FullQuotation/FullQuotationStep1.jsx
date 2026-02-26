import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Grid,
    TextField,
    MenuItem,
    Button,
    Typography,
    Paper,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { step1CreateOrResume } from "../../../../features/quotation/fullQuotationSlice";
import {
    fetchCountries,
    fetchStatesByCountry,
    clearStates,
    fetchAllIndianCities,
    fetchAllCitiesByCountry
} from '../../../../features/location/locationSlice';
import FullQuotationStep2 from "./FullQuotationStep2";
import LeadOptionsManager from "../../../../Components/LeadOptionsManager";
import { getLeadOptions } from "../../../../features/leads/leadSlice";
import { Settings as SettingsIcon } from "@mui/icons-material";

// ------------------- VALIDATION -------------------
const validationSchema = Yup.object({
    clientName: Yup.string().required("Required"),
    sector: Yup.string().required("Required"),
    arrivalDate: Yup.date().required("Required"),
    departureDate: Yup.date().required("Required"),
    quotationTitle: Yup.string().required("Required"),
    services: Yup.array().min(1, "At least one service is required").required(),
});

// ------------------- SECTION WRAPPER -------------------
const Section = ({ title, children }) => (
    <Paper
        sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            backgroundColor: "#fafafa",
            boxShadow: 2,
        }}
    >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {title}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            {children}
        </Grid>
    </Paper>
);

// ------------------- COMPONENT -------------------
const FullQuotationStep1 = ({ quotationId, onNextStep }) => {
    const dispatch = useDispatch();
    const [openOptionDialog, setOpenOptionDialog] = useState(false);
    const [manageField, setManageField] = useState("");
    const [showStep2, setShowStep2] = useState({ show: false, quotationId: null });

    const { countries, states, cities } = useSelector((state) => state.location);
    const { options } = useSelector((state) => state.leads);

    // Dynamic field options
    const [servicesList, setServicesList] = useState([]);
    const [hotelTypeList, setHotelTypeList] = useState([]);
    const [mealPlanList, setMealPlanList] = useState([]);
    const [sharingTypeList, setSharingTypeList] = useState([]);
    const [arrivalLocationList, setArrivalLocationList] = useState([]);
    const [departureLocationList, setDepartureLocationList] = useState([]);

    // ------------------- FETCH LEAD OPTIONS -------------------
    useEffect(() => {
        dispatch(getLeadOptions());
    }, [dispatch]);

    useEffect(() => {
        if (Array.isArray(options)) {
            const services = [];
            const hotelTypes = [];
            const mealPlans = [];
            const sharingTypes = [];
            const arrivalLocations = [];
            const departureLocations = [];

            options.forEach((opt) => {
                switch (opt.fieldName) {
                    case "services":
                        services.push(opt.value);
                        break;
                    case "hotelType":
                        hotelTypes.push(opt.value);
                        break;
                    case "mealPlan":
                        mealPlans.push(opt.value);
                        break;
                    case "sharingType":
                        sharingTypes.push(opt.value);
                        break;
                    case "arrivalLocation":
                        arrivalLocations.push(opt.value);
                        break;
                    case "departureLocation":
                        departureLocations.push(opt.value);
                        break;
                    default:
                        break;
                }
            });

            setServicesList(Array.from(new Set(services)));
            setHotelTypeList(Array.from(new Set(hotelTypes)));
            setMealPlanList(Array.from(new Set(mealPlans)));
            setSharingTypeList(Array.from(new Set(sharingTypes)));
            setArrivalLocationList(Array.from(new Set(arrivalLocations)));
            setDepartureLocationList(Array.from(new Set(departureLocations)));
        }
    }, [options]);

    // ------------------- FORMIK -------------------
    const formik = useFormik({
        initialValues: {
            clientName: "",
            tourType: "Domestic",
            sector: "",
            showCostPerAdult: false,
            services: [],
            adults: "",
            children: "",
            kids: "",
            infants: "",
            withoutMattress: false,
            hotelType: "",
            mealPlan: "",
            transport: "",
            sharingType: "",
            noOfRooms: "",
            noOfMattress: 0,
            arrivalDate: null,
            arrivalCity: "",
            arrivalLocation: "",
            departureDate: null,
            departureCity: "",
            departureLocation: "",
            nights: "",
            validFrom: null,
            validTill: null,
            createBy: "New Quotation",
            quotationTitle: "",
            initialNotes: "This is only tentative schedule for sightseeing and travel...",
            banner: null,
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const formData = new FormData();

                // ---------------- CLIENT DETAILS ----------------
                formData.append("clientDetails", JSON.stringify({
                    clientName: values.clientName,
                    tourType: values.tourType,
                    sector: values.sector,
                    showCostPerAdult: values.showCostPerAdult,
                    servicesRequired: values.services,
                    members: {
                        adults: values.adults,
                        children: values.children,
                        kidsWithoutMattress: values.kids,
                        infants: values.infants,
                    },
                }));

                // ---------------- ACCOMMODATION ----------------
                formData.append("accommodation", JSON.stringify({
                    hotelType: [values.hotelType],
                    mealPlan: values.mealPlan,
                    transport: values.transport === "Yes",
                    sharingType: values.sharingType,
                    noOfRooms: values.noOfRooms,
                    noOfMattress: values.noOfMattress,
                    noOfNights: values.nights,
                }));

                // ---------------- PICKUP / DROP ----------------
                formData.append("pickupDrop", JSON.stringify({
                    arrivalDate: values.arrivalDate,
                    arrivalCity: values.arrivalCity,
                    arrivalLocation: values.arrivalLocation,
                    departureDate: values.departureDate,
                    departureCity: values.departureCity,
                    departureLocation: values.departureLocation,
                }));

                // ---------------- QUOTATION VALIDITY ----------------
                formData.append("quotationValidity", JSON.stringify({
                    validFrom: values.validFrom,
                    validTill: values.validTill,
                }));

                // ---------------- QUOTATION INFO ----------------
                formData.append("quotation", JSON.stringify({
                    createBy: values.createBy,
                    quotationTitle: values.quotationTitle,
                    initalNotes: values.initialNotes,
                }));

                // ---------------- BANNER IMAGE ----------------
                if (values.banner) {
                    formData.append("bannerImage", values.banner); // <-- matches backend multer field name
                }

                // ---------------- DISPATCH API ----------------
                const resultAction = await dispatch(step1CreateOrResume(formData));

                if (step1CreateOrResume.fulfilled.match(resultAction)) {
                    const quotationId = resultAction.payload?.quotationId;
                    if (quotationId && typeof onNextStep === "function") {
                        onNextStep(quotationId); // move to Step 2
                    }
                } else {
                    console.error("❌ Error saving Step 1:", resultAction.payload);
                }
            } catch (error) {
                console.error("Submission error:", error);
            } finally {
                setSubmitting(false);
            }
        }

    });

    // ------------------- LOCATION LOGIC -------------------
    useEffect(() => {
        if (formik.values.tourType === "Domestic") {
            dispatch(fetchStatesByCountry("India"));
        } else {
            dispatch(clearStates());
            dispatch(fetchCountries());
        }
    }, [formik.values.tourType, dispatch]);

    useEffect(() => {
        formik.setFieldValue("sector", "");
    }, [formik.values.tourType]);

    useEffect(() => {
        const { tourType, sector } = formik.values;
        if (!sector) return;

        if (tourType === "Domestic") {
            dispatch(fetchAllIndianCities());
        } else if (tourType === "International") {
            dispatch(fetchAllCitiesByCountry(sector));
        }
    }, [formik.values.tourType, formik.values.sector, dispatch]);

    // ------------------- ADD OPTION -------------------
    const handleAddOption = (newOption) => {
        if (!newOption) return;

        switch (manageField) {
            case "services":
                if (!servicesList.includes(newOption)) {
                    setServicesList([...servicesList, newOption]);
                    formik.setFieldValue("services", [...formik.values.services, newOption]);
                }
                break;
            case "hotelType":
                if (!hotelTypeList.includes(newOption)) {
                    setHotelTypeList([...hotelTypeList, newOption]);
                    formik.setFieldValue("hotelType", newOption);
                }
                break;
            case "mealPlan":
                if (!mealPlanList.includes(newOption)) {
                    setMealPlanList([...mealPlanList, newOption]);
                    formik.setFieldValue("mealPlan", newOption);
                }
                break;
            case "sharingType":
                if (!sharingTypeList.includes(newOption)) {
                    setSharingTypeList([...sharingTypeList, newOption]);
                    formik.setFieldValue("sharingType", newOption);
                }
                break;
            case "arrivalLocation":
                if (!arrivalLocationList.includes(newOption)) {
                    setArrivalLocationList([...arrivalLocationList, newOption]);
                    formik.setFieldValue("arrivalLocation", newOption);
                }
                break;
            case "departureLocation":
                if (!departureLocationList.includes(newOption)) {
                    setDepartureLocationList([...departureLocationList, newOption]);
                    formik.setFieldValue("departureLocation", newOption);
                }
                break;
            default:
                break;
        }

        setOpenOptionDialog(false);
    };

    const pickupDropFields = [
        { name: "arrivalDate", label: "Arrival Date", type: "date" },
        { name: "arrivalCity", label: "Arrival City" },
        { name: "arrivalLocation", label: "Arrival Location" },
        { name: "departureDate", label: "Departure Date", type: "date" },
        { name: "departureCity", label: "Departure City" },
        { name: "departureLocation", label: "Departure Location" },
    ];
    // ------------------- AUTO CALCULATE NIGHTS -------------------
    useEffect(() => {
        const { arrivalDate, departureDate } = formik.values;
        if (arrivalDate && departureDate) {
            const diffTime = new Date(departureDate).getTime() - new Date(arrivalDate).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            formik.setFieldValue("nights", diffDays > 0 ? diffDays : 0);
        }
    }, [formik.values.arrivalDate, formik.values.departureDate]);

    // ------------------- RENDER STEP 2 -------------------
    if (showStep2.show) {
        return <FullQuotationStep2 quotationId={showStep2.quotationId} formData={formik.values} />;
    }

    // ------------------- MEMOIZED OPTIONS -------------------
    const memoizedStates = useMemo(() => states || [], [states]);
    const memoizedCountries = useMemo(() => countries || [], [countries]);

    // ------------------- RENDER -------------------
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <form onSubmit={formik.handleSubmit}>
                {/* Client Details */}
                <Section title="Client Details">
                    <Grid size={{ xs: 3 }}>
                        <TextField
                            fullWidth
                            name="clientName"
                            label="Client Name"
                            value={formik.values.clientName}
                            onChange={formik.handleChange}
                            error={formik.touched.clientName && !!formik.errors.clientName}
                            helperText={formik.touched.clientName && formik.errors.clientName}
                            placeholder="Enter client name"
                        />
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Tour Type</Typography>
                        <RadioGroup row name="tourType" value={formik.values.tourType} onChange={formik.handleChange}>
                            {["Domestic", "International"].map((t) => (
                                <FormControlLabel key={t} value={t} control={<Radio />} label={t} />
                            ))}
                        </RadioGroup>
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                        <TextField
                            select
                            fullWidth
                            name="sector"
                            label={formik.values.tourType === "Domestic" ? "State" : "Country"}
                            value={formik.values.sector}
                            onChange={formik.handleChange}
                        >
                            {(formik.values.tourType === "Domestic" ? memoizedStates : memoizedCountries).map((s) => (
                                <MenuItem key={s.isoCode || s.name} value={s.name}>{s.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                        <FormControlLabel
                            control={<Checkbox name="showCostPerAdult" checked={formik.values.showCostPerAdult} onChange={formik.handleChange} />}
                            label="Show Cost Per Adult"
                        />
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="body2" fontWeight={600}>Services Required</Typography>
                            <IconButton color="primary" onClick={() => { setManageField("services"); setOpenOptionDialog(true); }}>
                                <SettingsIcon />
                            </IconButton>
                        </Box>
                        <Autocomplete
                            multiple
                            options={servicesList}
                            value={formik.values.services}
                            onChange={(_, val) => formik.setFieldValue("services", val)}
                            renderInput={(params) => <TextField {...params} label="Select Services" />}
                        />
                    </Grid>

                    {["adults", "children", "kids", "infants"].map((f) => (
                        <Grid size={{ xs: 3 }} key={f}>
                            <TextField
                                fullWidth
                                name={f}
                                label={`No of ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                                value={formik.values[f]}
                                onChange={formik.handleChange}
                            />
                        </Grid>
                    ))}

                    <Grid size={{ xs: 6 }}>
                        <FormControlLabel
                            control={<Checkbox name="withoutMattress" checked={formik.values.withoutMattress} onChange={formik.handleChange} />}
                            label="Without Mattress"
                            sx={{ color: "orange" }}
                        />
                    </Grid>
                </Section>

                {/* Accommodation & Facility */}
                <Section title="Accommodation & Facility">
                    {[["hotelType", hotelTypeList], ["mealPlan", mealPlanList], ["sharingType", sharingTypeList]].map(([field, list]) => (
                        <Grid size={{ xs: 3 }} key={field}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                </Typography>
                                <IconButton color="primary" onClick={() => { setManageField(field); setOpenOptionDialog(true); }}>
                                    <SettingsIcon />
                                </IconButton>
                            </Box>
                            <TextField select fullWidth name={field} value={formik.values[field]} onChange={formik.handleChange}>
                                {list.map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
                            </TextField>
                        </Grid>
                    ))}

                    <Grid size={{ xs: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Transport</Typography>
                        <RadioGroup row name="transport" value={formik.values.transport} onChange={formik.handleChange}>
                            {["Yes", "No"].map((t) => <FormControlLabel key={t} value={t} control={<Radio />} label={t} />)}
                        </RadioGroup>
                    </Grid>

                    {["noOfRooms", "noOfMattress"].map((f) => (
                        <Grid size={{ xs: 3 }} key={f}>
                            <TextField
                                fullWidth
                                name={f}
                                label={f === "noOfMattress" ? "No of Mattress" : "No of Rooms"}
                                type={f === "noOfMattress" ? "number" : "text"}
                                value={formik.values[f]}
                                onChange={formik.handleChange}
                            />
                        </Grid>
                    ))}
                </Section>

                {/* Pickup / Drop */}
                {/* Pickup / Drop */}
                <Section title="Pickup / Drop">
                    {pickupDropFields.map((f) => (
                        <Grid size={{ xs: 3 }} key={f.name}>
                            {f.type === "date" ? (
                                <DatePicker
                                    label={f.label}
                                    value={formik.values[f.name]}
                                    onChange={(v) => formik.setFieldValue(f.name, v)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            ) : f.name === "arrivalCity" || f.name === "departureCity" ? (
                                <Autocomplete
                                    options={cities}
                                    value={formik.values[f.name]}
                                    onChange={(_, val) => formik.setFieldValue(f.name, val || "")}
                                    renderInput={(params) => <TextField {...params} label={f.label} fullWidth />}
                                />
                            ) : (
                                <Box>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>{f.label}</Typography>
                                        <IconButton
                                            color="primary"
                                            onClick={() => {
                                                setManageField(f.name);
                                                setOpenOptionDialog(true);
                                            }}
                                            size="small"
                                        >
                                            <SettingsIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <TextField
                                        select
                                        fullWidth
                                        name={f.name}
                                        value={formik.values[f.name]}
                                        onChange={formik.handleChange}
                                    >
                                        {(f.name === "arrivalLocation" ? arrivalLocationList : departureLocationList).map((o) => (
                                            <MenuItem key={o} value={o}>{o}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            )}
                        </Grid>
                    ))}
                    <Grid size={{ xs: 3 }}>
                        <TextField
                            fullWidth
                            name="nights"
                            label="Nights"
                            type="number"
                            value={formik.values.nights}
                            InputProps={{ readOnly: true }}
                        />

                    </Grid>
                </Section>


                {/* Quotation Validity */}
                <Section title="Quotation Validity">
                    {["validFrom", "validTill"].map((f) => (
                        <Grid size={{ xs: 3 }} key={f}>
                            <DatePicker
                                label={f === "validFrom" ? "Valid From" : "Valid Till"}
                                value={formik.values[f]}
                                onChange={(v) => formik.setFieldValue(f, v)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                    ))}
                </Section>

                {/* Quotation */}
                <Section title="Quotation">
                    <Grid size={{ xs: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Create By</Typography>
                        <RadioGroup row name="createBy" value={formik.values.createBy} onChange={formik.handleChange}>
                            <FormControlLabel value="New Quotation" control={<Radio />} label="New Quotation" />
                        </RadioGroup>
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                        <TextField
                            fullWidth
                            name="quotationTitle"
                            label="Quotation Title"
                            value={formik.values.quotationTitle}
                            onChange={formik.handleChange}
                            error={formik.touched.quotationTitle && !!formik.errors.quotationTitle}
                            helperText={formik.touched.quotationTitle && formik.errors.quotationTitle}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            name="initialNotes"
                            label="Initial Notes"
                            value={formik.values.initialNotes}
                            onChange={formik.handleChange}
                            InputProps={{ sx: { color: "#555" } }}
                        />
                        <Typography variant="caption" color="green">{formik.values.initialNotes.length}/200 characters</Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Select Banner Image (860px X 400px)</Typography>
                        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                            Upload
                            <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={(e) => {
                                    if (e.currentTarget.files && e.currentTarget.files[0]) {
                                        formik.setFieldValue("banner", e.currentTarget.files[0]);
                                    }
                                }}
                            />
                        </Button>

                    </Grid>
                </Section>

                <Box textAlign="right" mt={3}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? "Saving..." : "Next Step"}
                    </Button>

                </Box>
            </form>

            {/* Lead Options Dialog */}
            <Dialog open={openOptionDialog} onClose={() => setOpenOptionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Manage {manageField} Options</DialogTitle>
                <DialogContent>
                    <LeadOptionsManager fieldName={manageField} onAdd={handleAddOption} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenOptionDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default FullQuotationStep1;