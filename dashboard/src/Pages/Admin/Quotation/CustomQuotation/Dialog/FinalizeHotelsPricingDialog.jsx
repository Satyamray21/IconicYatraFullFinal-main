import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import CustomQuotationForm from "../customquotationStep6";
import { updateQuotationStep } from "../../../../../features/quotation/customQuotationSlice";

const FinalizeHotelsPricingDialog = ({
    open,
    onClose,
    quotation,
    quotationId,
    onSaved,
    /** When set, skips custom quotation step 6 API (e.g. quick quotation). */
    onSaveHotelsPricing,
}) => {
    const dispatch = useDispatch();

    const handleSubmit = async (finalData) => {
        if (onSaveHotelsPricing) {
            await onSaveHotelsPricing(finalData);
        } else {
            await dispatch(
                updateQuotationStep({
                    quotationId,
                    stepNumber: 6,
                    stepData: {
                        clientDetails: finalData.clientDetails,
                        pickupDrop: finalData.pickupDrop,
                        tourDetails: finalData.tourDetails,
                    },
                })
            ).unwrap();
        }
        onSaved?.();
        onClose();
    };

    if (!open || !quotation) return null;

    const formData = {
        clientDetails: quotation.clientDetails,
        pickupDrop: quotation.pickupDrop,
        tourDetails: quotation.tourDetails,
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth scroll="paper">
            <DialogTitle sx={{ pr: 6 }}>
                Edit hotels, rooms & pricing (same as Step 6)
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ maxWidth: 1400, mx: "auto" }}>
                    <CustomQuotationForm
                        formData={formData}
                        onSubmit={handleSubmit}
                        loading={false}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default FinalizeHotelsPricingDialog;
