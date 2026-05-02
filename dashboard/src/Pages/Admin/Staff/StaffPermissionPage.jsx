import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  alpha,
  useTheme,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import ShieldIcon from "@mui/icons-material/Shield";
import PersonIcon from "@mui/icons-material/Person";
import StaffAccessPermission from "../Profile/components/StaffAccessPermission";
import api from "../../../utils/axios";
import { motion } from "framer-motion";

const GlassCard = ({ children, sx }) => (
  <Card
    sx={{
      borderRadius: 4,
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.1)",
        borderColor: "#1976d2",
      },
      ...sx,
    }}
  >
    {children}
  </Card>
);

const StaffPermissionPage = () => {
  const { staffId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const staffData = location.state?.staffData;
  const [staff, setStaff] = useState(staffData || null);
  const [loading, setLoading] = useState(!staffData);
  const [error, setError] = useState(null);

  // Color constants
  const primaryBlue = "#1976d2";
  const lightBlue = "#f5f9ff";
  const textColor = "#1a202c";
  const subTextColor = "#64748b";
  const borderColor = "#e2e8f0";
  const hoverBlue = "#1565c0";

  // Fetch staff profile when not passed via navigation state
  useEffect(() => {
    if (!staff && staffId) {
      const fetchStaff = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/staff/${staffId}`);
          setStaff(response.data.data);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to load staff data");
        } finally {
          setLoading(false);
        }
      };
      fetchStaff();
    }
  }, [staffId, staff]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          bgcolor: "#ffffff",
        }}
      >
        <CircularProgress sx={{ color: primaryBlue }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header & Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/admin/staff")}
              sx={{
                color: subTextColor,
                textDecoration: "none",
                "&:hover": { color: primaryBlue }
              }}
            >
              Staff Management
            </Link>
            <Typography variant="body2" sx={{ color: textColor }}>
              Access & Permissions
            </Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 4,
              color: primaryBlue,
              borderColor: borderColor,
              "&:hover": {
                borderColor: primaryBlue,
                bgcolor: alpha(primaryBlue, 0.04)
              }
            }}
            variant="outlined"
          >
            Back to Staff List
          </Button>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: alpha("#d32f2f", 0.04),
              color: "#d32f2f",
              borderRadius: 2,
              border: `1px solid ${alpha("#d32f2f", 0.2)}`
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Staff Identity Header */}
        {staff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard
              sx={{
                mb: 4,
                p: 3,
                background: lightBlue,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(135deg, ${primaryBlue}, ${hoverBlue})`,
                    boxShadow: `0 4px 14px 0 ${alpha(primaryBlue, 0.3)}`
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Typography variant="h4" fontWeight={800} sx={{ color: textColor, letterSpacing: "-0.5px" }}>
                      {staff.personalDetails?.fullName}
                    </Typography>
                    <Chip
                      label={staff.personalDetails?.userRole || "Staff"}
                      size="small"
                      sx={{
                        bgcolor: alpha(primaryBlue, 0.1),
                        color: primaryBlue,
                        fontWeight: 600,
                        border: `1px solid ${alpha(primaryBlue, 0.3)}`
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 4, mt: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: subTextColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Staff ID
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: textColor }}>
                        {staff.staffId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: subTextColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Email Address
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: textColor }}>
                        {staff.personalDetails?.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: subTextColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Contact
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: textColor }}>
                        {staff.personalDetails?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <ShieldIcon sx={{ fontSize: 60, color: alpha(primaryBlue, 0.1) }} />
                </Box>
              </Box>
            </GlassCard>
          </motion.div>
        )}

        {/* Permissions Management Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard sx={{ overflow: "hidden" }}>
            <CardContent sx={{ p: 0 }}>
              <StaffAccessPermission staffId={staffId} staffData={staff} isDark={false} />
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: subTextColor }}>
              Admin Privilege Control System v2.0 • Secured by Iconic Yatra Infrastructure
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StaffPermissionPage;