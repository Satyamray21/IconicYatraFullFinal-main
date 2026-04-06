import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
} from "@mui/material";

const EditBankDetails = ({ open, onClose, bankDetails, onBankChange, onUpdateBank }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: "primary.main" }}>Edit Bank Details</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Edit Bank Details
                    </Typography>

                    <TextField
                        fullWidth
                        label="Bank Name *"
                        value={bankDetails.bankName || ""}
                        onChange={(e) => onBankChange("bankName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Branch Name *"
                        value={bankDetails.branchName || ""}
                        onChange={(e) => onBankChange("branchName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Account Holder Name *"
                        value={bankDetails.accountHolderName || ""}
                        onChange={(e) => onBankChange("accountHolderName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Account Number *"
                        value={bankDetails.accountNumber || ""}
                        onChange={(e) => onBankChange("accountNumber", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="IFSC Code *"
                        value={bankDetails.ifscCode || ""}
                        onChange={(e) => onBankChange("ifscCode", e.target.value)}
                        margin="normal"
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onUpdateBank}
                    variant="contained"
                    sx={{ bgcolor: "success.main", "&:hover": { bgcolor: "success.dark" } }}
                >
                    Update
                </Button>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditBankDetails;