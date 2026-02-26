// ==================== FULL FIXED FILE ====================
// customquotationStep6.jsx

import React from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Button,
    Card,
    CardContent,
} from "@mui/material";

import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { createCustomQuotation } from "../../../../features/quotation/customQuotationSlice";
import { toast } from "react-toastify";

// =====================================================
// VALIDATION SCHEMA
// =====================================================
const validationSchema = yup.object({
    adult: yup.number().min(0).required(),
    child: yup.number().min(0),
    kid: yup.number().min(0),
    infants: yup.number().min(0),
    mediPlan: yup.string().required(),
    noOfRooms: yup.number().min(1).required(),
    roomType: yup.string().required(),
    sharingType: yup.string().required(),
    noOfMattress: yup.number().min(0),
    superiorMattressCost: yup.number().min(0),
    deluxeMattressCost: yup.number().min(0),
    marginPercent: yup.number().min(0),
    marginAmount: yup.number().min(0),
    discount: yup.number().min(0),
    gstOn: yup.string(),
    taxPercent: yup.number().min(0),
    regardsText: yup.string(),
    signedBy: yup.string(),
});

// =====================================================
// MAIN COMPONENT
// =====================================================
const CustomQuotationForm = ({ formData, leadData, onSubmit, loading }) => {
    const dispatch = useDispatch();
    const { clientDetails, pickupDrop, tourDetails } = formData;
    const cities = pickupDrop || [];

    // =====================================================
    // INITIALIZE CITY PRICE OBJECTS
    // =====================================================
    const initializeCityPrices = (cities) =>
        cities.reduce((acc, city, index) => {
            acc[index] = {
                standardHotelName: "",
                standardPrice: "",
                deluxeHotelName: "",
                deluxePrice: "",
            };
            return acc;
        }, {});

    // =====================================================
    // FORMIK INITIAL VALUES
    // =====================================================
    const formik = useFormik({
        initialValues: {
            adult: tourDetails?.quotationDetails?.adults || 0,
            child: tourDetails?.quotationDetails?.children || 0,
            kid: tourDetails?.quotationDetails?.kids || 0,
            infants: tourDetails?.quotationDetails?.infants || 0,

            mediPlan: tourDetails?.quotationDetails?.mealPlan || "",
            noOfRooms: tourDetails?.quotationDetails?.rooms?.numberOfRooms || 1,
            roomType: tourDetails?.quotationDetails?.rooms?.roomType || "",
            sharingType: tourDetails?.quotationDetails?.rooms?.sharingType || "",

            noOfMattress: tourDetails?.quotationDetails?.rooms?.mattress || 0,

            superiorMattressCost:
                tourDetails?.quotationDetails?.mattress?.superiorMattressCost || 0,
            deluxeMattressCost:
                tourDetails?.quotationDetails?.mattress?.deluxeMattressCost || 0,

            cityPrices: initializeCityPrices(cities),

            marginPercent:
                tourDetails?.quotationDetails?.companyMargin?.marginPercent || 0,
            marginAmount:
                tourDetails?.quotationDetails?.companyMargin?.marginAmount || 0,

            discount: tourDetails?.quotationDetails?.discount || 0,

            gstOn: tourDetails?.quotationDetails?.taxes?.gstOn || "Full",
            taxPercent: tourDetails?.quotationDetails?.taxes?.taxPercent || 0,

            regardsText:
                tourDetails?.quotationDetails?.signatureDetails?.regardsText ||
                "Best Regards",
            signedBy:
                tourDetails?.quotationDetails?.signatureDetails?.signedBy || "",
        },

        validationSchema,

        onSubmit: async (values) => {
            try {
                const totals = calculateTotals(values);
                const totalNights = totals.totalNights;

                const vehicleCost =
                    Number(
                        formData?.tourDetails?.vehicleDetails?.costDetails?.totalCost || 0
                    ) || 0;

                // =====================================================
                // MATTRESS TOTAL
                // =====================================================
                const mattressCount = Number(values.noOfMattress) || 0;

                const superiorMattressTotal =
                    mattressCount * values.superiorMattressCost * totalNights;

                const deluxeMattressTotal =
                    mattressCount * values.deluxeMattressCost * totalNights;

                const totalStandardWithRooms =
                    totals.totalStandard * values.noOfRooms + superiorMattressTotal;

                const totalDeluxeWithRooms =
                    totals.totalDeluxe * values.noOfRooms + deluxeMattressTotal;

                const totalStandardPackage = totalStandardWithRooms + vehicleCost;
                const totalDeluxePackage = totalDeluxeWithRooms + vehicleCost;

                const baseStandard = totalStandardPackage;
                const baseDeluxe = totalDeluxePackage;

                const standardAfterMargin =
                    baseStandard +
                    (values.marginPercent / 100) * baseStandard +
                    Number(values.marginAmount);

                const deluxeAfterMargin =
                    baseDeluxe +
                    (values.marginPercent / 100) * baseDeluxe +
                    Number(values.marginAmount);

                const standardTaxable =
                    standardAfterMargin - Number(values.discount);

                const deluxeTaxable =
                    deluxeAfterMargin - Number(values.discount);

                const gstPercent = Number(values.taxPercent);

                const standardGST =
                    (gstPercent / 100) * standardTaxable;

                const deluxeGST =
                    (gstPercent / 100) * deluxeTaxable;

                const finalStandardTotal = standardTaxable + standardGST;
                const finalDeluxeTotal = deluxeTaxable + deluxeGST;

                // =====================================================
                // FINAL PAYLOAD
                // =====================================================
                const finalData = {
                    ...formData,
                    tourDetails: {
                        ...formData.tourDetails,
                        quotationDetails: {
                            adults: values.adult,
                            children: values.child,
                            kids: values.kid,
                            infants: values.infants,
                            mealPlan: values.mediPlan,

                            destinations: cities.map((city, index) => ({
                                cityName: city.cityName,
                                nights: city.nights,
                                standardHotels: [
                                    values.cityPrices[index]?.standardHotelName || "",
                                ],
                                deluxeHotels: [
                                    values.cityPrices[index]?.deluxeHotelName || "",
                                ],
                                prices: {
                                    standard:
                                        Number(values.cityPrices[index]?.standardPrice) || 0,
                                    deluxe:
                                        Number(values.cityPrices[index]?.deluxePrice) || 0,
                                },
                            })),

                            rooms: {
                                numberOfRooms: values.noOfRooms,
                                roomType: values.roomType,
                                sharingType: values.sharingType,
                                mattress: values.noOfMattress,
                            },

                            mattress: {
                                superiorMattressCost: values.superiorMattressCost,
                                deluxeMattressCost: values.deluxeMattressCost,
                            },

                            companyMargin: {
                                marginPercent: values.marginPercent,
                                marginAmount: values.marginAmount,
                            },

                            discount: values.discount,

                            taxes: {
                                gstOn: values.gstOn,
                                taxPercent: values.taxPercent,
                            },

                            packageCalculations: {
                                standard: {
                                    baseCost: baseStandard,
                                    afterMargin: standardAfterMargin,
                                    afterDiscount: standardTaxable,
                                    gstAmount: standardGST,
                                    gstPercentage: gstPercent,
                                    finalTotal: finalStandardTotal,
                                },
                                deluxe: {
                                    baseCost: baseDeluxe,
                                    afterMargin: deluxeAfterMargin,
                                    afterDiscount: deluxeTaxable,
                                    gstAmount: deluxeGST,
                                    gstPercentage: gstPercent,
                                    finalTotal: finalDeluxeTotal,
                                },
                            },

                            signatureDetails: {
                                regardsText: values.regardsText,
                                signedBy: values.signedBy,
                            },
                        },
                    },
                };

                if (onSubmit) {
                    await onSubmit(finalData);
                } else {
                    await dispatch(createCustomQuotation(finalData)).unwrap();
                }

                toast.success("Quotation created successfully!");
            } catch (err) {
                console.error("❌ Error submitting form:", err);
                toast.error("Failed to submit quotation");
            }
        },
    });

    // =====================================================
    // BASIC HOTEL PRICE CALCULATION
    // =====================================================
    const calculateTotals = (values) => {
        let totalNights = 0;
        let totalStandard = 0;
        let totalDeluxe = 0;

        cities.forEach((city, index) => {
            const nights = Number(city.nights) || 0;
            const stdPrice = Number(values.cityPrices[index]?.standardPrice || 0);
            const dlxPrice = Number(values.cityPrices[index]?.deluxePrice || 0);

            totalNights += nights;
            totalStandard += nights * stdPrice;
            totalDeluxe += nights * dlxPrice;
        });

        return { totalNights, totalStandard, totalDeluxe };
    };

    // =====================================================
    // REALTIME CALCULATIONS FOR UI
    // =====================================================
    const totals = calculateTotals(formik.values);
    const totalNights = totals.totalNights;

    const mattressCount = Number(formik.values.noOfMattress || 0);

    const superiorMattressTotal =
        mattressCount * formik.values.superiorMattressCost * totalNights;

    const deluxeMattressTotal =
        mattressCount * formik.values.deluxeMattressCost * totalNights;

    const vehicleCost =
        Number(
            formData?.tourDetails?.vehicleDetails?.costDetails?.totalCost || 0
        ) || 0;

    const totalStandardWithRooms =
        totals.totalStandard *
        Number(formik.values.noOfRooms) +
        superiorMattressTotal;

    const totalDeluxeWithRooms =
        totals.totalDeluxe *
        Number(formik.values.noOfRooms) +
        deluxeMattressTotal;

    const totalStandardPackage = totalStandardWithRooms + vehicleCost;
    const totalDeluxePackage = totalDeluxeWithRooms + vehicleCost;

    const marginPercent = Number(formik.values.marginPercent || 0);
    const gstPercent = Number(formik.values.taxPercent || 0);

    const baseStandard = totalStandardPackage;
    const baseDeluxe = totalDeluxePackage;

    const standardAfterMargin =
        baseStandard +
        (marginPercent / 100) * baseStandard +
        Number(formik.values.marginAmount);

    const deluxeAfterMargin =
        baseDeluxe +
        (marginPercent / 100) * baseDeluxe +
        Number(formik.values.marginAmount);

    const standardTaxable =
        standardAfterMargin - Number(formik.values.discount);

    const deluxeTaxable =
        deluxeAfterMargin - Number(formik.values.discount);

    const standardGST =
        (gstPercent / 100) * standardTaxable;

    const deluxeGST =
        (gstPercent / 100) * deluxeTaxable;

    const finalStandardTotal = standardTaxable + standardGST;
    const finalDeluxeTotal = deluxeTaxable + deluxeGST;

    // =====================================================
    // UI START
    // =====================================================
    return (
        <Box sx={{ maxWidth: 1300, margin: "0 auto", p: 3 }}>
            <form onSubmit={formik.handleSubmit}>
                <Typography variant="h4" align="center">
                    Custom Quotation
                </Typography>

                {/* CLIENT SUMMARY */}
                <Paper sx={{ p: 2, mt: 3, backgroundColor: "#f8f8f8" }}>
                    <Typography variant="h6">Client Summary</Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6} sm={3}>
                            <strong>Client:</strong> {clientDetails.clientName}
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <strong>Sector:</strong> {clientDetails.sector}
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <strong>Arrival:</strong> {tourDetails.arrivalCity}
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <strong>Departure:</strong> {tourDetails.departureCity}
                        </Grid>
                    </Grid>
                </Paper>

                {/* QUOTATION DETAILS */}
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6">Quotation Details</Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6} sm={3}>
                            <TextField label="Adults" type="number" fullWidth {...formik.getFieldProps("adult")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Children" type="number" fullWidth {...formik.getFieldProps("child")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Kids" type="number" fullWidth {...formik.getFieldProps("kid")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Infants" type="number" fullWidth {...formik.getFieldProps("infants")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Meal Plan" fullWidth {...formik.getFieldProps("mediPlan")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="No. of Rooms" type="number" fullWidth {...formik.getFieldProps("noOfRooms")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Room Type" fullWidth {...formik.getFieldProps("roomType")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Sharing Type" fullWidth {...formik.getFieldProps("sharingType")} />
                        </Grid>

                        {/* MATTRESS */}
                        <Grid item xs={6} sm={3}>
                            <TextField label="No. of Mattress" type="number" fullWidth {...formik.getFieldProps("noOfMattress")} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* MATTRESS COST */}
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6">Mattress Cost (Per Night)</Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Superior Mattress Cost" type="number" fullWidth {...formik.getFieldProps("superiorMattressCost")} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField label="Deluxe Mattress Cost" type="number" fullWidth {...formik.getFieldProps("deluxeMattressCost")} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* DESTINATION PRICE TABLE */}
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6">Destinations & Prices</Typography>

                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Destination</TableCell>
                                    <TableCell>Nights</TableCell>
                                    <TableCell>Standard Hotel</TableCell>
                                    <TableCell>Standard Price</TableCell>
                                    <TableCell>Deluxe Hotel</TableCell>
                                    <TableCell>Deluxe Price</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {cities.map((city, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{city.cityName}</TableCell>
                                        <TableCell>{city.nights}</TableCell>

                                        <TableCell>
                                            <TextField size="small" fullWidth {...formik.getFieldProps(`cityPrices[${index}].standardHotelName`)} />
                                        </TableCell>

                                        <TableCell>
                                            <TextField size="small" type="number" fullWidth {...formik.getFieldProps(`cityPrices[${index}].standardPrice`)} />
                                        </TableCell>

                                        <TableCell>
                                            <TextField size="small" fullWidth {...formik.getFieldProps(`cityPrices[${index}].deluxeHotelName`)} />
                                        </TableCell>

                                        <TableCell>
                                            <TextField size="small" type="number" fullWidth {...formik.getFieldProps(`cityPrices[${index}].deluxePrice`)} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* PRICING SUMMARY */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h5" fontWeight="bold">
                            Pricing Summary
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={3}>
                            {/* STANDARD */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderLeft: "6px solid #1976d2" }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ color: "#1976d2" }}>
                                            STANDARD PACKAGE
                                        </Typography>

                                        <Typography><strong>Base Cost:</strong> ₹{baseStandard.toFixed(2)}</Typography>
                                        <Typography><strong>After Margin:</strong> ₹{standardAfterMargin.toFixed(2)}</Typography>
                                        <Typography><strong>After Discount:</strong> ₹{standardTaxable.toFixed(2)}</Typography>
                                        <Typography><strong>GST ({gstPercent}%):</strong> ₹{standardGST.toFixed(2)}</Typography>

                                        <Divider sx={{ my: 1 }} />

                                        <Typography sx={{ color: "green" }} variant="h6">
                                            Final Total: ₹{finalStandardTotal.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* DELUXE */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderLeft: "6px solid #9c27b0" }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ color: "#9c27b0" }}>
                                            DELUXE PACKAGE
                                        </Typography>

                                        <Typography><strong>Base Cost:</strong> ₹{baseDeluxe.toFixed(2)}</Typography>
                                        <Typography><strong>After Margin:</strong> ₹{deluxeAfterMargin.toFixed(2)}</Typography>
                                        <Typography><strong>After Discount:</strong> ₹{deluxeTaxable.toFixed(2)}</Typography>
                                        <Typography><strong>GST ({gstPercent}%):</strong> ₹{deluxeGST.toFixed(2)}</Typography>

                                        <Divider sx={{ my: 1 }} />

                                        <Typography sx={{ color: "green" }} variant="h6">
                                            Final Total: ₹{finalDeluxeTotal.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* MARGIN & TAXES */}
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6">Company Margin / Taxes</Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6} sm={3}>
                            <TextField label="Margin (%)" type="number" fullWidth {...formik.getFieldProps("marginPercent")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Margin Amount" type="number" fullWidth {...formik.getFieldProps("marginAmount")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Discount" type="number" fullWidth {...formik.getFieldProps("discount")} />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <FormControl fullWidth>
                                <InputLabel>GST On</InputLabel>
                                <Select value={formik.values.gstOn} name="gstOn" onChange={formik.handleChange}>
                                    <MenuItem value="Full">Full</MenuItem>
                                    <MenuItem value="None">None</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <TextField label="Tax (%)" type="number" fullWidth {...formik.getFieldProps("taxPercent")} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* SIGNATURE */}
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6">Signature Details</Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Regards Text" fullWidth {...formik.getFieldProps("regardsText")} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField label="Signed By" fullWidth {...formik.getFieldProps("signedBy")} />
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                        {loading ? "Saving..." : "Submit Quotation"}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default CustomQuotationForm;