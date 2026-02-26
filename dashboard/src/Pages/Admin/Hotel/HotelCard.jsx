// src/components/HotelCard.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHotels,
  deleteHotel,
  updateHotelStatus,
  updateHotel,
} from "../../../features/hotel/hotelSlice";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Stack,
  Chip,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Delete,
  Edit,
  MoreVert,
} from "@mui/icons-material";
import { CheckCircle, Cancel } from "@mui/icons-material";

const HotelCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, error } = useSelector((state) => state.hotel);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Edit Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelType: "",
    contactDetails: { mobile: "", email: "" },
    location: { address1: "", city: "" },
  });

  // Delete Confirm
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  // Handle Menu
  const handleMenuOpen = (event, hotel) => {
    setMenuAnchor(event.currentTarget);
    setSelectedHotel(hotel);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedHotel(null);
  };

  // Delete
  const handleDeleteConfirm = () => {
    if (!selectedHotel) return;
    dispatch(deleteHotel(selectedHotel._id));
    setDeleteOpen(false);
    handleMenuClose();
  };

  // Status Update
  const handleStatusChange = (status) => {
    dispatch(updateHotelStatus({ id: selectedHotel._id, status }));
    handleMenuClose();
  };

  // Edit Modal
  const handleEditOpen = (hotel) => {
    setSelectedHotel(hotel);
    setFormData({
      hotelName: hotel.hotelName,
      hotelType: hotel.hotelType,
      contactDetails: {
        mobile: hotel.contactDetails?.mobile || "",
        email: hotel.contactDetails?.email || "",
      },
      location: {
        address1: hotel.location?.address1 || "",
        city: hotel.location?.city || "",
      },
    });
    setEditOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedHotel(null);
  };

  const handleEditSave = () => {
    if (!selectedHotel) return;
    dispatch(updateHotel({ id: selectedHotel._id, formData }));
    handleEditClose();
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Hotel List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/hotelform")}
        >
          Add Hotel
        </Button>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Hotel ID</TableCell>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 150
                }}
              >
                Hotel Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold", }}>Country</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>City</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {hotels.map((hotel, index) => (
              <TableRow key={hotel._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{hotel.hotelId}</TableCell>
                <TableCell>{hotel.hotelName}</TableCell>
                <TableCell>{hotel.hotelType}</TableCell>
                <TableCell>{hotel.contactDetails?.mobile}</TableCell>
                <TableCell>{hotel.contactDetails?.email}</TableCell>
                <TableCell>{hotel.location?.country}</TableCell>
                <TableCell>{hotel.location?.city}</TableCell>
                <TableCell>
                  <Chip
                    label={hotel.status}
                    color={hotel.status === "Active" ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {/* Edit */}
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/hotel/edit/${hotel._id}`)}
                    >
                      <Edit />
                    </IconButton>
                    {/* Delete */}
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setDeleteOpen(true);
                      }}
                    >
                      <Delete />
                    </IconButton>
                    {/* Menu */}
                    <IconButton onClick={(e) => handleMenuOpen(e, hotel)}>
                      <MoreVert />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* More Menu */}
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

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{" "}
          <b>{selectedHotel?.hotelName}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HotelCard;
