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
    Checkbox,
    TextField,
} from "@mui/material";
import { Formik, Form } from "formik";
import { useSelector } from "react-redux";

const FINAL_PACKAGES = ["Standard", "Deluxe", "Superior"];

/**
 * @param {object} props
 * @param {{ label: string, hotel: string, cost: string }[]} [props.packageOptionsOverride] When set (e.g. quick quotation), these options replace Redux-driven package rows.
 * @param {string} [props.preselectedPackageLabel] Pre-select when it matches an option label.
 */
const FinalizeDialog = ({
    open,
    onClose,
    onConfirm,
    packageOptionsOverride,
    preselectedPackageLabel,
    /** Billable add-on services (amount + line tax) to add to each package total in the dialog */
    additionalServicesSum = 0,
    allowEditableAmount = false,
}) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [packageAmountOverrides, setPackageAmountOverrides] = useState({});

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

    const parseAmountFromCost = (value) => {
        const cleaned = String(value ?? "").replace(/[^0-9.-]/g, "");
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const handlePackageToggle = (packageLabel) => {
        setSelectedOptions((prev) => {
            if (prev.includes(packageLabel)) {
                return prev.filter((p) => p !== packageLabel);
            } else {
                return [...prev, packageLabel];
            }
        });
    };

    const handleSubmit = (values) => {
        const selectedPackageAmounts = selectedOptions.reduce((acc, label) => {
            const raw = Number(packageAmountOverrides[label]);
            acc[label] = Number.isFinite(raw) ? raw : 0;
            return acc;
        }, {});
        onConfirm({
            quotations: selectedOptions,
            // For backward compatibility, also send single package
            quotation: selectedOptions.length > 0 ? selectedOptions[0] : "",
            selectedPackageAmounts,
            selectedAmount:
                selectedOptions.length > 0
                    ? selectedPackageAmounts[selectedOptions[0]]
                    : 0,
        });
    };

    React.useEffect(() => {
        if (open) {
            const initialAmounts = quotationOptions.reduce((acc, option) => {
                acc[option.label] = parseAmountFromCost(option.cost);
                return acc;
            }, {});
            setPackageAmountOverrides(initialAmounts);
            const preselect =
                preselectedPackageLabel != null && String(preselectedPackageLabel).trim()
                    ? String(preselectedPackageLabel).trim()
                    : selectedQuotation?.finalizedPackages?.[0] || selectedQuotation?.finalizedPackage;

            if (preselect && FINAL_PACKAGES.includes(preselect)) {
                setSelectedOptions([preselect]);
            }
        }
        if (!open) {
            setSelectedOptions([]);
            setPackageAmountOverrides({});
        }
    }, [open, preselectedPackageLabel, selectedQuotation?.finalizedPackage, quotationOptions]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, color: "#1976d2" }}>
                Finalize Quotation - Select Packages
            </DialogTitle>

            <DialogContent>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, mt: 2 }}
                    color="text.primary"
                >
                    <span style={{ color: "red" }}>*</span> Select one or more packages
                </Typography>

                <Grid container spacing={2}>
                    {quotationOptions.map((option) => {
                        const isSelected = selectedOptions.includes(option.label);

                        return (
                            <Grid size={{ xs: 12, md: 4 }} key={option.label}>
                                <Box
                                    onClick={() => handlePackageToggle(option.label)}
                                    sx={{
                                        border: isSelected
                                            ? "2px solid #ff9800"
                                            : "1px solid #ccc",
                                        borderRadius: 1,
                                        p: 2,
                                        cursor: "pointer",
                                        textAlign: "center",
                                        transition: "0.2s",
                                        backgroundColor: isSelected ? "#fff8e1" : "transparent",
                                        "&:hover": { borderColor: "#1976d2", backgroundColor: "#f5f5f5" },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => handlePackageToggle(option.label)}
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
                                    {allowEditableAmount && (
                                        <TextField
                                            size="small"
                                            type="number"
                                            label="Finalize amount"
                                            value={packageAmountOverrides[option.label] ?? ""}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) =>
                                                setPackageAmountOverrides((prev) => ({
                                                    ...prev,
                                                    [option.label]: Number(e.target.value || 0),
                                                }))
                                            }
                                            inputProps={{ min: 0 }}
                                            sx={{ mt: 1 }}
                                            fullWidth
                                        />
                                    )}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

                {selectedOptions.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: "#e3f2fd", borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Selected Packages: {selectedOptions.join(", ")}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={selectedOptions.length === 0}
                    sx={{
                        textTransform: "none",
                        backgroundColor: selectedOptions.length > 0 ? "#64b5f6" : "#bbdefb",
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
        </Dialog>
    );
};

export default FinalizeDialog;