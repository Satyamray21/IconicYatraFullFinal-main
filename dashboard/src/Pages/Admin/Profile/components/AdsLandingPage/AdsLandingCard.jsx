// src/components/GoogleAdsList.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchLandingPages, deleteLandingPage } from "../../../../../features/landingPage/landingPageSlice";

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

  const { pages, loading } = useSelector((state) => state.landingPages);

  const campaigns = pages || [];

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
     DELETE LANDING PAGE
  ================================ */

  const handleDelete = async (id) => {

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

    navigate("/googleadseditform", {
      state: { campaign, isEditing: true },
    });

  };



  /* ===============================
     VIEW
  ================================ */

  const handleView = (campaign) => {

    navigate(`/google-ads/${campaign._id}`, {
      state: { campaign },
    });

  };



  /* ===============================
     CREATE
  ================================ */

  const handleCreateNew = () => {

    navigate("/googleadsform");

  };



  /* ===============================
     SEARCH FILTER
  ================================ */

  const filteredCampaigns = campaigns.filter((campaign) =>

    campaign.heroTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.slug?.toLowerCase().includes(searchTerm.toLowerCase())

  );



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

                    <LandingPageChip
                      label={campaign.slug}
                      icon={<FlagIcon />}
                      size="small"
                    />

                  </TableCell>



                  <TableCell>

                    <Chip
                      label={campaign.isActive ? "Active" : "Inactive"}
                      color={campaign.isActive ? "success" : "default"}
                      size="small"
                    />

                  </TableCell>



                  <TableCell>

                    {new Date(campaign.createdAt).toLocaleDateString("en-IN")}

                  </TableCell>



                  <TableCell>

                    <Stack direction="row" spacing={1}>

                      <Tooltip title="View">

                        <IconButton
                          size="small"
                          onClick={() => handleView(campaign)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Edit">

                        <IconButton
                          size="small"
                          onClick={() => handleEdit(campaign)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                      </Tooltip>



                      <Tooltip title="Delete">

                        <IconButton
                          size="small"
                          color="error"
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
