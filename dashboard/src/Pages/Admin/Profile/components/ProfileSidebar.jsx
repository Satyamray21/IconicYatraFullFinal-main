import React from "react";
import {
    Paper, Avatar, Box, Typography, Divider,
    List, ListItem, ListItemIcon, ListItemText
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddIcon from "@mui/icons-material/Add";

const ProfileSidebar = ({ user, activeTab, setActiveTab }) => {

    const menuItemStyle = {
        borderRadius: 2,
        mb: 0.5,
        px: 1.5,
        transition: "all 0.2s ease",
        "&:hover": {
            bgcolor: "#eef3ff",
            transform: "translateX(4px)",
            cursor: "pointer"
        }
    };

    const activeStyle = {
        bgcolor: "#e0ebff",
        borderLeft: "4px solid #1976d2",
        transform: "translateX(4px)"
    };

    return (
        <Paper
            sx={{
                width: 280,
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.1)"
            }}
        >

            {/* TOP HEADER SECTION */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #1976d2, #004ba0)",
                    p: 3,
                    color: "white",
                    textAlign: "center"
                }}
            >
                <Avatar
                    src={user?.profileImg}
                    sx={{
                        width: 90,
                        height: 90,
                        margin: "0 auto",
                        mb: 1,
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.3)"
                    }}
                />

                <Typography variant="h6" fontWeight={600}>
                    {user?.fullName}
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {user?.email}
                </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
                <List>

                    <ListItem
                        sx={{ ...menuItemStyle, ...(activeTab === "profile" && activeStyle) }}
                        onClick={() => setActiveTab("profile")}
                    >
                        <ListItemIcon><PersonIcon color={activeTab === "profile" ? "primary" : "inherit"} /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItem>

                    <ListItem
                        sx={{ ...menuItemStyle, ...(activeTab === "company" && activeStyle) }}
                        onClick={() => setActiveTab("company")}
                    >
                        <ListItemIcon><BusinessIcon color={activeTab === "company" ? "primary" : "inherit"} /></ListItemIcon>
                        <ListItemText primary="Company" />
                    </ListItem>

                    <ListItem
                        sx={{ ...menuItemStyle, ...(activeTab === "gallery" && activeStyle) }}
                        onClick={() => setActiveTab("gallery")}
                    >
                        <ListItemIcon><CollectionsBookmarkIcon color={activeTab === "gallery" ? "primary" : "inherit"} /></ListItemIcon>
                        <ListItemText primary="Gallery" />
                    </ListItem>

                    <ListItem
                        sx={{ ...menuItemStyle, ...(activeTab === "bankDetails" && activeStyle) }}
                        onClick={() => setActiveTab("bankDetails")}
                    >
                        <ListItemIcon><AccountBalanceIcon color={activeTab === "bankDetails" ? "primary" : "inherit"} /></ListItemIcon>
                        <ListItemText primary="Bank Details" />
                    </ListItem>

                    {/* ADMIN SECTION */}
                    {user?.userRole === "Admin" && (
                        <>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="overline" sx={{ pl: 1.5, color: "gray" }}>
                                Admin Tools
                            </Typography>

                            <ListItem
                                sx={{ ...menuItemStyle, ...(activeTab === "admin" && activeStyle) }}
                                onClick={() => setActiveTab("admin")}
                            >
                                <ListItemIcon><AddIcon color={activeTab === "admin" ? "primary" : "inherit"} /></ListItemIcon>
                                <ListItemText primary="Create User" />
                            </ListItem>
                        </>
                    )}

                </List>
            </Box>
        </Paper>
    );
};

export default ProfileSidebar;