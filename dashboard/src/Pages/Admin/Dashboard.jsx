import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Skeleton,
  IconButton,
  Tooltip as MuiTooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  alpha,
} from "@mui/material";
import {
  TrendingUp,
  Assignment,
  FlightTakeoff,
  Receipt,
  Event,
  History,
  TrendingDown,
  FiberManualRecord,
  QuestionAnswer,
  Article,
  Hotel,
  NotificationsActive,
  MoreVert,
  CheckCircle,
  AccessTime,
  Add,
  FilterList,
  Today,
  Payments,
  CalendarToday,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, createReminder, updateReminderStatus } from "../../features/dashboard/dashboardSlice";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.extend(relativeTime);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const GlassCard = ({ children, sx, noPadding = false }) => (
  <Card
    sx={{
      borderRadius: 6,
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)",
      color: "#fff",
      transition: "transform 0.3s ease, border-color 0.3s ease",
      "&:hover": {
        borderColor: "rgba(255, 255, 255, 0.15)",
      },
      ...sx,
    }}
  >
    {noPadding ? children : <CardContent sx={{ p: 3 }}>{children}</CardContent>}
  </Card>
);

const StatCard = ({ title, value, icon, color, trend, trendValue, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    style={{ height: "100%" }}
  >
    <GlassCard
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&:hover": { 
          transform: "translateY(-5px)",
          "& .neon-bg": { opacity: 0.2 }
        },
      }}
    >
      <Box className="neon-bg" sx={{ 
        position: "absolute", 
        top: -40, 
        right: -40, 
        width: 120, 
        height: 120, 
        borderRadius: "50%", 
        bgcolor: color, 
        filter: "blur(40px)", 
        opacity: 0.1, 
        transition: "opacity 0.3s ease" 
      }} />
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ my: 1, color: "#fff", letterSpacing: -1 }}>
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                px: 1, 
                py: 0.2, 
                borderRadius: 1, 
                bgcolor: trend === "up" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: trend === "up" ? "#10b981" : "#ef4444" 
              }}>
                {trend === "up" ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
                <Typography variant="caption" fontWeight={900} sx={{ ml: 0.5 }}>{trendValue}</Typography>
              </Box>
            </Box>
          )}
        </Box>
        <Avatar
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.4)} 100%)`,
            color: "#fff",
            width: 48,
            height: 48,
            borderRadius: 2.5,
            boxShadow: `0 8px 16px ${alpha(color, 0.2)}`
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 22 } })}
        </Avatar>
      </Box>
    </GlassCard>
  </motion.div>
);

const MiniStat = ({ title, value, icon, color }) => (
  <Box display="flex" alignItems="center" gap={2} p={2.5} sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
    <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 44, height: 44, borderRadius: 3 }}>{icon}</Avatar>
    <Box>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{title}</Typography>
      <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>{value}</Typography>
    </Box>
  </Box>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.dashboard);
  
  // Menu/Dialog states
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [newReminderData, setNewReminderData] = useState({ title: "", type: "reminder", priority: "medium", dateTime: dayjs() });
  
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    dispatch(fetchDashboardStats({ 
      activityDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : null 
    }));
  }, [dispatch, selectedDate]);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);

  const handleCreateReminder = async () => {
    if (!newReminderData.title) {
      setSnackbar({ open: true, message: "Title is required", severity: "error" });
      return;
    }
    
    try {
      await dispatch(createReminder({
        ...newReminderData,
        dateTime: newReminderData.dateTime.toISOString()
      })).unwrap();
      setReminderDialogOpen(false);
      setNewReminderData({ title: "", type: "reminder", priority: "medium", dateTime: dayjs() });
      setSnackbar({ open: true, message: "Action item created successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err || "Failed to create item", severity: "error" });
    }
  };

  const handleCompleteReminder = async (id) => {
    try {
      await dispatch(updateReminderStatus({ id, status: 'completed' })).unwrap();
      setSnackbar({ open: true, message: "Item marked as completed", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err || "Failed to update item", severity: "error" });
    }
  };

  const filteredActivities = stats?.recentActivities?.filter(log => 
    activityFilter === "all" ? true : log.model === activityFilter
  ) || [];

  const leadPieData = stats?.leads
    ? [
        { name: "Active", value: stats.leads.active },
        { name: "Confirmed", value: stats.leads.confirmed },
        { name: "Cancelled", value: stats.leads.cancelled },
      ]
    : [];

  const revenueData = stats?.invoices?.monthlyRevenue || [];

  if (loading && !stats) {
    return (
      <Box p={4} sx={{ bgcolor: "#0f172a", minHeight: "100vh" }}>
        <Skeleton variant="text" width={300} height={60} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Grid container spacing={3} mt={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 5, bgcolor: "rgba(255,255,255,0.05)" }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          backgroundColor: "#030712",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          p: { xs: 2, md: 4 },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 80% 0%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 1) 0%, transparent 100%)
            `,
            zIndex: 0,
            pointerEvents: "none"
          }
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
          {/* Header Section */}
          <Box mb={5} display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap={2}>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, mb: 0.5 }}>
                Operational <Box component="span" sx={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Insight</Box>
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                Welcome back, Admin. System status is optimal.
              </Typography>
            </motion.div>
            <Box display="flex" gap={1.5}>
              <GlassCard noPadding sx={{ display: "flex", alignItems: "center", gap: 1, height: 42, px: 2, borderRadius: 2 }}>
                <Today sx={{ color: "#3b82f6", fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{dayjs().format("MMM DD, YYYY")}</Typography>
              </GlassCard>
              <Button 
                variant="contained" 
                startIcon={<Add sx={{ fontSize: 18 }} />} 
                onClick={() => setReminderDialogOpen(true)}
                sx={{ 
                  borderRadius: 2, 
                  height: 42,
                  px: 2.5, 
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  boxShadow: "0 8px 20px rgba(59, 130, 246, 0.25)",
                  textTransform: "none"
                }}
              >
                Action Item
              </Button>
            </Box>
          </Box>

        {/* Primary Stats Grid */}
        <Grid container spacing={3} mb={6}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Annual Revenue" value={`₹${(stats?.invoices?.revenue || 0).toLocaleString()}`} icon={<TrendingUp />} color="#10b981" trend="up" trendValue="+14.2%" delay={0.1} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pipeline Leads" value={stats?.leads?.total || 0} icon={<Assignment />} color="#3b82f6" trend="up" delay={0.2} trendValue="+5.1%" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Tours" value={stats?.tours?.active || 0} icon={<FlightTakeoff />} color="#8b5cf6" trend="up" delay={0.3} trendValue="+2.8%" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Quotes" value={stats?.quotations?.total || 0} icon={<Receipt />} color="#ec4899" trend="down" delay={0.4} trendValue="-1.2%" />
          </Grid>
        </Grid>

        {/* Dynamic Secondary Stats */}
        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <MiniStat title="Website Enquiries" value={stats?.others?.enquiries || 0} icon={<QuestionAnswer />} color="#06b6d4" />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <MiniStat title="Content Repository" value={stats?.others?.blogs || 0} icon={<Article />} color="#f59e0b" />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <MiniStat title="Hotel Inventory" value={stats?.others?.hotels || 0} icon={<Hotel />} color="#ef4444" />
            </motion.div>
          </Grid>
        </Grid>

        {/* Analytical Section */}
        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ p: 1 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>Financial Performance</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Monthly revenue metrics across all invoices</Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip label="6 Months" size="small" sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", fontWeight: 800, borderRadius: 2 }} />
                  </Box>
                </Box>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" dot={{ r: 5, fill: "#3b82f6", strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 8, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} mb={1}>Lead Ecosystem</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }} mb={4} display="block">Current status distribution</Typography>
                <Box height={400} display="flex" flexDirection="column" justifyContent="center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={leadPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="value">
                        {leadPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box mt={4} sx={{ px: 2 }}>
                    {leadPieData.map((item, i) => (
                      <Box key={item.name} display="flex" justifyContent="space-between" alignItems="center" mb={1.5} sx={{ bgcolor: "rgba(255,255,255,0.02)", p: "8px 16px", borderRadius: 3 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: COLORS[i % COLORS.length], boxShadow: `0 0 10px ${COLORS[i]}` }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: "rgba(255,255,255,0.7)" }}>{item.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800}>{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>

        {/* Operational Flow Section */}
        <Grid container spacing={3}>
          {/* Reminders & Appointments */}
          <Grid item xs={12} md={5}>
            <GlassCard sx={{ height: "100%", minHeight: 550 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b", width: 50, height: 50 }}><NotificationsActive /></Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>Schedule & Reminders</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Upcoming critical actions</Typography>
                    </Box>
                  </Box>
                  <IconButton color="inherit" onClick={handleMenuClick}><MoreVert /></IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => { setReminderDialogOpen(true); handleMenuClose(); }}>Add New Action</MenuItem>
                    <MenuItem onClick={handleMenuClose}>View Full Calendar</MenuItem>
                  </Menu>
                </Box>
                
                <List sx={{ p: 0 }}>
                  <AnimatePresence>
                    {stats?.reminders?.length > 0 ? (
                      stats.reminders.map((reminder, idx) => (
                        <motion.div key={reminder._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                          <ListItem sx={{ px: 0, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <ListItemIcon sx={{ minWidth: 56 }}>
                              <Box sx={{ 
                                width: 44, 
                                height: 44, 
                                borderRadius: 3, 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                bgcolor: reminder.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                                color: reminder.priority === 'high' ? '#ef4444' : '#3b82f6'
                              }}>
                                {reminder.type === 'appointment' ? <AccessTime /> : <NotificationsActive />}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography variant="body1" fontWeight={700} sx={{ color: "#fff" }}>{reminder.title}</Typography>}
                              secondary={
                                <Box display="flex" alignItems="center" gap={1.5} mt={0.5}>
                                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Event sx={{ fontSize: 14 }} /> {dayjs(reminder.dateTime).format("MMM DD, hh:mm A")}
                                  </Typography>
                                  <Chip label={reminder.priority} size="small" sx={{ 
                                    height: 18, 
                                    fontSize: 10, 
                                    fontWeight: 900, 
                                    textTransform: "uppercase", 
                                    bgcolor: reminder.priority === 'high' ? '#ef4444' : (reminder.priority === 'medium' ? '#f59e0b' : '#10b981'),
                                    color: "#fff"
                                  }} />
                                </Box>
                              }
                            />
                            <MuiTooltip title="Mark Complete">
                              <IconButton size="small" onClick={() => handleCompleteReminder(reminder._id)} sx={{ color: "rgba(255,255,255,0.2)", "&:hover": { color: "#10b981", bgcolor: "rgba(16,185,129,0.1)" } }}>
                                <CheckCircle />
                              </IconButton>
                            </MuiTooltip>
                          </ListItem>
                        </motion.div>
                      ))
                    ) : (
                      <Box textAlign="center" py={12}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.1)", mx: "auto", mb: 2 }}><NotificationsActive fontSize="large" /></Avatar>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Your schedule is clear for now.</Typography>
                      </Box>
                    )}
                  </AnimatePresence>
                </List>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Activity Stream */}
          <Grid item xs={12} md={7}>
            <GlassCard sx={{ height: "100%", minHeight: 550 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: "rgba(14,165,233,0.1)", color: "#0ea5e9", width: 50, height: 50 }}><History /></Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>Live Activity Stream</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Historical logs across all modules</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <IconButton color="inherit" onClick={handleFilterClick}><FilterList /></IconButton>
                    <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
                      <MenuItem onClick={() => { setActivityFilter("all"); handleFilterClose(); }}>All Activity</MenuItem>
                      <MenuItem onClick={() => { setActivityFilter("Lead"); handleFilterClose(); }}>Lead Updates</MenuItem>
                      <MenuItem onClick={() => { setActivityFilter("Payment"); handleFilterClose(); }}>Payment Logs</MenuItem>
                      <MenuItem onClick={() => { setActivityFilter("Package"); handleFilterClose(); }}>Package Logs</MenuItem>
                      <MenuItem onClick={() => { setActivityFilter("Invoice"); handleFilterClose(); }}>Invoice Logs</MenuItem>
                    </Menu>
                    <DatePicker
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { 
                            width: 150,
                            "& .MuiInputBase-root": {
                              color: "#fff",
                              bgcolor: "rgba(255,255,255,0.05)",
                              borderRadius: 2,
                              "& fieldset": { border: "none" }
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ position: "relative" }}>
                  <List sx={{ p: 0 }}>
                    {filteredActivities.length > 0 ? (
                      filteredActivities.map((log, idx) => (
                        <ListItem key={log._id} sx={{ px: 0, py: 2.5, alignItems: "flex-start", borderBottom: idx < filteredActivities.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <ListItemIcon sx={{ minWidth: 56, mt: 0.5 }}>
                            <Box sx={{ 
                              width: 42, 
                              height: 42, 
                              borderRadius: 2.5, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              bgcolor: log.model === 'Lead' ? 'rgba(59,130,246,0.1)' : (log.model === 'Payment' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'),
                              color: log.model === 'Lead' ? '#3b82f6' : (log.model === 'Payment' ? '#10b981' : 'rgba(255,255,255,0.4)')
                            }}>
                              {log.model === 'Lead' ? <Assignment sx={{ fontSize: 18 }} /> : (log.model === 'Payment' ? <Payments sx={{ fontSize: 18 }} /> : <History sx={{ fontSize: 18 }} />)}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="body1" fontWeight={700} sx={{ color: "#fff", lineHeight: 1.4 }}>{log.description}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", minWidth: 100, textAlign: "right", fontWeight: 600 }}>{dayjs(log.timestamp).fromNow()}</Typography>
                              </Box>
                            }
                            secondary={
                              <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} mt={1.5}>
                                <Chip label={log.model} size="small" sx={{ 
                                  bgcolor: log.model === 'Lead' ? 'rgba(59,130,246,0.1)' : (log.model === 'Payment' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'),
                                  color: log.model === 'Lead' ? '#3b82f6' : (log.model === 'Payment' ? '#10b981' : 'rgba(255,255,255,0.6)'),
                                  height: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", borderRadius: 1 
                                }} />
                                <Chip label={log.action} size="small" sx={{ 
                                  bgcolor: log.action === 'CREATE' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', 
                                  color: log.action === 'CREATE' ? '#10b981' : '#3b82f6',
                                  height: 20, fontSize: 10, fontWeight: 900, borderRadius: 1 
                                }} />
                                {log.user && (
                                  <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: "rgba(59,130,246,0.15)", p: "2px 10px", borderRadius: 1.5 }}>
                                    <Avatar sx={{ width: 14, height: 14, fontSize: 8, bgcolor: "#3b82f6" }}>{log.user[0]}</Avatar>
                                    <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 800 }}>{log.user}</Typography>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Box textAlign="center" py={10}>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.3)" }}>No activity recorded for this filter.</Typography>
                      </Box>
                    )}
                  </List>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>

        {/* Dialogs */}
        <Dialog 
          open={reminderDialogOpen} 
          onClose={() => setReminderDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: 5, background: "#1e293b", color: "#fff", width: "100%", maxWidth: 500 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, p: 3, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Add Action Item</DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box display="flex" flexDirection="column" gap={3} mt={2}>
              <TextField 
                fullWidth 
                label="What needs to be done?" 
                variant="filled" 
                value={newReminderData.title}
                onChange={(e) => setNewReminderData({ ...newReminderData, title: e.target.value })}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.5)" } }} 
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth variant="filled" sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                    <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Type</InputLabel>
                    <Select 
                      value={newReminderData.type}
                      onChange={(e) => setNewReminderData({ ...newReminderData, type: e.target.value })}
                      sx={{ color: "#fff" }}
                    >
                      <MenuItem value="reminder">Reminder</MenuItem>
                      <MenuItem value="appointment">Appointment</MenuItem>
                      <MenuItem value="task">Task</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth variant="filled" sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                    <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Priority</InputLabel>
                    <Select 
                      value={newReminderData.priority}
                      onChange={(e) => setNewReminderData({ ...newReminderData, priority: e.target.value })}
                      sx={{ color: "#fff" }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <DateTimePicker
                label="Date & Time"
                value={newReminderData.dateTime}
                onChange={(newValue) => setNewReminderData({ ...newReminderData, dateTime: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth variant="filled" sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, input: { color: "#fff" }, label: { color: "rgba(255,255,255,0.5)" } }} />}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Button onClick={() => setReminderDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateReminder} sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}>Create Item</Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
