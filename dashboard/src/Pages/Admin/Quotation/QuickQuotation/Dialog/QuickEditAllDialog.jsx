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

    const handleSave = () => {
        // Construct the update payload
        const snap = quotation.packageSnapshot || {};
        const finalizedTier = String(quotation.finalizedPackage || "Standard").toLowerCase();
        
        let newTotalCost = 0;
        if (finalizedTier === "standard") newTotalCost = Number(formData.standardCost);
        else if (finalizedTier === "deluxe") newTotalCost = Number(formData.deluxeCost);
        else if (finalizedTier === "superior") newTotalCost = Number(formData.superiorCost);

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
            totalCost: newTotalCost,
            packageSnapshot: {
                ...snap,
                destinationNights: updatedDestinationNights,
                // Root snapshot fields also used by transformQuickApiToDisplay
                finalStandardCost: Number(formData.standardCost),
                finalDeluxeCost: Number(formData.deluxeCost),
                finalSuperiorCost: Number(formData.superiorCost),
                quotationDetails: {
                    ...(snap.quotationDetails || {}),
                    standardCost: Number(formData.standardCost),
                    deluxeCost: Number(formData.deluxeCost),
                    superiorCost: Number(formData.superiorCost),
                    transportationCost: Number(formData.transportationCost),
                    taxes: {
                        ...(snap.quotationDetails?.taxes || {}),
                        taxPercent: Number(formData.taxPercent),
                        gstOn: formData.gstOn,
                    },
                    // We should also update packageCalculations to match the new totals
                    packageCalculations: {
                        ...(snap.quotationDetails?.packageCalculations || {}),
                        standard: { 
                            ...(snap.quotationDetails?.packageCalculations?.standard || {}),
                            finalTotal: Number(formData.standardCost) 
                        },
                        deluxe: { 
                            ...(snap.quotationDetails?.packageCalculations?.deluxe || {}),
                            finalTotal: Number(formData.deluxeCost) 
                        },
                        superior: { 
                            ...(snap.quotationDetails?.packageCalculations?.superior || {}),
                            finalTotal: Number(formData.superiorCost) 
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
                <Typography variant="h6" gutterBottom>Pricing & Costs</Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth
                            label="Standard Cost"
                            type="number"
                            value={formData.standardCost}
                            onChange={(e) => handleChange("standardCost", e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth
                            label="Deluxe Cost"
                            type="number"
                            value={formData.deluxeCost}
                            onChange={(e) => handleChange("deluxeCost", e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth
                            label="Superior Cost"
                            type="number"
                            value={formData.superiorCost}
                            onChange={(e) => handleChange("superiorCost", e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            fullWidth
                            label="Transport Cost"
                            type="number"
                            value={formData.transportationCost}
                            onChange={(e) => handleChange("transportationCost", e.target.value)}
                        />
                    </Grid>
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
                </Grid>

                <Typography variant="h6" gutterBottom>Hotel Names</Typography>
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
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>Save All Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickEditAllDialog;
