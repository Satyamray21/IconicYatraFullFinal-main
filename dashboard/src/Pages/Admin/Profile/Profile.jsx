import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../../../features/user/userSlice";

import ProfileSidebar from "./components/ProfileSidebar";
import ProfileDetails from "./components/ProfileDetails";
import CompanyInfo from "./components/CompanyInfo";
import AddressDetails from "./components/AddressDetails";
import CreateAdminForm from "./components/CreateAdminForm";
import CareerDashboard from "./components/CareerDashboard";
import BankDetailsPage from "./Bank/Form/BankCard";

const Profile = () => {
    const dispatch = useDispatch();
    const { user, loading, error } = useSelector((state) => state.profile);

    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) dispatch(fetchProfile(userId));
    }, [dispatch]);

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box
            display="flex"
            height="100vh"
            bgcolor="#eef2f7"
            sx={{
                p: 2,
                gap: 2,
            }}
        >
            {/* Left Sidebar */}
            <ProfileSidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Right Content with Professional Card Layout */}
            <Paper
                elevation={3}
                sx={{
                    flex: 1,
                    borderRadius: 4,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Top Header Bar */}
                <Box
                    sx={{
                        p: 3,
                        borderBottom: "1px solid #e0e0e0",
                        bgcolor: "white",
                    }}
                >
                    <Typography variant="h5" fontWeight={600}>
                        {activeTab === "profile" && "My Profile"}
                        {activeTab === "company" && "Company Information"}
                        {activeTab === "gallery" && "Gallery Upload"}
                         {activeTab === "candidates" && "Candidate Applications"}
                        {/* {activeTab === "address" && "Address Details"} */}
                        {activeTab === "bankDetails" && "Bank Details"}
                        {activeTab === "admin" && "Create New User"}
                    </Typography>
                </Box>

                {/* Scrollable Body Section */}
                <Box
                    flex={1}
                    p={3}
                    sx={{
                        overflowY: "auto",
                        bgcolor: "#fafbfc",
                    }}
                >
                    {activeTab === "profile" && <ProfileDetails user={user} />}
                    {activeTab === "company" && <CompanyInfo />}
                    {activeTab === "gallery" && <AddressDetails user={user} />}
                    {activeTab === "candidates" && <CareerDashboard />}
                    {activeTab === "admin" && user?.userRole === "Admin" && <CreateAdminForm />}
                    {activeTab === "bankDetails" && <BankDetailsPage />}
                </Box>
            </Paper>
        </Box>
    );
};

export default Profile;