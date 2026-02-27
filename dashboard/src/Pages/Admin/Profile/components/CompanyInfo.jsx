import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Divider,
  Avatar,
  Button,
  Container,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  alpha,
  useTheme,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import LockIcon from "@mui/icons-material/Lock";
import MailIcon from "@mui/icons-material/Mail";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GavelIcon from "@mui/icons-material/Gavel";
import WorkIcon from "@mui/icons-material/Work";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import QrCodeIcon from "@mui/icons-material/QrCode";
import InfoIcon from "@mui/icons-material/Info";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";

import { useDispatch, useSelector } from "react-redux";
import {
  getCompany,
  upsertCompany,
} from "../../../../features/companyUI/companyUISlice";

const CompanyProfile = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { data: company, status } = useSelector(
    (state) => state.companyUI
  );
  const companyData = company?.company;
  const [selected, setSelected] = useState("Company Profile");
  const [createDialog, setCreateDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [editDialog, setEditDialog] = useState({
    open: false,
    field: "",
    value: "",
  });

  useEffect(() => {
    dispatch(getCompany());
  }, [dispatch]);

  const menuItems = [
    { text: "Company Profile", icon: <BusinessIcon />, color: "#1976d2" },
    { text: "Access & Permission", icon: <LockIcon />, color: "#388e3c" },
    { text: "Email Notification", icon: <MailIcon />, color: "#f57c00" },
    { text: "Account & Billing", icon: <AccountBalanceIcon />, color: "#7b1fa2" },
    { text: "Banking & Status", icon: <AccountBalanceIcon />, color: "#d32f2f" },
    { text: "Terms & Condition", icon: <GavelIcon />, color: "#0288d1" },
    { text: "Package", icon: <WorkIcon />, color: "#00796b" },
  ];

  const displayFields = [
    { key: "companyName", icon: <BusinessIcon />, label: "Company Name" },
    { key: "contactPerson", icon: <PersonIcon />, label: "Contact Person" },
    { key: "call", icon: <PhoneIcon />, label: "Phone" },
    { key: "support", icon: <PhoneIcon />, label: "Support" },
    { key: "email", icon: <EmailIcon />, label: "Email" },
    { key: "address", icon: <LocationOnIcon />, label: "Address" },
    { key: "website", icon: <LanguageIcon />, label: "Website" },
    { key: "gst", icon: <InfoIcon />, label: "GST" },
    { key: "about", icon: <DescriptionIcon />, label: "About" },
    { key: "note", icon: <DescriptionIcon />, label: "Note" },
    { key: "invoiceTerms", icon: <DescriptionIcon />, label: "Invoice Terms" },
    { key: "pdfFooter", icon: <DescriptionIcon />, label: "PDF Footer" },
    { key: "currency", icon: <AttachMoneyIcon />, label: "Currency" },
  ];

  const imageFields = [
    { key: "headerLogo", label: "Header Logo" },
    { key: "footerLogo", label: "Footer Logo" },
    { key: "signature", label: "Signature" },
  ];

  const [qrInputs, setQrInputs] = useState([
    { name: "", color: "#1976d2", file: null, preview: null },
  ]);
  const [testimonialInputs, setTestimonialInputs] = useState([
    { name: "", address: "", words: "", file: null, preview: null },
  ]);
  const [teamInputs, setTeamInputs] = useState([
    { name: "", designation: "", description: "", file: null, preview: null },
  ]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingQR, setEditingQR] = useState(null);

  const formatLabel = (text) =>
    text
      .replace("stats.", "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

  // ============================
  // CREATE COMPANY
  // ============================
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    const formData = new FormData();
    formData.append("companyName", newCompanyName);

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());
    setCreateDialog(false);
    setNewCompanyName("");
  };

  // ============================
  // EDIT TEXT / STATS
  // ============================
  const handleEditSave = async () => {
    const formData = new FormData();

    if (editDialog.field.startsWith("stats.")) {
      const statKey = editDialog.field.split(".")[1];
      formData.append(`stats[${statKey}]`, editDialog.value);
    } else {
      formData.append(editDialog.field, editDialog.value);
    }

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setEditDialog({ open: false, field: "", value: "" });
  };

  // ============================
  // IMAGE UPLOAD
  // ============================
  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(field, file);

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());
  };

  // ============================
  // QR CODES FUNCTIONS
  // ============================
  
  // DELETE QR code
  const handleDeleteQR = async (index) => {
    const updatedQRCodes = [...companyData.qrCodes];
    updatedQRCodes.splice(index, 1);

    const formData = new FormData();
    formData.append("qrCodes", JSON.stringify(updatedQRCodes));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());
  };

  // SAVE edited QR code
  const handleSaveEditedQR = async (index) => {
    const updatedQRCodes = [...companyData.qrCodes];
    updatedQRCodes[index] = {
      ...updatedQRCodes[index],
      name: editingQR.name,
      color: editingQR.color,
    };

    const formData = new FormData();
    formData.append("qrCodes", JSON.stringify(updatedQRCodes));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setEditingQR(null);
  };

  // Add new QR row
  const addQrField = () => {
    setQrInputs([...qrInputs, { name: "", color: "#1976d2", file: null, preview: null }]);
  };

  // Handle QR input change
  const handleQrChange = (index, key, value) => {
    const updated = [...qrInputs];
    
    if (key === 'file' && value) {
      updated[index][key] = value;
      updated[index].preview = URL.createObjectURL(value);
    } else {
      updated[index][key] = value;
    }
    
    setQrInputs(updated);
  };

  // Upload Multiple QR
  const handleQrUpload = async () => {
    const formData = new FormData();

    qrInputs.forEach((qr) => {
      if (qr.file) {
        formData.append("qrCodes", qr.file);
        formData.append("qrNames[]", qr.name);
        formData.append("qrColors[]", qr.color);
      }
    });

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    // reset
    setQrInputs([{ name: "", color: "#1976d2", file: null, preview: null }]);
  };
  
  // ============================
  // TESTIMONIALS FUNCTIONS
  // ============================
  
  const handleTestimonialChange = (index, key, value) => {
    const updated = [...testimonialInputs];

    if (key === "file" && value) {
      updated[index][key] = value;
      updated[index].preview = URL.createObjectURL(value);
    } else {
      updated[index][key] = value;
    }

    setTestimonialInputs(updated);
  };
  
  const handleTestimonialUpload = async () => {
    const formData = new FormData();

    testimonialInputs.forEach((t) => {
      if (t.file) {
        formData.append("testimonialPhotos", t.file);
        formData.append("testimonialNames[]", t.name);
        formData.append("testimonialAddresses[]", t.address);
        formData.append("testimonialWords[]", t.words);
      }
    });

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setTestimonialInputs([
      { name: "", address: "", words: "", file: null, preview: null },
    ]);
  };
  
  // DELETE testimonial
  const handleDeleteExistingTestimonial = async (index) => {
    const updatedTestimonials = [...companyData.testimonials];
    updatedTestimonials.splice(index, 1);

    const formData = new FormData();
    formData.append("testimonials", JSON.stringify(updatedTestimonials));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());
  };

  // SAVE edited testimonial
  const handleSaveExistingTestimonial = async (index) => {
    const updatedTestimonials = [...companyData.testimonials];
    updatedTestimonials[index] = editingTestimonial;

    const formData = new FormData();
    formData.append("testimonials", JSON.stringify(updatedTestimonials));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setEditingTestimonial(null);
  };

  const addTestimonialField = () => {
    setTestimonialInputs([
      ...testimonialInputs,
      { name: "", address: "", words: "", file: null, preview: null },
    ]);
  };

  // ============================
  // TEAM MEMBERS FUNCTIONS
  // ============================
  
  const handleTeamChange = (index, key, value) => {
    const updated = [...teamInputs];

    if (key === "file" && value) {
      updated[index][key] = value;
      updated[index].preview = URL.createObjectURL(value);
    } else {
      updated[index][key] = value;
    }

    setTeamInputs(updated);
  };

  const handleTeamUpload = async () => {
    const formData = new FormData();

    teamInputs.forEach((member) => {
      if (member.file) {
        formData.append("teamPhotos", member.file);
        formData.append("teamNames[]", member.name);
        formData.append("teamDesignations[]", member.designation);
        formData.append("teamDescriptions[]", member.description);
      }
    });

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setTeamInputs([
      { name: "", designation: "", description: "", file: null, preview: null },
    ]);
  };

  // DELETE team member
  const handleDeleteExistingTeam = async (index) => {
    const updatedTeam = [...companyData.ourTeam];
    updatedTeam.splice(index, 1);

    const formData = new FormData();
    formData.append("ourTeam", JSON.stringify(updatedTeam));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());
  };

  // SAVE edited team member
  const handleSaveExistingTeam = async (index) => {
    const updatedTeam = [...companyData.ourTeam];
    updatedTeam[index] = editingTeam;

    const formData = new FormData();
    formData.append("ourTeam", JSON.stringify(updatedTeam));

    await dispatch(upsertCompany(formData));
    dispatch(getCompany());

    setEditingTeam(null);
  };

  const addTeamField = () => {
    setTeamInputs([
      ...teamInputs,
      { name: "", designation: "", description: "", file: null, preview: null },
    ]);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: theme.palette.primary.main }}>
              Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ '& .MuiListItemButton-root': { borderRadius: 2, mb: 0.5 } }}>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  selected={selected === item.text}
                  onClick={() => setSelected(item.text)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: alpha(item.color, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(item.color, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: item.color,
                      },
                      '& .MuiListItemText-primary': {
                        color: item.color,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: selected === item.text ? item.color : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 3,
              minHeight: "85vh",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pb: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
                {selected}
              </Typography>
              {companyData && selected === "Company Profile" && (
                <Chip 
                  label="Active" 
                  size="small" 
                  color="success" 
                  sx={{ ml: 2, borderRadius: 1 }}
                />
              )}
            </Box>

            {status === "loading" && (
              <Box textAlign="center" mt={5}>
                <CircularProgress />
              </Box>
            )}

            {/* No Company */}
            {selected === "Company Profile" &&
              status !== "loading" &&
              !companyData && (
                <Box 
                  textAlign="center" 
                  mt={6}
                  sx={{
                    p: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                  <Typography variant="h6" mb={2} color="textSecondary">
                    No Company Added Yet
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setCreateDialog(true)}
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, px: 4, py: 1 }}
                  >
                    Add Company
                  </Button>
                </Box>
              )}

            {/* Company Data */}
            {selected === "Company Profile" &&
              companyData &&
              status !== "loading" && (
                <>
                  {/* Basic Info Card */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 4, 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Basic Information
                      </Typography>

                      <Grid container spacing={2}>
                        {displayFields.map((field) => (
                          <Grid item xs={12} key={field.key}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                                <Box sx={{ color: theme.palette.primary.main, mr: 1 }}>
                                  {field.icon}
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                  {field.label}:
                                </Typography>
                              </Box>

                              <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                {companyData?.[field.key] || '-'}
                              </Typography>

                              <IconButton
                                size="small"
                                onClick={() =>
                                  setEditDialog({
                                    open: true,
                                    field: field.key,
                                    value: companyData?.[field.key] || "",
                                  })
                                }
                                sx={{
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  {/* Testimonials Section */}
                  <Card
                    elevation={0}
                    sx={{
                      mb: 4,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        mb={3}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonIcon color="primary" />
                        Testimonials
                      </Typography>

                      {/* Existing Testimonials */}
                      <Grid container spacing={2} mb={4}>
                        {companyData?.testimonials?.map((t, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card
                              elevation={0}
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 2,
                                position: "relative",
                              }}
                            >
                              {/* DELETE BUTTON */}
                              <IconButton
                                size="small"
                                color="error"
                                sx={{ position: "absolute", top: 5, right: 5 }}
                                onClick={() =>
                                  handleDeleteExistingTestimonial(index)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>

                              {editingTestimonial &&
                              editingTestimonial.index === index ? (
                                <>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Name"
                                    sx={{ mb: 1 }}
                                    value={editingTestimonial.name}
                                    onChange={(e) =>
                                      setEditingTestimonial({
                                        ...editingTestimonial,
                                        name: e.target.value,
                                      })
                                    }
                                  />

                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Address"
                                    sx={{ mb: 1 }}
                                    value={editingTestimonial.address}
                                    onChange={(e) =>
                                      setEditingTestimonial({
                                        ...editingTestimonial,
                                        address: e.target.value,
                                      })
                                    }
                                  />

                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    label="Words"
                                    sx={{ mb: 2 }}
                                    value={editingTestimonial.words}
                                    onChange={(e) =>
                                      setEditingTestimonial({
                                        ...editingTestimonial,
                                        words: e.target.value,
                                      })
                                    }
                                  />

                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() =>
                                      handleSaveExistingTestimonial(index)
                                    }
                                    sx={{ mr: 1 }}
                                  >
                                    Save
                                  </Button>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      setEditingTestimonial(null)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Avatar
                                    src={t.photo?.url}
                                    sx={{ width: 70, height: 70, mb: 2 }}
                                  />
                                  <Typography fontWeight={600}>
                                    {t.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {t.address}
                                  </Typography>
                                  <Typography variant="body2" mt={1}>
                                    {t.words}
                                  </Typography>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() =>
                                      setEditingTestimonial({
                                        ...t,
                                        index,
                                      })
                                    }
                                  >
                                    Edit
                                  </Button>
                                </>
                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Add New Testimonials */}
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Add New Testimonials
                      </Typography>

                      {testimonialInputs.map((t, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: 2,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            {/* Name */}
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Name"
                                value={t.name}
                                onChange={(e) =>
                                  handleTestimonialChange(index, "name", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Address */}
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Address"
                                value={t.address}
                                onChange={(e) =>
                                  handleTestimonialChange(index, "address", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Words */}
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                label="Words"
                                value={t.words}
                                onChange={(e) =>
                                  handleTestimonialChange(index, "words", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Upload + Preview */}
                            <Grid
                              item
                              xs={12}
                              md={2}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 90,
                              }}
                            >
                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                fullWidth
                                startIcon={<ImageIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Upload
                                <input
                                  hidden
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleTestimonialChange(
                                      index,
                                      "file",
                                      e.target.files[0]
                                    )
                                  }
                                />
                              </Button>

                              <Box sx={{ height: 60, mt: 1 }}>
                                {t.preview && (
                                  <Avatar
                                    src={t.preview}
                                    sx={{ width: 50, height: 50 }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}

                      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={addTestimonialField}
                          startIcon={<AddIcon />}
                        >
                          Add Another
                        </Button>

                        <Button
                          variant="contained"
                          onClick={handleTestimonialUpload}
                          startIcon={<SaveIcon />}
                        >
                          Save Testimonials
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                      
                  {/* Vision & Mission Section */}
                  <Card
                    elevation={0}
                    sx={{
                      mb: 4,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        mb={3}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <InfoIcon color="primary" />
                        Vision & Mission
                      </Typography>

                      {/* Vision */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          borderRadius: 2,
                          position: "relative",
                        }}
                      >
                        <Typography fontWeight={600}>Our Vision</Typography>
                        <Typography variant="body2" mt={1}>
                          {companyData?.ourVision || "-"}
                        </Typography>

                        <IconButton
                          size="small"
                          sx={{ position: "absolute", top: 5, right: 5 }}
                          onClick={() =>
                            setEditDialog({
                              open: true,
                              field: "ourVision",
                              value: companyData?.ourVision || "",
                            })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Paper>

                      {/* Mission */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          borderRadius: 2,
                          position: "relative",
                        }}
                      >
                        <Typography fontWeight={600}>Our Mission</Typography>
                        <Typography variant="body2" mt={1}>
                          {companyData?.ourMission || "-"}
                        </Typography>

                        <IconButton
                          size="small"
                          sx={{ position: "absolute", top: 5, right: 5 }}
                          onClick={() =>
                            setEditDialog({
                              open: true,
                              field: "ourMission",
                              value: companyData?.ourMission || "",
                            })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    </CardContent>
                  </Card>

                  {/* Our Team Section */}
                  <Card
                    elevation={0}
                    sx={{
                      mb: 4,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        mb={3}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GroupIcon color="primary" />
                        Our Team
                      </Typography>

                      {/* Existing Team Members */}
                      <Grid container spacing={2} mb={4}>
                        {companyData?.ourTeam?.map((member, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card
                              elevation={0}
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 2,
                                position: "relative",
                              }}
                            >
                              {/* DELETE BUTTON */}
                              <IconButton
                                size="small"
                                color="error"
                                sx={{ position: "absolute", top: 5, right: 5 }}
                                onClick={() =>
                                  handleDeleteExistingTeam(index)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>

                              {editingTeam &&
                              editingTeam.index === index ? (
                                <>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Name"
                                    sx={{ mb: 1 }}
                                    value={editingTeam.name}
                                    onChange={(e) =>
                                      setEditingTeam({
                                        ...editingTeam,
                                        name: e.target.value,
                                      })
                                    }
                                  />

                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Designation"
                                    sx={{ mb: 1 }}
                                    value={editingTeam.designation}
                                    onChange={(e) =>
                                      setEditingTeam({
                                        ...editingTeam,
                                        designation: e.target.value,
                                      })
                                    }
                                  />

                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    label="Description"
                                    sx={{ mb: 2 }}
                                    value={editingTeam.description}
                                    onChange={(e) =>
                                      setEditingTeam({
                                        ...editingTeam,
                                        description: e.target.value,
                                      })
                                    }
                                  />

                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() =>
                                      handleSaveExistingTeam(index)
                                    }
                                    sx={{ mr: 1 }}
                                  >
                                    Save
                                  </Button>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      setEditingTeam(null)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Avatar
                                    src={member.photo?.url}
                                    sx={{ width: 70, height: 70, mb: 2 }}
                                  />
                                  <Typography fontWeight={600}>
                                    {member.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="primary"
                                    fontWeight={500}
                                  >
                                    {member.designation}
                                  </Typography>
                                  <Typography variant="body2" mt={1}>
                                    {member.description}
                                  </Typography>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() =>
                                      setEditingTeam({
                                        ...member,
                                        index,
                                      })
                                    }
                                  >
                                    Edit
                                  </Button>
                                </>
                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Add New Team Members */}
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Add New Team Members
                      </Typography>

                      {teamInputs.map((member, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: 2,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            {/* Name */}
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Name"
                                value={member.name}
                                onChange={(e) =>
                                  handleTeamChange(index, "name", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Designation */}
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Designation"
                                value={member.designation}
                                onChange={(e) =>
                                  handleTeamChange(index, "designation", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Description */}
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                label="Description"
                                value={member.description}
                                onChange={(e) =>
                                  handleTeamChange(index, "description", e.target.value)
                                }
                              />
                            </Grid>

                            {/* Upload + Preview */}
                            <Grid
                              item
                              xs={12}
                              md={2}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 90,
                              }}
                            >
                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                fullWidth
                                startIcon={<ImageIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Upload
                                <input
                                  hidden
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleTeamChange(
                                      index,
                                      "file",
                                      e.target.files[0]
                                    )
                                  }
                                />
                              </Button>

                              <Box sx={{ height: 60, mt: 1 }}>
                                {member.preview && (
                                  <Avatar
                                    src={member.preview}
                                    sx={{ width: 50, height: 50 }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}

                      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={addTeamField}
                          startIcon={<AddIcon />}
                        >
                          Add Another Member
                        </Button>

                        <Button
                          variant="contained"
                          onClick={handleTeamUpload}
                          startIcon={<SaveIcon />}
                        >
                          Save Team Members
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Images */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 4, 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ImageIcon color="primary" />
                        Company Assets
                      </Typography>

                      <Grid container spacing={3}>
                        {imageFields.map((field) => (
                          <Grid item xs={12} sm={6} md={4} key={field.key}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                p: 2, 
                                textAlign: "center",
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[4],
                                },
                              }}
                            >
                              <Typography fontWeight={600} mb={2} color="primary">
                                {field.label}
                              </Typography>

                              {companyData?.[field.key]?.url ? (
                                <Avatar
                                  src={companyData[field.key].url}
                                  variant="rounded"
                                  sx={{
                                    width: 120,
                                    height: 120,
                                    mx: "auto",
                                    mb: 2,
                                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 120,
                                    height: 120,
                                    mx: "auto",
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 2,
                                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                                  }}
                                >
                                  <ImageIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.3) }} />
                                </Box>
                              )}

                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<ImageIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Upload
                                <input
                                  hidden
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, field.key)}
                                />
                              </Button>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* QR Codes Section */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 4, 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QrCodeIcon color="primary" />
                        QR Codes
                      </Typography>

                      {/* Existing QR Codes */}
                      <Grid container spacing={2} mb={4}>
                        {companyData?.qrCodes?.map((qr, index) => (
                          <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card
                              elevation={0}
                              sx={{
                                p: 2,
                                textAlign: "center",
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: 2,
                                position: "relative",
                                transition: "all 0.2s",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  boxShadow: theme.shadows[4],
                                },
                              }}
                            >
                              {/* DELETE BUTTON */}
                              <IconButton
                                size="small"
                                color="error"
                                sx={{ position: "absolute", top: 5, right: 5 }}
                                onClick={() => handleDeleteQR(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>

                              {editingQR && editingQR.index === index ? (
                                <>
                                  {/* EDIT MODE */}
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="QR Name"
                                    value={editingQR.name}
                                    sx={{ mb: 1 }}
                                    onChange={(e) =>
                                      setEditingQR({
                                        ...editingQR,
                                        name: e.target.value,
                                      })
                                    }
                                  />

                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="color"
                                    label="Color"
                                    value={editingQR.color}
                                    onChange={(e) =>
                                      setEditingQR({
                                        ...editingQR,
                                        color: e.target.value,
                                      })
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ mb: 2 }}
                                  />

                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleSaveEditedQR(index)}
                                    sx={{ mr: 1 }}
                                  >
                                    Save
                                  </Button>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setEditingQR(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {/* VIEW MODE */}
                                  <Typography fontWeight={600} color="primary" gutterBottom>
                                    {qr.name}
                                  </Typography>

                                  <Avatar
                                    src={qr.url}
                                    variant="rounded"
                                    sx={{
                                      width: 120,
                                      height: 120,
                                      mx: "auto",
                                      my: 1,
                                      border: `2px solid ${qr.color}`,
                                    }}
                                  />

                                  <Box
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      backgroundColor: qr.color,
                                      borderRadius: "50%",
                                      mx: "auto",
                                      mt: 1,
                                      border: `2px solid ${alpha(
                                        theme.palette.common.white,
                                        0.5
                                      )}`,
                                      boxShadow: theme.shadows[2],
                                    }}
                                  />

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    onClick={() =>
                                      setEditingQR({
                                        index,
                                        name: qr.name,
                                        color: qr.color,
                                      })
                                    }
                                  >
                                    Edit
                                  </Button>
                                </>
                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Add New QR */}
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Add New QR Codes
                      </Typography>

                      {qrInputs.map((qr, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: 2,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="QR Name"
                                value={qr.name}
                                onChange={(e) => handleQrChange(index, "name", e.target.value)}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                type="color"
                                label="Color"
                                value={qr.color}
                                onChange={(e) => handleQrChange(index, "color", e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <Button 
                                variant="outlined" 
                                component="label" 
                                fullWidth
                                startIcon={<ImageIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Upload QR
                                <input
                                  hidden
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleQrChange(index, "file", e.target.files[0])}
                                />
                              </Button>
                            </Grid>

                            {qr.preview && (
                              <Grid item xs={12} sm={2}>
                                <Avatar
                                  src={qr.preview}
                                  variant="rounded"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    border: `2px solid ${theme.palette.primary.main}`,
                                  }}
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      ))}

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="text"
                          onClick={addQrField}
                          startIcon={<AddIcon />}
                          sx={{ borderRadius: 2 }}
                        >
                          Add Another QR
                        </Button>

                        <Button
                          variant="contained"
                          onClick={handleQrUpload}
                          startIcon={<SaveIcon />}
                          sx={{ borderRadius: 2 }}
                        >
                          Save QR Codes
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon color="primary" />
                        Team Statistics
                      </Typography>

                      <Grid container spacing={2}>
                        {companyData?.stats &&
                          Object.entries(companyData.stats).map(([key, value]) => (
                            <Grid item xs={6} sm={4} md={3} key={key}>
                              <Card 
                                elevation={0}
                                sx={{ 
                                  p: 2,
                                  textAlign: "center",
                                  position: "relative",
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                  borderRadius: 2,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                  },
                                }}
                              >
                                <Typography variant="h5" fontWeight={700} color="primary">
                                  {value}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {formatLabel(key)}
                                </Typography>

                                <IconButton
                                  size="small"
                                  sx={{
                                    position: "absolute",
                                    top: 5,
                                    right: 5,
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                  onClick={() =>
                                    setEditDialog({
                                      open: true,
                                      field: `stats.${key}`,
                                      value,
                                    })
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </>
              )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Dialog */}
      <Dialog 
        open={createDialog} 
        onClose={() => setCreateDialog(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Add New Company
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Company Name"
            margin="normal"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setCreateDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCompany}
            sx={{ borderRadius: 2 }}
          >
            Create Company
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, field: "", value: "" })}
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Edit {formatLabel(editDialog.field)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            value={editDialog.value}
            onChange={(e) => setEditDialog({ ...editDialog, value: e.target.value })}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            multiline={editDialog.field.includes('about') || editDialog.field.includes('note')}
            rows={editDialog.field.includes('about') || editDialog.field.includes('note') ? 4 : 1}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setEditDialog({ open: false, field: "", value: "" })}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditSave}
            sx={{ borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanyProfile;