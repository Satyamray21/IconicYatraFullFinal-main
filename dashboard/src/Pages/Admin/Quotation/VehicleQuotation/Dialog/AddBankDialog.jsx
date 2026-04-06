import React from 'react';
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

const AddBankDialog = ({
  open,
  onClose,
  newBankDetails,
  onNewBankChange,
  onAddBank,
}) => {
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
              value={newBankDetails.bankName}
              onChange={(e) => onNewBankChange("bankName", e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Branch Name"
              value={newBankDetails.branchName}
              onChange={(e) => onNewBankChange("branchName", e.target.value)}
              margin="normal"
            />
          </Box>

          <TextField
            fullWidth
            label="*Account Holder Name"
            value={newBankDetails.accountHolderName}
            onChange={(e) =>
              onNewBankChange("accountHolderName", e.target.value)
            }
            margin="normal"
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="*Account Number"
              value={newBankDetails.accountNumber}
              onChange={(e) => onNewBankChange("accountNumber", e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="IFSC Code"
              value={newBankDetails.ifscCode}
              onChange={(e) => onNewBankChange("ifscCode", e.target.value)}
              margin="normal"
            />
          </Box>

          <TextField
            fullWidth
            label="Opening Balance"
            type="number"
            value={newBankDetails.openingBalance}
            onChange={(e) => onNewBankChange("openingBalance", e.target.value)}
            margin="normal"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onAddBank}
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

export default AddBankDialog;