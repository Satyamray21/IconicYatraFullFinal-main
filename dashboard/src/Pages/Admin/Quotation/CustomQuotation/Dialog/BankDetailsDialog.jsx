import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Box,
    Typography,
    RadioGroup as MuiRadioGroup,
    FormControlLabel as MuiFormControlLabel,
    Radio,
    Divider,
} from "@mui/material";
import { Add } from "@mui/icons-material";

const BankDetailsDialog = ({
    open,
    onClose,
    accountType,
    setAccountType,
    accountName,
    setAccountName,
    accountOptions,
    onAddBankOpen,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: "primary.main" }}>Bank Details</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                        Select Company Bank Account
                    </Typography>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Account Name</InputLabel>
                        <Select
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            label="Account Name"
                        >
                            {accountOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {accountName && accountOptions.find(o => o.value === accountName) && (
                        <Box sx={{ mt: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <b>Bank:</b> {accountOptions.find(o => o.value === accountName)?.bankName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <b>A/C Holder:</b> {accountOptions.find(o => o.value === accountName)?.accountHolderName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <b>A/C Number:</b> {accountName}
                            </Typography>
                            <Typography variant="body2">
                                <b>IFSC:</b> {accountOptions.find(o => o.value === accountName)?.ifscCode}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{ bgcolor: "skyblue", "&:hover": { bgcolor: "deepskyblue" } }}
                >
                    Confirm
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

export default BankDetailsDialog;