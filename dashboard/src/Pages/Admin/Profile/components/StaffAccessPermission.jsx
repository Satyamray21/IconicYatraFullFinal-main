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
  alpha,
  useTheme,
  Switch,
  Grid,

} from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import api from "../../../../utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

const StaffAccessPermission = ({ staffId, staffData, isDark = false }) => {
  const theme = useTheme();
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

  // Style constants - White and Primary Blue combination
  const textColor = "#1a202c";
  const subTextColor = "#64748b";
  const borderColor = "#e2e8f0";
  const primaryBlue = "#1976d2";
  const lightBlue = "#f0f7ff";
  const hoverBlue = "#1565c0";

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handlePermissionChange = (permissionKey) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  const handleToggleModule = (moduleName, check) => {
    const module = modules.find(m => m.name === moduleName);
    if (!module) return;

    const newPerms = { ...selectedPermissions };
    module.permissions.forEach(p => {
      newPerms[p.key] = check;
    });
    setSelectedPermissions(newPerms);
  };

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

  const handleViewLoginHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/staff-permission/${staffId}/login-history?limit=50`
      );
      const payload = response.data?.data;
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);
      setLoginHistory(rows);
      setLoginHistoryDialog(true);
    } catch (error) {
      setErrorMessage("Failed to fetch login history");
    } finally {
      setLoading(false);
    }
  };

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <Box sx={{ color: textColor, bgcolor: "#ffffff", minHeight: "100vh" }}>
      {/* Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="success" sx={{ m: 3, mb: 0 }} onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="error" sx={{ m: 3, mb: 0 }} onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ p: 3 }}>
        {needsPermissionSetup && (
          <Card sx={{ mb: 3, background: lightBlue, border: `1px solid ${primaryBlue}20`, borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" gap={2} alignItems="flex-start">
                <SecurityIcon sx={{ color: primaryBlue, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: textColor }}>Initial Account Setup</Typography>
                  <Typography variant="body2" color={subTextColor} sx={{ mb: 2 }}>
                    This staff member doesn't have a dashboard account yet. Select a base role to generate their login credentials and default permissions.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}>
                    {["Admin", "Manager", "Staff"].map((role) => (
                      <Button
                        key={role}
                        variant={selectedRole === role ? "contained" : "outlined"}
                        onClick={() => handleRoleChange(role)}
                        disabled={loading}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          bgcolor: selectedRole === role ? primaryBlue : "transparent",
                          borderColor: selectedRole === role ? primaryBlue : borderColor,
                          color: selectedRole === role ? "#fff" : textColor,
                          "&:hover": {
                            bgcolor: selectedRole === role ? hoverBlue : alpha(primaryBlue, 0.04),
                            borderColor: primaryBlue,
                          }
                        }}
                      >
                        {role}
                      </Button>
                    ))}
                    <Button
                      variant="contained"
                      onClick={handleCreateStaffPermission}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        bgcolor: "#10b981",
                        boxShadow: `0 4px 12px ${alpha("#10b981", 0.2)}`,
                        "&:hover": { bgcolor: "#059669" }
                      }}
                    >
                      Initialize Access
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Status & Creds Summary Card */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: "100%", bgcolor: "#ffffff", border: `1px solid ${borderColor}`, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: textColor }}>Account Status</Typography>
                  <Chip
                    label={permissions?.status || "Pending"}
                    color={permissions?.status === "Active" ? "success" : "warning"}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color={subTextColor}>Username</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" fontWeight={600} sx={{ color: textColor }}>{permissions?.credentials?.username || "Not set"}</Typography>
                      {permissions?.credentials?.username && (
                        <IconButton size="small" onClick={() => copyToClipboard(permissions.credentials.username)}>
                          <ContentCopyIcon fontSize="inherit" sx={{ color: subTextColor }} />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color={subTextColor}>Assigned Role</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: primaryBlue }}>{permissions?.role || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={handleViewLoginHistory}
                        disabled={needsPermissionSetup}
                        sx={{ color: textColor }}
                      >
                        Login Logs
                      </Button>
                      <Button
                        size="small"
                        color={permissions?.status === "Active" ? "error" : "success"}
                        onClick={() => handleToggleStatus(permissions?.status === "Active" ? "Inactive" : "Active")}
                        disabled={needsPermissionSetup}
                      >
                        {permissions?.status === "Active" ? "Suspend Account" : "Activate Account"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: "100%", background: `linear-gradient(135deg, ${alpha(primaryBlue, 0.03)} 0%, ${alpha(primaryBlue, 0.08)} 100%)`, border: `1px solid ${borderColor}`, borderRadius: 3 }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <RefreshIcon sx={{ fontSize: 40, color: primaryBlue, mb: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: textColor }}>Security Reset</Typography>
                <Typography variant="body2" color={subTextColor} sx={{ mb: 2.5 }}>
                  Force generate new login credentials and temporary password for this staff.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateCredentials}
                  disabled={loading || needsPermissionSetup}
                  sx={{ borderRadius: 2, bgcolor: primaryBlue, "&:hover": { bgcolor: hoverBlue } }}
                >
                  Reset Credentials
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Permissions Management Section */}
        {!needsPermissionSetup && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: textColor }}>Access Matrix</Typography>
                <Typography variant="body2" color={subTextColor}>Configure which modules and actions this user can access.</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => setPermissionsDialog(true)}
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2, bgcolor: primaryBlue, "&:hover": { bgcolor: hoverBlue } }}
              >
                Modify Permissions
              </Button>
            </Box>

            <Grid container spacing={2}>
              {modules.map((module) => {
                const activeCount = module.permissions.filter(p => selectedPermissions[p.key]).length;
                const totalCount = module.permissions.length;

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={module.name}>
                    <Card sx={{
                      height: "100%",
                      bgcolor: "#ffffff",
                      border: `1px solid ${activeCount > 0 ? alpha(primaryBlue, 0.3) : borderColor}`,
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      "&:hover": { borderColor: alpha(primaryBlue, 0.5), transform: "translateY(-4px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: textColor }}>{module.name}</Typography>
                          <Chip
                            label={`${activeCount}/${totalCount}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              borderColor: activeCount > 0 ? primaryBlue : borderColor,
                              color: activeCount > 0 ? primaryBlue : subTextColor
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                          {module.permissions.map((perm) => (
                            <Tooltip title={perm.label} key={perm.key}>
                              <Chip
                                label={perm.label.split(" ")[0]}
                                size="small"
                                sx={{
                                  fontSize: "0.65rem",
                                  height: 24,
                                  bgcolor: selectedPermissions[perm.key] ? alpha(primaryBlue, 0.1) : "transparent",
                                  color: selectedPermissions[perm.key] ? primaryBlue : subTextColor,
                                  border: `1px solid ${selectedPermissions[perm.key] ? alpha(primaryBlue, 0.4) : alpha(borderColor, 0.5)}`,
                                  fontWeight: selectedPermissions[perm.key] ? 700 : 400
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Permissions Edit Dialog */}
      <Dialog
        open={permissionsDialog}
        onClose={() => setPermissionsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#ffffff",
            color: textColor,
            borderRadius: 4,
            backgroundImage: "none"
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1, fontWeight: 800, fontSize: "1.5rem", color: textColor }}>
          Edit Access Permissions
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Box mb={3}>
            <Typography variant="caption" color={subTextColor} sx={{ textTransform: "uppercase", fontWeight: 700, mb: 1, display: "block" }}>
              Quick Select Role
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {["Admin", "Manager", "Staff"].map(r => (
                <Chip
                  key={r}
                  label={r}
                  onClick={() => handleRoleChange(r)}
                  variant={selectedRole === r ? "filled" : "outlined"}
                  color={selectedRole === r ? "primary" : "default"}
                  sx={{ px: 1 }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ mb: 3, borderColor: alpha(borderColor, 0.5) }} />

          {modules.map((module) => (
            <Box key={module.name} sx={{ mb: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: textColor }}>{module.name}</Typography>
                <Box>
                  <Button size="small" onClick={() => handleToggleModule(module.name, true)} sx={{ fontSize: "0.7rem", color: primaryBlue }}>Select All</Button>
                  <Button size="small" onClick={() => handleToggleModule(module.name, false)} sx={{ fontSize: "0.7rem", color: "#d32f2f" }}>Clear</Button>
                </Box>
              </Box>
              <Grid container spacing={1}>
                {module.permissions.map((perm) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={perm.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={selectedPermissions[perm.key] || false}
                          onChange={() => handlePermissionChange(perm.key)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: primaryBlue,
                              '&:hover': {
                                backgroundColor: alpha(primaryBlue, 0.08),
                              },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: primaryBlue,
                            },
                          }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: textColor }}>{perm.label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setPermissionsDialog(false)} sx={{ color: subTextColor }}>Cancel</Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2, px: 4, bgcolor: primaryBlue, "&:hover": { bgcolor: hoverBlue } }}
          >
            {loading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog
        open={credentialsDialog}
        onClose={() => setCredentialsDialog(false)}
        PaperProps={{
          sx: { bgcolor: "#ffffff", color: textColor, borderRadius: 4, border: `1px solid ${primaryBlue}` }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: textColor }}>New Credentials Secured</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            These credentials will only be shown once. Share them securely with the staff member.
          </Alert>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Username"
              value={credentials?.username || ""}
              variant="filled"
              InputProps={{ readOnly: true, sx: { fontWeight: 700, color: primaryBlue } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Temporary Password"
              value={credentials?.tempPassword || ""}
              variant="filled"
              InputProps={{
                readOnly: true,
                sx: { fontWeight: 700, color: "#10b981", letterSpacing: 1 },
                endAdornment: (
                  <IconButton onClick={() => copyToClipboard(credentials?.tempPassword)}>
                    <ContentCopyIcon />
                  </IconButton>
                )
              }}
            />
          </Box>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const text = `Account: Iconic Yatra Staff Portal\nUsername: ${credentials?.username}\nTemp Password: ${credentials?.tempPassword}\n\nURL: ${window.location.origin}`;
              const element = document.createElement("a");
              element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
              element.setAttribute("download", `staff_creds_${credentials?.username}.txt`);
              element.click();
            }}
            sx={{ borderRadius: 2, py: 1.5, bgcolor: primaryBlue, "&:hover": { bgcolor: hoverBlue } }}
          >
            Download Credential PDF/Txt
          </Button>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setCredentialsDialog(false)} variant="outlined" fullWidth sx={{ borderRadius: 2, borderColor: borderColor, color: textColor }}>Got it</Button>
        </DialogActions>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog
        open={loginHistoryDialog}
        onClose={() => setLoginHistoryDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "#ffffff", color: textColor, borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: textColor }}>Access Logs: {permissions?.credentials?.username}</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ background: "transparent", border: `1px solid ${borderColor}`, borderRadius: 2, boxShadow: "none" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(borderColor, 0.3) }}>
                  <TableCell sx={{ color: textColor, fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ color: textColor, fontWeight: 700 }}>Result</TableCell>
                  <TableCell sx={{ color: textColor, fontWeight: 700 }}>IP / Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loginHistory.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ color: textColor }}>{dayjs(log.timestamp).format("MMM D, YYYY HH:mm")}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status === "Login Successful" ? "Success" : "Failed"}
                        size="small"
                        color={log.status === "Login Successful" ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.6rem", height: 18, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: textColor }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>{log.ip}</Typography>
                      <Typography variant="caption" sx={{ color: subTextColor }}>{log.city}, {log.country}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLoginHistoryDialog(false)} sx={{ color: primaryBlue }}>Close Logs</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAccessPermission;