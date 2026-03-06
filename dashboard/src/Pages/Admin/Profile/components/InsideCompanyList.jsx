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
  IconButton
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchCompanies } from "../../../../features/company/InsideCompany";

const InsideCompanyList = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { companies, loading } = useSelector((state) => state.company);

  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const filteredCompanies = companies?.filter((c) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Paper sx={{ p: 4 }}>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
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
            <TableCell>Status</TableCell>
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

                <TableCell>
                  {company.status ? "Active" : "Inactive"}
                </TableCell>

                <TableCell>

                  <IconButton
                    color="primary"
                    onClick={() =>
                      navigate(`/admin/inside-company/edit/${company._id}`)
                    }
                  >
                    <EditIcon />
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
