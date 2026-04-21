import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAssociates,
  deleteAssociate,
  fetchAssociateQuotations,
  clearAssociateQuotations,
} from "../../../features/associate/associateSlice";

const stats = [
  { title: "Today's", active: 0, confirmed: 0, cancelled: 0 },
  { title: "This Month", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 3 Months", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 6 Months", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 12 Months", active: 0, confirmed: 0, cancelled: 0 },
];

const AssociateDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    list: associateList = [],
    loading,
    quotations = [],
    quotationsLoading = false,
    quotationsTotal = 0,
    quotationsError = null,
  } = useSelector((state) => state.associate);

  // State for snackbar and dialog
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    associateId: null,
    associateName: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [quotationsDialog, setQuotationsDialog] = useState({
    open: false,
    associateId: null,
    associateName: "",
  });

  useEffect(() => {
    dispatch(fetchAllAssociates());
  }, [dispatch]);

  const handleAddClick = () => {
    navigate("/associatesform");
  };

  const handleEditClick = (row) => {
    navigate(`/associates/associateseditform/${row.associateId}`);
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      associateId: row.associateId,
      associateName: row.associateName,
    });
  };

  const handleViewQuotations = (row) => {
    setQuotationsDialog({
      open: true,
      associateId: row.associateId,
      associateName: row.associateName,
    });
    dispatch(fetchAssociateQuotations(row.associateId));
  };

  const handleCloseQuotationsDialog = () => {
    setQuotationsDialog({
      open: false,
      associateId: null,
      associateName: "",
    });
    dispatch(clearAssociateQuotations());
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.associateId) {
      dispatch(deleteAssociate(deleteDialog.associateId))
        .unwrap()
        .then(() => {
          showSnackbar("Associate deleted successfully", "success");
          // Refresh the list
          dispatch(fetchAllAssociates());
        })
        .catch((error) => {
          console.error("Failed to delete associate:", error);
          showSnackbar("Failed to delete associate", "error");
        });
    }
    setDeleteDialog({ open: false, associateId: null, associateName: "" });
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, associateId: null, associateName: "" });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter associates based on search term
  const filteredAssociates = associateList.filter((associate) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      associate.personalDetails?.fullName?.toLowerCase().includes(searchLower) ||
      associate.personalDetails?.email?.toLowerCase().includes(searchLower) ||
      associate.personalDetails?.mobileNumber?.includes(searchTerm) ||
      associate.associateId?.toLowerCase().includes(searchLower) ||
      associate.firm?.firmName?.toLowerCase().includes(searchLower)
    );
  });

  const mappedAssociateList = filteredAssociates.map((associate, index) => ({
    id: index + 1,
    associateId: associate.associateId,
    associateType: associate.personalDetails?.associateType,
    associateName: associate.personalDetails?.fullName || "",
    mobile: associate.personalDetails?.mobileNumber || "",
    email: associate.personalDetails?.email || "",
    city: associate.staffLocation?.city || "",
    firm: associate.firm?.firmName || "",
  }));

  const columns = [
    { field: "id", headerName: "Sr No.", width: 60 },
    { field: "associateId", headerName: "Associate Id", width: 150 },
    { field: "associateType", headerName: "Associate Type", width: 150 },
    {
      field: "associateName",
      headerName: "Associate Name",
      width: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: "primary.main",
            cursor: "pointer",
            fontWeight: 500,
            textDecoration: "underline",
            "&:hover": { color: "primary.dark" },
          }}
          onClick={() => handleViewQuotations(params.row)}
          title="View assigned quotations"
        >
          {params.row.associateName}
        </Typography>
      ),
    },
    { field: "mobile", headerName: "Mobile", width: 120 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "city", headerName: "City", width: 90 },
    { field: "firm", headerName: "Firm", width: 150 },
    {
      field: "action",
      headerName: "Action",
      width: 160,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton
            color="info"
            size="small"
            onClick={() => handleViewQuotations(params.row)}
            title="View Assigned Quotations"
          >
            <ReceiptLongIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            title="Edit Associate"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete Associate"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const quotationColumns = [
    { field: "srNo", headerName: "Sr No.", width: 70 },
    { field: "quotationId", headerName: "Quotation ID", width: 180 },
    { field: "quotationType", headerName: "Type", width: 100 },
    { field: "clientName", headerName: "Client", width: 180, flex: 1 },
    {
      field: "amount",
      headerName: "Amount",
      width: 140,
      renderCell: (params) => formatCurrency(params.row.amount),
    },
    {
      field: "date",
      headerName: "Date",
      width: 140,
      renderCell: (params) => formatDate(params.row.date),
    },
    { field: "status", headerName: "Status", width: 110 },
  ];

  const quotationRows = (quotations || []).map((q, index) => ({
    id: q._id || `${q.quotationType}-${index}`,
    srNo: index + 1,
    quotationId: q.quotationId || "-",
    quotationType: q.quotationType || "-",
    clientName: q.clientName || "-",
    amount: q.amount || 0,
    date: q.date,
    status: q.status || "-",
  }));

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Stat Cards */}
        <Grid container spacing={2}>
          {stats.map((item, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <Card
                sx={{
                  backgroundColor: "#e91e63",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Typography variant="h6">
                    {item.title}: {item.active}
                  </Typography>
                  <Typography variant="body2">Active: {item.active}</Typography>
                  <Typography variant="body2">
                    Confirmed: {item.confirmed}
                  </Typography>
                  <Typography variant="body2">
                    Cancelled: {item.cancelled}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Actions */}
        <Box
          mt={3}
          mb={2}
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
        >
          <Button
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
            onClick={handleAddClick}
          >
            Add
          </Button>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name, email, mobile, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 300 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Data Grid */}
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: "600px" }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={mappedAssociateList}
                columns={columns}
                pageSize={7}
                rowsPerPageOptions={[7, 25, 50, 100]}
                autoHeight
                disableRowSelectionOnClick
                loading={loading}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete associate{" "}
            <strong>{deleteDialog.associateName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assigned Quotations Dialog */}
      <Dialog
        open={quotationsDialog.open}
        onClose={handleCloseQuotationsDialog}
        maxWidth="lg"
        fullWidth
        aria-labelledby="quotations-dialog-title"
      >
        <DialogTitle id="quotations-dialog-title">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="h6" component="div">
                Quotations Assigned to {quotationsDialog.associateName || "Associate"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quotationsDialog.associateId}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Total Assigned
              </Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(quotationsTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {quotationRows.length} quotation
                {quotationRows.length === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {quotationsLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height={200}
            >
              <CircularProgress />
            </Box>
          ) : quotationsError ? (
            <Alert severity="error">{quotationsError}</Alert>
          ) : quotationRows.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography variant="body1" color="text.secondary">
                No quotations have been assigned to this associate yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: "100%", minHeight: 300 }}>
              <DataGrid
                rows={quotationRows}
                columns={quotationColumns}
                autoHeight
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuotationsDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AssociateDashboard;