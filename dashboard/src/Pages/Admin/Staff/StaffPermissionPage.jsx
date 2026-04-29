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
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        py: 4,
        color: "#fff"
      }}
    >
      <Container maxWidth="lg">
        {/* Header & Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Breadcrumbs sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { color: "rgba(255,255,255,0.3)" } }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/admin/staff")}
              sx={{ color: alpha("#fff", 0.7), textDecoration: "none", "&:hover": { color: "#fff" } }}
            >
              Staff Management
            </Link>
            <Typography variant="body2" color="#fff">
              Access & Permissions
            </Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 4,
              color: "#fff",
              borderColor: "rgba(255,255,255,0.2)",
              "&:hover": { borderColor: "#fff", background: "rgba(255,255,255,0.05)" }
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
            sx={{ mb: 3, background: "rgba(211, 47, 47, 0.1)", color: "#ff8a80", border: "1px solid rgba(211, 47, 47, 0.3)" }}
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
                background: "linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(45deg, #3b82f6, #2563eb)",
                    boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)"
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.5px" }}>
                      {staff.personalDetails?.fullName}
                    </Typography>
                    <Chip
                      label={staff.personalDetails?.userRole || "Staff"}
                      size="small"
                      sx={{
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#60a5fa",
                        fontWeight: 600,
                        border: "1px solid rgba(59, 130, 246, 0.3)"
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 4, mt: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Staff ID
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {staff.staffId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Email Address
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {staff.personalDetails?.email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                        Contact
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {staff.personalDetails?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <ShieldIcon sx={{ fontSize: 60, color: "rgba(255,255,255,0.1)" }} />
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
          <GlassCard>
            <CardContent sx={{ p: 0 }}>
              <StaffAccessPermission staffId={staffId} staffData={staff} isDark={true} />
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
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
              Admin Privilege Control System v2.0 • Secured by Iconic Yatra Infrastructure
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StaffPermissionPage;
