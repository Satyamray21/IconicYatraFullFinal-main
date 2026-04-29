import React, { useState, useEffect } from "react";
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
  Typography,
  Grid,
  Box,
  Radio,
  Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAssociates } from "../../../../../features/associate/associateSlice";
import { getCompany } from "../../../../../features/companyUI/companyUISlice";

const FinalizeDialog = ({ open, onClose, vendor, setVendor, onConfirm }) => {
  const dispatch = useDispatch();
  const [selectedBankId, setSelectedBankId] = useState("");

  const { list: associateList = [] } = useSelector((state) => state.associate);
  const { data: company, status } = useSelector((state) => state.companyUI);

  useEffect(() => {
    dispatch(fetchAllAssociates());
  }, [dispatch]);

  useEffect(() => {
    if (!company && status === "idle") {
      dispatch(getCompany());
    }
  }, [company, status, dispatch]);

  const vehicleVendors = associateList.filter(
    (associate) => associate.personalDetails.associateType === "Vehicle Vendor"
  );

  useEffect(() => {
    if (!vendor && vehicleVendors.length > 0) {
      setVendor(vehicleVendors[0].personalDetails.fullName);
    }
  }, [vendor, vehicleVendors, setVendor]);

  useEffect(() => {
    if (!open) {
      setSelectedBankId("");
    }
  }, [open]);

  const handleConfirmClick = () => {
    const selectedBank = company?.bankDetails?.find((b) => b._id === selectedBankId);
    onConfirm(selectedBank);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: "#1976d2" }}>
        Finalize Quotation - Select Vendor & Bank
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }} color="text.primary">
          <span style={{ color: "red" }}>*</span> Select Vehicle Vendor
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel required>Vehicle Vendor</InputLabel>
          <Select
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            displayEmpty
          >
            {vehicleVendors.map((v) => (
              <MenuItem key={v._id} value={v.personalDetails.fullName}>
                {v.personalDetails.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} color="text.primary">
          🏦 Select Bank Account
        </Typography>

        <Grid container spacing={2}>
          {company?.bankDetails && company.bankDetails.length > 0 ? (
            company.bankDetails.map((bank) => (
              <Grid item xs={12} md={6} key={bank._id}>
                <Box
                  onClick={() => setSelectedBankId(bank._id)}
                  sx={{
                    border:
                      selectedBankId === bank._id
                        ? "2px solid #4caf50"
                        : "1px solid #ccc",
                    borderRadius: 1,
                    p: 2,
                    cursor: "pointer",
                    transition: "0.2s",
                    backgroundColor:
                      selectedBankId === bank._id ? "#e8f5e9" : "transparent",
                    "&:hover": {
                      borderColor: "#4caf50",
                      backgroundColor: "#f1f8e9",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Radio
                      checked={selectedBankId === bank._id}
                      sx={{
                        color: "#4caf50",
                        "&.Mui-checked": { color: "#4caf50" },
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {bank.bankName} - {bank.accountHolderName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        A/C: {bank.accountNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        IFSC: {bank.ifscCode}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                No bank details found in company settings.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={handleConfirmClick}
          variant="contained"
          disabled={!vendor || !selectedBankId}
          sx={{
            textTransform: "none",
            backgroundColor: vendor && selectedBankId ? "#64b5f6" : "#bbdefb",
            "&:hover": { backgroundColor: "#2196f3" },
          }}
        >
          Confirm
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "#f57c00",
            textTransform: "none",
            "&:hover": { backgroundColor: "#ef6c00" },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinalizeDialog;