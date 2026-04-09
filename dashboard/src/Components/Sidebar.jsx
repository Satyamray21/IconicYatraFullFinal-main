import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Toolbar,
  AppBar,
  Collapse,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { sidebarItems } from "./SidebarData";
import logo from "../assets/Logo/logoiconic.jpg";
import { getCompany } from "../features/companyUI/companyUISlice";
const drawerWidth = 200;

const Sidebar = ({ children }) => {
  const { data: company, status } = useSelector((state) => state.companyUI);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getCompany());
  }, [dispatch]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState({}); // 👈 NEW

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  const handleToggle = (label) => {
    setOpenMenu((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActiveRoute = (route) => location.pathname === route;

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, textAlign: "center" }}>
        <img
          src={company?.company?.headerLogo?.url}
          style={{ height: "50px", width: "150px" }}
        />
      </Box>

      <Divider />

      <List>
        {sidebarItems.map((item, index) => {
          if (item.divider) {
            return <Divider key={index} sx={{ my: 1 }} />;
          }

          // 🔽 HANDLE DROPDOWN (Settings)
          if (item.children) {
            const isOpen = openMenu[item.label];

            return (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleToggle(item.label)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText primary={item.label} />

                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>

                {/* CHILDREN */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child, i) => {
                      const isActive = isActiveRoute(child.route);

                      return (
                        <ListItem key={i} disablePadding>
                          <ListItemButton
                            component={Link}
                            to={child.route}
                            sx={{
                              pl: 4,
                              backgroundColor: isActive
                                ? "primary.main"
                                : "transparent",
                              color: isActive ? "white" : "black",
                              "&:hover": {
                                backgroundColor: isActive
                                  ? "primary.dark"
                                  : "#e0e0e0",
                              },
                            }}
                            onClick={() => isMobile && toggleDrawer()}
                          >
                            <ListItemIcon
                              sx={{
                                color: isActive ? "white" : "black",
                                minWidth: 40,
                              }}
                            >
                              {child.icon}
                            </ListItemIcon>

                            <ListItemText primary={child.label} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          // 🔹 NORMAL ITEM
          const isActive = isActiveRoute(item.route);

          return (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={Link}
                to={item.route}
                sx={{
                  backgroundColor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "white" : "black",
                  "&:hover": {
                    backgroundColor: isActive ? "primary.dark" : "#e0e0e0",
                  },
                }}
                onClick={() => isMobile && toggleDrawer()}
              >
                <ListItemIcon
                  sx={{ color: isActive ? "white" : "black", minWidth: 40 }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>

            <Typography variant="h6">Admin Dashboard</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: isMobile ? 7 : 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;
