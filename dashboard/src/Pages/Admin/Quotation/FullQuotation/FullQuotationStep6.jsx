import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Grid,
    Typography,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    MenuItem,
    Divider,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { step6Update } from "../../../../features/quotation/fullQuotationSlice";
import { toast } from "react-toastify";

const FullQuotationStep6 = ({ quotation, quotationId }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // ✅ Initialize navigate

    const [totals, setTotals] = useState({
        standard: 0,
        deluxe: 0,
        superior: 0,
    });

    // Calculate total cost for each type
    useEffect(() => {
        if (quotation?.stayLocation?.length) {
            setTotals({
                standard: quotation.stayLocation.reduce(
                    (sum, loc) => sum + (loc.standard?.totalCost || 0),
                    0
                ),
                deluxe: quotation.stayLocation.reduce(
                    (sum, loc) => sum + (loc.deluxe?.totalCost || 0),
                    0
                ),
                superior: quotation.stayLocation.reduce(
                    (sum, loc) => sum + (loc.superior?.totalCost || 0),
                    0
                ),
            });
        }
    }, [quotation]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            // Margins
            standardMarginPercent:
                quotation?.pricing?.margins?.standard?.percent || 0,
            standardMarginValue: quotation?.pricing?.margins?.standard?.value || 0,
            deluxeMarginPercent: quotation?.pricing?.margins?.deluxe?.percent || 0,
            deluxeMarginValue: quotation?.pricing?.margins?.deluxe?.value || 0,
            superiorMarginPercent:
                quotation?.pricing?.margins?.superior?.percent || 0,
            superiorMarginValue: quotation?.pricing?.margins?.superior?.value || 0,

            // Discounts
            standardDiscount: quotation?.pricing?.discounts?.standard || 0,
            deluxeDiscount: quotation?.pricing?.discounts?.deluxe || 0,
            superiorDiscount: quotation?.pricing?.discounts?.superior || 0,

            // Taxes
            gstOn: quotation?.pricing?.taxes?.gstOn || "Full",
            taxPercent: quotation?.pricing?.taxes?.taxPercent || "18",

            // Contact
            contactDetails: quotation?.pricing?.contactDetails || "",
        },
        validationSchema: Yup.object({
            standardMarginPercent: Yup.number().required("Required"),
            standardMarginValue: Yup.number().required("Required"),
            deluxeMarginPercent: Yup.number().required("Required"),
            deluxeMarginValue: Yup.number().required("Required"),
            superiorMarginPercent: Yup.number().required("Required"),
            superiorMarginValue: Yup.number().required("Required"),
            standardDiscount: Yup.number().required("Required"),
            deluxeDiscount: Yup.number().required("Required"),
            superiorDiscount: Yup.number().required("Required"),
            gstOn: Yup.string().required("Required"),
            taxPercent: Yup.string().required("Required"),
            contactDetails: Yup.string().required("Required"),
        }),
        onSubmit: async (values) => {
            try {
                const pricing = {
                    totals,
                    margins: {
                        standard: {
                            percent: values.standardMarginPercent,
                            value: values.standardMarginValue,
                        },
                        deluxe: {
                            percent: values.deluxeMarginPercent,
                            value: values.deluxeMarginValue,
                        },
                        superior: {
                            percent: values.superiorMarginPercent,
                            value: values.superiorMarginValue,
                        },
                    },
                    discounts: {
                        standard: values.standardDiscount,
                        deluxe: values.deluxeDiscount,
                        superior: values.superiorDiscount,
                    },
                    taxes: { gstOn: values.gstOn, taxPercent: values.taxPercent },
                    contactDetails: values.contactDetails,
                };

                const resultAction = await dispatch(
                    step6Update({ quotationId, pricing })
                );

                if (step6Update.fulfilled.match(resultAction)) {
                    toast.success("Step 6 saved successfully!");

                    // ✅ NAVIGATE TO QUOTATION PAGE AFTER SUCCESS
                    navigate('/quotation');

                } else {
                    toast.error("Failed to save Step 6");
                    console.error(resultAction.payload);
                }
            } catch (err) {
                toast.error("Error saving Step 6");
                console.error(err);
            }
        },
    });

    // Auto-calculate Margin Value when Percent changes
    useEffect(() => {
        formik.setFieldValue(
            "standardMarginValue",
            ((formik.values.standardMarginPercent || 0) * totals.standard) / 100
        );
    }, [formik.values.standardMarginPercent, totals.standard]);

    useEffect(() => {
        formik.setFieldValue(
            "deluxeMarginValue",
            ((formik.values.deluxeMarginPercent || 0) * totals.deluxe) / 100
        );
    }, [formik.values.deluxeMarginPercent, totals.deluxe]);

    useEffect(() => {
        formik.setFieldValue(
            "superiorMarginValue",
            ((formik.values.superiorMarginPercent || 0) * totals.superior) / 100
        );
    }, [formik.values.superiorMarginPercent, totals.superior]);

    return (
        <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ p: 3, maxWidth: 900, mx: "auto", border: "1px solid #ccc", borderRadius: 2 }}
        >
            <Typography variant="h6" fontWeight={600} mb={2}>
                Quotation Pricing
            </Typography>

            {/* Totals */}
            <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Total Stay Costs
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography>Standard: ₹{totals.standard}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography>Deluxe: ₹{totals.deluxe}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography>Superior: ₹{totals.superior}</Typography>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Company Margin */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Company Margin
            </Typography>
            <Grid container spacing={2} mb={3}>
                {["standard", "deluxe", "superior"].map((type) => (
                    <React.Fragment key={type}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography>{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                name={`${type}MarginPercent`}
                                value={formik.values[`${type}MarginPercent`]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                label="%"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                name={`${type}MarginValue`}
                                value={formik.values[`${type}MarginValue`]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                label="₹"
                            />
                        </Grid>
                    </React.Fragment>
                ))}
            </Grid>

            {/* Discount */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Discount
            </Typography>
            <Grid container spacing={2} mb={3}>
                {["standard", "deluxe", "superior"].map((type) => (
                    <Grid size={{ xs: 12, md: 4 }} key={type}>
                        <TextField
                            fullWidth
                            name={`${type}Discount`}
                            value={formik.values[`${type}Discount`]}
                            onChange={formik.handleChange}
                            label={`${type.charAt(0).toUpperCase() + type.slice(1)} Discount`}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Taxes */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Taxes
            </Typography>
            <RadioGroup
                row
                name="gstOn"
                value={formik.values.gstOn}
                onChange={formik.handleChange}
            >
                <FormControlLabel value="Full" control={<Radio />} label="Full" />
                <FormControlLabel value="Margin" control={<Radio />} label="Margin" />
                <FormControlLabel value="None" control={<Radio />} label="None" />
            </RadioGroup>
            <Box mt={2} mb={3}>
                <TextField
                    select
                    fullWidth
                    label="GST %"
                    name="taxPercent"
                    value={formik.values.taxPercent}
                    onChange={formik.handleChange}
                >
                    <MenuItem value="5">5%</MenuItem>
                    <MenuItem value="12">12%</MenuItem>
                    <MenuItem value="18">18%</MenuItem>
                    <MenuItem value="28">28%</MenuItem>
                </TextField>
            </Box>

            {/* Contact / Signature */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Contact Details
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={2}
                name="contactDetails"
                value={formik.values.contactDetails}
                onChange={formik.handleChange}
                sx={{ mb: 3 }}
            />

            <Box textAlign="center">
                <Button type="submit" variant="contained" color="primary">
                    Save & Continue
                </Button>
            </Box>
        </Box>
    );
};

export default FullQuotationStep6;