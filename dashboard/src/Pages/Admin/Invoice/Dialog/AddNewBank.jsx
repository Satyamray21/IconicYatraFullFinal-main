import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
} from "@mui/material";

const AddNewBank = ({ open, onClose, onSave }) => {
    const [bankDetails, setBankDetails] = useState({
        bankName: "",
        branchName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        openingBalance: "",
    });

    // Reset fields whenever dialog opens
    useEffect(() => {
        if (open) {
            setBankDetails({
                bankName: "",
                branchName: "",
                accountHolderName: "",
                accountNumber: "",
                ifscCode: "",
                openingBalance: "",
            });
        }
    }, [open]);

    const handleChange = (field, value) => {
        setBankDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleAdd = () => {
        onSave(bankDetails.bankName); // or send full object if needed
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: "primary.main" }}>Add New Bank</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Associate's Bank Details
                    </Typography>

                    <Box display="flex" gap={2} sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            label="*Name of Bank"
                            value={bankDetails.bankName}
                            onChange={(e) => handleChange("bankName", e.target.value)}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Branch Name"
                            value={bankDetails.branchName}
                            onChange={(e) => handleChange("branchName", e.target.value)}
                            margin="normal"
                        />
                    </Box>

                    <TextField
                        fullWidth
                        label="*Account Holder Name"
                        value={bankDetails.accountHolderName}
                        onChange={(e) =>
                            handleChange("accountHolderName", e.target.value)
                        }
                        margin="normal"
                        sx={{ mb: 2 }}
                    />

                    <Box display="flex" gap={2} sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            label="*Account Number"
                            value={bankDetails.accountNumber}
                            onChange={(e) => handleChange("accountNumber", e.target.value)}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="IFSC Code"
                            value={bankDetails.ifscCode}
                            onChange={(e) => handleChange("ifscCode", e.target.value)}
                            margin="normal"
                        />
                    </Box>

                    <TextField
                        fullWidth
                        label="Opening Balance"
                        type="number"
                        value={bankDetails.openingBalance}
                        onChange={(e) => handleChange("openingBalance", e.target.value)}
                        margin="normal"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    sx={{ bgcolor: "skyblue", "&:hover": { bgcolor: "deepskyblue" } }}
                >
                    Add
                </Button>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ bgcolor: "darkorange", "&:hover": { bgcolor: "orange" } }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddNewBank;