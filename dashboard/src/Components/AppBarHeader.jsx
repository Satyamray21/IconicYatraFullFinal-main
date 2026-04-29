import React, { useState, useCallback } from "react";
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
} from "@mui/material";
import {
  ChevronLeft,
  Notifications,
  CalendarToday,
  Lock,
  Logout,
  Edit,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProfile } from "../features/user/userSlice";
import axios from "../utils/axios";

const DashboardHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Redux user state (profileSlice se)
  const { user } = useSelector((state) => state.profile);

  const [anchorEl, setAnchorEl] = useState(null);

  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState(null);

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

          <IconButton>
            <Notifications />
          </IconButton>

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
                  navigate("/change-password");
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
    </AppBar>
  );
};

export default DashboardHeader;