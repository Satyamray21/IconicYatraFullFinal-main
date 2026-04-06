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
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <MuiRadioGroup
              row
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <MuiFormControlLabel
                value="company"
                control={<Radio />}
                label="Company Account"
              />
              <MuiFormControlLabel
                value="other"
                control={<Radio />}
                label="Other Accounts"
              />
            </MuiRadioGroup>
          </FormControl>

          {accountType === "company" ? (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Account Name : Iconic Yatra
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Account Number : 0
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                IFSC Code :
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Bank Name :
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Branch Name :
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                *Account Name
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
                  <Divider />
                  <MenuItem onClick={onAddBankOpen}>
                    <Box display="flex" alignItems="center">
                      <Add sx={{ mr: 1 }} />
                      Add New Bank
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </>
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