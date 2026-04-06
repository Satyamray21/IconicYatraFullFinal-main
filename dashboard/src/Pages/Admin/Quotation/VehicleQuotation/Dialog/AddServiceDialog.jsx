import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

const AddServiceDialog = ({
  open,
  onClose,
  currentService,
  onServiceChange,
  services,
  onAddService,
  onClearService,
  onRemoveService,
  onSaveServices,
  taxOptions,
}) => {
  const calculateTotalAmount = () => {
    return services.reduce((total, service) => total + service.totalAmount, 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ color: "primary.main", display: "flex", alignItems: "center" }}
      >
        <Add sx={{ mr: 1 }} />
        Add Service
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">*Included In Quotation</FormLabel>
            <RadioGroup
              row
              value={currentService.included}
              onChange={(e) => onServiceChange("included", e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="*Particulars"
            value={currentService.particulars}
            onChange={(e) => onServiceChange("particulars", e.target.value)}
            margin="normal"
          />

          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="*Amount"
              type="number"
              value={currentService.amount}
              onChange={(e) => onServiceChange("amount", e.target.value)}
              margin="normal"
              disabled={currentService.included === "yes"}
              placeholder={
                currentService.included === "yes"
                  ? "Included in quotation"
                  : ""
              }
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>*Tax %</InputLabel>
              <Select
                value={currentService.taxType}
                onChange={(e) => onServiceChange("taxType", e.target.value)}
                label="*Tax %"
              >
                {taxOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {services.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Added Services
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Included</TableCell>
                      <TableCell>Particulars</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {service.included === "yes" ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>{service.particulars}</TableCell>
                        <TableCell align="right">
                          {service.included === "yes"
                            ? "Included"
                            : `₹${service.amount}`}
                        </TableCell>
                        <TableCell align="right">
                          {service.taxLabel}
                        </TableCell>
                        <TableCell align="right">
                          {service.included === "yes"
                            ? "Included"
                            : `₹${service.totalAmount.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => onRemoveService(service.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
              >
                <Typography variant="h6">
                  Total Amount: ₹{calculateTotalAmount().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onAddService}
          variant="outlined"
          startIcon={<Add />}
        >
          Add More
        </Button>
        <Button
          onClick={onClearService}
          variant="outlined"
          color="secondary"
        >
          Clear
        </Button>
        <Button
          onClick={onSaveServices}
          variant="contained"
          sx={{ bgcolor: "skyblue", "&:hover": { bgcolor: "deepskyblue" } }}
        >
          Save
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

export default AddServiceDialog;