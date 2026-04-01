import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import logo from "../assets/Logo/logoiconic1.png";
import {useSelector} from "react-redux";
const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuType, setMenuType] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openCollapse, setOpenCollapse] = useState({});
  const isMobile = useMediaQuery("(max-width:900px)");
  const location = useLocation();

  const OpenMenu = (event, type) => {
    setAnchorEl(event.currentTarget);
    setMenuType(type);
  };

  const CloseMenu = () => {
    setAnchorEl(null);
    setMenuType("");
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleCollapse = (key) => {
    setOpenCollapse((prev) => ({ ...prev, [key]: !prev[key] }));
  };
   const { data: company, status } = useSelector(
    (state) => state.companyUI
  );
  const isActive = (path) => location.pathname === path;
  const isParentActive = (key) =>
    location.pathname === `/${key}` || location.pathname.startsWith(`/${key}/`);

  return (
    <Box sx={{ width: "100%" }}>
      <AppBar
        position="static"
        color="transparent"
        sx={{ px: 1, boxShadow: "none", borderBottom: "1px solid #eee" }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
            {/* Logo */}
            <Box
              component={Link}
              to="/"
              sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              <img src={company?.company?.headerLogo?.url} alt="Logo" height="40" />
            </Box>

            {/* Desktop Menu */}
            {!isMobile ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {/* Home */}
                <Button
                  component={Link}
                  to="/"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: isActive("/") ? "#1f3c65" : "black",
                    borderBottom: isActive("/") ? "3px solid #1f3c65" : "3px solid transparent",
                    pb: "6px",
                  }}
                >
                  Home
                </Button>

                {/* Domestic Link */}
                <Button
                  component={Link}
                  to="/domestic"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: isParentActive("domestic") ? "#1f3c65" : "black",
                    borderBottom: isParentActive("domestic")
                      ? "3px solid #1f3c65"
                      : "3px solid transparent",
                    pb: "6px",
                  }}
                >
                  Domestic
                </Button>

                {/* International Link */}
                <Button
                  component={Link}
                  to="/international"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: isParentActive("international") ? "#1f3c65" : "black",
                    borderBottom: isParentActive("international")
                      ? "3px solid #1f3c65"
                      : "3px solid transparent",
                    pb: "6px",
                  }}
                >
                  International
                </Button>

                {/* Static Links */}
                {["holidays", "spiritual-tour", "services", "contact"].map((page) => (
                  <Button
                    key={page}
                    component={Link}
                    to={`/${page}`}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      color: isActive(`/${page}`) ? "#1f3c65" : "black",
                      borderBottom: isActive(`/${page}`)
                        ? "3px solid #1f3c65"
                        : "3px solid transparent",
                      pb: "6px",
                    }}
                  >
                    {page === "spiritual-tour" ? "Spiritual Tour" : page.charAt(0).toUpperCase() + page.slice(1)}
                  </Button>
                ))}
              </Box>
            ) : (
              // Mobile Drawer Toggle Button
              <IconButton onClick={toggleDrawer} sx={{ color: "#1f3c65" }}>
                <MenuIcon fontSize="medium" />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer for Mobile */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 270, p: 2 }}>
          {/* Drawer Header with Logo */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <img src={logo} alt="Logo" height="40" />
          </Box>
          <Divider sx={{ mb: 2 }} />

          <List>
            {/* Home */}
            <ListItemButton
              component={Link}
              to="/"
              onClick={toggleDrawer}
              sx={{
                fontWeight: isActive("/") ? 700 : 500,
                borderLeft: isActive("/") ? "4px solid #1f3c65" : "4px solid transparent",
                color: isActive("/") ? "#1f3c65" : "black",
              }}
            >
              <ListItemText primary="Home" />
            </ListItemButton>

            {/* Domestic Link */}
            <ListItemButton
              component={Link}
              to="/domestic"
              onClick={toggleDrawer}
              sx={{
                fontWeight: isParentActive("domestic") ? 700 : 500,
                borderLeft: isParentActive("domestic")
                  ? "4px solid #1f3c65"
                  : "4px solid transparent",
                color: isParentActive("domestic") ? "#1f3c65" : "black",
              }}
            >
              <ListItemText primary="Domestic" />
            </ListItemButton>

            {/* International Link */}
            <ListItemButton
              component={Link}
              to="/international"
              onClick={toggleDrawer}
              sx={{
                fontWeight: isParentActive("international") ? 700 : 500,
                borderLeft: isParentActive("international")
                  ? "4px solid #1f3c65"
                  : "4px solid transparent",
                color: isParentActive("international") ? "#1f3c65" : "black",
              }}
            >
              <ListItemText primary="International" />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            {/* Static Links */}
            {[
              { name: "Holidays", path: "holidays" },
              { name: "Yatra", path: "spiritual-tour" },
              { name: "Services", path: "services" },
              { name: "Contact", path: "contact" }
            ].map((page) => (
              <ListItemButton
                key={page.path}
                component={Link}
                to={`/${page.path}`}
                onClick={toggleDrawer}
                sx={{
                  fontWeight: isActive(`/${page.path}`) ? 700 : 500,
                  borderLeft: isActive(`/${page.path}`)
                    ? "4px solid #1f3c65"
                    : "4px solid transparent",
                  color: isActive(`/${page.path}`) ? "#1f3c65" : "black",
                }}
              >
                <ListItemText primary={page.name} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Navbar;