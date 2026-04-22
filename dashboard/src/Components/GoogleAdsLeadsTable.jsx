import React, { useEffect, useState } from "react";
import { Box, Chip, MenuItem, Select, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import axios from "../utils/axios";

const statusColors = {
  New: "info",
  Contacted: "warning",
  "Follow Up": "secondary",
  Quoted: "primary",
  Converted: "success",
  Closed: "default",
  Spam: "error",
};

const GoogleAdsLeadsTable = () => {
  const [rows, setRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });

  const selectedIds = Array.from(rowSelectionModel?.ids || []);

  /* ================= FETCH LEADS ================= */
  const fetchLeads = async () => {
    try {
      const res = await axios.get("/googleAdsEnquiry");

      if (res.data.success) {
        setRows(res.data.data || []);
      }
    } catch (error) {
      toast.error("Error fetching leads");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  /* ================= STATUS UPDATE ================= */
  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`/googleAdsEnquiry/${id}/status`, {
        status,
      });

      toast.success("Status updated");
      fetchLeads();
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  /* ================= DELETE SINGLE ================= */
  const handleDeleteSingle = async (id) => {
    if (!window.confirm("Delete this lead?")) return;

    try {
      const res = await axios.delete(`/googleAdsEnquiry/${id}`);

      toast.success(res.data.message || "Deleted successfully");
      setRowSelectionModel((prev) => {
        const nextIds = new Set(prev?.ids || []);
        nextIds.delete(id);
        return { type: "include", ids: nextIds };
      });
      fetchLeads();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  /* ================= BULK DELETE ================= */
  const handleBulkDelete = async () => {
    if (!selectedIds.length) {
      toast.error("No leads selected");
      return;
    }

    if (!window.confirm("Delete selected leads?")) return;

    try {
      const res = await axios.post(`/googleAdsEnquiry/delete-multiple`, {
        ids: selectedIds,
      });

      toast.success(res.data.message || "Deleted successfully");

      setRowSelectionModel({ type: "include", ids: new Set() });
      fetchLeads();
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  };

  /* ================= COLUMNS ================= */
  const columns = [
    {
      field: "createdAt",
      headerName: "Date",
      minWidth: 140,
      valueGetter: (value, row) =>
        row?.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-IN")
          : "",
    },
    { field: "name", headerName: "Name", minWidth: 150, flex: 1 },
    { field: "phone", headerName: "Phone", minWidth: 140 },
    { field: "email", headerName: "Email", minWidth: 200, flex: 1 },
    { field: "adult", headerName: "Adult", width: 80 },
    { field: "child", headerName: "Child", width: 80 },
    {
      field: "utm_source",
      headerName: "Source",
      minWidth: 120,
    },
    {
      field: "utm_campaign",
      headerName: "Campaign",
      minWidth: 160,
    },
    {
      field: "utm_term",
      headerName: "Keyword",
      minWidth: 160,
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
      },
    },
    {
      field: "landingPage",
      headerName: "Landing Page",
      minWidth: 200,
      renderCell: (params) => {
        const page = params?.row?.landingPage || "";
        const cleanUrl = page.replace(/^https?:\/\/[^/]+/, "");
        return <span>{cleanUrl}</span>;
      },
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
            onChange={(e) => handleStatusChange(params.row._id, e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevents row selection when clicking select
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
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
      renderCell: (params) => (
        <Button
          color="error"
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevents row selection when clicking delete button
            handleDeleteSingle(params.row._id);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      {/* BULK DELETE */}
      {selectedIds.length > 0 && (
        <Button
          variant="contained"
          color="error"
          sx={{ mb: 1 }}
          onClick={handleBulkDelete}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row._id}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newSelectionModel) => {
          // DataGrid v8 model shape: { type: "include" | "exclude", ids: Set<GridRowId> }
          if (
            newSelectionModel &&
            typeof newSelectionModel === "object" &&
            newSelectionModel.ids instanceof Set
          ) {
            setRowSelectionModel(newSelectionModel);
            return;
          }
          // Backward-safe fallback for array model
          const asArray = Array.isArray(newSelectionModel)
            ? newSelectionModel
            : [];
          setRowSelectionModel({ type: "include", ids: new Set(asArray) });
        }}
        rowSelectionModel={rowSelectionModel}
        pageSizeOptions={[10, 20, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        // Additional props to help with stability
        keepNonExistentRowsSelected={false}
      />
    </Box>
  );
};

export default GoogleAdsLeadsTable;
