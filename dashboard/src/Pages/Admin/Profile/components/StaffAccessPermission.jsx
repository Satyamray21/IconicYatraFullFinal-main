import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import api from "../../../../utils/axios";

const StaffAccessPermission = ({ staffId, staffData }) => {
  const [permissions, setPermissions] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [loginHistoryDialog, setLoginHistoryDialog] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState("Staff");
  const [needsPermissionSetup, setNeedsPermissionSetup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch permission modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await api.get("/staff-permission/modules/list");
        setModules(response.data.data || []);
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };
    fetchModules();
  }, []);

  // Fetch staff permissions
  useEffect(() => {
    fetchPermissions();
  }, [staffId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await api.get(`/staff-permission/${staffId}`);
      const data = response.data.data;
      setPermissions(data);
      setSelectedPermissions(data.permissions || {});
      setSelectedRole(data.role || "Staff");
      setNeedsPermissionSetup(Boolean(data.needsPermissionSetup));
    } catch (error) {
      setPermissions(null);
      setNeedsPermissionSetup(false);
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch permissions"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaffPermission = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await api.post(
        `/staff-permission/${staffId}/create-permission`,
        { role: selectedRole }
      );
      const payload = response.data.data;
      const creds = payload?.credentials;
      if (creds?.username && creds?.tempPassword) {
        setCredentials({
          username: creds.username,
          tempPassword: creds.tempPassword,
        });
        setCredentialsDialog(true);
      }
      setSuccessMessage("Staff login and permissions created successfully");
      await fetchPermissions();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to create staff permissions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate new credentials
  const handleGenerateCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/staff-permission/${staffId}/reset-password`);
      setCredentials(response.data.data);
      setCredentialsDialog(true);
      setSuccessMessage("New credentials generated successfully");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to generate credentials");
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  // Handle permission change
  const handlePermissionChange = (permissionKey) => {
    setSelectedPermissions({
      ...selectedPermissions,
      [permissionKey]: !selectedPermissions[permissionKey],
    });
  };

  // Handle role change and apply defaults
  const handleRoleChange = async (newRole) => {
    if (permissions?.needsPermissionSetup) {
      setSelectedRole(newRole);
      return;
    }
    try {
      setLoading(true);
      const response = await api.put(`/staff-permission/${staffId}/permissions`, {
        role: newRole,
      });
      setSelectedRole(newRole);
      setSelectedPermissions(response.data.data.permissions);
      setSuccessMessage(`Role changed to ${newRole}`);
      await fetchPermissions();
    } catch (error) {
      setErrorMessage("Failed to change role");
    } finally {
      setLoading(false);
    }
  };

  // Save permission changes
  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      await api.put(`/staff-permission/${staffId}/permissions`, {
        permissions: selectedPermissions,
      });
      setSuccessMessage("Permissions updated successfully");
      setPermissionsDialog(false);
      await fetchPermissions();
    } catch (error) {
      setErrorMessage("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch login history (API wraps rows in { data: [...], pagination })
  const handleViewLoginHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/staff-permission/${staffId}/login-history?limit=50`
      );
      const payload = response.data?.data;
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setLoginHistory(rows);
      setLoginHistoryDialog(true);
    } catch (error) {
      setErrorMessage("Failed to fetch login history");
    } finally {
      setLoading(false);
    }
  };

  // Toggle staff status
  const handleToggleStatus = async (newStatus) => {
    try {
      setLoading(true);
      await api.put(`/staff-permission/${staffId}/status`, {
        status: newStatus,
      });
      setSuccessMessage(`Staff status changed to ${newStatus}`);
      await fetchPermissions();
    } catch (error) {
      setErrorMessage("Failed to change status");
    } finally {
      setLoading(false);
    }
  };

  if (!permissions && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!permissions) {
    return (
      <Box sx={{ p: 3 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {needsPermissionSetup && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This staff member has no dashboard login yet. Choose a role and click{" "}
          <strong>Create staff login &amp; permissions</strong> to generate a username and temporary
          password.
        </Alert>
      )}

      {needsPermissionSetup && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Initial setup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Role below applies when the account is created. You can change permissions after
              setup.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              {["Admin", "Manager", "Staff"].map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "contained" : "outlined"}
                  onClick={() => handleRoleChange(role)}
                  disabled={loading}
                >
                  {role}
                </Button>
              ))}
              <Button
                variant="contained"
                color="success"
                onClick={handleCreateStaffPermission}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />
                }
              >
                Create staff login & permissions
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Credentials Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Staff Credentials"
          action={
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateCredentials}
              disabled={loading || needsPermissionSetup}
              startIcon={<RefreshIcon />}
            >
              Generate New Credentials
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Box sx={{ mb: 2 }}>
                <strong>Username:</strong>{" "}
                {permissions?.credentials?.username || "—"}
                <Tooltip title="Copy username">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(permissions?.credentials?.username)}
                    disabled={!permissions?.credentials?.username}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <strong>Generated:</strong>{" "}
                {permissions?.credentials?.generatedAt
                  ? new Date(permissions.credentials.generatedAt).toLocaleString()
                  : "—"}
              </Box>
            </Box>
            <Box>
              <Box sx={{ mb: 2 }}>
                <strong>Status:</strong>
                <Chip
                  label={permissions?.status}
                  color={permissions?.status === "Active" ? "success" : "error"}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Box>
                <strong>Role:</strong>
                <Chip label={permissions?.role} color="primary" sx={{ ml: 1 }} />
              </Box>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleViewLoginHistory}
              startIcon={<HistoryIcon />}
              disabled={needsPermissionSetup}
            >
              View Login History
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                handleToggleStatus(permissions?.status === "Active" ? "Inactive" : "Active")
              }
              disabled={needsPermissionSetup}
            >
              {permissions?.status === "Active" ? "Deactivate" : "Activate"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Permissions Card — hidden until login record exists */}
      {!needsPermissionSetup && (
        <Card>
          <CardHeader
            title="Access & Permissions"
            subheader={`Current Role: ${permissions?.role}`}
            action={
              <Button
                variant="contained"
                color="primary"
                onClick={() => setPermissionsDialog(true)}
                startIcon={<EditIcon />}
              >
                Edit Permissions
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <strong>Select Role:</strong>
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                {["Admin", "Manager", "Staff"].map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "contained" : "outlined"}
                    onClick={() => handleRoleChange(role)}
                    disabled={loading}
                  >
                    {role}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <strong style={{ marginBottom: 8, display: "block" }}>Current Permissions:</strong>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                {modules.map((module) => (
                  <Box
                    key={module.name}
                    sx={{ border: "1px solid #e0e0e0", p: 2, borderRadius: 1 }}
                  >
                    <strong>{module.name}</strong>
                    <Box sx={{ mt: 1 }}>
                      {module.permissions.map((perm) => (
                        <Box
                          key={perm.key}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mt: 0.5,
                            color: selectedPermissions[perm.key] ? "#1976d2" : "#999",
                          }}
                        >
                          <Chip
                            label={perm.label}
                            size="small"
                            variant={
                              selectedPermissions[perm.key] ? "filled" : "outlined"
                            }
                            color={selectedPermissions[perm.key] ? "primary" : "default"}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Permissions Edit Dialog */}
      <Dialog open={permissionsDialog} onClose={() => setPermissionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Staff Permissions</DialogTitle>
        <DialogContent>
          {modules.map((module) => (
            <Box key={module.name} sx={{ mb: 2 }}>
              <strong>{module.name}</strong>
              <FormGroup>
                {module.permissions.map((perm) => (
                  <FormControlLabel
                    key={perm.key}
                    control={
                      <Checkbox
                        checked={selectedPermissions[perm.key] || false}
                        onChange={() => handlePermissionChange(perm.key)}
                      />
                    }
                    label={perm.label}
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={credentialsDialog} onClose={() => setCredentialsDialog(false)}>
        <DialogTitle>New Credentials Generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ This is a temporary password. Staff must change it on first login.
          </Alert>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TextField
                fullWidth
                label="Username"
                value={credentials?.username || ""}
                InputProps={{ readOnly: true }}
              />
              <Tooltip title="Copy">
                <IconButton onClick={() => copyToClipboard(credentials?.username)}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                fullWidth
                label="Temporary Password"
                type="text"
                value={credentials?.tempPassword || ""}
                InputProps={{ readOnly: true }}
              />
              <Tooltip title="Copy">
                <IconButton onClick={() => copyToClipboard(credentials?.tempPassword)}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const text = `Username: ${credentials?.username}\nTemporary Password: ${credentials?.tempPassword}\n\nNote: Please change password on first login.`;
              const element = document.createElement("a");
              element.setAttribute(
                "href",
                "data:text/plain;charset=utf-8," + encodeURIComponent(text)
              );
              element.setAttribute("download", `credentials_${credentials?.username}.txt`);
              element.style.display = "none";
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
          >
            Download Credentials
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCredentialsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog
        open={loginHistoryDialog}
        onClose={() => setLoginHistoryDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Login History</DialogTitle>
        <DialogContent>
          {!Array.isArray(loginHistory) || loginHistory.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center", color: "#999" }}>
              No login history found
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>ISP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(loginHistory) ? loginHistory : []).map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{log.dateTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={log.status === "Login Successful" ? "success" : "error"}
                        />
                      </TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>
                        {log.city}, {log.region}, {log.country}
                      </TableCell>
                      <TableCell>{log.isp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAccessPermission;
