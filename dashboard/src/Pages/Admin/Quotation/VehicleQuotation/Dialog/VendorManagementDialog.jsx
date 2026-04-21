import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axios from "../../../../../utils/axios";

const VendorManagementDialog = ({
  open,
  onClose,
  vehicle,
  vehicleQuotationId,
  onSaved,
}) => {
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newVendor, setNewVendor] = useState({
    vendorName: "",
    vendorType: "Vehicle",
    amount: "",
    remarks: "",
  });

  const getVendorRowId = (vendor) =>
    String(vendor?._id || vendor?.id || vendor?.tempId || "");

  useEffect(() => {
    if (open && vehicle?.finalizedVendorsWithAmounts) {
      setVendors(
        vehicle.finalizedVendorsWithAmounts.map((v) => ({
          ...v,
          tempId: v?._id ? undefined : String(v?.tempId || Date.now() + Math.random()),
        })),
      );
    }
  }, [open, vehicle]);

  const handleAddVendor = () => {
    if (newVendor.vendorName && newVendor.amount) {
      const vendor = {
        ...newVendor,
        tempId: String(Date.now()),
        amount: Number(newVendor.amount),
      };
      setVendors([...vendors, vendor]);
      setNewVendor({
        vendorName: "",
        vendorType: "Vehicle",
        amount: "",
        remarks: "",
      });
    }
  };

  const handleEditSave = (id) => {
    setVendors(
      vendors.map((v) =>
        getVendorRowId(v) === id
          ? { ...v, ...editData, amount: Number(editData.amount) }
          : v,
      ),
    );
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      setVendors(vendors.filter((v) => getVendorRowId(v) !== id));
    }
  };

  const handleSaveAll = async () => {
    try {
      await axios.patch(`/vehicleQT/${vehicleQuotationId}`, {
        finalizedVendorsWithAmounts: vendors,
      });
      onSaved?.();
      onClose();
    } catch (error) {
      console.error("Failed to save vendors:", error);
    }
  };

  const totalVendorAmount = vendors.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" fontWeight="bold">
          Vendor Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage vendors and their payment amounts for this vehicle quotation
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Summary */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#f9f9f9" }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Summary
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Typography variant="body2">
              Total Vendors: <strong>{vendors.length}</strong>
            </Typography>
            <Typography variant="body2">
              Total Amount: <strong>₹{totalVendorAmount.toLocaleString("en-IN")}</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Add New Vendor Form */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            Add New Vendor
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 2, alignItems: "center" }}>
            <TextField
              size="small"
              label="Vendor Name"
              value={newVendor.vendorName}
              onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })}
            />

            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={newVendor.vendorType}
                label="Type"
                onChange={(e) => setNewVendor({ ...newVendor, vendorType: e.target.value })}
              >
                <MenuItem value="Vehicle">Vehicle</MenuItem>
                <MenuItem value="Hotel">Hotel</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="number"
              label="Amount (₹)"
              value={newVendor.amount}
              onChange={(e) => setNewVendor({ ...newVendor, amount: e.target.value })}
            />

            <TextField
              size="small"
              label="Remarks"
              value={newVendor.remarks}
              onChange={(e) => setNewVendor({ ...newVendor, remarks: e.target.value })}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleAddVendor}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
        </Paper>

        {/* Vendors Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Vendor Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No vendors added yet
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={getVendorRowId(vendor)} hover>
                    <TableCell>
                      {editingId === getVendorRowId(vendor) ? (
                        <TextField
                          size="small"
                          value={editData.vendorName || ""}
                          onChange={(e) => setEditData({ ...editData, vendorName: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        vendor.vendorName
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === getVendorRowId(vendor) ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editData.vendorType || ""}
                            onChange={(e) => setEditData({ ...editData, vendorType: e.target.value })}
                          >
                            <MenuItem value="Vehicle">Vehicle</MenuItem>
                            <MenuItem value="Hotel">Hotel</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          size="small"
                          label={vendor.vendorType}
                          color={
                            vendor.vendorType === "Vehicle" ? "primary" :
                            vendor.vendorType === "Hotel" ? "secondary" : "default"
                          }
                        />
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {editingId === getVendorRowId(vendor) ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editData.amount || ""}
                          onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                        />
                      ) : (
                        `₹${Number(vendor.amount).toLocaleString("en-IN")}`
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === getVendorRowId(vendor) ? (
                        <TextField
                          size="small"
                          value={editData.remarks || ""}
                          onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        vendor.remarks || "-"
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === getVendorRowId(vendor) ? (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleEditSave(getVendorRowId(vendor))}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingId(null);
                              setEditData({});
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingId(getVendorRowId(vendor));
                              setEditData(vendor);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(getVendorRowId(vendor))}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSaveAll}
          variant="contained"
          color="primary"
        >
          Save All Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorManagementDialog;