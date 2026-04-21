import React, { useState } from "react";
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
  Chip,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

/** Receive Voucher → Cr = money received from client; Payment Voucher → Dr = money paid to vendor */
const summarizeVoucherAmounts = (vouchers) => {
  let receivedFromClient = 0;
  let paidToVendor = 0;
  (vouchers || []).forEach((v) => {
    const n = Number(v.amount) || 0;
    const isReceive = v.drCr === "Cr" || v.paymentType === "Receive Voucher";
    const isPayment = v.drCr === "Dr" || v.paymentType === "Payment Voucher";
    if (isReceive) receivedFromClient += n;
    else if (isPayment) paidToVendor += n;
  });
  return {
    receivedFromClient,
    paidToVendor,
    net: receivedFromClient - paidToVendor,
    cr: receivedFromClient,
    dr: paidToVendor,
  };
};

const TransactionHistoryDialog = ({
  open,
  onClose,
  loading,
  rows = [],
  quotationRef,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const totals = summarizeVoucherAmounts(rows);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const tableHeaders = [
    "Sr.",
    "Receipt #",
    "Voucher ID",
    "Type",
    "Party",
    "Particulars",
    "Payment Mode",
    "Dr/Cr",
    "Amount",
    "Actions",
  ];

  const handleEditSave = (id) => {
    onEditTransaction?.(id, editData);
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      onDeleteTransaction?.(id);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: "500px" } }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div" fontWeight="bold">
          Transaction History {quotationRef ? `— ${quotationRef}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Receive vouchers (Cr) = money from client | Payment vouchers (Dr) = money to vendors
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh", overflow: "auto" }}>
        {/* Summary Cards */}
        {!loading && rows?.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                flex: "1 1 200px",
                p: 2,
                borderLeft: "4px solid",
                borderColor: "success.main",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Received from client
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ₹{totals.receivedFromClient.toLocaleString("en-IN")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Receive vouchers (Cr)
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                flex: "1 1 200px",
                p: 2,
                borderLeft: "4px solid",
                borderColor: "warning.main",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Paid to vendors
              </Typography>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                ₹{totals.paidToVendor.toLocaleString("en-IN")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Payment vouchers (Dr)
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                flex: "1 1 200px",
                p: 2,
                borderLeft: "4px solid",
                borderColor: "info.main",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Net (client in − vendor out)
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{totals.net.toLocaleString("en-IN")}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Transactions Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {tableHeaders.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      fontWeight: "bold",
                      borderRight:
                        index < tableHeaders.length - 1 ? "1px solid #e0e0e0" : "none",
                      minWidth: header === "Actions" ? 120 : "auto",
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rows?.length ? (
                rows.map((v, index) => (
                  <TableRow key={v._id || index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          value={editData.receiptNumber || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, receiptNumber: e.target.value })
                          }
                        />
                      ) : (
                        v.receiptNumber || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          value={editData.invoiceId || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, invoiceId: e.target.value })
                          }
                        />
                      ) : (
                        v.invoiceId || "-"
                      )}
                    </TableCell>
                    <TableCell>{v.paymentType}</TableCell>
                    <TableCell>
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          value={editData.partyName || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, partyName: e.target.value })
                          }
                        />
                      ) : (
                        v.partyName
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          value={editData.particulars || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, particulars: e.target.value })
                          }
                          fullWidth
                        />
                      ) : (
                        v.particulars || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          value={editData.paymentMode || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, paymentMode: e.target.value })
                          }
                        />
                      ) : (
                        v.paymentMode || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={v.drCr || "—"}
                        color={
                          v.drCr === "Cr" ? "success" : v.drCr === "Dr" ? "warning" : "default"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editingId === v._id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editData.amount || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, amount: e.target.value })
                          }
                        />
                      ) : (
                        `₹${(Number(v.amount) || 0).toLocaleString("en-IN")}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === v._id ? (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleEditSave(v._id)}
                          >
                            Save
                          </Button>
                          <Button size="small" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingId(v._id);
                              setEditData(v);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(v._id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    align="center"
                    sx={{ height: 120, color: "text.secondary", fontStyle: "italic" }}
                  >
                    No transactions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionHistoryDialog;
