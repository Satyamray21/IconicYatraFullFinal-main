import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    Typography,
    Box,
    IconButton,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const QuickEditAllDialog = ({ open, onClose, quotation, onSave }) => {
    const [formData, setFormData] = useState({
        standardCost: 0,
        deluxeCost: 0,
        superiorCost: 0,
        transportationCost: 0,
        taxPercent: 5,
        gstOn: "Full",
        gstIncluded: true,
        destinations: [],
    });

    useEffect(() => {
        if (open && quotation) {
            const snap = quotation.packageSnapshot || {};
            const qd = snap.quotationDetails || {};
            const tx = qd.taxes || {};

            setFormData({
                standardCost: qd.standardCost ?? snap.standardCost ?? 0,
                deluxeCost: qd.deluxeCost ?? snap.deluxeCost ?? 0,
                superiorCost: qd.superiorCost ?? snap.superiorCost ?? 0,
                transportationCost: qd.transportationCost ?? snap.transportationTotalCost ?? 0,
                taxPercent: tx.taxPercent ?? 5,
                gstOn: tx.gstOn || "Full",
                gstIncluded: tx.gstIncludedInFinalAmount ?? true,
                destinations: (snap.destinationNights || []).map(dn => ({
                    destination: dn.destination,
                    standardHotel: dn.hotels?.find(h => h.category === "standard")?.hotelName || "",
                    deluxeHotel: dn.hotels?.find(h => h.category === "deluxe")?.hotelName || "",
                    superiorHotel: dn.hotels?.find(h => h.category === "superior")?.hotelName || "",
                })),
            });
        }
    }, [open, quotation]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleHotelChange = (index, tier, value) => {
        const newDestinations = [...formData.destinations];
        newDestinations[index][tier] = value;
        setFormData(prev => ({ ...prev, destinations: newDestinations }));
    };

    const getCalculatedValues = (baseAmount) => {
        const amount = Number(baseAmount) || 0;
        const taxRate = Number(formData.taxPercent) || 0;
        if (formData.gstOn === "None" || taxRate === 0) {
            return { base: amount, gst: 0, total: amount };
        }
        
        if (formData.gstIncluded) {
            const base = amount / (1 + taxRate / 100);
            return { base, gst: amount - base, total: amount };
        } else {
            const gst = (amount * taxRate) / 100;
            return { base: amount, gst, total: amount + gst };
        }
    };

    const handleSave = () => {
        const snap = quotation.packageSnapshot || {};
        const finalizedTier = String(quotation.finalizedPackage || "Standard").toLowerCase();
        
        const standardVals = getCalculatedValues(formData.standardCost);
        const deluxeVals = getCalculatedValues(formData.deluxeCost);
        const superiorVals = getCalculatedValues(formData.superiorCost);
        const transportVals = getCalculatedValues(formData.transportationCost);

        let newTotalCost = 0;
        if (finalizedTier === "standard") newTotalCost = standardVals.total;
        else if (finalizedTier === "deluxe") newTotalCost = deluxeVals.total;
        else if (finalizedTier === "superior") newTotalCost = superiorVals.total;

        // Update hotel names in destinationNights
        const updatedDestinationNights = (snap.destinationNights || []).map((dn, idx) => {
            const edit = formData.destinations[idx];
            if (!edit) return dn;
            
            const newHotels = (dn.hotels || []).map(h => {
                if (h.category === "standard") return { ...h, hotelName: edit.standardHotel };
                if (h.category === "deluxe") return { ...h, hotelName: edit.deluxeHotel };
                if (h.category === "superior") return { ...h, hotelName: edit.superiorHotel };
                return h;
            });
            
            return { ...dn, hotels: newHotels };
        });

        const updatePayload = {
            totalCost: Math.round(newTotalCost),
            packageSnapshot: {
                ...snap,
                destinationNights: updatedDestinationNights,
                finalStandardCost: Math.round(standardVals.total),
                finalDeluxeCost: Math.round(deluxeVals.total),
                finalSuperiorCost: Math.round(superiorVals.total),
                quotationDetails: {
                    ...(snap.quotationDetails || {}),
                    standardCost: Math.round(standardVals.total),
                    deluxeCost: Math.round(deluxeVals.total),
                    superiorCost: Math.round(superiorVals.total),
                    transportationCost: Math.round(transportVals.total),
                    taxes: {
                        ...(snap.quotationDetails?.taxes || {}),
                        taxPercent: Number(formData.taxPercent),
                        gstOn: formData.gstOn,
                        gstIncludedInFinalAmount: formData.gstIncluded,
                    },
                    packageCalculations: {
                        ...(snap.quotationDetails?.packageCalculations || {}),
                        standard: { 
                            ...(snap.quotationDetails?.packageCalculations?.standard || {}),
                            finalTotal: Math.round(standardVals.total) 
                        },
                        deluxe: { 
                            ...(snap.quotationDetails?.packageCalculations?.deluxe || {}),
                            finalTotal: Math.round(deluxeVals.total) 
                        },
                        superior: { 
                            ...(snap.quotationDetails?.packageCalculations?.superior || {}),
                            finalTotal: Math.round(superiorVals.total) 
                        },
                    }
                }
            }
        };

        onSave(updatePayload);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Edit Quotation Details
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Pricing & Costs</Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>GST Mode</InputLabel>
                        <Select
                            value={formData.gstIncluded ? "included" : "excluded"}
                            label="GST Mode"
                            onChange={(e) => handleChange("gstIncluded", e.target.value === "included")}
                        >
                            <MenuItem value="included">GST Included</MenuItem>
                            <MenuItem value="excluded">GST Excluded</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="GST %"
                            type="number"
                            value={formData.taxPercent}
                            onChange={(e) => handleChange("taxPercent", e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>GST On</InputLabel>
                            <Select
                                value={formData.gstOn}
                                label="GST On"
                                onChange={(e) => handleChange("gstOn", e.target.value)}
                            >
                                <MenuItem value="Full">Full</MenuItem>
                                <MenuItem value="Margin">Margin</MenuItem>
                                <MenuItem value="None">None</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    {[
                        { key: "standardCost", label: "Standard Cost" },
                        { key: "deluxeCost", label: "Deluxe Cost" },
                        { key: "superiorCost", label: "Superior Cost" },
                        { key: "transportationCost", label: "Transport Cost" },
                    ].map(({ key, label }) => {
                        const { base, gst, total } = getCalculatedValues(formData[key]);

                        return (
                            <Grid size={{ xs: 12, sm: 3 }} key={key}>
                                <TextField
                                    fullWidth
                                    label={label}
                                    type="number"
                                    value={formData[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    helperText={
                                        Number(formData.taxPercent) > 0 && formData.gstOn !== "None" ? (
                                            <Box component="span" sx={{ display: "block", fontSize: "0.75rem", mt: 0.5, color: "text.secondary" }}>
                                                Base: ₹{Math.round(base).toLocaleString("en-IN")} <br/>
                                                GST: ₹{Math.round(gst).toLocaleString("en-IN")} <br/>
                                                <strong>Total: ₹{Math.round(total).toLocaleString("en-IN")}</strong>
                                            </Box>
                                        ) : null
                                    }
                                />
                            </Grid>
                        );
                    })}
                </Grid>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Hotel Names</Typography>
                {formData.destinations.map((dest, idx) => (
                    <Box key={idx} sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {dest.destination}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Standard Hotel"
                                    value={dest.standardHotel}
                                    onChange={(e) => handleHotelChange(idx, "standardHotel", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Deluxe Hotel"
                                    value={dest.deluxeHotel}
                                    onChange={(e) => handleHotelChange(idx, "deluxeHotel", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Superior Hotel"
                                    value={dest.superiorHotel}
                                    onChange={(e) => handleHotelChange(idx, "superiorHotel", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button variant="contained" onClick={handleSave} size="large">Save All Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickEditAllDialog;
