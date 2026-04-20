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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import StaffAccessPermission from "../Profile/components/StaffAccessPermission";
import api from "../../../utils/axios";

const StaffPermissionPage = () => {
  const { staffId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const staffData = location.state?.staffData;
  const [staff, setStaff] = useState(staffData || null);
  const [loading, setLoading] = useState(!staffData);
  const [error, setError] = useState(null);

  // Fetch staff profile (same as GET /api/v1/staff/:id) when not passed via navigation state
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 6 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body2" 
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ cursor: "pointer" }}
        >
          Staff Management
        </Link>
        <Typography color="textSecondary">
          Access & Permissions
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        Back to Staff List
      </Button>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Staff Info Header Card */}
      {staff && (
        <Card
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LockIcon
              sx={{
                fontSize: 40,
                color: theme.palette.primary.main,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
                {staff.personalDetails?.fullName}
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Staff ID
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {staff.staffId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Role
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {staff.personalDetails?.userRole}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {staff.personalDetails?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      )}

      {/* Permissions Management Component */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <StaffAccessPermission staffId={staffId} staffData={staff} />
        </CardContent>
      </Card>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 4, borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>Tips:</strong> Generate new credentials to reset staff password. Update permissions to control what modules this staff member can access. View login history to track all login attempts with geolocation data.
        </Typography>
      </Alert>
    </Container>
  );
};

export default StaffPermissionPage;
