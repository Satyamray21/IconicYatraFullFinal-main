import React, { useEffect, useState } from "react";
import { Box, Chip, MenuItem, Select } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const statusColors = {
  New: "info",
  Contacted: "warning",
  "Follow Up": "secondary",
  Quoted: "primary",
  Converted: "success",
  Closed: "default",
  Spam: "error"
};

const GoogleAdsLeadsTable = () => {

  const [rows, setRows] = useState([]);

  const fetchLeads = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/googleAdsEnquiry`
    );

    const data = await res.json();

    if (data.success) {
      setRows(data.data);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id, status) => {

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/googleAdsEnquiry/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      }
    );

    fetchLeads();
  };

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1
    },
    {
      field: "adult",
      headerName: "Adult",
      width: 80
    },
    {
      field: "child",
      headerName: "Child",
      width: 80
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Select
          size="small"
          value={params.row.status}
          onChange={(e) =>
            handleStatusChange(params.row._id, e.target.value)
          }
        >
          {[
            "New",
            "Contacted",
            "Follow Up",
            "Quoted",
            "Converted",
            "Closed",
            "Spam"
          ].map((status) => (
            <MenuItem key={status} value={status}>
              <Chip
                label={status}
                color={statusColors[status]}
                size="small"
              />
            </MenuItem>
          ))}
        </Select>
      )
    },
    {
      field: "source",
      headerName: "Source",
      flex: 1
    },
   {
  field: "createdAt",
  headerName: "Date",
  flex: 1,
  renderCell: (params) => {
    if (!params.row?.createdAt) return "";

    const date = new Date(params.row.createdAt);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}





  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row._id}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
      />
    </Box>
  );
};

export default GoogleAdsLeadsTable;
