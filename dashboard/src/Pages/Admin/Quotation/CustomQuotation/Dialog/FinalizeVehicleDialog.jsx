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
import CustomQuotationStep5 from "../customquotationStep5";
import { updateQuotationStep } from "../../../../../features/quotation/customQuotationSlice";

const FinalizeVehicleDialog = ({ open, onClose, quotation, quotationId, onSaved }) => {
    const dispatch = useDispatch();
    const td = quotation?.tourDetails;
    const cd = quotation?.clientDetails;

    const handleNext = async (vehiclePayload) => {
        await dispatch(
            updateQuotationStep({
                quotationId,
                stepNumber: 5,
                stepData: vehiclePayload,
            })
        ).unwrap();
        onSaved?.();
        onClose();
    };

    if (!open || !quotation) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ pr: 6 }}>
                Edit vehicle & pickup / drop
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 1 }}>
                <Box sx={{ pb: 2 }}>
                    <CustomQuotationStep5
                        clientName={cd?.clientName}
                        arrivalCity={td?.arrivalCity}
                        departureCity={td?.departureCity}
                        arrivalDate={td?.arrivalDate}
                        departureDate={td?.departureDate}
                        transport={td?.transport || "Yes"}
                        cities={quotation?.pickupDrop || []}
                        vehicleDetails={td?.vehicleDetails || {}}
                        onNext={handleNext}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default FinalizeVehicleDialog;
