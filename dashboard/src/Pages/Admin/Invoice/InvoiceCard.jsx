import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getInvoices,
  deleteInvoice,
  renumberCompanyAdvancedReceipts,
  backfillInvoiceSerials,
} from "../../../features/invoice/invoiceSlice";

const InvoiceCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, loading, error } = useSelector((state) => state.invoice);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 🔴 Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // 🔔 Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [repairingAr, setRepairingAr] = useState(false);
  const [repairingSerials, setRepairingSerials] = useState(false);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 📅 Date formatter
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "-";

  // 💰 Currency formatter
  const formatCurrency = (value) =>
    `₹${(Number(value) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  // 📦 Fetch invoices
  useEffect(() => {
    dispatch(getInvoices());
  }, [dispatch]);

  // ➕ Add invoice
  const handleAddClick = () => {
    navigate("/invoiceform");
  };

  const handleRepairAdvancedReceipts = async () => {
    setRepairingAr(true);
    try {
      const result = await dispatch(renumberCompanyAdvancedReceipts()).unwrap();
      await dispatch(getInvoices());
      setSnackbar({
        open: true,
        message: result?.message || "Advance receipt numbers updated",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          typeof err === "string"
            ? err
            : "Could not repair advance receipt numbers",
        severity: "error",
      });
    } finally {
      setRepairingAr(false);
    }
  };

  const handleRepairInvoiceSerials = async () => {
    setRepairingSerials(true);
    try {
      const result = await dispatch(backfillInvoiceSerials({})).unwrap();
      await dispatch(getInvoices());
      setSnackbar({
        open: true,
        message:
          result?.message || "Invoice serial numbers repaired successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          typeof err === "string"
            ? err
            : "Could not repair invoice serial numbers",
        severity: "error",
      });
    } finally {
      setRepairingSerials(false);
    }
  };

  // ✏️ Edit invoice
  const handleEditClick = (invoice) => {
    navigate(`/invoice/edit/${invoice._id}`, {
      state: { invoiceData: invoice },
    });
  };

  // 🗑️ Open confirm dialog
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  // 🗑️ Confirm delete
  const confirmDelete = async () => {
    try {
      await dispatch(deleteInvoice(deleteId)).unwrap();

      setSnackbar({
        open: true,
        message: "Invoice deleted successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Failed to delete invoice",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // 👁️ View invoice
  const handleRowClick = (invoice) => {
    navigate(`/invoice/generate/${invoice._id}`);
  };

  // 🔍 Filter invoices
  const filteredData = useMemo(() => {
    let source = Array.isArray(invoices) ? invoices : [];

    if (!searchQuery.trim()) return source;

    return source.filter((item) =>
      item.partyName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [invoices, searchQuery]);

  // 📄 Pagination
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress color="warning" />
      </Box>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Action Bar */}
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              color="warning"
              onClick={handleAddClick}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={repairingAr}
              onClick={handleRepairAdvancedReceipts}
            >
              {repairingAr ? "Repairing…" : "Repair AR numbers"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={repairingSerials}
              onClick={handleRepairInvoiceSerials}
            >
              {repairingSerials ? "Repairing…" : "Repair Invoice S.No"}
            </Button>
          </Box>

          <TextField
            size="small"
            placeholder="Search by party name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr No.</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Adv. receipt</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Party Name</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Received</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.length ? (
                paginatedData.map((invoice, index) => (
                  <TableRow
                    key={invoice._id}
                    hover
                    onClick={() => handleRowClick(invoice)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{invoice.invoiceNo}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {invoice.advancedReceiptNo || "—"}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{invoice.billingName}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.receivedAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.balanceAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(invoice);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(invoice._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[7, 25, 50]}
        />
      </Box>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this invoice?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InvoiceCard;
