import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackages, deletePackage } from "../../../features/package/packageSlice";

const PackageDashboard = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    items: packageList = [],
    total: totalPackages = 0,
    loading,
    error
  } = useSelector((state) => state.packages);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tourTypeFilter, setTourTypeFilter] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0
  });

  // ✅ Fetch packages with pagination
  useEffect(() => {
  dispatch(
    fetchPackages({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      status: statusFilter,
      tourType: tourTypeFilter,
      search: searchQuery
    })
  );
}, [dispatch, paginationModel, statusFilter, tourTypeFilter, searchQuery]);


  // ✅ Dynamic tour types
  const tourTypes = ["Domestic", "International"];


  const handleAddClick = () => navigate("/packageform");

  const handleEditClick = (row) => {
    navigate(`/tourpackage/packageeditform/${row._id}`);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    dispatch(deletePackage(deleteId));
    setOpenDeleteDialog(false);
  };

  // ✅ Columns
  const columns = [
    { field: "srNo", headerName: "Sr No.", width: 70 },

    { field: "packageId", headerName: "Package Id", flex: 1, minWidth: 150 },

    { field: "sector", headerName: "Sector", width: 120 },

    { field: "title", headerName: "Title", flex: 2, minWidth: 180 },

    { field: "noOfNight", headerName: "No of Night", width: 120 },

    { field: "tourType", headerName: "Tour Type", width: 120 },

    { field: "packageType", headerName: "Package Type", width: 140 },

    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            color:
              params.value?.toLowerCase() === "active"
                ? "green"
                : "red",
            textTransform: "capitalize",
            mt: 1
          }}
        >
          {params.value}
        </Typography>
      )
    },

    {
      field: "action",
      headerName: "Action",
      width: 120,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row._id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // ✅ Filters
  const filteredData = useMemo(() => {
    return packageList.filter((pkg) => {

      const matchesStatus =
        !statusFilter ||
        pkg.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesTourType =
        !tourTypeFilter ||
        pkg.tourType?.toLowerCase() === tourTypeFilter.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        pkg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.tourType?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesTourType && matchesSearch;
    });
  }, [packageList, searchQuery, statusFilter, tourTypeFilter]);

  const clearFilters = () => {
    setStatusFilter("");
    setTourTypeFilter("");
    setSearchQuery("");
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>

        {/* Action Bar */}

        <Box
          mt={3}
          mb={2}
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
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

          <Box
            display="flex"
            gap={2}
            flexDirection={{ xs: "column", sm: "row" }}
          >

            {/* Status Filter */}

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deactive">Deactive</MenuItem>
            </TextField>

            {/* Tour Type */}

            <TextField
              select
              size="small"
              label="Tour Type"
              value={tourTypeFilter}
              onChange={(e) => setTourTypeFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>

              {tourTypes.map((type, i) => (
                <MenuItem key={i} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            {/* Search */}

            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            {(searchQuery || statusFilter || tourTypeFilter) && (
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}

          </Box>
        </Box>

        {/* Count */}

        <Typography mb={2} variant="body2">
          Showing {filteredData.length} of {totalPackages} packages
        </Typography>

        {/* Table */}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <DataGrid
            autoHeight
            rows={filteredData.map((pkg, index) => ({
              ...pkg,
              id: pkg._id,
              srNo: index + 1,
              noOfNight:
                pkg.stayLocations?.reduce(
                  (sum, loc) => sum + loc.nights,
                  0
                ) || 0,
              packageType: pkg.packageSubType || "-"
            }))}
            columns={columns}
            disableRowSelectionOnClick
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={totalPackages}
            paginationMode="server"
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5"
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: "bold"
              }
            }}
          />
        )}

        {/* Delete Dialog */}

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <Box p={4} textAlign="center">

            <DeleteIcon sx={{ fontSize: 60, color: "red" }} />

            <Typography mt={2} fontWeight="bold">
              Are you sure you want to delete this package?
            </Typography>

            <Box mt={3} display="flex" gap={2} justifyContent="center">

              <Button
                variant="contained"
                color="error"
                onClick={confirmDelete}
              >
                Delete
              </Button>

              <Button
                variant="outlined"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancel
              </Button>

            </Box>

          </Box>
        </Dialog>

      </Box>
    </Container>
  );
};

export default PackageDashboard;
