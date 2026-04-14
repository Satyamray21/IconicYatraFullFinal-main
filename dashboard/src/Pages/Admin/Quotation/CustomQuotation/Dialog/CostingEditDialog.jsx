import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Divider,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { updateCustomQuotationCosting } from "../../../../../features/quotation/customQuotationSlice";
import { computeCustomQuotationPackages } from "../../../../../utils/customQuotationPricing";

const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = parseFloat(String(v).replace(/,/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
};

const TierPreview = ({ title, color, pkg }) => (
    <Paper variant="outlined" sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color }} gutterBottom>
            {title}
        </Typography>
        <Typography variant="body2">Base: ₹{pkg.baseCost.toFixed(2)}</Typography>
        <Typography variant="body2">After margin: ₹{pkg.afterMargin.toFixed(2)}</Typography>
        <Typography variant="body2">After discount: ₹{pkg.afterDiscount.toFixed(2)}</Typography>
        <Typography variant="body2">
            GST ({pkg.gstPercentage}%): ₹{pkg.gstAmount.toFixed(2)}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="h6" color="success.main">
            Final: ₹{pkg.finalTotal.toFixed(2)}
        </Typography>
    </Paper>
);

/**
 * Same pricing rules as customquotationStep6 — changing margin, discount, GST % or GST On
 * recalculates all three packages immediately.
 */
const CostingEditDialog = ({
    open,
    onClose,
    quotation,
    quotationId,
    onSaved,
    /** When set, called instead of updateCustomQuotationCosting (e.g. quick quotations). */
    saveCostingOverride,
}) => {
    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);
    const [marginPercent, setMarginPercent] = useState("");
    const [marginAmount, setMarginAmount] = useState("");
    const [discount, setDiscount] = useState("");
    const [taxPercent, setTaxPercent] = useState("");
    const [gstOn, setGstOn] = useState("Full");

    useEffect(() => {
        if (!open || !quotation?.tourDetails?.quotationDetails) return;
        const qd = quotation.tourDetails.quotationDetails;
        const cm = qd.companyMargin || {};
        const tx = qd.taxes || {};
        setMarginPercent(cm.marginPercent ?? "");
        setMarginAmount(cm.marginAmount ?? "");
        setDiscount(qd.discount ?? "");
        setTaxPercent(tx.taxPercent ?? "");
        setGstOn(tx.gstOn || "Full");
    }, [open, quotation]);

    const vehicleCost = useMemo(
        () =>
            toNum(
                quotation?.tourDetails?.vehicleDetails?.costDetails?.totalCost
            ),
        [quotation]
    );

    const pricing = useMemo(() => {
        if (!open || !quotation?.tourDetails?.quotationDetails) {
            return null;
        }
        const qd = quotation.tourDetails.quotationDetails;
        const dest = qd.destinations || [];
        const rooms = qd.rooms || {};
        const mattressRates = qd.mattress || {};

        return computeCustomQuotationPackages({
            destinations: dest.map((d) => ({
                nights: d.nights,
                prices: {
                    standard: d.prices?.standard,
                    deluxe: d.prices?.deluxe,
                    superior: d.prices?.superior,
                },
            })),
            numberOfRooms: rooms.numberOfRooms,
            mattressCount: rooms.mattress,
            standardPackageMattressCostPerNight: mattressRates.superiorMattressCost,
            deluxePackageMattressCostPerNight: mattressRates.deluxeMattressCost,
            vehicleCost,
            marginPercent,
            marginAmount,
            discount,
            taxPercent,
            gstOn,
        });
    }, [
        open,
        quotation,
        vehicleCost,
        marginPercent,
        marginAmount,
        discount,
        taxPercent,
        gstOn,
    ]);

    const handleSave = async () => {
        if (!pricing) return;
        if (!saveCostingOverride && !quotationId) return;
        setSaving(true);
        try {
            const body = {
                packageCalculations: {
                    standard: pricing.standard,
                    deluxe: pricing.deluxe,
                    superior: pricing.superior,
                },
                companyMargin: {
                    marginPercent: toNum(marginPercent),
                    marginAmount: toNum(marginAmount),
                },
                discount: toNum(discount),
                taxes: {
                    gstOn,
                    taxPercent: toNum(taxPercent),
                    applyGST: gstOn !== "None",
                },
            };
            if (saveCostingOverride) {
                await saveCostingOverride(body);
            } else {
                await dispatch(
                    updateCustomQuotationCosting({
                        quotationId,
                        body,
                    })
                ).unwrap();
            }
            onSaved?.();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit costing</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Uses the same rules as Step 6 (nights × rates × rooms + mattress + vehicle →
                    margin → discount → GST). Change GST % or GST on — totals update instantly.
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Margin %"
                            value={marginPercent}
                            onChange={(e) => setMarginPercent(e.target.value)}
                            inputProps={{ step: "any" }}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Margin ₹"
                            value={marginAmount}
                            onChange={(e) => setMarginAmount(e.target.value)}
                            inputProps={{ step: "any" }}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Discount ₹"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            inputProps={{ step: "any" }}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="GST %"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(e.target.value)}
                            inputProps={{ step: "any" }}
                            helperText="Live totals"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>GST on</InputLabel>
                            <Select
                                label="GST on"
                                value={gstOn}
                                onChange={(e) => setGstOn(e.target.value)}
                            >
                                <MenuItem value="Full">Full — on amount after discount</MenuItem>
                                <MenuItem value="Margin">Margin — on margin only</MenuItem>
                                <MenuItem value="None">None</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {pricing && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {pricing.totalNights} night(s) in route · Vehicle ₹{vehicleCost.toFixed(2)}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TierPreview title="Standard" color="#1976d2" pkg={pricing.standard} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TierPreview title="Deluxe" color="#9c27b0" pkg={pricing.deluxe} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TierPreview title="Superior" color="#2e7d32" pkg={pricing.superior} />
                            </Grid>
                        </Grid>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={
                        saving ||
                        !pricing ||
                        (!saveCostingOverride && !quotationId)
                    }
                    startIcon={saving ? <CircularProgress size={18} /> : null}
                >
                    Save costing
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CostingEditDialog;
