import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Divider,
  IconButton,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

import {
  fetchLandingPageById,
  updateLandingPage,
  clearLandingState,
  clearCurrentPage
} from "../../../../../../features/landingPage/landingPageSlice";

// Helper function to get image source
const getImageSource = (image) => {
  if (!image) return null;
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  return image; // This is a URL string
};

export default function LandingPageForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL params
  const dispatch = useDispatch();

  const { page, loading, error, updateSuccess } = useSelector(
    (state) => state.landingPages
  );

  const [formData, setFormData] = useState({
    // Header Section
    headerDescription: "",
    
    // Hero Section
    heroBackgroundImage: null,
    heroTitle: "",
    heroDescription: "",
    heroButtonText: "",
    heroOverlayOpacity: 0.65,
    
    // Overview Sections (now an array)
    overviewSections: [
      {
        id: 1,
        overviewTitle: "",
        overviewDescription: "",
        overviewImage: null,
        overviewGetFreeQuoteButton: "",
        overviewChatWithUsButton: "",
      }
    ],
    
    // Own Package Section
    ownPackageTitle: "",
    ownPackageDescription: "",
    ownPackageImage: null,
    ownPackageFeatures: [],
    
    // Solutions Section
    solutionTitle: "",
    solutionDescription: "",
    solutionItems: [],
    
    // Package Features
    packageFeaturesTitle: "",
    packageFeatures: [],
    
    // Why Choose Us
    whyChooseTitle: "",
    whyChooseBannerImage: null,
    whyChooseReasons: [],
    
    // Work Process
    workProcessTitle: "",
    workProcessSteps: [],
    
    // Frequently Asked Questions
    faqTitle: "",
    faqQuestions: [],
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Fetch landing page data when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchLandingPageById(id));
    }

    // Cleanup function
    return () => {
      dispatch(clearCurrentPage());
      dispatch(clearLandingState());
    };
  }, [dispatch, id]);

  // Populate form when page data is fetched
  useEffect(() => {
    if (page && id) {
      // Transform the data to include unique IDs for array items
      const transformedData = {
        headerDescription: page.headerDescription || "",
        
        heroBackgroundImage: page.heroBackgroundImage?.url || null,
        heroTitle: page.heroTitle || "",
        heroDescription: page.heroDescription || "",
        heroButtonText: page.heroButtonText || "",
        heroOverlayOpacity: page.heroOverlayOpacity || 0.65,
        
        overviewSections: page.overviewSections?.length > 0 
          ? page.overviewSections.map((section, index) => ({
              ...section,
              id: section._id || Date.now() + index,
              overviewImage: section.overviewImage?.url || null
            }))
          : [{
              id: 1,
              overviewTitle: "",
              overviewDescription: "",
              overviewImage: null,
              overviewGetFreeQuoteButton: "",
              overviewChatWithUsButton: "",
            }],
        
        ownPackageTitle: page.ownPackageTitle || "",
        ownPackageDescription: page.ownPackageDescription || "",
        ownPackageImage: page.ownPackageImage?.url || null,
        ownPackageFeatures: page.ownPackageFeatures || [],
        
        solutionTitle: page.solutionTitle || "",
        solutionDescription: page.solutionDescription || "",
        solutionItems: page.solutionItems?.map((item, index) => ({
          ...item,
          id: item._id || Date.now() + index,
          icon: item.icon?.url || null
        })) || [],
        
        packageFeaturesTitle: page.packageFeaturesTitle || "",
        packageFeatures: page.packageFeatures?.map((feature, index) => ({
          ...feature,
          id: feature._id || Date.now() + index,
          icon: feature.icon?.url || null
        })) || [],
        
        whyChooseTitle: page.whyChooseTitle || "",
        whyChooseBannerImage: page.whyChooseBannerImage?.url || null,
        whyChooseReasons: page.whyChooseReasons?.map((reason, index) => ({
          ...reason,
          id: reason._id || Date.now() + index
        })) || [],
        
        workProcessTitle: page.workProcessTitle || "",
        workProcessSteps: page.workProcessSteps?.map((step, index) => ({
          ...step,
          id: step._id || Date.now() + index
        })) || [],
        
        faqTitle: page.faqTitle || "",
        faqQuestions: page.faqQuestions?.map((faq, index) => ({
          ...faq,
          id: faq._id || Date.now() + index
        })) || [],
      };
      
      setFormData(transformedData);
    }
  }, [page, id]);

  // Handle update success
  useEffect(() => {
    if (updateSuccess) {
      setSnackbar({
        open: true,
        message: 'Landing page updated successfully!',
        severity: 'success'
      });

      // Navigate back to landing pages list after successful update
      setTimeout(() => {
        navigate('/landing-pages');
      }, 2000);
    }
  }, [updateSuccess, navigate]);

  // Handle error
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please upload an image file',
          severity: 'error'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      // Store the file object directly for FormData
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  // Overview Section handlers
  const handleAddOverviewSection = () => {
    const newId = Date.now();
    setFormData(prev => ({
      ...prev,
      overviewSections: [
        ...prev.overviewSections,
        {
          id: newId,
          overviewTitle: "",
          overviewDescription: "",
          overviewImage: null,
          overviewGetFreeQuoteButton: "",
          overviewChatWithUsButton: "",
        }
      ]
    }));
  };

  const handleUpdateOverviewSection = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      overviewSections: prev.overviewSections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    }));
  };

  const handleRemoveOverviewSection = (id) => {
    if (formData.overviewSections.length <= 1) {
      setSnackbar({
        open: true,
        message: 'You must have at least one overview section',
        severity: 'warning'
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      overviewSections: prev.overviewSections.filter(section => section.id !== id)
    }));
  };

  const handleOverviewImageUpload = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please upload an image file',
          severity: 'error'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        overviewSections: prev.overviewSections.map(section =>
          section.id === id ? { ...section, overviewImage: file } : section
        )
      }));
    }
  };

  // Simple array handlers (for strings)
  const handleAddSimpleArrayItem = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], ""]
    }));
  };

  const handleUpdateSimpleArrayItem = (fieldName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[fieldName]];
      newArray[index] = value;
      return { ...prev, [fieldName]: newArray };
    });
  };

  const handleRemoveSimpleArrayItem = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  // Object array handlers (for packages, solutions, etc.)
  const handleAddObjectArrayItem = (fieldName, template) => {
    const newId = Date.now() + Math.random();
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { ...template, id: newId }]
    }));
  };

  const handleUpdateObjectArrayItem = (fieldName, id, key, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map(item => 
        item.id === id ? { ...item, [key]: value } : item
      )
    }));
  };

  const handleRemoveObjectArrayItem = (fieldName, id) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(item => item.id !== id)
    }));
  };

  const handleObjectArrayImageUpload = (e, fieldName, id, imageField) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please upload an image file',
          severity: 'error'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].map(item => 
          item.id === id ? { ...item, [imageField]: file } : item
        )
      }));
    }
  };

  const validateForm = () => {
    // Add validation logic here if needed
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error'
      });
      return;
    }

    // Create FormData object for multipart/form-data
    const submitData = new FormData();

    // Prepare the data object for JSON stringification
    const jsonData = {
      headerDescription: formData.headerDescription,
      heroTitle: formData.heroTitle,
      heroDescription: formData.heroDescription,
      heroButtonText: formData.heroButtonText,
      heroOverlayOpacity: formData.heroOverlayOpacity,
      
      // Overview Sections - remove image files and temporary IDs
      overviewSections: formData.overviewSections.map(({ id, overviewImage, ...rest }) => {
        // Only include the image URL if it's not a file
        const sectionData = { ...rest };
        if (overviewImage && !(overviewImage instanceof File)) {
          sectionData.overviewImage = overviewImage;
        }
        return sectionData;
      }),
      
      // Own Package
      ownPackageTitle: formData.ownPackageTitle,
      ownPackageDescription: formData.ownPackageDescription,
      ownPackageFeatures: formData.ownPackageFeatures,
      
      // Solutions - remove image files and temporary IDs
      solutionTitle: formData.solutionTitle,
      solutionDescription: formData.solutionDescription,
      solutionItems: formData.solutionItems.map(({ id, icon, ...rest }) => {
        const itemData = { ...rest };
        if (icon && !(icon instanceof File)) {
          itemData.icon = icon;
        }
        return itemData;
      }),
      
      // Package Features - remove image files and temporary IDs
      packageFeaturesTitle: formData.packageFeaturesTitle,
      packageFeatures: formData.packageFeatures.map(({ id, icon, ...rest }) => {
        const featureData = { ...rest };
        if (icon && !(icon instanceof File)) {
          featureData.icon = icon;
        }
        return featureData;
      }),
      
      // Why Choose Us
      whyChooseTitle: formData.whyChooseTitle,
      whyChooseReasons: formData.whyChooseReasons.map(({ id, ...rest }) => rest),
      
      // Work Process
      workProcessTitle: formData.workProcessTitle,
      workProcessSteps: formData.workProcessSteps.map(({ id, ...rest }) => rest),
      
      // FAQs
      faqTitle: formData.faqTitle,
      faqQuestions: formData.faqQuestions.map(({ id, ...rest }) => rest),
    };

    // Append the JSON data
    submitData.append('data', JSON.stringify(jsonData));

    // Append single image files (if they are new files)
    if (formData.heroBackgroundImage instanceof File) {
      submitData.append('heroBackgroundImage', formData.heroBackgroundImage);
    }

    if (formData.ownPackageImage instanceof File) {
      submitData.append('ownPackageImage', formData.ownPackageImage);
    }

    if (formData.whyChooseBannerImage instanceof File) {
      submitData.append('whyChooseBannerImage', formData.whyChooseBannerImage);
    }

    // Append overview section images (as array)
    formData.overviewSections.forEach((section) => {
      if (section.overviewImage instanceof File) {
        submitData.append('overviewImages', section.overviewImage);
      }
    });

    // Append solution icons (as array)
    formData.solutionItems.forEach((item) => {
      if (item.icon instanceof File) {
        submitData.append('solutionIcons', item.icon);
      }
    });

    // Append feature icons (as array)
    formData.packageFeatures.forEach((feature) => {
      if (feature.icon instanceof File) {
        submitData.append('featureIcons', feature.icon);
      }
    });

    // Dispatch update action
    dispatch(updateLandingPage({ id, formData: submitData }));
  };

  const handleRemoveImage = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const handleRemoveArrayImage = (fieldName, id, imageField) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map(item =>
        item.id === id ? { ...item, [imageField]: null } : item
      )
    }));
  };

  const handleCancel = () => {
    navigate('/landing-pages');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
    dispatch(clearLandingState());
  };

  // Show loading state
  if (loading && !page) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading landing page data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
              Edit Landing Page
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your landing page content and settings
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* ========== HEADER SECTION ========== */}
            <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                📋 Header Section
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Header Description"
                    name="headerDescription"
                    value={formData.headerDescription}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    fullWidth
                    required
                    placeholder="Enter header description..."
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
                <Grid size={{ xs: 12 }}>
                  {!formData.heroBackgroundImage ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Upload Hero Background Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "heroBackgroundImage")}
                      />
                    </Button>
                  ) : (
                    <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img
                        src={getImageSource(formData.heroBackgroundImage)}
                        alt="Hero Background"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          objectFit: 'cover',
                          width: '100%'
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveImage("heroBackgroundImage")}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Hero Title"
                    name="heroTitle"
                    value={formData.heroTitle}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    fullWidth
                    required
                    placeholder="Enter main title..."
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Hero Description"
                    name="heroDescription"
                    value={formData.heroDescription}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    fullWidth
                    required
                    placeholder="Enter hero description..."
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Button Text"
                    name="heroButtonText"
                    value={formData.heroButtonText}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    placeholder="e.g., Chat for Package"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Overlay Opacity (0-1)"
                    name="heroOverlayOpacity"
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    value={formData.heroOverlayOpacity}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    helperText="0 = transparent, 1 = solid black"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ========== OVERVIEW SECTIONS ========== */}
            {formData.overviewSections.map((section, index) => (
              <Paper key={section.id} elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa", position: "relative" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600, mb: 0 }}>
                    📝 Overview Section {index + 1}
                  </Typography>
                  {formData.overviewSections.length > 1 && (
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveOverviewSection(section.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Overview Title"
                      value={section.overviewTitle}
                      onChange={(e) => handleUpdateOverviewSection(section.id, "overviewTitle", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Overview Description"
                      value={section.overviewDescription}
                      onChange={(e) => handleUpdateOverviewSection(section.id, "overviewDescription", e.target.value)}
                      multiline
                      rows={4}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    {!section.overviewImage ? (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                      >
                        Upload Overview Icon
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleOverviewImageUpload(e, section.id)}
                        />
                      </Button>
                    ) : (
                      <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        <img
                          src={getImageSource(section.overviewImage)}
                          alt="Overview Icon"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            borderRadius: 8,
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          onClick={() => handleUpdateOverviewSection(section.id, "overviewImage", null)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                          }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Get Free Quote Button Text"
                      value={section.overviewGetFreeQuoteButton}
                      onChange={(e) => handleUpdateOverviewSection(section.id, "overviewGetFreeQuoteButton", e.target.value)}
                      fullWidth
                      required
                      placeholder="Get Free Quote"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Chat With Us Button Text"
                      value={section.overviewChatWithUsButton}
                      onChange={(e) => handleUpdateOverviewSection(section.id, "overviewChatWithUsButton", e.target.value)}
                      fullWidth
                      required
                      placeholder="Chat with Us"
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Add New Overview Section Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={handleAddOverviewSection}
                size="large"
              >
                Add New Overview Section
              </Button>
            </Box>

            {/* ========== OWN PACKAGE SECTION ========== */}
            <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                ✨ Customize Your Own Package
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Section Title"
                    name="ownPackageTitle"
                    value={formData.ownPackageTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Section Description"
                    name="ownPackageDescription"
                    value={formData.ownPackageDescription}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  {!formData.ownPackageImage ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                    >
                      Upload Own Package Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "ownPackageImage")}
                      />
                    </Button>
                  ) : (
                    <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img
                        src={getImageSource(formData.ownPackageImage)}
                        alt="Own Package"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          objectFit: 'cover',
                          width: '100%'
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveImage("ownPackageImage")}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  
                  {formData.ownPackageFeatures.map((feature, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        value={feature}
                        onChange={(e) => handleUpdateSimpleArrayItem("ownPackageFeatures", index, e.target.value)}
                        fullWidth
                        size="small"
                        placeholder={`Feature ${index + 1}`}
                      />
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveSimpleArrayItem("ownPackageFeatures", index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSimpleArrayItem("ownPackageFeatures")}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add Feature
                  </Button>
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Section Title"
                    name="solutionTitle"
                    value={formData.solutionTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Section Description"
                    name="solutionDescription"
                    value={formData.solutionDescription}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    fullWidth
                    required
                    placeholder="Enter section description..."
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Solution Items
                  </Typography>
                  
                  {formData.solutionItems.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          {!item.icon ? (
                            <Button
                              variant="outlined"
                              component="label"
                              size="small"
                              startIcon={<CloudUploadIcon />}
                              fullWidth
                            >
                              Upload Icon
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handleObjectArrayImageUpload(e, "solutionItems", item.id, "icon")}
                              />
                            </Button>
                          ) : (
                            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                              <img
                                src={getImageSource(item.icon)}
                                alt="Solution Icon"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: 100,
                                  borderRadius: 8,
                                  objectFit: 'cover'
                                }}
                              />
                              <IconButton
                                onClick={() => handleUpdateObjectArrayItem("solutionItems", item.id, "icon", null)}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255,255,255,0.8)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                }}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Solution Title"
                            value={item.title || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("solutionItems", item.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Solution Description"
                            value={item.description || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("solutionItems", item.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveObjectArrayItem("solutionItems", item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddObjectArrayItem("solutionItems", { 
                      title: "", 
                      description: "",
                      icon: null 
                    })}
                    variant="outlined"
                    fullWidth
                  >
                    Add Solution
                  </Button>
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Section Title"
                    name="packageFeaturesTitle"
                    value={formData.packageFeaturesTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  
                  {formData.packageFeatures.map((feature) => (
                    <Paper key={feature.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          {!feature.icon ? (
                            <Button
                              variant="outlined"
                              component="label"
                              size="small"
                              startIcon={<CloudUploadIcon />}
                              fullWidth
                            >
                              Upload Feature Icon
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handleObjectArrayImageUpload(e, "packageFeatures", feature.id, "icon")}
                              />
                            </Button>
                          ) : (
                            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                              <img
                                src={getImageSource(feature.icon)}
                                alt="Feature Icon"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: 100,
                                  borderRadius: 8,
                                  objectFit: 'cover'
                                }}
                              />
                              <IconButton
                                onClick={() => handleUpdateObjectArrayItem("packageFeatures", feature.id, "icon", null)}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255,255,255,0.8)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                }}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Feature Title"
                            value={feature.title || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("packageFeatures", feature.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Feature Description"
                            value={feature.description || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("packageFeatures", feature.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveObjectArrayItem("packageFeatures", feature.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddObjectArrayItem("packageFeatures", { 
                      icon: null,
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                  >
                    Add Feature
                  </Button>
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Section Title"
                    name="whyChooseTitle"
                    value={formData.whyChooseTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  {!formData.whyChooseBannerImage ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                    >
                      Upload Banner Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "whyChooseBannerImage")}
                      />
                    </Button>
                  ) : (
                    <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img
                        src={getImageSource(formData.whyChooseBannerImage)}
                        alt="Why Choose Banner"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          borderRadius: 8,
                          objectFit: 'cover',
                          width: '100%'
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveImage("whyChooseBannerImage")}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reasons
                  </Typography>
                  
                  {formData.whyChooseReasons.map((reason) => (
                    <Paper key={reason.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Reason Title"
                            value={reason.title || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("whyChooseReasons", reason.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Reason Description"
                            value={reason.description || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("whyChooseReasons", reason.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveObjectArrayItem("whyChooseReasons", reason.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddObjectArrayItem("whyChooseReasons", { 
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                  >
                    Add Reason
                  </Button>
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Section Title"
                    name="workProcessTitle"
                    value={formData.workProcessTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Steps
                  </Typography>
                  
                  {formData.workProcessSteps.map((step) => (
                    <Paper key={step.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            label="Step Number"
                            type="number"
                            value={step.step || formData.workProcessSteps.length}
                            onChange={(e) => handleUpdateObjectArrayItem("workProcessSteps", step.id, "step", parseInt(e.target.value))}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 9 }}>
                          <TextField
                            label="Step Title"
                            value={step.title || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("workProcessSteps", step.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Step Description"
                            value={step.description || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("workProcessSteps", step.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveObjectArrayItem("workProcessSteps", step.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddObjectArrayItem("workProcessSteps", { 
                      step: formData.workProcessSteps.length + 1, 
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                  >
                    Add Step
                  </Button>
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="FAQ Title"
                    name="faqTitle"
                    value={formData.faqTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Questions and Answers
                  </Typography>
                  
                  {formData.faqQuestions.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Question"
                            value={item.question || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("faqQuestions", item.id, "question", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Answer"
                            value={item.answer || ""}
                            onChange={(e) => handleUpdateObjectArrayItem("faqQuestions", item.id, "answer", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveObjectArrayItem("faqQuestions", item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddObjectArrayItem("faqQuestions", { 
                      question: "", 
                      answer: "" 
                    })}
                    variant="outlined"
                    fullWidth
                  >
                    Add Question
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Form Actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
              <Button 
                variant="outlined"
                onClick={handleCancel}
                size="large"
                sx={{ px: 4 }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ px: 4 }}
              >
                {loading ? 'Updating...' : 'Update Landing Page'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}