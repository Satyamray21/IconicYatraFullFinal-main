// src/Pages/Admin/Hotel/HotelCard.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchHotels,
  deleteHotel,
  updateHotelStatus,
} from "../../../features/hotel/hotelSlice";

import {
  Container,
  Typography,
  IconButton,
  Button,
  Stack,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Delete,
  Edit,
  MoreVert,
  CheckCircle,
  Cancel,
  Search,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

const HotelCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels = [], loading, error } = useSelector((state) => state.hotel);

  const [searchTerm, setSearchTerm] = useState("");
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Delete Confirm Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch hotels on mount
  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  // Handle errors from Redux store
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: "error",
      });
    }
  }, [error]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleMenuOpen = (event, hotel) => {
    setMenuAnchor(event.currentTarget);
    setSelectedHotel(hotel);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedHotel(null);
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!selectedHotel) return;
    try {
      await dispatch(deleteHotel(selectedHotel._id)).unwrap();
      setSnackbar({
        open: true,
        message: "Hotel deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Failed to delete hotel. Please try again.",
        severity: "error",
      });
    }
    setDeleteOpen(false);
    setSelectedHotel(null);
  };

  // Status Update
  const handleStatusChange = async (status) => {
    if (!selectedHotel) return;
    try {
      await dispatch(updateHotelStatus({ id: selectedHotel._id, status })).unwrap();
      setSnackbar({
        open: true,
        message: `Status updated to ${status} successfully!`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Failed to update status. Please try again.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  // Filter client-side
  const mappedHotels = (hotels || [])
    .map((hotel, index) => ({
      id: hotel._id, // unique id required for DataGrid rows
      srNo: index + 1,
      hotelId: hotel.hotelId || "-",
      hotelName: hotel.hotelName || "-",
      hotelType: hotel.hotelType || "-",
      mobile: hotel.contactDetails?.mobile || "-",
      email: hotel.contactDetails?.email || "-",
      address: hotel.location?.address || "-",
      state: hotel.location?.state || "-",
      country: hotel.location?.country || "India",
      city: hotel.location?.city || "-",
      status: hotel.status || "Active",
      originalData: hotel,
    }))
    .filter((hotel) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        hotel.hotelName.toLowerCase().includes(term) ||
        hotel.hotelId.toLowerCase().includes(term) ||
        hotel.city.toLowerCase().includes(term) ||
        hotel.state.toLowerCase().includes(term) ||
        hotel.mobile.toLowerCase().includes(term) ||
        hotel.email.toLowerCase().includes(term)
      );
    });

  const columns = [
    { field: "srNo", headerName: "Sr. No", width: 70 },
    { field: "hotelId", headerName: "Hotel ID", width: 110 },
    { field: "hotelName", headerName: "Hotel Name", width: 180 },
    { field: "hotelType", headerName: "Category", width: 120 },
    { field: "mobile", headerName: "Mobile", width: 120 },
    { field: "email", headerName: "Email", width: 180 },
    {
      field: "address",
      headerName: "Address",
      width: 200,
      renderCell: (params) => (
        <Box
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
          }}
          title={params.value}
        >
          {params.value}
        </Box>
      ),
    },
    { field: "state", headerName: "State", width: 120 },
    { field: "country", headerName: "Country", width: 100 },
    { field: "city", headerName: "Destination", width: 130 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Active" ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const hotel = params.row;
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" height="100%">
            {/* Edit */}
            <IconButton
              color="primary"
              size="small"
              onClick={() => navigate(`/hotel/edit/${hotel.id}`)}
            >
              <Edit fontSize="small" />
            </IconButton>
            {/* Delete */}
            <IconButton
              color="error"
              size="small"
              onClick={() => {
                setSelectedHotel(hotel.originalData);
                setDeleteOpen(true);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
            {/* Menu */}
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, hotel.originalData)}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Stack>
        );
      },
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Hotel List
          </Typography>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            alignItems="center"
          >
            <TextField
              placeholder="Search hotels..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: "100%", sm: 250 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" disabled>
                      <Search fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate("/hotelform")}
              sx={{ minWidth: 120, height: 40 }}
            >
              Add Hotel
            </Button>
          </Box>
        </Box>

        {/* Data Grid */}
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: "800px" }}>
            <DataGrid
              rows={mappedHotels}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50, 100]}
              autoHeight
              disableRowSelectionOnClick
              loading={loading}
            />
          </Box>
        </Box>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 180,
              boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            },
          }}
        >
          <MenuItem onClick={() => handleStatusChange("Active")}>
            <ListItemIcon>
              <CheckCircle sx={{ color: "green" }} fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Set Active"
              primaryTypographyProps={{ sx: { color: "green", fontWeight: "bold" } }}
            />
          </MenuItem>

          <MenuItem onClick={() => handleStatusChange("Inactive")}>
            <ListItemIcon>
              <Cancel sx={{ color: "red" }} fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Set Inactive"
              primaryTypographyProps={{ sx: { color: "red", fontWeight: "bold" } }}
            />
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedHotel(null);
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete hotel{" "}
              <b>{selectedHotel?.hotelName}</b>? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                setSelectedHotel(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications Snackbar */}
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

export default HotelCard;
