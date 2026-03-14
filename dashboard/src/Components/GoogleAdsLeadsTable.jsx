import React, { useEffect, useState } from "react";
import { Box, Chip, MenuItem, Select, Tooltip } from "@mui/material";
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
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/googleAdsEnquiry`
      );

      const data = await res.json();

      if (data.success) {
        setRows(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
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
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const columns = [
    { field: "name", headerName: "Name", minWidth: 150, flex: 1 },

    { field: "phone", headerName: "Phone", minWidth: 140 },

    { field: "email", headerName: "Email", minWidth: 200, flex: 1 },

    { field: "adult", headerName: "Adult", width: 80 },

    { field: "child", headerName: "Child", width: 80 },

    {
      field: "utm_source",
      headerName: "Source",
      minWidth: 120
    },

    {
      field: "utm_campaign",
      headerName: "Campaign",
      minWidth: 160
    },

    {
      field: "utm_term",
      headerName: "Keyword",
      minWidth: 160
    },

    {
      field: "device",
      headerName: "Device",
      minWidth: 120,
      valueGetter: (value, row) => {
        const ua = row?.device || "";

        if (ua.includes("Mobile")) return "Mobile";
        if (ua.includes("Windows")) return "Desktop";
        if (ua.includes("Mac")) return "Mac";

        return "Unknown";
      }
    },

    {
      field: "landingPage",
      headerName: "Landing Page",
      minWidth: 200,
      renderCell: (params) => {
        const page = params?.row?.landingPage || "";
        const cleanUrl = page.replace(/^https?:\/\/[^/]+/, "");

        return <span>{cleanUrl}</span>;
      }
    },

    {
      field: "status",
      headerName: "Status",
      minWidth: 160,
      renderCell: (params) => {
        const status = params.row.status || "New";

        return (
          <Select
            size="small"
            value={status}
            onChange={(e) =>
              handleStatusChange(params.row._id, e.target.value)
            }
          >
            {Object.keys(statusColors).map((statusOption) => (
              <MenuItem key={statusOption} value={statusOption}>
                <Chip
                  label={statusOption}
                  color={statusColors[statusOption]}
                  size="small"
                />
              </MenuItem>
            ))}
          </Select>
        );
      }
    },

    {
      field: "createdAt",
      headerName: "Date",
      minWidth: 140,
      valueGetter: (value, row) => {
        if (!row?.createdAt) return "";

        return new Date(row.createdAt).toLocaleDateString("en-IN");
      }
    }
  ];

  return (
    <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row._id}
        pageSizeOptions={[10, 20, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 }
          }
        }}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default GoogleAdsLeadsTable;
