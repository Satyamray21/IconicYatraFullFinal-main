import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    Grid,
    Typography,
    Button,
    Divider,
    Radio,
} from "@mui/material";
import { Formik, Form } from "formik";
import { useSelector } from "react-redux";

const FINAL_PACKAGES = ["Standard", "Deluxe", "Superior"];

/**
 * @param {object} props
 * @param {{ label: string, hotel: string, cost: string }[]} [props.packageOptionsOverride] When set (e.g. quick quotation), these options replace Redux-driven package rows.
 * @param {string} [props.preselectedPackageLabel] Pre-select radio when it matches an option label (quick finalize uses this).
 */
const FinalizeDialog = ({
    open,
    onClose,
    onConfirm,
    packageOptionsOverride,
    preselectedPackageLabel,
    /** Billable add-on services (amount + line tax) to add to each package total in the dialog */
    additionalServicesSum = 0,
}) => {
    const [selectedOption, setSelectedOption] = useState("");

    const { selectedQuotation } = useSelector(
        (state) => state.customQuotation
    );

    // SAFELY extract pricing

    const adj = Number(additionalServicesSum) || 0;
    const adjustPkg = (v) => {
        if (typeof v !== "number" || Number.isNaN(v)) return "N/A";
        return v + adj;
    };

    const standardCost = adjustPkg(
        selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations
            ?.standard?.finalTotal
    );

    const deluxeCost = adjustPkg(
        selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations
            ?.deluxe?.finalTotal
    );

    // Extract hotel names
    const standardHotel =
        selectedQuotation?.tourDetails?.quotationDetails?.destinations?.[0]
            ?.standardHotels?.[0] ?? "N/A";

    const deluxeHotel =
        selectedQuotation?.tourDetails?.quotationDetails?.destinations?.[0]
            ?.deluxeHotels?.[0] ?? "N/A";

    const superiorHotel =
        selectedQuotation?.tourDetails?.quotationDetails?.destinations?.[0]
            ?.superiorHotels?.[0] ?? "N/A";

    const superiorCost = adjustPkg(
        selectedQuotation?.tourDetails?.quotationDetails?.packageCalculations
            ?.superior?.finalTotal
    );

    const fmtRupee = (v) =>
        typeof v === "number" && Number.isFinite(v)
            ? `₹ ${v.toLocaleString("en-IN")}`
            : "—";

    const quotationOptionsFromRedux = useMemo(
        () => [
            {
                label: "Standard",
                hotel: standardHotel,
                cost: fmtRupee(standardCost),
            },
            {
                label: "Deluxe",
                hotel: deluxeHotel,
                cost: fmtRupee(deluxeCost),
            },
            {
                label: "Superior",
                hotel: superiorHotel,
                cost: fmtRupee(superiorCost),
            },
        ],
        [
            standardCost,
            deluxeCost,
            superiorCost,
            standardHotel,
            deluxeHotel,
            superiorHotel,
        ]
    );

    const quotationOptions =
        Array.isArray(packageOptionsOverride) && packageOptionsOverride.length
            ? packageOptionsOverride
            : quotationOptionsFromRedux;

    const handleSubmit = (values) => {
        onConfirm(values);
    };

    const preselect =
        preselectedPackageLabel != null && String(preselectedPackageLabel).trim()
            ? String(preselectedPackageLabel).trim()
            : selectedQuotation?.finalizedPackage;
    React.useEffect(() => {
        if (open && preselect) {
            const match = quotationOptions.some((o) => o.label === preselect);
            if (match) setSelectedOption(preselect);
            else if (FINAL_PACKAGES.includes(preselect))
                setSelectedOption(preselect);
        }
        if (!open) setSelectedOption("");
    }, [open, preselect, quotationOptions]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, color: "#1976d2" }}>
                Finalize Quotation
            </DialogTitle>

            <Formik
                enableReinitialize
                initialValues={{
                    quotation:
                        preselect &&
                        (FINAL_PACKAGES.includes(preselect) ||
                            quotationOptions.some((o) => o.label === preselect))
                            ? preselect
                            : "",
                }}
                onSubmit={handleSubmit}
            >
                {({ setFieldValue }) => (
                    <Form>
                        <DialogContent>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, mb: 2 }}
                                color="text.primary"
                            >
                                <span style={{ color: "red" }}>*</span> Quotation
                            </Typography>

                            <Grid container spacing={2}>
                                {quotationOptions.map((option) => {
                                    const isSelected = selectedOption === option.label;

                                    return (
                                        <Grid size={{ xs: 12, md: 4 }} key={option.label}>
                                            <Box
                                                onClick={() => {
                                                    setSelectedOption(option.label);
                                                    setFieldValue("quotation", option.label);
                                                }}
                                                sx={{
                                                    border: isSelected
                                                        ? "2px solid #ff9800"
                                                        : "1px solid #ccc",
                                                    borderRadius: 1,
                                                    p: 2,
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    transition: "0.2s",
                                                    "&:hover": { borderColor: "#1976d2" },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Radio
                                                        checked={isSelected}
                                                        value={option.label}
                                                        name="quotation"
                                                        sx={{
                                                            color: "#ff9800",
                                                            "&.Mui-checked": { color: "#ff9800" },
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ color: "#ff9800", fontWeight: 600 }}
                                                    >
                                                        {option.label}
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 1, borderColor: "#ff9800" }} />

                                                <Typography
                                                    variant="body2"
                                                    sx={{ mb: 1, color: "#1976d2" }}
                                                >
                                                    » {option.hotel}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    Total Cost:{" "}
                                                    <span style={{ fontWeight: 600 }}>{option.cost}</span>
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={!selectedOption}
                                sx={{
                                    textTransform: "none",
                                    backgroundColor: selectedOption ? "#64b5f6" : "#bbdefb",
                                    "&:hover": { backgroundColor: "#2196f3" },
                                }}
                            >
                                Confirm
                            </Button>

                            <Button
                                variant="contained"
                                onClick={onClose}
                                sx={{
                                    backgroundColor: "#f57c00",
                                    textTransform: "none",
                                    "&:hover": { backgroundColor: "#ef6c00" },
                                }}
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default FinalizeDialog;