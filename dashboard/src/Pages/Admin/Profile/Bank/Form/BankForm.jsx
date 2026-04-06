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

const AddBankDetails = ({ open, onClose, newBankDetails, onNewBankChange, onAddBank }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: "primary.main" }}>Add New Bank</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Bank Details
                    </Typography>

                    <TextField
                        fullWidth
                        label="Bank Name *"
                        value={newBankDetails.bankName}
                        onChange={(e) => onNewBankChange("bankName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Branch Name *"
                        value={newBankDetails.branchName}
                        onChange={(e) => onNewBankChange("branchName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Account Holder Name *"
                        value={newBankDetails.accountHolderName}
                        onChange={(e) => onNewBankChange("accountHolderName", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Account Number *"
                        value={newBankDetails.accountNumber}
                        onChange={(e) => onNewBankChange("accountNumber", e.target.value)}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="IFSC Code *"
                        value={newBankDetails.ifscCode}
                        onChange={(e) => onNewBankChange("ifscCode", e.target.value)}
                        margin="normal"
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onAddBank} variant="contained" sx={{ bgcolor: "primary.main" }}>
                    Add
                </Button>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddBankDetails;