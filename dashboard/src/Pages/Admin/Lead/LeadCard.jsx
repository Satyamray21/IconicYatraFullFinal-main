import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import { useSelector, useDispatch } from "react-redux";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  getAllLeads,
  fetchLeadsReports,
  changeLeadStatus,
  deleteLead,
  addLeadFollowUp,
  updateLeadFollowUp,
} from "../../../features/leads/leadSlice";
import LeadEditForm from "./Form/LeadEditForm";

dayjs.extend(customParseFormat);

const FOLLOW_UP_STATUSES = [
  "Pending",
  "Scheduled",
  "In Progress",
  "Interested",
  "No Response",
  "Completed",
  "Max Reached",
];

const FOLLOW_UP_METHODS = ["Call", "WhatsApp", "Email", "Meeting", "Other"];

const FOLLOW_UP_OUTCOMES = [
  "Connected",
  "Not Reachable",
  "Call Back Later",
  "Interested",
  "Not Interested",
  "Wrong Number",
  "Other",
];

const FOLLOW_UP_STATUS_COLORS = {
  Pending: "default",
  Scheduled: "info",
  "In Progress": "primary",
  Interested: "success",
  "No Response": "warning",
  Completed: "success",
  "Max Reached": "error",
};

const getFollowUps = (lead) => {
  const fu = lead?.followUps || {};
  return {
    status: fu.status || "Pending",
    maxAllowed: Number(fu.maxAllowed) > 0 ? Number(fu.maxAllowed) : 5,
    count: Number(fu.count) || 0,
    nextFollowUpAt: fu.nextFollowUpAt || null,
    lastFollowUpAt: fu.lastFollowUpAt || null,
    lastNote: fu.lastNote || "",
    history: Array.isArray(fu.history) ? fu.history : [],
  };
};

const formatFollowUpDate = (value) => {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : "-";
};

const isFollowUpOverdue = (nextFollowUpAt, status) => {
  if (!nextFollowUpAt) return false;
  if (["Completed", "Max Reached"].includes(status)) return false;
  const d = dayjs(nextFollowUpAt).startOf("day");
  if (!d.isValid()) return false;
  return d.isBefore(dayjs().startOf("day"));
};

const isFollowUpToday = (nextFollowUpAt) => {
  if (!nextFollowUpAt) return false;
  const d = dayjs(nextFollowUpAt);
  return d.isValid() && d.isSame(dayjs(), "day");
};

