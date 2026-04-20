import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import HistoryIcon from "@mui/icons-material/History";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllStaff, deleteStaff } from "../../../features/staff/staffSlice";
import { isStaffSession } from "../../../features/user/userSlice";
import axios from "../../../utils/axios";

function isUserModelAdmin(user) {
  if (!user || isStaffSession(user)) return false;
  const role = user.userRole || user.role || "";
  return ["Superadmin", "Admin", "Executive"].includes(role);
}

function normalizeLoginHistoryPayload(res) {
  const inner = res?.data?.data;
  if (Array.isArray(inner)) return inner;
  if (inner && Array.isArray(inner.data)) return inner.data;
  return [];
}

const stats = [
  { title: "Today's", active: 0, lead: 0, quotation: 0 },
  { title: "This Month", active: 0, lead: 0, quotation: 0 },
  { title: "Last 3 Months", active: 0, lead: 0, quotation: 0 },
  { title: "Last 6 Months", active: 0, lead: 0, quotation: 0 },
  { title: "Last 12 Months", active: 0, lead: 0, quotation: 0 },
];

const StaffCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { list: staffList = [], loading, error } = useSelector((state) => state.staffs);
  const user = useSelector((state) => state.profile.user);
  const canViewStaffLoginHistory = isUserModelAdmin(user);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    staffId: null,
    staffName: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [staffLoginDialog, setStaffLoginDialog] = useState({
    open: false,
    staffId: "",
    staffName: "",
    rows: [],
    loading: false,
    error: null,
  });

  const openStaffLoginHistory = async (row) => {
    setStaffLoginDialog({
      open: true,
      staffId: row.staffId,
      staffName: row.staffName || row.staffId,
      rows: [],
      loading: true,
      error: null,
    });
    try {
      const r = await axios.get(
        `/staff-permission/${encodeURIComponent(row.staffId)}/login-history`,
        { params: { limit: 80 } }
      );
      const rows = normalizeLoginHistoryPayload(r);
      setStaffLoginDialog((prev) => ({
        ...prev,
        rows,
        loading: false,
      }));
    } catch (e) {
      setStaffLoginDialog((prev) => ({
        ...prev,
        loading: false,
        error:
          e.response?.data?.message ||
          e.response?.data?.error ||
          "Failed to fetch login history",
      }));
    }
  };

  const closeStaffLoginHistory = () => {
    setStaffLoginDialog({
      open: false,
      staffId: "",
      staffName: "",
      rows: [],
      loading: false,
      error: null,
    });
  };

  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);

  const handleAddClick = () => {
    navigate("/staffform");
  };

  const handleEditClick = (row) => {
    navigate(`/staff/staffeditform/${row.staffId}`);
  };

  const handleManagePermissions = (row) => {
    const staffData = staffList.find((s) => s.staffId === row.staffId);
    navigate(`/admin/staff/${row.staffId}/permissions`, {
      state: { staffData },
    });
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      staffId: row.staffId,
      staffName: row.staffName,
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.staffId) {
      try {
        await dispatch(deleteStaff(deleteDialog.staffId)).unwrap();

        setSnackbar({
          open: true,
          message: "Staff member deleted successfully!",
          severity: "success",
        });

        // Refresh the staff list
        dispatch(fetchAllStaff());

      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to delete staff member. Please try again.",
          severity: "error",
        });
        console.error("Delete failed:", error);
      }
    }

    setDeleteDialog({ open: false, staffId: null, staffName: "" });
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, staffId: null, staffName: "" });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const mappedStaffList = staffList.map((staff, index) => ({
    id: staff.staffId,
    sno: index + 1, // Required by DataGrid
    staffId: staff.staffId,
    staffName: staff.personalDetails?.fullName || "",
    mobile: staff.personalDetails?.mobileNumber || "",
    email: staff.personalDetails?.email || "",
    city: staff.staffLocation?.city || "",
    designation: staff.personalDetails?.designation || "",
  }));

  const columns = [
    { field: "sno", headerName: "Sr No.", width: 60 },
    { field: "staffId", headerName: "Staff Id", width: 120 },
    { field: "staffName", headerName: "Staff Name", width: 200 },
    { field: "mobile", headerName: "Mobile", width: 120 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "city", headerName: "City", width: 120 },
    { field: "designation", headerName: "Designation", width: 120 },
    {
      field: "action",
      headerName: "Action",
      width: canViewStaffLoginHistory ? 200 : 150,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5} alignItems="center">
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            disabled={loading}
            title="Edit Staff"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="success"
            size="small"
            onClick={() => handleManagePermissions(params.row)}
            disabled={loading}
            title="Manage Permissions"
          >
            <LockIcon fontSize="small" />
          </IconButton>
          {canViewStaffLoginHistory && (
            <Tooltip title="Login history">
              <IconButton
                color="info"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  openStaffLoginHistory(params.row);
                }}
                disabled={loading}
                aria-label={`Login history for ${params.row.staffName}`}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            disabled={loading}
            title="Delete Staff"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Stat Cards */}
        <Grid container spacing={2}>
          {stats.map((item, index) => (
            <Grid key={index} item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  backgroundColor: "#0b6396ff",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Typography variant="h6">
                    {item.title}: {item.active}
                  </Typography>
                  <Typography variant="body2">Active: {item.active}</Typography>
                  <Typography variant="body2">Lead: {item.lead}</Typography>
                  <Typography variant="body2">
                    Quotation: {item.quotation}
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
              rows={mappedStaffList}
              columns={columns}
              pageSize={7}
              rowsPerPageOptions={[7, 25, 50, 100]}
              autoHeight
              disableRowSelectionOnClick
              loading={loading}
            />
          </Box>
        </Box>

        <Dialog
          open={staffLoginDialog.open}
          onClose={closeStaffLoginHistory}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Login history — {staffLoginDialog.staffName}{" "}
            <Typography component="span" variant="body2" color="text.secondary">
              ({staffLoginDialog.staffId})
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {staffLoginDialog.loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={220}
              >
                <CircularProgress />
              </Box>
            ) : staffLoginDialog.error ? (
              <Alert severity="error">{staffLoginDialog.error}</Alert>
            ) : staffLoginDialog.rows.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No login history for this staff (create staff login &amp; permissions
                first).
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell>Date &amp; time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>ISP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffLoginDialog.rows.map((log, idx) => (
                      <TableRow
                        key={
                          log._id
                            ? String(log._id)
                            : `${staffLoginDialog.staffId}-${log.dateTime}-${idx}`
                        }
                      >
                        <TableCell>{log.dateTime}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            size="small"
                            color={
                              log.status === "Login Successful"
                                ? "success"
                                : "error"
                            }
                          />
                        </TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>
                          {[log.city, log.region, log.country]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </TableCell>
                        <TableCell>{log.isp || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeStaffLoginHistory}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={cancelDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete staff member{" "}
              <strong>{deleteDialog.staffName}</strong>? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete} color="primary">
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default StaffCard;