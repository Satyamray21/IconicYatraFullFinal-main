import React, { useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { sidebarItems } from './SidebarData';
import logo from '../assets/Logo/logoiconic.jpg'

const drawerWidth = 200;

const Sidebar = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img src={logo} style={{ height: '50px', width: '150px' }} />
      </Box>
      <Divider />
      <List>
        {sidebarItems.map((item, index) => {
          // Render Divider if the item has the divider flag
          if (item.divider) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
          }

          const isActive = location.pathname === item.route;

          return (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={Link}
                to={item.route}
                sx={{
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'black',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : '#e0e0e0',
                  },
                }}
                onClick={() => isMobile && toggleDrawer()}
              >
                <ListItemIcon
                  sx={{ color: isActive ? 'white' : 'black', minWidth: 40 }}
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
    <Box sx={{ display: 'flex' }}>
      {/* AppBar for mobile */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #ccc',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Page Content */}
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