const EXPORT_COLUMNS = [
  { key: "srNo", label: "S.No" },
  { key: "leadId", label: "Lead Id" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "destination", label: "Destination" },
  { key: "arrivalDate", label: "Arrival Date" },
  { key: "priority", label: "Priority" },
  { key: "assignTo", label: "Assign To" },
];

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildExcelXml = (rows, filterSummary) => {
  const columns = EXPORT_COLUMNS.map(
    (col) =>
      `<Column ss:AutoFitWidth="1" ss:Width="${
        col.key === "email" ? 160 : col.key === "name" ? 140 : 90
      }"/>`
  ).join("");

  const headerCells = EXPORT_COLUMNS.map(
    (col) =>
      `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXml(
        col.label
      )}</Data></Cell>`
  ).join("");

  const bodyRows = rows
    .map((row) => {
      const cells = EXPORT_COLUMNS.map((col) => {
        const value = String(row[col.key] ?? "");
        return `<Cell ss:StyleID="sText"><Data ss:Type="String">${escapeXml(
          value
        )}</Data></Cell>`;
      }).join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sHeader">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#E91E63" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="sText">
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="sTitle">
   <Font ss:Bold="1" ss:Size="14"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Leads">
  <Table>
   ${columns}
   <Row>
    <Cell ss:StyleID="sTitle" ss:MergeAcross="${EXPORT_COLUMNS.length - 1}">
     <Data ss:Type="String">Leads Report</Data>
    </Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="sText" ss:MergeAcross="${EXPORT_COLUMNS.length - 1}">
     <Data ss:Type="String">${escapeXml(filterSummary)}</Data>
    </Cell>
   </Row>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
};

const getRawArrivalDate = (lead) =>
  lead?.tourDetails?.pickupDrop?.arrivalDate ||
  lead?.tourDetails?.arrivalDate ||
  lead?.arrivalDate ||
  null;

const getArrivalDateKey = (value) => {
  if (!value || value === "-") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const named = dayjs(
      trimmed,
      ["DD-MM-YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD"],
      true
    );
    if (named.isValid()) return named.format("YYYY-MM-DD");
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

const formatDate = (dateString) => {
  const key = getArrivalDateKey(dateString);
  if (!key) return "-";
  return dayjs(key, "YYYY-MM-DD").format("DD MMM YYYY");
};

const formatFileStamp = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

const LeadCard = () => {
  const navigate = useNavigate();
  const [anchorEls, setAnchorEls] = React.useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    leadId: null,
    leadName: "",
    rowId: null,
  });

  const [editDialog, setEditDialog] = useState({
    open: false,
    leadId: null,
    leadData: null,
  });

  const [followUpDialog, setFollowUpDialog] = useState({
    open: false,
    leadId: null,
    leadName: "",
    followUps: null,
  });

  const [followUpForm, setFollowUpForm] = useState({
    method: "Call",
    outcome: "Connected",
    note: "",
    nextFollowUpAt: "",
    followUpStatus: "In Progress",
    maxAllowed: 5,
  });

  const [followUpSaving, setFollowUpSaving] = useState(false);

  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    leadId: null,
    leadName: "",
    followUps: null,
    row: null,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const dispatch = useDispatch();

  const {
    list: leadList = [],
    status,
    error: leadsError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.leads);

  const {
    reports: stats = [],
  } = useSelector((state) => state.leads);

  useEffect(() => {
    dispatch(getAllLeads());
    dispatch(fetchLeadsReports());
  }, [dispatch]);

  const handleRetryLoad = () => {
    dispatch(getAllLeads());
    dispatch(fetchLeadsReports());
  };

  useEffect(() => {
    if (deleteError) {
      setSnackbar({
        open: true,
        message: deleteError,
        severity: "error",
      });
    }
  }, [deleteError]);

  const destinationOptions = useMemo(() => {
    const unique = new Set();
    leadList.forEach((lead) => {
      const destination = lead?.tourDetails?.tourDestination;
      if (destination && destination !== "-") {
        unique.add(destination);
      }
    });
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [leadList]);

  const mappedLeads = useMemo(() => {
    let fromKey = fromDate ? getArrivalDateKey(fromDate) : null;
    let toKey = toDate ? getArrivalDateKey(toDate) : null;
    if (fromKey && toKey && fromKey > toKey) {
      const swapped = fromKey;
      fromKey = toKey;
      toKey = swapped;
    }
    const term = searchTerm.trim().toLowerCase();

    const filtered = leadList.filter((lead) => {
      const destination = lead?.tourDetails?.tourDestination || "-";
      if (
        destinationFilter !== "all" &&
        destination.toLowerCase() !== destinationFilter.toLowerCase()
      ) {
        return false;
      }

      const fu = getFollowUps(lead);
      if (followUpFilter === "overdue") {
        if (!isFollowUpOverdue(fu.nextFollowUpAt, fu.status)) return false;
      } else if (followUpFilter === "today") {
        if (!isFollowUpToday(fu.nextFollowUpAt)) return false;
      } else if (followUpFilter === "max") {
        if (fu.status !== "Max Reached" && fu.count < fu.maxAllowed) return false;
      } else if (followUpFilter !== "all") {
        if (fu.status !== followUpFilter) return false;
      }

      if (fromKey || toKey) {
        const arrivalKey = getArrivalDateKey(getRawArrivalDate(lead));
        if (!arrivalKey) return false;
        if (fromKey && arrivalKey < fromKey) return false;
        if (toKey && arrivalKey > toKey) return false;
      }

      if (!term) return true;

      const name = lead?.personalDetails?.fullName || "";
      const mobile = lead?.personalDetails?.mobile || "";
      const email = lead?.personalDetails?.emailId || "";
      const leadId = lead?.leadId || "";
      return (
        name.toLowerCase().includes(term) ||
        mobile.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        leadId.toLowerCase().includes(term) ||
        destination.toLowerCase().includes(term)
      );
    });

    if (fromKey || toKey) {
      filtered.sort((a, b) => {
        const aKey = getArrivalDateKey(getRawArrivalDate(a)) || "";
        const bKey = getArrivalDateKey(getRawArrivalDate(b)) || "";
        return bKey.localeCompare(aKey);
      });
    }

    const total = filtered.length;
    return filtered.map((lead, index) => {
      const fu = getFollowUps(lead);
      const overdue = isFollowUpOverdue(fu.nextFollowUpAt, fu.status);
      return {
        id: lead._id || lead.leadId || `lead-${index}`,
        srNo: total - index,
        leadId: lead.leadId || "-",
        status: lead.status || "New",
        source: lead.officialDetail?.source || "-",
        name: lead.personalDetails?.fullName || "-",
        mobile: lead.personalDetails?.mobile || "-",
        email: lead.personalDetails?.emailId || "-",
        destination: lead.tourDetails?.tourDestination || "-",
        arrivalDate: formatDate(getRawArrivalDate(lead)),
        priority: lead.officialDetail?.priority || "-",
        assignTo:
          lead.officialDetail?.assignedTo || lead.officialDetail?.assinedTo || "-",
        followUpStatus: fu.status,
        followUpCountLabel: `${fu.count}/${fu.maxAllowed}`,
        nextFollowUp: formatFollowUpDate(fu.nextFollowUpAt),
        followUpOverdue: overdue,
        originalData: lead,
      };
    });
  }, [leadList, searchTerm, fromDate, toDate, destinationFilter, followUpFilter]);

  const handleAddClick = () => {
    navigate("/lead/leadtourform");
  };

  const handleEditClick = (row) => {
    setEditDialog({
      open: true,
      leadId: row.leadId,
      leadData: row.originalData,
    });
  };

  const handleEditSave = () => {
    setEditDialog({ open: false, leadId: null, leadData: null });
    dispatch(getAllLeads());
    setSnackbar({
      open: true,
      message: "Lead updated successfully!",
      severity: "success",
    });
  };

  const handleEditCancel = () => {
    setEditDialog({ open: false, leadId: null, leadData: null });
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      leadId: row.leadId,
      leadName: row.name,
      rowId: row.id,
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.leadId && deleteDialog.leadId !== "-") {
      try {
        await dispatch(deleteLead(deleteDialog.leadId)).unwrap();
        setSnackbar({
          open: true,
          message: "Lead deleted successfully!",
          severity: "success",
        });
        dispatch(getAllLeads());
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to delete lead. Please try again.",
          severity: "error",
        });
        console.error("Delete failed:", error);
      }
    } else {
      setSnackbar({
        open: true,
        message: "Invalid lead ID",
        severity: "error",
      });
    }

    setDeleteDialog({ open: false, leadId: null, leadName: "", rowId: null });
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, leadId: null, leadName: "", rowId: null });
  };

  const handleMenuClick = (event, id) => {
    setAnchorEls((prev) => ({ ...prev, [id]: event.currentTarget }));
  };

  const handleMenuClose = (id) => {
    setAnchorEls((prev) => ({ ...prev, [id]: null }));
  };

  const handleStatusChange = (rowId, newStatus) => {
    const lead = mappedLeads.find((item) => item.id === rowId);

    if (!lead || lead.leadId === "-") {
      console.error("Invalid lead ID");
      setSnackbar({
        open: true,
        message: "Invalid lead ID",
        severity: "error",
      });
      return;
    }

    const validStatuses = ["Active", "Cancelled", "Confirmed", "Not Converted"];
    if (!validStatuses.includes(newStatus)) {
      setSnackbar({
        open: true,
        message: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`,
        severity: "error",
      });
      return;
    }

    dispatch(changeLeadStatus({ leadId: lead.leadId, status: newStatus }))
      .unwrap()
      .then(() => {
        dispatch(getAllLeads());
        dispatch(fetchLeadsReports());
        setSnackbar({
          open: true,
          message: `Lead status updated to ${newStatus}`,
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to update lead status:", err);
        setSnackbar({
          open: true,
          message: "Failed to update lead status",
          severity: "error",
        });
      });

    handleMenuClose(rowId);
  };

  const openFollowUpDialog = (row) => {
    handleMenuClose(row.id);
    const fu = getFollowUps(row.originalData);
    setFollowUpDialog({
      open: true,
      leadId: row.leadId,
      leadName: row.name,
      followUps: fu,
    });
    setFollowUpForm({
      method: "Call",
      outcome: "Connected",
      note: "",
      nextFollowUpAt: fu.nextFollowUpAt
        ? dayjs(fu.nextFollowUpAt).format("YYYY-MM-DD")
        : "",
      followUpStatus:
        fu.status === "Max Reached" ? "In Progress" : fu.status || "In Progress",
      maxAllowed: fu.maxAllowed || 5,
    });
  };

  const closeFollowUpDialog = () => {
    setFollowUpDialog({
      open: false,
      leadId: null,
      leadName: "",
      followUps: null,
    });
  };

  const openFollowUpHistory = (row) => {
    const fu = getFollowUps(row.originalData);
    setHistoryDialog({
      open: true,
      leadId: row.leadId,
      leadName: row.name,
      followUps: fu,
      row,
    });
  };

  const closeFollowUpHistory = () => {
    setHistoryDialog({
      open: false,
      leadId: null,
      leadName: "",
      followUps: null,
      row: null,
    });
  };

  const handleSaveFollowUp = async () => {
    if (!followUpDialog.leadId) return;
    setFollowUpSaving(true);
    try {
      const fu = followUpDialog.followUps || {};
      const newMax = Number(followUpForm.maxAllowed) || fu.maxAllowed || 5;
      const atMax = (fu.count || 0) >= newMax;

      if (Number(newMax) !== Number(fu.maxAllowed)) {
        await dispatch(
          updateLeadFollowUp({
            leadId: followUpDialog.leadId,
            payload: { maxAllowed: newMax },
          }),
        ).unwrap();
      }

      await dispatch(
        addLeadFollowUp({
          leadId: followUpDialog.leadId,
          payload: {
            method: followUpForm.method,
            outcome: followUpForm.outcome,
            note: followUpForm.note,
            nextFollowUpAt: followUpForm.nextFollowUpAt || null,
            followUpStatus: followUpForm.followUpStatus,
            force: atMax,
          },
        }),
      ).unwrap();

      setSnackbar({
        open: true,
        message: "Follow-up logged successfully",
        severity: "success",
      });
      closeFollowUpDialog();
      dispatch(getAllLeads());
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Failed to log follow-up",
        severity: "error",
      });
    } finally {
      setFollowUpSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getFilterSummary = () => {
    const parts = [];
    if (fromDate) parts.push(`Arrival From: ${formatDate(fromDate)}`);
    if (toDate) parts.push(`Arrival To: ${formatDate(toDate)}`);
    parts.push(
      `Destination: ${destinationFilter === "all" ? "All" : destinationFilter}`
    );
    return parts.join("  |  ");
  };

  const handleDownloadExcel = async () => {
    if (!mappedLeads.length) {
      setSnackbar({
        open: true,
        message: "No leads found for the selected filters",
        severity: "warning",
      });
      return;
    }

    try {
      const { saveAs } = await import("file-saver");
      const xml = buildExcelXml(mappedLeads, getFilterSummary());
      const blob = new Blob([xml], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      saveAs(blob, `Leads_${formatFileStamp()}.xls`);
      setSnackbar({
        open: true,
        message: "Excel downloaded successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to download Excel",
        severity: "error",
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!mappedLeads.length) {
      setSnackbar({
        open: true,
        message: "No leads found for the selected filters",
        severity: "warning",
      });
      return;
    }

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFontSize(14);
      doc.text("Leads Report", 14, 12);
      doc.setFontSize(9);
      doc.text(getFilterSummary(), 14, 18);

      autoTable(doc, {
        startY: 22,
        head: [EXPORT_COLUMNS.map((col) => col.label)],
        body: mappedLeads.map((row) =>
          EXPORT_COLUMNS.map((col) => String(row[col.key] ?? "-")),
        ),
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [233, 30, 99], textColor: 255 },
        alternateRowStyles: { fillColor: [252, 228, 236] },
      });

      doc.save(`Leads_${formatFileStamp()}.pdf`);
      setSnackbar({
        open: true,
        message: "PDF downloaded successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to download PDF",
        severity: "error",
      });
    }
  };

  const columns = [
    { field: "srNo", headerName: "S.No", width: 70 },
    { field: "leadId", headerName: "Lead Id", width: 100 },
    { field: "status", headerName: "Status", width: 100 },
    {
      field: "followUpStatus",
      headerName: "Follow-up",
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || "Pending"}
          color={FOLLOW_UP_STATUS_COLORS[params.value] || "default"}
          variant={params.row.followUpOverdue ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "followUpCountLabel",
      headerName: "Attempts",
      width: 90,
    },
    {
      field: "nextFollowUp",
      headerName: "Next FU",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Click to view previous follow-up notes">
          <Box
            onClick={() => openFollowUpHistory(params.row)}
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 1,
              px: 0.5,
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <Typography
              variant="body2"
              color={params.row.followUpOverdue ? "error" : "text.primary"}
              fontWeight={params.row.followUpOverdue ? 600 : 500}
              textAlign="center"
              sx={{ lineHeight: 1.2 }}
            >
              {params.row.followUpOverdue ? `⚠ ${params.value}` : params.value}
            </Typography>
          </Box>
        </Tooltip>
      ),
    },
    { field: "source", headerName: "Source", width: 80 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "mobile", headerName: "Mobile", width: 100 },
    { field: "email", headerName: "Email", width: 150 },
    { field: "destination", headerName: "Destination", width: 100 },
    { field: "arrivalDate", headerName: "Arrival Date", width: 100 },
    { field: "priority", headerName: "Priority", width: 80 },
    { field: "assignTo", headerName: "Assign To", width: 100 },
    {
      field: "action",
      headerName: "Action",
      width: 180,
      renderCell: (params) => {
        const rowId = params.row.id;
        return (
          <Box display="flex" gap={0.5} alignItems="center">
            <Tooltip title="Add Follow-up">
              <IconButton
                color="secondary"
                size="small"
                onClick={() => openFollowUpDialog(params.row)}
                disabled={deleteLoading}
              >
                <PhoneCallbackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEditClick(params.row)}
              disabled={deleteLoading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              disabled={deleteLoading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, rowId)}
              disabled={deleteLoading}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEls[rowId]}
              open={Boolean(anchorEls[rowId])}
              onClose={() => handleMenuClose(rowId)}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose(rowId);
                  openFollowUpDialog(params.row);
                }}
              >
                Add Follow-up
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Active")}>
                Active
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Confirmed")}>
                Confirmed
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Cancelled")}>
                Cancelled
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange(rowId, "Not Converted")}>
                Not Converted
              </MenuItem>
            </Menu>
          </Box>
        );
      },
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Grid container spacing={2}>
          {stats.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={index}>
              <Card
                sx={{
                  backgroundColor: "#e91e63",
                  color: "#fff",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Typography variant="h6">
                    {item.title}: {item.active}
                  </Typography>
                  <Typography variant="body2">Active: {item.Active}</Typography>
                  <Typography variant="body2">
                    Confirmed: {item.Confirmed}
                  </Typography>
                  <Typography variant="body2">
                    Cancelled: {item.Cancelled}
                  </Typography>
                  <Typography variant="body2">
                    Not Converted: {item["Not Converted"] || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box
          mt={3}
          mb={2}
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
          flexWrap="wrap"
        >
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Button
              variant="contained"
              color="warning"
              sx={{ minWidth: 100 }}
              onClick={handleAddClick}
            >
              Add
            </Button>

            <TextField
              size="small"
              type="date"
              label="From Arrival Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              inputProps={{ max: toDate || undefined }}
            />
            <TextField
              size="small"
              type="date"
              label="To Arrival Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              inputProps={{ min: fromDate || undefined }}
            />
            {(fromDate || toDate) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear Dates
              </Button>
            )}

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="lead-destination-filter-label">
                Destination
              </InputLabel>
              <Select
                labelId="lead-destination-filter-label"
                label="Destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              >
                <MenuItem value="all">All Destinations</MenuItem>
                {destinationOptions.map((destination) => (
                  <MenuItem key={destination} value={destination}>
                    {destination}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="lead-followup-filter-label">Follow-up</InputLabel>
              <Select
                labelId="lead-followup-filter-label"
                label="Follow-up"
                value={followUpFilter}
                onChange={(e) => setFollowUpFilter(e.target.value)}
              >
                <MenuItem value="all">All Follow-ups</MenuItem>
                <MenuItem value="today">Due Today</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="max">Max Reached</MenuItem>
                {FOLLOW_UP_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="success"
              startIcon={<GridOnIcon />}
              onClick={handleDownloadExcel}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
            >
              PDF
            </Button>
          </Box>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name, mobile, id..."
            sx={{ width: { xs: "100%", sm: 300 } }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {(fromDate || toDate) && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            Showing {mappedLeads.length} lead{mappedLeads.length === 1 ? "" : "s"}{" "}
            with arrival date
            {fromDate ? ` on or after ${formatDate(fromDate)}` : ""}
            {toDate ? ` and on or before ${formatDate(toDate)}` : fromDate ? " (no To date, so later dates are included)" : ""}
            . Dates are shown as DD MMM YYYY.
          </Typography>
        )}

        {status === "failed" && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRetryLoad}>
                Retry
              </Button>
            }
          >
            {leadsError || "Failed to load leads. Please retry."}
          </Alert>
        )}

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: "600px" }}>
            <DataGrid
              rows={mappedLeads}
              columns={columns}
              pageSize={7}
              rowsPerPageOptions={[7, 25, 50, 100]}
              autoHeight
              disableRowSelectionOnClick
              loading={status === "loading"}
              sx={{
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          </Box>
        </Box>

        <Dialog
          open={editDialog.open}
          onClose={handleEditCancel}
          maxWidth="lg"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              minHeight: "80vh",
              maxHeight: "90vh",
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <LeadEditForm
              leadId={editDialog.leadId}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteDialog.open}
          onClose={cancelDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete lead for{" "}
              <strong>{deleteDialog.leadName}</strong> (ID:{" "}
              {deleteDialog.leadId})? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={cancelDelete}
              color="primary"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              disabled={deleteLoading}
              autoFocus
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={followUpDialog.open}
          onClose={closeFollowUpDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Follow-up — {followUpDialog.leadName} ({followUpDialog.leadId})
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Attempts:{" "}
              <strong>
                {followUpDialog.followUps?.count || 0}/
                {followUpDialog.followUps?.maxAllowed || 5}
              </strong>
              {" · "}
              Status:{" "}
              <strong>{followUpDialog.followUps?.status || "Pending"}</strong>
              {followUpDialog.followUps?.lastNote
                ? ` · Last note: ${followUpDialog.followUps.lastNote}`
                : ""}
            </Typography>

            {(followUpDialog.followUps?.count || 0) >=
              (followUpDialog.followUps?.maxAllowed || 5) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Max follow-ups reached. Increase Max Allowed below to continue,
                or this log will be forced.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Method</InputLabel>
                  <Select
                    label="Method"
                    value={followUpForm.method}
                    onChange={(e) =>
                      setFollowUpForm((p) => ({ ...p, method: e.target.value }))
                    }
                  >
                    {FOLLOW_UP_METHODS.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Outcome</InputLabel>
                  <Select
                    label="Outcome"
                    value={followUpForm.outcome}
                    onChange={(e) =>
                      setFollowUpForm((p) => ({ ...p, outcome: e.target.value }))
                    }
                  >
                    {FOLLOW_UP_OUTCOMES.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Follow-up Status</InputLabel>
                  <Select
                    label="Follow-up Status"
                    value={followUpForm.followUpStatus}
                    onChange={(e) =>
                      setFollowUpForm((p) => ({
                        ...p,
                        followUpStatus: e.target.value,
                      }))
                    }
                  >
                    {FOLLOW_UP_STATUSES.filter((s) => s !== "Max Reached").map(
                      (s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Next Follow-up Date"
                  InputLabelProps={{ shrink: true }}
                  value={followUpForm.nextFollowUpAt}
                  onChange={(e) =>
                    setFollowUpForm((p) => ({
                      ...p,
                      nextFollowUpAt: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Allowed"
                  inputProps={{ min: 1, max: 20 }}
                  value={followUpForm.maxAllowed}
                  onChange={(e) =>
                    setFollowUpForm((p) => ({
                      ...p,
                      maxAllowed: e.target.value,
                    }))
                  }
                  helperText="Default 5 (max 20)"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Note / Remark"
                  value={followUpForm.note}
                  onChange={(e) =>
                    setFollowUpForm((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </Grid>
            </Grid>

            {Array.isArray(followUpDialog.followUps?.history) &&
              followUpDialog.followUps.history.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent history
                  </Typography>
                  {followUpDialog.followUps.history.slice(0, 5).map((h, idx) => (
                    <Typography
                      key={`${h.date}-${idx}`}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {formatFollowUpDate(h.date)} · {h.method} · {h.outcome}
                      {h.note ? ` — ${h.note}` : ""}
                    </Typography>
                  ))}
                </Box>
              )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeFollowUpDialog} disabled={followUpSaving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSaveFollowUp}
              disabled={followUpSaving}
              startIcon={
                followUpSaving ? <CircularProgress size={16} /> : null
              }
            >
              {followUpSaving ? "Saving..." : "Save Follow-up"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={historyDialog.open}
          onClose={closeFollowUpHistory}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Previous Follow-ups — {historyDialog.leadName} ({historyDialog.leadId})
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Attempts:{" "}
              <strong>
                {historyDialog.followUps?.count || 0}/
                {historyDialog.followUps?.maxAllowed || 5}
              </strong>
              {" · "}
              Status:{" "}
              <strong>{historyDialog.followUps?.status || "Pending"}</strong>
              {" · "}
              Next FU:{" "}
              <strong>
                {formatFollowUpDate(historyDialog.followUps?.nextFollowUpAt)}
              </strong>
            </Typography>

            {Array.isArray(historyDialog.followUps?.history) &&
            historyDialog.followUps.history.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {historyDialog.followUps.history.map((h, idx) => (
                  <Box
                    key={`${h.date}-${idx}`}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      backgroundColor: idx === 0 ? "action.hover" : "background.paper",
                    }}
                  >
                    <Typography variant="subtitle2">
                      #{(historyDialog.followUps.count || historyDialog.followUps.history.length) - idx}{" "}
                      · {formatFollowUpDate(h.date)} · {h.method} · {h.outcome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {h.note?.trim() ? h.note : "No note added"}
                    </Typography>
                    {h.nextFollowUpAt && (
                      <Typography variant="caption" color="text.secondary">
                        Next set to: {formatFollowUpDate(h.nextFollowUpAt)}
                      </Typography>
                    )}
                    {h.createdBy && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        By: {h.createdBy}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No previous follow-up notes yet for this lead.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeFollowUpHistory}>Close</Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                const row = historyDialog.row;
                closeFollowUpHistory();
                if (row) openFollowUpDialog(row);
              }}
            >
              Add Follow-up
            </Button>
          </DialogActions>
        </Dialog>

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

export default LeadCard;
