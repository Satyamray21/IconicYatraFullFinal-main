import React, { useState } from "react";
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
import { useSelector } from "react-redux";

const DashboardHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Redux user state (profileSlice se)
  const { user } = useSelector((state) => state.profile);

  const [anchorEl, setAnchorEl] = useState(null);

  const pageTitles = {
    "/": "Dashboard",
    "/lead": "Leads Manager",
    "/quotation": "Quotation Manager",
    "/hotel": "Hotel Manager",
    "/tourpackage": "Package Manager",
    "/payment": "Payment Manager",
    "/invoice": "Invoice Manager",
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

          <IconButton>
            <CalendarToday />
          </IconButton>

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
    </AppBar>
  );
};

export default DashboardHeader;