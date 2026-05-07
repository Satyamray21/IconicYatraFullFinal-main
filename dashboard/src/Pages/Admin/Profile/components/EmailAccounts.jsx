import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  MenuItem,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,

} from "@mui/icons-material";
import axios from "../../../../utils/axios";

const EmailAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    appPassword: "",
    displayName: "",
    label: "",
    service: "gmail",
    host: "",
    port: "",
    secure: true,
    companyId: "",
    signature: {
      name: "",
      mobile: [""],
      links: [""],
    },
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/email-accounts");
      setAccounts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch email accounts:", err);
      showSnackbar("Failed to fetch email accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("/company");
      setCompanies(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCompanies();
  }, []);

  const handleOpenDialog = (account = null) => {
    if (account) {
      setEditingId(account._id);
      setFormData({
        email: account.email,
        appPassword: "", // Don't show password
        displayName: account.displayName || "",
        label: account.label || "",
        service: account.service || "gmail",
        host: account.host || "",
        port: account.port || "",
        secure: account.secure ?? true,
        companyId: typeof account.companyId === "object" ? account.companyId._id : account.companyId || "",
        signature: {
          name: account.signature?.name || "",
          mobile: Array.isArray(account.signature?.mobile) 
            ? (account.signature.mobile.length ? account.signature.mobile : [""]) 
            : (account.signature?.mobile ? [account.signature.mobile] : [""]),
          links: account.signature?.links?.length ? account.signature.links : [""],
        },
      });
    } else {
      setEditingId(null);
      setFormData({
        email: "",
        appPassword: "",
        displayName: "",
        label: "",
        service: "gmail",
        host: "",
        port: "",
        secure: true,
        companyId: "",
        signature: { name: "", mobile: [""], links: [""] },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("signature.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        signature: { ...prev.signature, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLinkChange = (index, value) => {
    setFormData((prev) => {
      const newLinks = [...prev.signature.links];
      newLinks[index] = value;
      return { ...prev, signature: { ...prev.signature, links: newLinks } };
    });
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      signature: { ...prev.signature, links: [...prev.signature.links, ""] },
    }));
  };

  const removeLink = (index) => {
    setFormData((prev) => {
      const newLinks = prev.signature.links.filter((_, i) => i !== index);
      return { ...prev, signature: { ...prev.signature, links: newLinks } };
    });
  };

  const handleMobileChange = (index, value) => {
    setFormData((prev) => {
      const newMobiles = [...prev.signature.mobile];
      newMobiles[index] = value;
      return { ...prev, signature: { ...prev.signature, mobile: newMobiles } };
    });
  };

  const addMobile = () => {
    setFormData((prev) => ({
      ...prev,
      signature: { ...prev.signature, mobile: [...prev.signature.mobile, ""] },
    }));
  };

  const removeMobile = (index) => {
    setFormData((prev) => {
      const newMobiles = prev.signature.mobile.filter((_, i) => i !== index);
      return { ...prev, signature: { ...prev.signature, mobile: newMobiles } };
    });
  };

  const handleSubmit = async () => {
    if (!formData.email || (!editingId && !formData.appPassword)) {
      showSnackbar("Please fill in all required fields", "warning");
      return;
    }

    try {
      if (editingId) {
        // Only include appPassword if it's not empty
        const payload = { ...formData };
        if (!payload.appPassword) delete payload.appPassword;

        await axios.patch(`/email-accounts/${editingId}`, payload);
        showSnackbar("Email account updated successfully", "success");
      } else {
        await axios.post("/email-accounts", formData);
        showSnackbar("Email account added successfully", "success");
      }
      fetchAccounts();
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to save email account:", err);
      showSnackbar(err.response?.data?.message || "Failed to save email account", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this email account?")) return;

    try {
      await axios.delete(`/email-accounts/${id}`);
      showSnackbar("Email account deleted successfully", "success");
      fetchAccounts();
    } catch (err) {
      console.error("Failed to delete email account:", err);
      showSnackbar("Failed to delete email account", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Manage Email Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Account
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>Label</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Email ID</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account._id} hover>
                      <TableCell>{account.label || "—"}</TableCell>
                      <TableCell>
                        {account.companyId
                          ? typeof account.companyId === "object"
                            ? account.companyId.companyName || "Unknown"
                            : companies.find((c) => c._id === account.companyId)?.companyName || "Unknown"
                          : "Global"}
                      </TableCell>
                      <TableCell>{account.displayName || "—"}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(account)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(account._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No email accounts added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Email Account" : "Add Email Account"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField
                label="Account Label (e.g. Reservations, Sales)"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                sx={{ flex: 1 }}
                variant="outlined"
              />
              <TextField
                select
                label="Associated Company"
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                sx={{ flex: 1 }}
                helperText="Leave empty for Global access"
              >
                <MenuItem value="">Global (All Companies)</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.companyName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Display Name (e.g. Iconic Travel)"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "action.active", mr: 1 }} />,
              }}
            />
            <TextField
              label="Email ID"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              required
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: "action.active", mr: 1 }} />,
              }}
            />
            <TextField
              label={editingId ? "App Password (Leave blank to keep current)" : "App Password"}
              name="appPassword"
              type="password"
              value={formData.appPassword}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              required={!editingId}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "action.active", mr: 1 }} />,
              }}
            />

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Provider/Service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                sx={{ flex: 1 }}
              >
                <MenuItem value="gmail">Gmail</MenuItem>
                <MenuItem value="hotmail">Outlook/Hotmail</MenuItem>
                <MenuItem value="">Custom SMTP</MenuItem>
              </TextField>
              {formData.service === "" && (
                <>
                  <TextField
                    label="Host"
                    name="host"
                    value={formData.host}
                    onChange={handleInputChange}
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Port"
                    name="port"
                    type="number"
                    value={formData.port}
                    onChange={handleInputChange}
                    sx={{ flex: 1 }}
                  />
                </>
              )}
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Email Signature Settings
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                label="Signature Name"
                name="signature.name"
                value={formData.signature.name}
                onChange={handleInputChange}
                sx={{ flex: 1 }}
                variant="outlined"
              />
              <Box flex={1}>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  Signature Mobiles
                </Typography>
                {formData.signature.mobile.map((mob, index) => (
                  <Box display="flex" gap={1} mb={1} key={index}>
                    <TextField
                      size="small"
                      placeholder="+91 9876543210"
                      value={mob}
                      onChange={(e) => handleMobileChange(index, e.target.value)}
                      fullWidth
                    />
                    {formData.signature.mobile.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => removeMobile(index)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={addMobile}>
                  Add Another Mobile
                </Button>
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary" mb={1}>
                Signature Links
              </Typography>
              {formData.signature.links.map((link, index) => (
                <Box display="flex" gap={1} mb={1} key={index}>
                  <TextField
                    size="small"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    fullWidth
                  />
                  {formData.signature.links.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => removeLink(index)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={addLink}>
                Add Another Link
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailAccounts;
