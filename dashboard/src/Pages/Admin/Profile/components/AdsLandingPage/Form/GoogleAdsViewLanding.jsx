// src/components/ViewLandingPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  CircularProgress,
  IconButton
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SecurityIcon from "@mui/icons-material/Security";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";

import {
  fetchLandingPageById,
  clearCurrentPage,
} from "../../../../../../features/landingPage/landingPageSlice";

// Styled component for read-only text fields
const ReadOnlyTextField = ({ label, value, multiline = false, rows = 1 }) => (
  <TextField
    fullWidth
    label={label}
    value={value || ""}
    InputProps={{
      readOnly: true,
    }}
    variant="outlined"
    multiline={multiline}
    rows={rows}
    sx={{
      "& .MuiInputBase-input": {
        backgroundColor: "#f5f5f5",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#e0e0e0",
      }
    }}
  />
);

const ReadOnlySelect = ({ label, value, options = [] }) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select
      value={value || ""}
      label={label}
      inputProps={{ readOnly: true }}
      sx={{
        "& .MuiSelect-select": {
          backgroundColor: "#f5f5f5",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#e0e0e0",
        }
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const ReadOnlySlider = ({ label, value }) => (
  <Box>
    <Typography gutterBottom>{label}</Typography>
    <Slider
      value={value || 0.65}
      step={0.1}
      marks
      min={0}
      max={1}
      valueLabelDisplay="auto"
      disabled
    />
  </Box>
);

const ImagePreview = ({ src, alt, label }) => {
  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (image?.url) return image.url;
    return null;
  };

  const imageUrl = getImageUrl(src);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}:
      </Typography>
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          sx={{
            width: "100%",
            maxHeight: 200,
            objectFit: "cover",
            borderRadius: 1,
            border: "1px solid #e0e0e0"
          }}
        />
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            bgcolor: "#f5f5f5",
            borderStyle: "dashed"
          }}
        >
          <ImageIcon sx={{ color: "#bdbdbd", mr: 1 }} />
          <Typography color="text.secondary">No image uploaded</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default function ViewLandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  
  const { page, loading, error } = useSelector((state) => state.landingPages);

  useEffect(() => {
    if (id) {
      dispatch(fetchLandingPageById(id));
    }
    
    return () => {
      dispatch(clearCurrentPage());
    };
  }, [id, dispatch]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/googleadseditform/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Landing page not found
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Go Back
        </Button>
      </Container>
    );
  }

  // Destructure page data
  const data = page;
  
  // Default empty values for arrays
  const overviewSections = data.overviewSections || [];
  const solutionItems = data.solutionItems || [];
  const packageFeatures = data.packageFeatures || [];
  const whyChooseReasons = data.whyChooseReasons || [];
  const workProcessSteps = data.workProcessSteps || [];
  const faqQuestions = data.faqQuestions || [];
  const ownPackageFeatures = data.ownPackageFeatures || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back and Edit Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Page
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary" sx={{ fontWeight: 700, mb: 3 }}>
          Landing Page Preview
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This is a read-only view of your landing page data. Click the Edit button to make changes.
        </Alert>

        <Stack spacing={4}>
          {/* ========== SLUG FIELD ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              🔗 Page Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Page Slug"
                  value={data.slug}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  This slug is used for the page URL: /landing-pages/{data.slug || "[slug]"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyTextField
                  label="Created At"
                  value={data.createdAt ? new Date(data.createdAt).toLocaleString() : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyTextField
                  label="Last Updated"
                  value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <Chip 
                  label={data.isActive ? "Active" : "Inactive"} 
                  color={data.isActive ? "success" : "default"}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ========== HEADER SECTION ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              📋 Header Section
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Header Description"
                  value={data.headerDescription}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ========== HERO SECTION ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              🎯 Hero Section
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ImagePreview 
                  src={data.heroBackgroundImage} 
                  alt="Hero Background" 
                  label="Hero Background Image"
                />
              </Grid>

              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Hero Title"
                  value={data.heroTitle}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Hero Description"
                  value={data.heroDescription}
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ReadOnlyTextField
                  label="Button Text"
                  value={data.heroButtonText}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ReadOnlySlider
                  label="Overlay Opacity"
                  value={data.heroOverlayOpacity}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ========== OVERVIEW SECTIONS ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              📝 Overview Sections {overviewSections.length > 0 && `(${overviewSections.length})`}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {overviewSections.length === 0 ? (
              <Alert severity="info">No overview sections added</Alert>
            ) : (
              <Grid container spacing={3}>
                {overviewSections.map((section, index) => (
                  <Grid item xs={12} key={section._id || index}>
                    <Card variant="outlined" sx={{ bgcolor: "white" }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Overview Section {index + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <ImagePreview 
                              src={section.overviewImage} 
                              alt={section.overviewTitle}
                              label="Overview Icon"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <ReadOnlyTextField
                              label="Overview Title"
                              value={section.overviewTitle}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <ReadOnlyTextField
                              label="Overview Description"
                              value={section.overviewDescription}
                              multiline
                              rows={3}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <ReadOnlyTextField
                              label="Get Free Quote Button"
                              value={section.overviewGetFreeQuoteButton}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <ReadOnlyTextField
                              label="Chat With Us Button"
                              value={section.overviewChatWithUsButton}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* ========== OWN PACKAGE SECTION ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              ✨ Customize Your Own Package
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ImagePreview 
                  src={data.ownPackageImage} 
                  alt={data.ownPackageTitle}
                  label="Own Package Image"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ReadOnlyTextField
                  label="Section Title"
                  value={data.ownPackageTitle}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ReadOnlyTextField
                  label="Section Description"
                  value={data.ownPackageDescription}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Features:
                </Typography>
                {ownPackageFeatures.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No features added
                  </Typography>
                ) : (
                  <List sx={{ bgcolor: "white", borderRadius: 1 }}>
                    {ownPackageFeatures.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* ========== SOLUTIONS SECTION ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              💡 Travel Solutions
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Section Title"
                  value={data.solutionTitle}
                />
              </Grid>

              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Section Description"
                  value={data.solutionDescription}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Solution Items:
                </Typography>
                {solutionItems.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No solutions added
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {solutionItems.map((item) => (
                      <Grid item xs={12} md={4} key={item._id}>
                        <Card sx={{ height: "100%" }}>
                          <CardContent>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                              {item.icon ? (
                                <Avatar src={item.icon.url} sx={{ width: 60, height: 60, mb: 2 }} />
                              ) : (
                                <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: "grey.300" }}>
                                  <MiscellaneousServicesIcon />
                                </Avatar>
                              )}
                              <Typography variant="h6" gutterBottom>{item.title || "Untitled"}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.description || "No description"}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* ========== PACKAGE FEATURES ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              ⭐ Package Features
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Section Title"
                  value={data.packageFeaturesTitle}
                />
              </Grid>

              <Grid item xs={12}>
                {packageFeatures.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No package features added
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {packageFeatures.map((feature) => (
                      <Grid item xs={12} md={6} key={feature._id}>
                        <Card variant="outlined" sx={{ height: "100%" }}>
                          <CardContent>
                            <Box sx={{ display: "flex", gap: 2 }}>
                              {feature.icon ? (
                                <Avatar src={feature.icon.url} variant="rounded" sx={{ width: 50, height: 50 }} />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 50, height: 50, bgcolor: "grey.300" }}>
                                  <MiscellaneousServicesIcon />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {feature.title || "Untitled"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {feature.description || "No description"}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* ========== WHY CHOOSE US ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              ❓ Why Choose Us
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ImagePreview 
                  src={data.whyChooseBannerImage} 
                  alt="Why Choose Us Banner"
                  label="Banner Image"
                />
              </Grid>

              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Section Title"
                  value={data.whyChooseTitle}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Reasons:
                </Typography>
                {whyChooseReasons.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No reasons added
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {whyChooseReasons.map((reason) => (
                      <Grid item xs={12} sm={6} key={reason._id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {reason.title || "Untitled"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reason.description || "No description"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* ========== WORK PROCESS ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              🔄 Work Process
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="Section Title"
                  value={data.workProcessTitle}
                />
              </Grid>

              <Grid item xs={12}>
                {workProcessSteps.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No work process steps added
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {workProcessSteps.map((step) => (
                      <Grid item xs={12} sm={6} md={3} key={step._id}>
                        <Card sx={{ height: "100%", textAlign: "center" }}>
                          <CardContent>
                            <Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50, mx: "auto", mb: 2 }}>
                              {step.step || "?"}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {step.title || "Untitled"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {step.description || "No description"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* ========== FREQUENTLY ASKED QUESTIONS ========== */}
          <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              ❓ Frequently Asked Questions
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReadOnlyTextField
                  label="FAQ Title"
                  value={data.faqTitle}
                />
              </Grid>

              <Grid item xs={12}>
                {faqQuestions.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    No FAQs added
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {faqQuestions.map((item) => (
                      <Card key={item._id} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Q: {item.question || "No question"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            A: {item.answer || "No answer"}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Form Metadata */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>Slug:</strong> {data.slug || "Not set"} | 
              <strong> Status:</strong> {data.isActive ? "Active" : "Inactive"} |
              <strong> Created:</strong> {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A"}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}