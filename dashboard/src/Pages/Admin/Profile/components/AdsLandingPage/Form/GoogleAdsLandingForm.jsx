import React, { useState } from "react";
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
  Avatar,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import { useDispatch } from "react-redux";
import { createLandingPage } from "../../../../../../features/landingPage/landingPageSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function LandingPageForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState = {
    slug: "",
    headerDescription: "",
    slidingText: [
      { id: Date.now(), text: "" }
    ],
    solutionButtonText: "",
    solutionButtonDescription: "",
    heroBackgroundImage: null,
    heroBackgroundImagePreview: null,
    heroTitle: "",
    heroDescription: "",
    heroButtonText: "",
    heroOverlayOpacity: 0.65,

    overviewSections: [
      {
        id: 1,
        overviewTitle: "",
        overviewDescription: "",
        overviewImage: null,
        overviewImagePreview: null,
        overviewGetFreeQuoteButton: "",
        overviewChatWithUsButton: "",
      },
    ],

    ownPackageTitle: "",
    ownPackageDescription: "",
    ownPackageImage: null,
    ownPackageImagePreview: null,
    ownPackageFeatures: [],

    solutionTitle: "",
    solutionDescription: "",
    solutionItems: [],

    packageFeaturesTitle: "",
    packageFeatures: [],

    whyChooseTitle: "",
    whyChooseBannerImage: null,
    whyChooseBannerImagePreview: null,
    whyChooseReasons: [],

    workProcessTitle: "",
    workProcessSteps: [],

    faqTitle: "",
    faqQuestions: [],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Sliding Text Handlers
  const addSlidingText = () => {
    setFormData(prev => ({
      ...prev,
      slidingText: [
        ...prev.slidingText,
        { id: Date.now(), text: "" }
      ]
    }));
  };

  const updateSlidingText = (id, value) => {
    setFormData(prev => ({
      ...prev,
      slidingText: prev.slidingText.map(item =>
        item.id === id ? { ...item, text: value } : item
      )
    }));
  };

  const removeSlidingText = (id) => {
    setFormData(prev => ({
      ...prev,
      slidingText: prev.slidingText.filter(item => item.id !== id)
    }));
  };

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
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [fieldName]: file,
        [`${fieldName}Preview`]: previewUrl
      }));
    }
  };

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      if (formData.heroBackgroundImagePreview) {
        URL.revokeObjectURL(formData.heroBackgroundImagePreview);
      }
      if (formData.ownPackageImagePreview) {
        URL.revokeObjectURL(formData.ownPackageImagePreview);
      }
      if (formData.whyChooseBannerImagePreview) {
        URL.revokeObjectURL(formData.whyChooseBannerImagePreview);
      }
      formData.overviewSections.forEach(section => {
        if (section.overviewImagePreview) {
          URL.revokeObjectURL(section.overviewImagePreview);
        }
      });
      formData.solutionItems.forEach(item => {
        if (item.iconPreview) {
          URL.revokeObjectURL(item.iconPreview);
        }
      });
      formData.packageFeatures.forEach(feature => {
        if (feature.iconPreview) {
          URL.revokeObjectURL(feature.iconPreview);
        }
      });
    };
  }, [formData]);

  // Overview Section handlers
  const addOverviewSection = () => {
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
          overviewImagePreview: null,
          overviewGetFreeQuoteButton: "",
          overviewChatWithUsButton: "",
        }
      ]
    }));
  };

  const updateOverviewSection = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      overviewSections: prev.overviewSections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeOverviewSection = (id) => {
    setFormData(prev => ({
      ...prev,
      overviewSections: prev.overviewSections.filter(section => section.id !== id)
    }));
  };

  const handleOverviewImageUpload = (e, id) => {
    const file = e.target.files[0];
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        overviewSections: prev.overviewSections.map(section =>
          section.id === id ? { 
            ...section, 
            overviewImage: file,
            overviewImagePreview: previewUrl 
          } : section
        )
      }));
    }
  };

  // Simple array handlers (for strings)
  const addSimpleArrayItem = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], ""]
    }));
  };

  const updateSimpleArrayItem = (fieldName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[fieldName]];
      newArray[index] = value;
      return { ...prev, [fieldName]: newArray };
    });
  };

  const removeSimpleArrayItem = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  // Object array handlers (for packages, solutions, etc.)
  const addObjectArrayItem = (fieldName, template) => {
    const newId = Date.now();
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { ...template, id: newId }]
    }));
  };

  const updateObjectArrayItem = (fieldName, id, key, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map(item => 
        item.id === id ? { ...item, [key]: value } : item
      )
    }));
  };

  const removeObjectArrayItem = (fieldName, id) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(item => item.id !== id)
    }));
  };

  const handleObjectArrayImageUpload = (e, fieldName, id, imageField) => {
    const file = e.target.files[0];
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].map(item =>
          item.id === id ? { 
            ...item, 
            [imageField]: file,
            [`${imageField}Preview`]: previewUrl 
          } : item
        )
      }));
    }
  };

  const ImagePreview = ({ src, alt, onRemove, size = 80 }) => {
    if (!src) return null;
    
    return (
      <Box sx={{ position: 'relative', display: 'inline-block', mt: 1 }}>
        <Avatar
          src={src}
          alt={alt}
          variant="rounded"
          sx={{ width: size, height: size }}
        />
        {onRemove && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={() => onRemove()}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        )}
      </Box>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = new FormData();
    const data = {
      ...formData,
      solutionButtonText: formData.solutionButtonText || "",
  solutionButtonDescription: formData.solutionButtonDescription || "",
      // Remove preview fields before sending
      heroBackgroundImagePreview: undefined,
      ownPackageImagePreview: undefined,
      whyChooseBannerImagePreview: undefined,
      
      slidingText: formData.slidingText
        .map(item => item.text?.trim())
        .filter(text => text && text.length > 0),
      
      overviewSections: formData.overviewSections.map(section => ({
        ...section,
        overviewImagePreview: undefined
      })),
      
      solutionItems: formData.solutionItems.map(item => ({
        ...item,
        iconPreview: undefined
      })),
      
      packageFeatures: formData.packageFeatures.map(feature => ({
        ...feature,
        iconPreview: undefined
      }))
    };
    
    if (formData.heroBackgroundImage) {
      form.append("heroBackgroundImage", formData.heroBackgroundImage);
    }

    if (formData.ownPackageImage) {
      form.append("ownPackageImage", formData.ownPackageImage);
    }

    if (formData.whyChooseBannerImage) {
      form.append("whyChooseBannerImage", formData.whyChooseBannerImage);
    }

    formData.overviewSections.forEach((section) => {
      if (section.overviewImage instanceof File) {
        form.append("overviewImages", section.overviewImage);
      }
    });

    formData.solutionItems.forEach((item) => {
      if (item.icon instanceof File) {
        form.append("solutionIcons", item.icon);
      }
    });

    formData.packageFeatures.forEach((item) => {
      if (item.icon instanceof File) {
        form.append("featureIcons", item.icon);
      }
    });

    form.append("data", JSON.stringify(data));

    try {
      await dispatch(createLandingPage(form)).unwrap();
      toast.success("Landing page created successfully 🚀");
      setFormData(initialFormState);
      navigate("/profile?activeTab=googleAds");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create landing page");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Landing Page Content Form
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* ========== SLUG SECTION ========== */}
            <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                🔗 Landing Page Slug
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="Example: darjeeling-tour"
                disabled={isSubmitting}
              />
            </Paper>
            
            {/* ========== HEADER SECTION ========== */}
            <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                📋 Header Section
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid size={{xs:12}}>
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
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                    disabled={isSubmitting}
                  >
                    Upload Hero Background Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "heroBackgroundImage")}
                    />
                  </Button>
                  
                  {/* Image Preview */}
                  {formData.heroBackgroundImagePreview && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <ImagePreview 
                        src={formData.heroBackgroundImagePreview} 
                        alt="Hero background preview"
                        onRemove={() => {
                          URL.revokeObjectURL(formData.heroBackgroundImagePreview);
                          setFormData(prev => ({
                            ...prev,
                            heroBackgroundImage: null,
                            heroBackgroundImagePreview: null
                          }));
                        }}
                        size={120}
                      />
                    </Box>
                  )}
                </Grid>
                
                <Grid size={{xs:12}}>
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
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{xs:12}}>
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
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Button Text"
                    name="heroButtonText"
                    value={formData.heroButtonText}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    placeholder="e.g., Chat for Package"
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{xs:12, md:6}}>
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
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {/* ========== SLIDING TEXT SECTION ========== */}
            <Paper elevation={1} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                🎞️ Sliding Text
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {formData.slidingText.map((item, index) => (
                <Box key={item.id} sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField
                    label={`Sliding Text ${index + 1}`}
                    value={item.text}
                    onChange={(e) => updateSlidingText(item.id, e.target.value)}
                    fullWidth
                    size="small"
                    disabled={isSubmitting}
                  />

                  <IconButton
                    color="error"
                    onClick={() => removeSlidingText(item.id)}
                    disabled={isSubmitting}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addSlidingText}
                variant="outlined"
                size="small"
                disabled={isSubmitting}
              >
                Add Sliding Text
              </Button>
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
                      onClick={() => removeOverviewSection(section.id)}
                      size="small"
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid size={{xs:12}}>
                    <TextField
                      label="Overview Title"
                      value={section.overviewTitle}
                      onChange={(e) => updateOverviewSection(section.id, "overviewTitle", e.target.value)}
                      fullWidth
                      required
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid size={{xs:12}}>
                    <TextField
                      label="Overview Description"
                      value={section.overviewDescription}
                      onChange={(e) => updateOverviewSection(section.id, "overviewDescription", e.target.value)}
                      multiline
                      rows={4}
                      fullWidth
                      required
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid size={{xs:12}}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      disabled={isSubmitting}
                    >
                      Upload Overview Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleOverviewImageUpload(e, section.id)}
                      />
                    </Button>
                    
                    {/* Image Preview */}
                    {section.overviewImagePreview && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <ImagePreview 
                          src={section.overviewImagePreview} 
                          alt={`Overview ${index + 1} preview`}
                          onRemove={() => {
                            URL.revokeObjectURL(section.overviewImagePreview);
                            setFormData(prev => ({
                              ...prev,
                              overviewSections: prev.overviewSections.map(s =>
                                s.id === section.id ? {
                                  ...s,
                                  overviewImage: null,
                                  overviewImagePreview: null
                                } : s
                              )
                            }));
                          }}
                        />
                      </Box>
                    )}
                  </Grid>

                  <Grid size={{xs:12, md:6}}>
                    <TextField
                      label="Get Free Quote Button Text"
                      value={section.overviewGetFreeQuoteButton}
                      onChange={(e) => updateOverviewSection(section.id, "overviewGetFreeQuoteButton", e.target.value)}
                      fullWidth
                      required
                      placeholder="Get Free Quote"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid size={{xs:12, md:6}}>
                    <TextField
                      label="Chat With Us Button Text"
                      value={section.overviewChatWithUsButton}
                      onChange={(e) => updateOverviewSection(section.id, "overviewChatWithUsButton", e.target.value)}
                      fullWidth
                      required
                      placeholder="Chat with Us"
                      disabled={isSubmitting}
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
                onClick={addOverviewSection}
                size="large"
                disabled={isSubmitting}
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
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Section Title"
                    name="ownPackageTitle"
                    value={formData.ownPackageTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Section Description"
                    name="ownPackageDescription"
                    value={formData.ownPackageDescription}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    disabled={isSubmitting}
                  >
                    Upload Own Package Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "ownPackageImage")}
                    />
                  </Button>
                  
                  {/* Image Preview */}
                  {formData.ownPackageImagePreview && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <ImagePreview 
                        src={formData.ownPackageImagePreview} 
                        alt="Own package preview"
                        onRemove={() => {
                          URL.revokeObjectURL(formData.ownPackageImagePreview);
                          setFormData(prev => ({
                            ...prev,
                            ownPackageImage: null,
                            ownPackageImagePreview: null
                          }));
                        }}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  
                  {formData.ownPackageFeatures.map((feature, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        value={feature}
                        onChange={(e) => updateSimpleArrayItem("ownPackageFeatures", index, e.target.value)}
                        fullWidth
                        size="small"
                        placeholder={`Feature ${index + 1}`}
                        disabled={isSubmitting}
                      />
                      <IconButton 
                        color="error" 
                        onClick={() => removeSimpleArrayItem("ownPackageFeatures", index)}
                        disabled={isSubmitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addSimpleArrayItem("ownPackageFeatures")}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <TextField
                    label="Section Title"
                    name="solutionTitle"
                    value={formData.solutionTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
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
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Solution Button Text"
                    name="solutionButtonText"
                    value={formData.solutionButtonText}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="e.g. Get Started"
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Solution Button Description"
                    name="solutionButtonDescription"
                    value={formData.solutionButtonDescription}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Short description under button"
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Solution Items
                  </Typography>
                  
                  {formData.solutionItems.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Solution Title"
                            value={item.title}
                            onChange={(e) => updateObjectArrayItem("solutionItems", item.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Solution Description"
                            value={item.description || ""}
                            onChange={(e) => updateObjectArrayItem("solutionItems", item.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            disabled={isSubmitting}
                          >
                            Upload Icon
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleObjectArrayImageUpload(e, "solutionItems", item.id, "icon")}
                            />
                          </Button>
                          
                          {/* Icon Preview */}
                          {item.iconPreview && (
                            <Box sx={{ mt: 1 }}>
                              <ImagePreview 
                                src={item.iconPreview} 
                                alt="Solution icon preview"
                                onRemove={() => {
                                  URL.revokeObjectURL(item.iconPreview);
                                  setFormData(prev => ({
                                    ...prev,
                                    solutionItems: prev.solutionItems.map(i =>
                                      i.id === item.id ? {
                                        ...i,
                                        icon: null,
                                        iconPreview: null
                                      } : i
                                    )
                                  }));
                                }}
                                size={60}
                              />
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => removeObjectArrayItem("solutionItems", item.id)}
                              disabled={isSubmitting}
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
                    onClick={() => addObjectArrayItem("solutionItems", { 
                      title: "", 
                      description: "",
                      icon: null,
                      iconPreview: null
                    })}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <TextField
                    label="Section Title"
                    name="packageFeaturesTitle"
                    value={formData.packageFeaturesTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  
                  {formData.packageFeatures.map((feature) => (
                    <Paper key={feature.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs:12}}>
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            disabled={isSubmitting}
                          >
                            Upload Feature Icon
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleObjectArrayImageUpload(e, "packageFeatures", feature.id, "icon")}
                            />
                          </Button>
                          
                          {/* Icon Preview */}
                          {feature.iconPreview && (
                            <Box sx={{ mt: 1 }}>
                              <ImagePreview 
                                src={feature.iconPreview} 
                                alt="Feature icon preview"
                                onRemove={() => {
                                  URL.revokeObjectURL(feature.iconPreview);
                                  setFormData(prev => ({
                                    ...prev,
                                    packageFeatures: prev.packageFeatures.map(f =>
                                      f.id === feature.id ? {
                                        ...f,
                                        icon: null,
                                        iconPreview: null
                                      } : f
                                    )
                                  }));
                                }}
                                size={60}
                              />
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Feature Title"
                            value={feature.title}
                            onChange={(e) => updateObjectArrayItem("packageFeatures", feature.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Feature Description"
                            value={feature.description}
                            onChange={(e) => updateObjectArrayItem("packageFeatures", feature.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => removeObjectArrayItem("packageFeatures", feature.id)}
                              disabled={isSubmitting}
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
                    onClick={() => addObjectArrayItem("packageFeatures", { 
                      icon: null,
                      iconPreview: null,
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <TextField
                    label="Section Title"
                    name="whyChooseTitle"
                    value={formData.whyChooseTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    disabled={isSubmitting}
                  >
                    Upload Banner Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "whyChooseBannerImage")}
                    />
                  </Button>
                  
                  {/* Image Preview */}
                  {formData.whyChooseBannerImagePreview && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <ImagePreview 
                        src={formData.whyChooseBannerImagePreview} 
                        alt="Why choose banner preview"
                        onRemove={() => {
                          URL.revokeObjectURL(formData.whyChooseBannerImagePreview);
                          setFormData(prev => ({
                            ...prev,
                            whyChooseBannerImage: null,
                            whyChooseBannerImagePreview: null
                          }));
                        }}
                        size={120}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reasons
                  </Typography>
                  
                  {formData.whyChooseReasons.map((reason) => (
                    <Paper key={reason.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Reason Title"
                            value={reason.title}
                            onChange={(e) => updateObjectArrayItem("whyChooseReasons", reason.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Reason Description"
                            value={reason.description}
                            onChange={(e) => updateObjectArrayItem("whyChooseReasons", reason.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => removeObjectArrayItem("whyChooseReasons", reason.id)}
                              disabled={isSubmitting}
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
                    onClick={() => addObjectArrayItem("whyChooseReasons", { 
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <TextField
                    label="Section Title"
                    name="workProcessTitle"
                    value={formData.workProcessTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Steps
                  </Typography>
                  
                  {formData.workProcessSteps.map((step) => (
                    <Paper key={step.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs:12, md:3}}>
                          <TextField
                            label="Step Number"
                            type="number"
                            value={step.step}
                            onChange={(e) => updateObjectArrayItem("workProcessSteps", step.id, "step", parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12, md:9}}>
                          <TextField
                            label="Step Title"
                            value={step.title}
                            onChange={(e) => updateObjectArrayItem("workProcessSteps", step.id, "title", e.target.value)}
                            fullWidth
                            size="small"
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Step Description"
                            value={step.description}
                            onChange={(e) => updateObjectArrayItem("workProcessSteps", step.id, "description", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => removeObjectArrayItem("workProcessSteps", step.id)}
                              disabled={isSubmitting}
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
                    onClick={() => addObjectArrayItem("workProcessSteps", { 
                      step: formData.workProcessSteps.length + 1, 
                      title: "", 
                      description: "" 
                    })}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
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
                <Grid size={{xs:12}}>
                  <TextField
                    label="FAQ Title"
                    name="faqTitle"
                    value={formData.faqTitle}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid size={{xs:12}}>
                  <Typography variant="subtitle2" gutterBottom>
                    Questions and Answers
                  </Typography>
                  
                  {formData.faqQuestions.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Question"
                            value={item.question}
                            onChange={(e) => updateObjectArrayItem("faqQuestions", item.id, "question", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <TextField
                            label="Answer"
                            value={item.answer}
                            onChange={(e) => updateObjectArrayItem("faqQuestions", item.id, "answer", e.target.value)}
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                            disabled={isSubmitting}
                          />
                        </Grid>
                        <Grid size={{xs:12}}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton 
                              color="error" 
                              onClick={() => removeObjectArrayItem("faqQuestions", item.id)}
                              disabled={isSubmitting}
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
                    onClick={() => addObjectArrayItem("faqQuestions", { 
                      question: "", 
                      answer: "" 
                    })}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    Add Question
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Form Actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ px: 4, minWidth: 200 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                    Submitting...
                  </>
                ) : (
                  'Submit Form'
                )}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}