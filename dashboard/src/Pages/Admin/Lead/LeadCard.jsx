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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSelector, useDispatch } from "react-redux";
import {
  getAllLeads,
  fetchLeadsReports,
  changeLeadStatus,
  deleteLead,
} from "../../../features/leads/leadSlice";
import LeadEditForm from "./Form/LeadEditForm"; // Import the LeadEditForm component

const stats = [
  { title: "Today's", active: 0, confirmed: 0, cancelled: 0 },
  { title: "This Month", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 3 Months", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 6 Months", active: 0, confirmed: 0, cancelled: 0 },
  { title: "Last 12 Months", active: 15, confirmed: 0, cancelled: 0 },
];

const LeadCard = () => {
  const navigate = useNavigate();
  const [anchorEls, setAnchorEls] = React.useState({});

  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    leadId: null,
    leadName: "",
    rowId: null,
  });

  // State for edit dialog
  const [editDialog, setEditDialog] = useState({
    open: false,
    leadId: null,
    leadData: null,
  });

  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const dispatch = useDispatch();

  const {
    list: leadList = [],
    status,
    error,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.leads);

  const {
    reports: stats = [],
    loading: statsLoading,
    error: statsError,
  } = useSelector((state) => state.leads);

  useEffect(() => {
    dispatch(getAllLeads());
    dispatch(fetchLeadsReports());
  }, [dispatch]);

  // Effect to show delete errors
  useEffect(() => {
    if (deleteError) {
      setSnackbar({
        open: true,
        message: deleteError,
        severity: "error",
      });
    }
  }, [deleteError]);

  const handleAddClick = () => {
    navigate("/lead/leadtourform");
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEditClick = (row) => {
    setEditDialog({
      open: true,
      leadId: row.leadId,
      leadData: row.originalData,
    });
  };

  const handleEditSave = () => {
    setEditDialog({ open: false, leadId: null, leadData: null });

    // Refresh the leads list after successful update
    dispatch(getAllLeads());

    setSnackbar({
      open: true,
      message: "Lead updated successfully!",
      severity: "success",
    });
  };

  const handleEditCancel = () => {
    setEditDialog({ open: false, leadId: null, leadData: null });
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      leadId: row.leadId,
      leadName: row.name,
      rowId: row.id,
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.leadId && deleteDialog.leadId !== "-") {
      try {
        await dispatch(deleteLead(deleteDialog.leadId)).unwrap();

        setSnackbar({
          open: true,
          message: "Lead deleted successfully!",
          severity: "success",
        });

        // Refresh the leads list
        dispatch(getAllLeads());
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to delete lead. Please try again.",
          severity: "error",
        });
        console.error("Delete failed:", error);
      }
    } else {
      setSnackbar({
        open: true,
        message: "Invalid lead ID",
        severity: "error",
      });
    }

    setDeleteDialog({ open: false, leadId: null, leadName: "", rowId: null });
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, leadId: null, leadName: "", rowId: null });
  };

  const handleMenuClick = (event, id) => {
    setAnchorEls((prev) => ({ ...prev, [id]: event.currentTarget }));
  };

  const handleMenuClose = (id) => {
    setAnchorEls((prev) => ({ ...prev, [id]: null }));
  };

  // FIXED: Use exact status values that backend expects
  const handleStatusChange = (rowId, newStatus) => {
    const lead = mappedLeads.find((item) => item.id === rowId);

    if (!lead || lead.leadId === "-") {
      console.error("Invalid lead ID");
      setSnackbar({
        open: true,
        message: "Invalid lead ID",
        severity: "error",
      });
      return;
    }

    // Validate status before sending to backend
    const validStatuses = ["Active", "Cancelled", "Confirmed"];
    if (!validStatuses.includes(newStatus)) {
      setSnackbar({
        open: true,
        message: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`,
        severity: "error",
      });
      return;
    }

    dispatch(changeLeadStatus({ leadId: lead.leadId, status: newStatus }))
      .unwrap()
      .then(() => {
        dispatch(getAllLeads());
        dispatch(fetchLeadsReports()); // Refresh list after update
        setSnackbar({
          open: true,
          message: `Lead status updated to ${newStatus}`,
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to update lead status:", err);
        setSnackbar({
          open: true,
          message: "Failed to update lead status",
          severity: "error",
        });
      });

    handleMenuClose(rowId);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const mappedLeads = leadList.map((lead, index) => ({
    id: index + 1,
    leadId: lead.leadId || "-",
    status: lead.status || "New",
    source: lead.officialDetail?.source || "-",
    name: lead.personalDetails?.fullName || "-",
    mobile: lead.personalDetails?.mobile || "-",
    email: lead.personalDetails?.emailId || "-",
    destination: lead.tourDetails?.tourDestination || "-",
    arrivalDate: formatDate(lead?.tourDetails?.pickupDrop?.arrivalDate), // ✅ uses the formatter
    priority: lead.officialDetail?.priority || "-",
    assignTo:
      lead.officialDetail?.assignedTo || lead.officialDetail?.assinedTo || "-",
    originalData: lead,
  }));

  const columns = [
    { field: "id", headerName: "Sr No.", width: 60 },
    { field: "leadId", headerName: "Lead Id", width: 100 },
    { field: "status", headerName: "Status", width: 100 },
    { field: "source", headerName: "Source", width: 80 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "mobile", headerName: "Mobile", width: 100 },
    { field: "email", headerName: "Email", width: 150 },
    { field: "destination", headerName: "Destination", width: 100 },
    { field: "arrivalDate", headerName: "Arrival Date", width: 100 },
    { field: "priority", headerName: "Priority", width: 80 },
    { field: "assignTo", headerName: "Assign To", width: 100 },
    {
      field: "action",
      headerName: "Action",
      width: 140,
      renderCell: (params) => {
        const rowId = params.row.id;
        return (
          <Box display="flex" gap={1} alignItems="center">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEditClick(params.row)}
              disabled={deleteLoading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              disabled={deleteLoading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, rowId)}
              disabled={deleteLoading}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEls[rowId]}
              open={Boolean(anchorEls[rowId])}
              onClose={() => handleMenuClose(rowId)}
            >
              {/* FIXED: Use exact backend expected values */}
              <MenuItem onClick={() => handleStatusChange(rowId, "Active")}>
                Active
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Confirmed")}>
                Confirmed
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Cancelled")}>
                Cancelled
              </MenuItem>
            </Menu>
          </Box>
        );
      },
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Stat Cards */}
        <Grid container spacing={2}>
          {stats.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={index}>
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
                  <Typography variant="body2">Active: {item.Active}</Typography>
                  <Typography variant="body2">
                    Confirmed: {item.Confirmed}
                  </Typography>
                  <Typography variant="body2">
                    Cancelled: {item.Cancelled}
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
            placeholder="Search..."
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
            <DataGrid
              rows={mappedLeads}
              columns={columns}
              pageSize={7}
              rowsPerPageOptions={[7, 25, 50, 100]}
              autoHeight
              disableRowSelectionOnClick
              loading={status === "loading"}
            />
          </Box>
        </Box>

        {/* Edit Lead Dialog */}
        <Dialog
          open={editDialog.open}
          onClose={handleEditCancel}
          maxWidth="lg"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              minHeight: "80vh",
              maxHeight: "90vh",
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <LeadEditForm
              leadId={editDialog.leadId}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={cancelDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete lead for{" "}
              <strong>{deleteDialog.leadName}</strong> (ID:{" "}
              {deleteDialog.leadId})? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={cancelDelete}
              color="primary"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              disabled={deleteLoading}
              autoFocus
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default LeadCard;
