import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import api from "../../../utils/axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { buildInvoiceWhatsAppText, buildInvoiceEmailHtml } from "../../../utils/invoiceMailerTemplates";
import EmailInvoiceDialog from "./Dialog/EmailInvoiceDialog";
import InvoicePDF from "./Dialog/InvoicePdf/InvoicePDF";
import {
  getInvoices,
  deleteInvoice,
  renumberCompanyAdvancedReceipts,
  backfillInvoiceSerials,
} from "../../../features/invoice/invoiceSlice";
import { fetchCompanies } from "../../../features/company/InsideCompany";

const InvoiceCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, loading, error } = useSelector((state) => state.invoice);
  const { companies = [] } = useSelector((state) => state.company || {});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  // 🔴 Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0);
  const bulkPdfRefs = React.useRef([]);
  const [deleteId, setDeleteId] = useState(null);

  // 🔔 Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [repairingAr, setRepairingAr] = useState(false);
  const [repairingSerials, setRepairingSerials] = useState(false);

  // 💬 WhatsApp state
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");

  const [mailOpen, setMailOpen] = useState(false);
  const [mailInvoice, setMailInvoice] = useState(null);
  const invoicePdfRef = React.useRef();

  const [emailAccountOptions, setEmailAccountOptions] = useState([]);
  useEffect(() => {
    api.get("/email-accounts").then((res) => {
      setEmailAccountOptions(res.data?.data || []);
    }).catch(console.error);
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 📅 Date formatter
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "-";

  // 💰 Currency formatter
  const formatCurrency = (value) =>
    `₹${(Number(value) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  // 📦 Fetch invoices
  useEffect(() => {
    dispatch(getInvoices());
    dispatch(fetchCompanies());
  }, [dispatch]);

  // ➕ Add invoice
  const handleAddClick = () => {
    navigate("/invoiceform");
  };

  const handleRepairAdvancedReceipts = async () => {
    setRepairingAr(true);
    try {
      const result = await dispatch(renumberCompanyAdvancedReceipts()).unwrap();
      await dispatch(getInvoices());
      setSnackbar({
        open: true,
        message: result?.message || "Advance receipt numbers updated",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          typeof err === "string"
            ? err
            : "Could not repair advance receipt numbers",
        severity: "error",
      });
    } finally {
      setRepairingAr(false);
    }
  };

  const handleRepairInvoiceSerials = async () => {
    setRepairingSerials(true);
    try {
      const result = await dispatch(backfillInvoiceSerials({})).unwrap();
      await dispatch(getInvoices());
      setSnackbar({
        open: true,
        message:
          result?.message || "Invoice serial numbers repaired successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          typeof err === "string"
            ? err
            : "Could not repair invoice serial numbers",
        severity: "error",
      });
    } finally {
      setRepairingSerials(false);
    }
  };

  // ✏️ Edit invoice
  const handleEditClick = (invoice) => {
    navigate(`/invoice/edit/${invoice._id}`, {
      state: { invoiceData: invoice },
    });
  };

  // 🗑️ Open confirm dialog
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  // 🗑️ Confirm delete
  const confirmDelete = async () => {
    try {
      await dispatch(deleteInvoice(deleteId)).unwrap();

      setSnackbar({
        open: true,
        message: "Invoice deleted successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || "Failed to delete invoice",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // 👁️ View invoice
  const handleRowClick = (invoice) => {
    navigate(`/invoice/generate/${invoice._id}`);
  };

  const handleWhatsAppClick = (invoice) => {
    setWhatsAppInvoice(invoice);
    setWhatsAppPhone(invoice.mobile || "");
    setWhatsAppOpen(true);
  };

  const submitWhatsApp = () => {
    if (!whatsAppInvoice) return;
    const text = buildInvoiceWhatsAppText(whatsAppInvoice);
    const url = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setWhatsAppOpen(false);
  };

  const handleMailClick = (invoice) => {
    setMailInvoice(invoice);
    setMailOpen(true);
  };

  const submitMail = async (values) => {
    if (!mailInvoice || !invoicePdfRef.current) return;
    try {
      const base64 = await invoicePdfRef.current.generateBase64();
      if (!base64) throw new Error("Failed to generate PDF");

      const company = companies.find(c => c._id === values.companyId) || (typeof mailInvoice.companyId === 'object' ? mailInvoice.companyId : null);
      const bodyHtml = buildInvoiceEmailHtml(mailInvoice, {
        companyName: company?.companyName || "Iconic Travel",
        intro: values.message,
        signature: values.signature,
        companyTermsConditions: company?.termsAndConditions,
        bankDetails: company?.bankDetails,
        logo: company?.logo
      });

      await api.post(`/invoice/${mailInvoice._id}/email/send`, {
        to: values.to,
        subject: values.subject,
        bodyHtml,
        senderAccount: values.senderAccount,
        pdfAttachment: {
          filename: `Invoice_${mailInvoice.invoiceNo.replace(/\//g, '_')}.pdf`,
          contentBase64: base64,
          mimeType: "application/pdf"
        },
        companyId: company?._id || mailInvoice.companyId
      });
      
      setSnackbar({
        open: true,
        message: "Email sent successfully",
        severity: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Failed to send email",
        severity: "error",
      });
      return false;
    }
  };

  const processBulkDownload = async () => {
    try {
      const zip = new JSZip();
      for (let i = 0; i < filteredData.length; i++) {
        const inv = filteredData[i];
        const ref = bulkPdfRefs.current[i];
        if (ref && ref.generateBase64) {
          const base64 = await ref.generateBase64();
          if (base64) {
            const filename = `Invoice_${(inv.invoiceNo || "Unknown").replace(/\//g, "_")}.pdf`;
            zip.file(filename, base64, { base64: true });
          }
        }
        setBulkDownloadProgress(Math.round(((i + 1) / filteredData.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const zipName = `Invoices_${fromDate || "All"}_to_${toDate || "All"}.zip`;
      saveAs(content, zipName);

      setSnackbar({ open: true, message: "Bulk download completed successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to generate bulk PDFs", severity: "error" });
    } finally {
      setIsBulkDownloading(false);
      setBulkDownloadProgress(0);
    }
  };

  const handleBulkDownloadClick = () => {
    if (filteredData.length === 0) {
      setSnackbar({ open: true, message: "No invoices found to download", severity: "warning" });
      return;
    }
    if (filteredData.length > 200) {
      setSnackbar({ open: true, message: "Too many invoices. Please filter down (max 200).", severity: "warning" });
      return;
    }
    setIsBulkDownloading(true);
    setBulkDownloadProgress(0);
    // Allow React time to mount all the hidden InvoicePDF components
    setTimeout(() => {
      processBulkDownload();
    }, 2000);
  };

  // 🔍 Filter invoices
  const filteredData = useMemo(() => {
    let source = Array.isArray(invoices) ? invoices : [];

    if (selectedCompanyId !== "all") {
      source = source.filter((item) => {
        const invoiceCompanyId =
          typeof item?.companyId === "object"
            ? String(item?.companyId?._id || "")
            : String(item?.companyId || "");
        return invoiceCompanyId === String(selectedCompanyId);
      });
    }

    if (fromDate) {
      source = source.filter(item => new Date(item.invoiceDate) >= new Date(fromDate));
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      source = source.filter(item => new Date(item.invoiceDate) <= endOfDay);
    }

    if (!searchQuery.trim()) return source;

    return source.filter((item) =>
      item.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.billingName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery, selectedCompanyId, fromDate, toDate]);

  const summaryTotals = useMemo(() => {
    let totalAmount = 0;
    let totalTax = 0;
    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    filteredData.forEach(invoice => {
      const taxAmount = invoice.items?.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0) || 0;
      const isInterState = !String(invoice.stateOfSupply || "").toLowerCase().includes("uttar pradesh");
      
      totalAmount += (Number(invoice.totalAmount) || 0);
      totalTax += taxAmount;
      if (isInterState) {
        totalIGST += taxAmount;
      } else {
        totalCGST += taxAmount / 2;
        totalSGST += taxAmount / 2;
      }
    });

    return { totalAmount, totalTax, totalIGST, totalCGST, totalSGST };
  }, [filteredData]);

  // 📄 Pagination
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress color="warning" />
      </Box>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Action Bar */}
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              color="warning"
              onClick={handleAddClick}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={repairingAr}
              onClick={handleRepairAdvancedReceipts}
            >
              {repairingAr ? "Repairing…" : "Repair AR numbers"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              disabled={repairingSerials}
              onClick={handleRepairInvoiceSerials}
            >
              {repairingSerials ? "Repairing…" : "Repair Invoice S.No"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={isBulkDownloading}
              onClick={handleBulkDownloadClick}
            >
              {isBulkDownloading ? `Zipping... ${bulkDownloadProgress}%` : "Bulk Download PDFs (ZIP)"}
            </Button>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="invoice-company-filter-label">Company</InputLabel>
              <Select
                labelId="invoice-company-filter-label"
                label="Company"
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Companies</MenuItem>
                {(Array.isArray(companies) ? companies : []).map((company) => (
                  <MenuItem key={company._id} value={String(company._id)}>
                    {company.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
            />
            <TextField
              size="small"
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
            />
            <TextField
              size="small"
              placeholder="Search by party name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* Summary Calculator */}
        <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 3, flexWrap: "wrap", bgcolor: "#e3f2fd", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
            <strong>Total Amount:</strong> {formatCurrency(summaryTotals.totalAmount)}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
            <strong>Total Tax:</strong> {formatCurrency(summaryTotals.totalTax)}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
            <strong>Total CGST:</strong> {formatCurrency(summaryTotals.totalCGST)}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
            <strong>Total SGST:</strong> {formatCurrency(summaryTotals.totalSGST)}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
            <strong>Total IGST:</strong> {formatCurrency(summaryTotals.totalIGST)}
          </Typography>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr No.</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Adv. receipt</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Party Name</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Tax Amount</TableCell>
                <TableCell align="right">IGST</TableCell>
                <TableCell align="right">CGST</TableCell>
                <TableCell align="right">SGST</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.length ? (
                paginatedData.map((invoice, index) => {
                  const taxAmount = invoice.items?.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0) || 0;
                  const modeOfTax = invoice.withTax ? "With Tax" : "Without Tax";
                  const isInterState = !String(invoice.stateOfSupply || "").toLowerCase().includes("uttar pradesh");
                  const igst = isInterState ? taxAmount : 0;
                  const cgst = isInterState ? 0 : taxAmount / 2;
                  const sgst = isInterState ? 0 : taxAmount / 2;
                  return (
                  <TableRow
                    key={invoice._id}
                    hover
                    onClick={() => handleRowClick(invoice)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{invoice.invoiceNo}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {invoice.advancedReceiptNo || "—"}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{invoice.billingName}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(taxAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(igst)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(cgst)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(sgst)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppClick(invoice);
                        }}
                        title="Share on WhatsApp"
                      >
                        <WhatsAppIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMailClick(invoice);
                        }}
                        title="Send Mail"
                      >
                        <EmailIcon />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(invoice);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(invoice._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Box>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this invoice?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppOpen} onClose={() => setWhatsAppOpen(false)}>
        <DialogTitle>Send via WhatsApp</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <TextField
              fullWidth
              label="Phone Number (with Country Code)"
              variant="outlined"
              value={whatsAppPhone}
              onChange={(e) => setWhatsAppPhone(e.target.value)}
              placeholder="e.g., 919876543210"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsAppOpen(false)}>Cancel</Button>
          <Button onClick={submitWhatsApp} color="primary" variant="contained">
            Open WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Mail Dialog */}
      <EmailInvoiceDialog
        open={mailOpen}
        onClose={() => setMailOpen(false)}
        onSend={submitMail}
        companyOptions={companies}
        emailAccountOptions={emailAccountOptions}
        initialValuesOverride={{
          to: mailInvoice?.email || "",
          subject: mailInvoice ? `Invoice ${mailInvoice.invoiceNo} - ${mailInvoice.billingName}` : "",
          companyId: typeof mailInvoice?.companyId === 'object' ? mailInvoice?.companyId?._id : (mailInvoice?.companyId || "")
        }}
      />

      {/* Hidden InvoicePDF for base64 generation */}
      <Box sx={{ position: "absolute", top: -9999, left: -9999, zIndex: -1000 }}>
        {mailInvoice && (
          <Box sx={{ width: "1000px" }}>
            <InvoicePDF invoiceData={mailInvoice} ref={invoicePdfRef} />
          </Box>
        )}
        {isBulkDownloading &&
          filteredData.map((inv, idx) => (
            <Box key={inv._id} sx={{ width: "1000px" }}>
              <InvoicePDF
                invoiceData={inv}
                ref={(el) => (bulkPdfRefs.current[idx] = el)}
              />
            </Box>
          ))}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InvoiceCard;
