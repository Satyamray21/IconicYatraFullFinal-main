import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchCompanies,
  deleteCompany,
} from "../../../../features/company/InsideCompany";

import { toast } from "react-toastify";

const InsideCompanyList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { companies, loading } = useSelector((state) => state.company);

  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const filteredCompanies = companies?.filter(
    (c) =>
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this company?",
    );

    if (!confirmDelete) return;

    try {
      await dispatch(deleteCompany(id)).unwrap();

      toast.success("Company deleted successfully");

      dispatch(fetchCompanies());
    } catch (error) {
      toast.error(error || "Delete failed");
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      {/* Header */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5">Inside Companies</Typography>

          <Typography variant="body2" color="text.secondary">
            {companies?.length || 0} companies
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/inside-company/add")}
        >
          Add Company
        </Button>
      </Box>

      {/* Search */}

      <TextField
        fullWidth
        placeholder="Search by company name, email or phone..."
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sr No.</TableCell>
            <TableCell>Company Name</TableCell>
            <TableCell>Phone Number</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filteredCompanies?.length > 0 ? (
            filteredCompanies.map((company, index) => (
              <TableRow key={company._id}>
                <TableCell>{index + 1}</TableCell>

                <TableCell>{company.companyName}</TableCell>

                <TableCell>{company.phone}</TableCell>

                <TableCell>{company.email}</TableCell>

                <TableCell>{company.address}</TableCell>

                <TableCell>
                  {/* EDIT */}

                  <IconButton
                    color="primary"
                    onClick={() =>
                      navigate(`/admin/inside-company/edit/${company._id}`)
                    }
                  >
                    <EditIcon />
                  </IconButton>

                  {/* DELETE */}

                  <IconButton
                    color="error"
                    onClick={() => handleDelete(company._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography sx={{ py: 4 }}>
                  No Inside Companies Found
                  <br />
                  Click the button below to add your first inside company
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default InsideCompanyList;
