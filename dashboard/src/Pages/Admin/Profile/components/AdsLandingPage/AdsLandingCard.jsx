// src/components/GoogleAdsList.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLandingPages,
  deleteLandingPage
} from "../../../../../features/landingPage/landingPageSlice";

import { toast } from "react-toastify";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  TablePagination,
  LinearProgress,
  Tooltip
} from "@mui/material";

import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Flag as FlagIcon
} from "@mui/icons-material";

import { styled } from "@mui/material/styles";

/* ===============================
   STYLED COMPONENTS
================================ */

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  margin: theme.spacing(3),
}));

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 3),
  width: "300px",
}));

const LandingPageChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "#f3e5f5",
  color: "#7b1fa2",
  fontWeight: 500,
}));

/* ===============================
   COMPONENT
================================ */

const GoogleAdsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const MAIN_URL = import.meta.env.VITE_MAIN_URL;

  const { pages, loading } = useSelector((state) => state.landingPages);

  const landingPages = pages || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* ===============================
     FETCH DATA
  ================================ */

  useEffect(() => {
    dispatch(fetchLandingPages());
  }, [dispatch]);

  /* ===============================
     DELETE
  ================================ */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this landing page?"
    );
    if (!confirmDelete) return;

    try {
      await dispatch(deleteLandingPage(id)).unwrap();
      toast.success("Landing page deleted successfully");
    } catch (error) {
      toast.error(error || "Delete failed");
    }
  };

  /* ===============================
     EDIT
  ================================ */

  const handleEdit = (campaign) => {
    navigate(`/googleadseditform/${campaign._id}`);
 // ✅ FIXED
  };

  /* ===============================
     VIEW
  ================================ */

  const handleView = (campaign) => {
    navigate(`/google-ads/${campaign._id}`);
  };

  /* ===============================
     CREATE
  ================================ */

  const handleCreateNew = () => {
    navigate("/googleadsform");
  };

  /* ===============================
     SEARCH FILTER (OPTIMIZED)
  ================================ */

  const filteredCampaigns = useMemo(() => {
    return landingPages.filter((campaign) =>
      campaign.heroTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [landingPages, searchTerm]);

  /* ===============================
     PAGINATION
  ================================ */

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /* ===============================
     UI
  ================================ */

  return (
    <Box sx={{ p: 3, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          px: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "#1a237e", mb: 1 }}
          >
            Google Ads Landing Pages
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage landing pages used for ads
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create Landing Page
        </Button>
      </Box>

      {/* SEARCH */}
      <Stack direction="row" sx={{ px: 3 }}>
        <SearchField
          placeholder="Search landing pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* TABLE */}
      <StyledTableContainer component={Paper}>
        {loading && <LinearProgress />}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Landing Page</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredCampaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No landing pages found
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {filteredCampaigns
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((campaign, index) => (
                <TableRow key={campaign._id} hover>
                  <TableCell>
                    {page * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={600} color="primary">
                      {campaign.heroTitle}
                    </Typography>
                  </TableCell>

                  <TableCell>
  <a
    href={`${MAIN_URL}/${campaign.slug}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: "none" }}
  >
    <LandingPageChip
      label={campaign.slug}
      icon={<FlagIcon />}
      size="small"
      clickable
    />
  </a>
</TableCell>


                  <TableCell>
                    <Chip
                      label={campaign.isActive ? "Active" : "Inactive"}
                      color={campaign.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    {new Date(campaign.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          disabled={loading}
                          onClick={() => handleView(campaign)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          disabled={loading}
                          onClick={() => handleEdit(campaign)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={loading}
                          onClick={() => handleDelete(campaign._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCampaigns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </StyledTableContainer>
    </Box>
  );
};

export default GoogleAdsList;
