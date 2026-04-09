import React, { useEffect, useMemo, useState } from "react";
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
import { useSelector } from "react-redux";
import { destinationAxios } from "../Utils/axiosInstance";

const slugifySector = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const Navbar = () => {
  const [domesticAnchorEl, setDomesticAnchorEl] = useState(null);
  const [internationalAnchorEl, setInternationalAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openCollapse, setOpenCollapse] = useState({});
  const isMobile = useMediaQuery("(max-width:900px)");
  const location = useLocation();
  const [domesticDestinations, setDomesticDestinations] = useState([]);
  const [internationalDestinations, setInternationalDestinations] = useState([]);

  const openDomesticMenu = (event) => {
    setDomesticAnchorEl(event.currentTarget);
  };

  const closeDomesticMenu = () => {
    setDomesticAnchorEl(null);
  };

  const openInternationalMenu = (event) => {
    setInternationalAnchorEl(event.currentTarget);
  };

  const closeInternationalMenu = () => {
    setInternationalAnchorEl(null);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleCollapse = (key) => {
    setOpenCollapse((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const { data: company } = useSelector(
    (state) => state.companyUI
  );
  useEffect(() => {
    let isMounted = true;

    const fetchDestinations = async () => {
      try {
        const [domesticRes, internationalRes] = await Promise.all([
          destinationAxios.get("/?tourType=Domestic"),
          destinationAxios.get("/?tourType=International")
        ]);

        if (isMounted) {
          setDomesticDestinations(
            Array.isArray(domesticRes.data) ? domesticRes.data : []
          );
          setInternationalDestinations(
            Array.isArray(internationalRes.data) ? internationalRes.data : []
          );
        }
      } catch (error) {
        if (isMounted) {
          setDomesticDestinations([]);
          setInternationalDestinations([]);
        }
      }
    };

    fetchDestinations();

    return () => {
      isMounted = false;
    };
  }, []);

  const domesticSectors = useMemo(() => {
    const seen = new Set();
    return domesticDestinations
      .map((item) => item?.sector?.trim())
      .filter((sector) => {
        if (!sector) return false;
        const key = sector.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [domesticDestinations]);

  const internationalSectors = useMemo(() => {
    const seen = new Set();
    return internationalDestinations
      .map((item) => (item?.country || "").trim())
      .filter((sector) => {
        if (!sector) return false;
        const key = sector.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [internationalDestinations]);

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
                  onClick={openDomesticMenu}
                  endIcon={<ArrowDropDownIcon />}
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
                <Menu
                  anchorEl={domesticAnchorEl}
                  open={Boolean(domesticAnchorEl)}
                  onClose={closeDomesticMenu}
                >
                  <MenuItem component={Link} to="/domestic" onClick={closeDomesticMenu}>
                    All Domestic Packages
                  </MenuItem>
                  {domesticSectors.map((sector) => (
                    <MenuItem
                      key={sector}
                      component={Link}
                      to={`/domestic/${slugifySector(sector)}`}
                      onClick={closeDomesticMenu}
                    >
                      {sector}
                    </MenuItem>
                  ))}
                </Menu>

                {/* International Link */}
                <Button
                  onClick={openInternationalMenu}
                  endIcon={<ArrowDropDownIcon />}
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
                <Menu
                  anchorEl={internationalAnchorEl}
                  open={Boolean(internationalAnchorEl)}
                  onClose={closeInternationalMenu}
                >
                  <MenuItem
                    component={Link}
                    to="/international"
                    onClick={closeInternationalMenu}
                  >
                    All International Packages
                  </MenuItem>
                  {internationalSectors.map((sector) => (
                    <MenuItem
                      key={sector}
                      component={Link}
                      to={`/international/${slugifySector(sector)}`}
                      onClick={closeInternationalMenu}
                    >
                      {sector}
                    </MenuItem>
                  ))}
                </Menu>

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
              onClick={() => handleCollapse("domestic")}
              sx={{
                fontWeight: isParentActive("domestic") ? 700 : 500,
                borderLeft: isParentActive("domestic")
                  ? "4px solid #1f3c65"
                  : "4px solid transparent",
                color: isParentActive("domestic") ? "#1f3c65" : "black",
              }}
            >
              <ListItemText primary="Domestic" />
              {openCollapse.domestic ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={!!openCollapse.domestic} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  component={Link}
                  to="/domestic"
                  onClick={toggleDrawer}
                  sx={{ pl: 4 }}
                >
                  <ListItemText primary="All Domestic Packages" />
                </ListItemButton>
                {domesticSectors.map((sector) => (
                  <ListItemButton
                    key={sector}
                    component={Link}
                    to={`/domestic/${slugifySector(sector)}`}
                    onClick={toggleDrawer}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary={sector} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

            {/* International Link */}
            <ListItemButton
              onClick={() => handleCollapse("international")}
              sx={{
                fontWeight: isParentActive("international") ? 700 : 500,
                borderLeft: isParentActive("international")
                  ? "4px solid #1f3c65"
                  : "4px solid transparent",
                color: isParentActive("international") ? "#1f3c65" : "black",
              }}
            >
              <ListItemText primary="International" />
              {openCollapse.international ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={!!openCollapse.international} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  component={Link}
                  to="/international"
                  onClick={toggleDrawer}
                  sx={{ pl: 4 }}
                >
                  <ListItemText primary="All International Packages" />
                </ListItemButton>
                {internationalSectors.map((sector) => (
                  <ListItemButton
                    key={sector}
                    component={Link}
                    to={`/international/${slugifySector(sector)}`}
                    onClick={toggleDrawer}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary={sector} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

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