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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  // 🔴 Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
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

    if (!searchQuery.trim()) return source;

    return source.filter((item) =>
      item.partyName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [invoices, searchQuery, selectedCompanyId]);

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

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr No.</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Adv. receipt</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Party Name</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Received</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.length ? (
                paginatedData.map((invoice, index) => (
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
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{invoice.billingName}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.receivedAmount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.balanceAmount)}
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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
