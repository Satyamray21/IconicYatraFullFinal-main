import React, { useState, useEffect, useCallback } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
  Badge,
  TextField,
} from "@mui/material";
import {
  ChevronLeft,
  Notifications,
  CalendarToday,
  Lock,
  Logout,
  Edit,
  NotificationsActive,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProfile } from "../features/user/userSlice";
import axios from "../utils/axios";
import TablePagination from '@mui/material/TablePagination';
import { toast } from "react-toastify";

const DashboardHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Redux user state 
  const { user } = useSelector((state) => state.profile);

  const [anchorEl, setAnchorEl] = useState(null);

  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState(null);

  // Payment Summary State
  const [paymentSummaryOpen, setPaymentSummaryOpen] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [paymentSummaryLoading, setPaymentSummaryLoading] = useState(false);
  const [paymentSummaryError, setPaymentSummaryError] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [paymentSummarySearch, setPaymentSummarySearch] = useState("");
  const [paymentSummaryPage, setPaymentSummaryPage] = useState(0);
  const [paymentSummaryTotal, setPaymentSummaryTotal] = useState(0);

  // Change Password State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters!");
      return;
    }
    try {
      await axios.post("/user/me/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setChangePasswordOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to change password");
    }
  };

  const fetchPaymentSummary = useCallback(async (searchQuery = "", page = 1) => {
    setPaymentSummaryLoading(true);
    setPaymentSummaryError(null);
    try {
      const { data } = await axios.get("/quotations/payment-summary", {
        params: { search: searchQuery, page: page, limit: 50 }
      });
      setPaymentSummary(Array.isArray(data?.data?.data) ? data.data.data : []);
      setPaymentSummaryTotal(data?.data?.totalCount || 0);
    } catch (e) {
      setPaymentSummaryError(
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Could not load payment summary"
      );
      setPaymentSummary([]);
    } finally {
      setPaymentSummaryLoading(false);
    }
  }, []);

  // Debounce user input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaymentSummarySearch(searchInput);
      setPaymentSummaryPage(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when search or page changes
  useEffect(() => {
    if (paymentSummaryOpen) {
      fetchPaymentSummary(paymentSummarySearch, paymentSummaryPage + 1);
    }
  }, [paymentSummaryOpen, paymentSummarySearch, paymentSummaryPage, fetchPaymentSummary]);

  const fetchLoginHistory = useCallback(async () => {
    setLoginHistoryLoading(true);
    setLoginHistoryError(null);
    try {
      const { data } = await axios.get("/user/me/login-history", {
        params: { limit: 50 },
      });
      setLoginHistory(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setLoginHistoryError(
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Could not load login history"
      );
      setLoginHistory([]);
    } finally {
      setLoginHistoryLoading(false);
    }
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get("/notifications/my-notifications");
      const notifs = data?.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, user]);

  const [redisNotifications, setRedisNotifications] = useState([]);
  const [redisNotificationMenuAnchor, setRedisNotificationMenuAnchor] = useState(null);

  const fetchRedisNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get("/redis-notifications");
      setRedisNotifications(data?.data || []);
    } catch (e) {
      console.error("Failed to fetch redis notifications", e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRedisNotifications();
      const interval = setInterval(fetchRedisNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchRedisNotifications, user]);

  const handleClearAllRedis = async () => {
    try {
      await axios.delete("/redis-notifications");
      fetchRedisNotifications();
      setRedisNotificationMenuAnchor(null);
    } catch (e) {
      console.error("Failed to clear redis notifications", e);
    }
  };

  const handleDeleteRedisNotification = async (index, event) => {
    event.stopPropagation();
    try {
      await axios.delete(`/redis-notifications/${index}`);
      fetchRedisNotifications();
    } catch (e) {
      console.error("Failed to delete redis notification", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/notifications/mark-all-read");
      fetchNotifications();
      setNotificationMenuAnchor(null);
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await axios.patch(`/notifications/mark-as-read/${notif._id}`);
        fetchNotifications();
      }
      setNotificationMenuAnchor(null);
      if (notif.refId) {
        // Navigate to the lead or related object
        navigate(`/lead`); // Assuming leads manager for now, maybe deep link later
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const handleOpenLoginHistory = () => {
    setLoginHistoryOpen(true);
    fetchLoginHistory();
  };

  const pageTitles = {
    "/": "Dashboard",
    "/lead": "Leads Manager",
    "/quotation": "Quotation Manager",
    "/hotel": "Hotel Manager",
    "/tourpackage": "Package Manager",
    "/payment": "Payment Manager",
    "/invoice": "Invoice Manager",
    "/google-ads-enquiry": "Google Ads Enquiry",
    "/associates": "Business Associates Manager",
    "/staff": "Staff Manager",
    "/setting": "Settings",
    "/profile": "Profile",
  };

  const title = pageTitles[location.pathname] || "Page";

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? 1 : 0,
          py: isMobile ? 1 : 0,
        }}
      >
        {/* Left Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              "&:hover": { bgcolor: "primary.dark" },
              width: 36,
              height: 36,
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Typography variant="h5" color="primary" fontWeight="bold">
            {title}
          </Typography>
        </Box>

        {/* Center Logo */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Avatar
              variant="square"
              src="https://admin.iconicyatra.com/assets/img/logo.png"
              sx={{ width: isTablet ? 120 : 140, height: isTablet ? 30 : 40 }}
              alt="IconicYatra Logo"
            />
          </Box>
        )}

        {/* Right Section: Notifications + Profile */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="flex-end"
        >
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: "20px",
              background: "linear-gradient(90deg, #ff9800, #f57c00)",
              "&:hover": {
                background: "linear-gradient(90deg, #f57c00, #e65100)",
              },
            }}
            onClick={() => navigate("/google-ads-enquiry")}
          >
            Google Ads Enquiry
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: "20px",
              background: "linear-gradient(90deg, #1976d2, #1565c0)",
              "&:hover": {
                background: "linear-gradient(90deg, #1565c0, #0d47a1)",
              },
            }}
            onClick={() => navigate("/company-website-enquiry")}
          >
            Website Enquiry
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: "20px",
              background: "linear-gradient(90deg, #4caf50, #2e7d32)",
              "&:hover": {
                background: "linear-gradient(90deg, #2e7d32, #1b5e20)",
              },
            }}
            onClick={() => setPaymentSummaryOpen(true)}
          >
            Payment Summary
          </Button>

          <Tooltip title="Arrival Notifications">
            <IconButton onClick={(e) => setRedisNotificationMenuAnchor(e.currentTarget)} color="warning">
              <Badge badgeContent={redisNotifications.length} color="error">
                <NotificationsActive />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={redisNotificationMenuAnchor}
            open={Boolean(redisNotificationMenuAnchor)}
            onClose={() => setRedisNotificationMenuAnchor(null)}
            PaperProps={{
              sx: { width: 350, maxHeight: 400, borderRadius: 2 },
            }}
          >
            <Box
              p={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Arrival Notifications
              </Typography>
              {redisNotifications.length > 0 && (
                <Button size="small" color="error" onClick={handleClearAllRedis}>
                  Clear All
                </Button>
              )}
            </Box>
            <Divider />
            {redisNotifications.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2">No arrival notifications</Typography>
              </MenuItem>
            ) : (
              redisNotifications.map((notif, index) => (
                <MenuItem
                  key={index}
                  sx={{
                    whiteSpace: "normal",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    cursor: "default"
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">{notif.type}</Typography>
                    <IconButton size="small" onClick={(e) => handleDeleteRedisNotification(index, e)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2">
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notif.createdAt).toLocaleString()}
                  </Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          <Tooltip title="System Notifications">
            <IconButton onClick={(e) => setNotificationMenuAnchor(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notificationMenuAnchor}
            open={Boolean(notificationMenuAnchor)}
            onClose={() => setNotificationMenuAnchor(null)}
            PaperProps={{
              sx: { width: 320, maxHeight: 400, borderRadius: 2 },
            }}
          >
            <Box
              p={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead}>
                  Mark all as read
                </Button>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2">No notifications</Typography>
              </MenuItem>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    whiteSpace: "normal",
                    bgcolor: notif.isRead ? "transparent" : "action.hover",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Box py={1}>
                    <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          <Tooltip title="Login history">
            <IconButton
              onClick={handleOpenLoginHistory}
              aria-label="Login history"
              color="inherit"
            >
              <CalendarToday />
            </IconButton>
          </Tooltip>

          {/* Profile Section */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={handleProfileClick}
            sx={{ cursor: "pointer" }}
          >
            <Typography fontWeight={600} color="primary">
              {user?.fullName || "Admin"}
            </Typography>

            <Avatar
              src={user?.profileImg || ""}
              alt={user?.fullName || "Admin"}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid #1976d2",
              }}
            />
          </Stack>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: 4,
                minWidth: 300,
                overflow: "visible",
                p: 0,
                animation: "fadeIn 0.2s ease-out",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(-10px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 20,
                  width: 12,
                  height: 12,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{ p: 2, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={user?.profileImg || ""}
                  alt={user?.fullName || "Admin"}
                  sx={{ width: 50, height: 50, border: "2px solid #1976d2" }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user?.fullName}
                  </Typography>
                  <Typography variant="caption">
                    {user?.userRole || "Admin"}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* User Info */}
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>User ID:</strong> {user?.userId}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {user?.email}
              </Typography>

              <Divider sx={{ my: 1 }} />

              {/* Edit Profile */}
              <MenuItem
                onClick={() => {
                  handleClose();
                  const token = localStorage.getItem("token");
                  if (token) {
                    dispatch(fetchProfile());
                  }
                  navigate("/profile/edit");
                }}
                sx={{
                  "&:hover": { backgroundColor: "#f0f0f0" },
                  borderRadius: 1,
                }}
              >
                <Edit sx={{ mr: 1, color: "#1976d2" }} />
                Edit Profile
              </MenuItem>

              {/* Change Password */}
              <MenuItem
                onClick={() => {
                  handleClose();
                  setChangePasswordOpen(true);
                }}
                sx={{
                  "&:hover": { backgroundColor: "#f0f0f0" },
                  borderRadius: 1,
                }}
              >
                <Lock sx={{ mr: 1, color: "#1976d2" }} />
                Change Password
              </MenuItem>

              {/* Logout */}
              <MenuItem
                onClick={() => {
                  localStorage.clear();
                  const mainUrl = import.meta.env.VITE_MAIN_URL;
                  window.location.href = `${mainUrl}/admin/login`;
                }}
                sx={{
                  "&:hover": {
                    background: "linear-gradient(90deg, #f44336, #d32f2f)",
                    color: "white",
                  },
                  borderRadius: 1,
                  mt: 1,
                  fontWeight: "bold",
                }}
              >
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Box>
          </Menu>
        </Stack>
      </Toolbar>

      <Dialog
        open={loginHistoryOpen}
        onClose={() => setLoginHistoryOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Login history</DialogTitle>
        <DialogContent dividers>
          {loginHistoryLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
            >
              <CircularProgress size={40} />
            </Box>
          ) : loginHistoryError ? (
            <Typography color="error">{loginHistoryError}</Typography>
          ) : loginHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No login history found for this account.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell>Date &amp; time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>ISP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loginHistory.map((log) => (
                    <TableRow key={log._id || `${log.dateTime}-${log.ip}`}>
                      <TableCell>{log.dateTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={
                            log.status === "Login Successful"
                              ? "success"
                              : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>
                        {[log.city, log.region, log.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell>{log.isp || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={paymentSummaryOpen}
        onClose={() => setPaymentSummaryOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Payment Summary
          <TextField
            size="small"
            placeholder="Search client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              endAdornment: paymentSummaryLoading && paymentSummary.length > 0 ? <CircularProgress size={20} /> : null
            }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {paymentSummaryLoading && paymentSummary.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress size={40} />
            </Box>
          ) : paymentSummaryError ? (
            <Typography color="error">{paymentSummaryError}</Typography>
          ) : paymentSummary.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No payment summary found.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell>Client Name</TableCell>
                    <TableCell align="right">Total Quotation</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Due</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentSummary.map((client, index) => (
                    <React.Fragment key={index}>
                      <TableRow 
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        onClick={() => setExpandedClient(expandedClient === index ? null : index)}
                      >
                        <TableCell>
                          <Typography fontWeight="bold" color="primary">{client.clientName || "Unknown"}</Typography>
                        </TableCell>
                        <TableCell align="right">₹{client.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{client.receivedBalance?.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="error">
                            ₹{client.due?.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {expandedClient === index && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ pb: 2, pt: 0, bgcolor: "#fafafa" }}>
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="subtitle2" gutterBottom component="div" color="text.secondary">
                                Transactions
                              </Typography>
                              <Table size="small" aria-label="transactions">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {client.transactions?.length > 0 ? (
                                    client.transactions.map((txn, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                                        <TableCell>₹{txn.amount?.toLocaleString()}</TableCell>
                                        <TableCell>
                                          <Chip size="small" label={txn.status} color={['Receive Voucher', 'Cr'].includes(txn.status) ? 'success' : 'default'} />
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3}>No transactions found.</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={paymentSummaryTotal}
                page={paymentSummaryPage}
                onPageChange={(e, newPage) => setPaymentSummaryPage(newPage)}
                rowsPerPage={50}
                rowsPerPageOptions={[50]}
              />
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentSummaryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              size="small"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              size="small"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              size="small"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePasswordSubmit} disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default React.memo(DashboardHeader);