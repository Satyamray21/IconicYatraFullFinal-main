import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import axios from "../utils/axios";

const HeroSectionForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ================= Hero Slider State =================
  const [images, setImages] = useState([
    { preview: null, file: null, existingUrl: null },
    { preview: null, file: null, existingUrl: null },
    { preview: null, file: null, existingUrl: null }
  ]);

  const [imageNames, setImageNames] = useState(["", "", ""]);
  
  const [slideContents, setSlideContents] = useState([
    { title: "", duration: "", buttonText: "" },
    { title: "", duration: "", buttonText: "" },
    { title: "", duration: "", buttonText: "" }
  ]);

  // ================= Why Choose Us State =================
  const [sectionData, setSectionData] = useState({
    mainDescription: "",
  });
  const [features, setFeatures] = useState([]);
  const [editingFeature, setEditingFeature] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: null,
    iconFile: null,
    iconName: "",
    existingIconUrl: null,
  });

  // ================= Trusted Agency State =================
  const [agencyData, setAgencyData] = useState({
    description: "",
  });

  // ================= Achievements State =================
  const [achievements, setAchievements] = useState([]);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [achievementFormData, setAchievementFormData] = useState({
    icon: null,
    iconFile: null,
    iconName: "",
    existingIconUrl: null,
    value: "",
    label: "",
  });

  // Fetch existing data on component mount
  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/home/get");
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Populate Hero Slider
        if (data.heroSlider?.slides) {
          const slides = data.heroSlider.slides;
          const newImages = [...images];
          const newImageNames = [...imageNames];
          const newSlideContents = [...slideContents];
          
          slides.forEach((slide, index) => {
            if (slide.image) {
              newImages[index] = {
                preview: slide.image,
                file: null,
                existingUrl: slide.image
              };
              newImageNames[index] = slide.imageName || "";
              newSlideContents[index] = {
                title: slide.title || "",
                duration: slide.duration || "",
                buttonText: slide.buttonText || ""
              };
            }
          });
          
          setImages(newImages);
          setImageNames(newImageNames);
          setSlideContents(newSlideContents);
        }
        
        // Populate Why Choose Us
        if (data.whyChooseUs) {
          setSectionData({
            mainDescription: data.whyChooseUs.mainDescription || "",
          });
          
          if (data.whyChooseUs.features) {
            const fetchedFeatures = data.whyChooseUs.features.map((feature, idx) => ({
              id: idx,
              title: feature.title,
              description: feature.description,
              icon: feature.icon,
              iconFile: null,
              iconName: feature.iconName,
              existingIconUrl: feature.icon,
            }));
            setFeatures(fetchedFeatures);
          }
        }
        
        // Populate Trusted Agency
        if (data.trustedAgency) {
          setAgencyData({
            description: data.trustedAgency.description || "",
          });
        }
        
        // Populate Achievements
        if (data.achievements?.achievements) {
          const fetchedAchievements = data.achievements.achievements.map((ach, idx) => ({
            id: idx,
            icon: ach.icon,
            iconFile: null,
            iconName: ach.iconName,
            existingIconUrl: ach.icon,
            value: ach.value,
            label: ach.label,
          }));
          setAchievements(fetchedAchievements);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load existing data");
    } finally {
      setLoading(false);
    }
  };

  // ================= Hero Slider Functions =================
  const handleImageUpload = (index, file) => {
    if (file) {
      const updatedImages = [...images];
      const updatedImageNames = [...imageNames];

      updatedImages[index] = {
        preview: URL.createObjectURL(file),
        file: file,
        existingUrl: null,
      };

      updatedImageNames[index] = file.name;

      setImages(updatedImages);
      setImageNames(updatedImageNames);
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...images];
    const updatedImageNames = [...imageNames];

    if (updatedImages[index]?.preview && !updatedImages[index]?.existingUrl) {
      URL.revokeObjectURL(updatedImages[index].preview);
    }

    updatedImages[index] = { preview: null, file: null, existingUrl: null };
    updatedImageNames[index] = "";

    setImages(updatedImages);
    setImageNames(updatedImageNames);
  };

  const handleSlideContentChange = (slideIndex, field, value) => {
    const updatedContents = [...slideContents];
    updatedContents[slideIndex][field] = value;
    setSlideContents(updatedContents);
  };

  const hasImages = images.some(img => img.file !== null || img.existingUrl !== null);

  // ================= Why Choose Us Functions =================
  const handleMainSectionChange = (field, value) => {
    setSectionData({
      ...sectionData,
      [field]: value,
    });
  };

  const handleIconUpload = (file) => {
    if (file) {
      const iconUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        icon: iconUrl,
        iconFile: file,
        iconName: file.name,
        existingIconUrl: null,
      });
    }
  };

  const handleRemoveIcon = () => {
    if (formData.icon && !formData.existingIconUrl) {
      URL.revokeObjectURL(formData.icon);
    }
    setFormData({
      ...formData,
      icon: null,
      iconFile: null,
      iconName: "",
      existingIconUrl: null,
      title: formData.title,
      description: formData.description,
    });
  };

  const handleFeatureChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleAddFeature = () => {
    if (!formData.title || !formData.description || (!formData.icon && !formData.existingIconUrl)) {
      alert("Please fill in title, description and upload an icon");
      return;
    }

    const newFeature = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      icon: formData.icon || formData.existingIconUrl,
      iconFile: formData.iconFile,
      iconName: formData.iconName,
      existingIconUrl: formData.existingIconUrl,
    };

    setFeatures([...features, newFeature]);
    resetFeatureForm();
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature.id);
    setFormData({
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
      iconFile: null,
      iconName: feature.iconName,
      existingIconUrl: feature.existingIconUrl || feature.icon,
    });
  };

  const handleUpdateFeature = () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in title and description");
      return;
    }

    const updatedFeatures = features.map(feature => {
      if (feature.id === editingFeature) {
        return {
          ...feature,
          title: formData.title,
          description: formData.description,
          icon: formData.icon || formData.existingIconUrl,
          iconFile: formData.iconFile,
          iconName: formData.iconName,
          existingIconUrl: formData.existingIconUrl,
        };
      }
      return feature;
    });

    setFeatures(updatedFeatures);
    resetFeatureForm();
  };

  const handleDeleteFeature = (id) => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      const featureToDelete = features.find(f => f.id === id);
      if (featureToDelete && featureToDelete.icon && !featureToDelete.existingIconUrl) {
        URL.revokeObjectURL(featureToDelete.icon);
      }
      setFeatures(features.filter(feature => feature.id !== id));
    }
  };

  const resetFeatureForm = () => {
    setEditingFeature(null);
    if (formData.icon && !formData.existingIconUrl) {
      URL.revokeObjectURL(formData.icon);
    }
    setFormData({
      title: "",
      description: "",
      icon: null,
      iconFile: null,
      iconName: "",
      existingIconUrl: null,
    });
  };

  // ================= Trusted Agency Functions =================
  const handleDescriptionChange = (value) => {
    setAgencyData({
      ...agencyData,
      description: value,
    });
  };

  // ================= Achievements Functions =================
  const handleAchievementIconUpload = (file) => {
    if (file) {
      const iconUrl = URL.createObjectURL(file);
      setAchievementFormData({
        ...achievementFormData,
        icon: iconUrl,
        iconFile: file,
        iconName: file.name,
        existingIconUrl: null,
      });
    }
  };

  const handleRemoveAchievementIcon = () => {
    if (achievementFormData.icon && !achievementFormData.existingIconUrl) {
      URL.revokeObjectURL(achievementFormData.icon);
    }
    setAchievementFormData({
      ...achievementFormData,
      icon: null,
      iconFile: null,
      iconName: "",
      existingIconUrl: null,
      value: achievementFormData.value,
      label: achievementFormData.label,
    });
  };

  const handleAchievementChange = (field, value) => {
    setAchievementFormData({
      ...achievementFormData,
      [field]: value,
    });
  };

  const handleAddAchievement = () => {
    if (!achievementFormData.icon || !achievementFormData.value || !achievementFormData.label) {
      alert("Please fill in icon, value, and label");
      return;
    }

    const newAchievement = {
      id: Date.now(),
      icon: achievementFormData.icon,
      iconFile: achievementFormData.iconFile,
      iconName: achievementFormData.iconName,
      existingIconUrl: achievementFormData.existingIconUrl,
      value: achievementFormData.value,
      label: achievementFormData.label,
    };

    setAchievements([...achievements, newAchievement]);
    resetAchievementForm();
  };

  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement.id);
    setAchievementFormData({
      icon: achievement.icon,
      iconFile: null,
      iconName: achievement.iconName,
      existingIconUrl: achievement.existingIconUrl || achievement.icon,
      value: achievement.value,
      label: achievement.label,
    });
  };

  const handleUpdateAchievement = () => {
    if (!achievementFormData.value || !achievementFormData.label) {
      alert("Please fill in value and label");
      return;
    }

    const updatedAchievements = achievements.map(achievement => {
      if (achievement.id === editingAchievement) {
        return {
          ...achievement,
          value: achievementFormData.value,
          label: achievementFormData.label,
          icon: achievementFormData.icon || achievementFormData.existingIconUrl,
          iconFile: achievementFormData.iconFile,
          iconName: achievementFormData.iconName,
          existingIconUrl: achievementFormData.existingIconUrl,
        };
      }
      return achievement;
    });

    setAchievements(updatedAchievements);
    resetAchievementForm();
  };

  const handleDeleteAchievement = (id) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      const achievementToDelete = achievements.find(a => a.id === id);
      if (achievementToDelete && achievementToDelete.icon && !achievementToDelete.existingIconUrl) {
        URL.revokeObjectURL(achievementToDelete.icon);
      }
      setAchievements(achievements.filter(achievement => achievement.id !== id));
    }
  };

  const resetAchievementForm = () => {
    setEditingAchievement(null);
    if (achievementFormData.icon && !achievementFormData.existingIconUrl) {
      URL.revokeObjectURL(achievementFormData.icon);
    }
    setAchievementFormData({
      icon: null,
      iconFile: null,
      iconName: "",
      existingIconUrl: null,
      value: "",
      label: "",
    });
  };

  // ================= Final Submit =================
  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // ===== VALIDATIONS =====
      for (let i = 0; i < images.length; i++) {
        if (images[i].file || images[i].existingUrl) {
          const content = slideContents[i];
          if (!content.title || !content.duration) {
            alert(`Please complete content for Slide ${i + 1}`);
            setSaving(false);
            return;
          }
        }
      }

      if (!hasImages) {
        alert("Upload at least one image");
        setSaving(false);
        return;
      }

      if (!sectionData.mainDescription) {
        alert("Fill Why Choose Us");
        setSaving(false);
        return;
      }

      if (features.length === 0) {
        alert("Add features");
        setSaving(false);
        return;
      }

      if (!agencyData.description) {
        alert("Fill Trusted Agency");
        setSaving(false);
        return;
      }

      if (achievements.length === 0) {
        alert("Add achievements");
        setSaving(false);
        return;
      }

      // ===== CREATE JSON =====
      const finalData = {
        heroSlider: {
          slides: images.map((img, index) => ({
            image: img.existingUrl || null,
            imageName: imageNames[index],
            content: slideContents[index],
            hasImage: !!(img.file || img.existingUrl),
          })).filter(s => s.hasImage),
        },
        whyChooseUs: {
          mainDescription: sectionData.mainDescription,
          features: features.map(f => ({
            title: f.title,
            description: f.description,
            icon: f.existingIconUrl || null,
            iconName: f.iconName,
          })),
        },
        trustedAgency: {
          description: agencyData.description,
        },
        achievements: {
          achievements: achievements.map(a => ({
            icon: a.existingIconUrl || null,
            iconName: a.iconName,
            value: a.value,
            label: a.label,
          })),
        },
      };

      // ===== CREATE FORMDATA =====
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(finalData));

      // Add only new files
      images.forEach((img, index) => {
        if (img.file) {
          formDataToSend.append(`slide_${index}`, img.file);
        }
      });

      features.forEach((f, index) => {
        if (f.iconFile) {
          formDataToSend.append(`feature_${index}`, f.iconFile);
        }
      });

      achievements.forEach((a, index) => {
        if (a.iconFile) {
          formDataToSend.append(`achievement_${index}`, a.iconFile);
        }
      });

      // ===== API CALL =====
      const res = await axios.post("/home/save", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Save response:", res.data);
      alert("Saved Successfully 🚀");
      
      // Refresh data
      await fetchHomePageData();
      
    } catch (error) {
      console.error("Save error:", error);
      setError(error.response?.data?.message || "Error saving data");
      alert("Error saving data: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ================= Hero Slider Section ================= */}
      <Typography 
        variant="h4" 
        mb={4} 
        fontWeight={700}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Hero Slider Management
      </Typography>

      {/* Image Uploads */}
      <Box mb={5}>
        <Typography 
          variant="h6" 
          mb={2} 
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Slide Images
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Upload up to 3 images for your hero slider. Each slide can have its own content.
        </Typography>
        
        <Grid container spacing={3}>
          {images.map((img, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Box
                sx={{
                  position: "relative",
                  height: 280,
                  borderRadius: 3,
                  overflow: "hidden",
                  backgroundColor: "#f8f9fa",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                {img?.preview ? (
                  <>
                    <img
                      src={img.preview}
                      alt={`Slide ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.8)",
                        },
                      }}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Chip
                      label={`Slide ${index + 1}`}
                      size="small"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #e0e0e0",
                      borderRadius: 3,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: "#1976d2", mb: 1 }} />
                    <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                      Slide {index + 1}
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        "&:hover": {
                          borderColor: "#1565c0",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(index, e.target.files[0])
                        }
                      />
                    </Button>
                  </Box>
                )}
              </Box>
              {imageNames[index] && (
                <Typography variant="caption" sx={{ color: "#666", mt: 1, display: "block" }}>
                  {imageNames[index]}
                </Typography>
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4, borderColor: "#f0f0f0" }} />

      {/* Slide Content Fields */}
      <Box mb={5}>
        <Typography 
          variant="h6" 
          mb={2} 
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Slide Content
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Configure the content for each slide individually
        </Typography>
        
        {[0, 1, 2].map((slideIndex) => (
          <Card 
            key={slideIndex}
            sx={{ 
              mb: 3, 
              p: 2,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              backgroundColor: images[slideIndex]?.preview ? "#ffffff" : "#fafafa",
              opacity: images[slideIndex]?.preview ? 1 : 0.7,
            }}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight={600} 
              mb={2}
              sx={{ color: "#1976d2" }}
            >
              Slide {slideIndex + 1} Content {!images[slideIndex]?.preview && "(No image uploaded yet)"}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Package Title *"
                  fullWidth
                  value={slideContents[slideIndex].title}
                  onChange={(e) => handleSlideContentChange(slideIndex, "title", e.target.value)}
                  placeholder="e.g., Summer Special"
                  variant="outlined"
                  disabled={!images[slideIndex]?.preview}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                      "&.Mui-focused": {
                        color: "#1976d2",
                      },
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e0e0e0",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Duration *"
                  fullWidth
                  value={slideContents[slideIndex].duration}
                  onChange={(e) => handleSlideContentChange(slideIndex, "duration", e.target.value)}
                  placeholder="e.g., 4 Nights / 5 Days"
                  variant="outlined"
                  disabled={!images[slideIndex]?.preview}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                      "&.Mui-focused": {
                        color: "#1976d2",
                      },
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e0e0e0",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Button Text"
                  fullWidth
                  value={slideContents[slideIndex].buttonText}
                  onChange={(e) => handleSlideContentChange(slideIndex, "buttonText", e.target.value)}
                  placeholder="e.g., Book Now"
                  variant="outlined"
                  disabled={!images[slideIndex]?.preview}
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                      "&.Mui-focused": {
                        color: "#1976d2",
                      },
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e0e0e0",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Card>
        ))}
      </Box>

      <Divider sx={{ my: 6, borderColor: "#f0f0f0" }} />

      {/* ================= Why Choose Us Section ================= */}
      <Typography
        variant="h4"
        mb={4}
        fontWeight={700}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Why Choose Iconic Yatra?
      </Typography>

      {/* Main Section Content */}
      <Box mb={5}>
        <Typography
          variant="h6"
          mb={2}
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Main Section Content
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Configure the main description for the Why Choose Us section
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Main Description *"
              fullWidth
              multiline
              rows={3}
              value={sectionData.mainDescription}
              onChange={(e) => handleMainSectionChange("mainDescription", e.target.value)}
              placeholder="Enter main description (e.g., Experience unmatched travel services designed to make your journey safe, comfortable, and memorable.)"
              variant="outlined"
              required
              sx={{
                "& .MuiInputLabel-root": {
                  color: "#1976d2",
                  "&.Mui-focused": {
                    color: "#1976d2",
                  },
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "#e0e0e0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4, borderColor: "#f0f0f0" }} />

      {/* Features Section */}
      <Box mb={5}>
        <Typography
          variant="h6"
          mb={2}
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Features Management
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Add, edit, or remove features with custom icons, titles, and descriptions
        </Typography>

        {/* Add/Edit Feature Form */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            boxShadow: "none",
            backgroundColor: "#fafafa",
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2} sx={{ color: "#1976d2" }}>
              {editingFeature ? "Edit Feature" : "Add New Feature"}
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Feature Title *"
                  fullWidth
                  value={formData.title}
                  onChange={(e) => handleFeatureChange("title", e.target.value)}
                  placeholder="Enter feature title (e.g., Safe and Secure Travel)"
                  variant="outlined"
                  required
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="body2" mb={1} sx={{ color: "#1976d2", fontWeight: 500 }}>
                    Feature Icon *
                  </Typography>
                  {!formData.icon ? (
                    <Button
                      component="label"
                      variant="outlined"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        height: 56,
                        "&:hover": {
                          borderColor: "#1565c0",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    >
                      Upload Icon (PNG, SVG, JPG)
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleIconUpload(e.target.files[0])}
                      />
                    </Button>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1,
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        backgroundColor: "white",
                      }}
                    >
                      <img
                        src={formData.icon}
                        alt="icon preview"
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "contain",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {formData.iconName}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={handleRemoveIcon}
                        sx={{ color: "#f28c63" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Feature Description *"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFeatureChange("description", e.target.value)}
                  placeholder="Enter feature description"
                  variant="outlined"
                  required
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  {editingFeature && (
                    <Button
                      variant="outlined"
                      onClick={resetFeatureForm}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        "&:hover": {
                          borderColor: "#1565c0",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={editingFeature ? handleUpdateFeature : handleAddFeature}
                    startIcon={!editingFeature && <AddIcon />}
                    sx={{
                      background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                      borderRadius: 2,
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {editingFeature ? "Update Feature" : "Add Feature"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Features List */}
        <Typography variant="subtitle1" fontWeight={600} mb={2} sx={{ color: "#1976d2" }}>
          Current Features ({features.length})
        </Typography>
        
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  boxShadow: "none",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ position: "relative" }}>
                    {feature.icon && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mb: 2,
                          height: 80,
                        }}
                      >
                        <img
                          src={feature.icon}
                          alt="feature icon"
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            console.error("Failed to load image:", feature.icon);
                            e.target.style.display = "none";
                          }}
                        />
                      </Box>
                    )}
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ color: "#1976d2", mb: 1 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mb: 2, lineHeight: 1.5 }}>
                      {feature.description}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditFeature(feature)}
                        sx={{
                          color: "#1976d2",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFeature(feature.id)}
                        sx={{
                          color: "#f28c63",
                          "&:hover": {
                            backgroundColor: "rgba(242, 140, 99, 0.04)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {features.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              backgroundColor: "#fafafa",
              borderRadius: 3,
              border: "2px dashed #e0e0e0",
            }}
          >
            <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
              No features added yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Click "Add Feature" to start adding your value propositions
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 6, borderColor: "#f0f0f0" }} />

      {/* ================= Trusted Agency Section ================= */}
      <Typography
        variant="h4"
        mb={4}
        fontWeight={700}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Most Trusted Travel Agency - Section Manager
      </Typography>

      {/* Fixed Heading Display */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: "#f8f9fa",
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: "#1976d2",
            textAlign: "center",
          }}
        >
          Most Trusted Travel Agency
        </Typography>
      </Paper>

      <Divider sx={{ my: 4, borderColor: "#f0f0f0" }} />

      {/* Description */}
      <Box mb={5}>
        <Typography
          variant="h6"
          mb={2}
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Section Description
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Enter the description content for the Most Trusted Travel Agency section
        </Typography>

        <TextField
          label="Description *"
          fullWidth
          multiline
          rows={12}
          value={agencyData.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          variant="outlined"
          sx={{
            "& .MuiInputLabel-root": {
              color: "#1976d2",
              "&.Mui-focused": {
                color: "#1976d2",
              },
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "& fieldset": {
                borderColor: "#e0e0e0",
              },
              "&:hover fieldset": {
                borderColor: "#1976d2",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1976d2",
              },
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 6, borderColor: "#f0f0f0" }} />

      {/* ================= Achievements Section ================= */}
      <Typography
        variant="h4"
        mb={4}
        fontWeight={700}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Our Achievements - Section Manager
      </Typography>

      {/* Fixed Title */}
      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: "#f8f9fa",
          border: "1px solid #e0e0e0",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: "#1976d2" }}
        >
          Our Achievements
        </Typography>
      </Box>

      <Divider sx={{ my: 4, borderColor: "#f0f0f0" }} />

      {/* Achievements Management */}
      <Box mb={5}>
        <Typography
          variant="h6"
          mb={2}
          fontWeight={600}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Achievements Management
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: "#666" }}>
          Add, edit, or remove achievements with icon, value, and label
        </Typography>

        {/* Add/Edit Achievement Form */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            boxShadow: "none",
            backgroundColor: "#fafafa",
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2} sx={{ color: "#1976d2" }}>
              {editingAchievement ? "Edit Achievement" : "Add New Achievement"}
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" mb={1} sx={{ color: "#1976d2", fontWeight: 500 }}>
                  Achievement Icon {!editingAchievement && "*"}
                </Typography>
                {!achievementFormData.icon ? (
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      borderColor: "#1976d2",
                      color: "#1976d2",
                      height: 80,
                      "&:hover": {
                        borderColor: "#1565c0",
                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                      },
                    }}
                  >
                    {editingAchievement ? "Upload New Icon (Optional)" : "Upload Icon (PNG, SVG, JPG)"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleAchievementIconUpload(e.target.files[0])}
                    />
                  </Button>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      backgroundColor: "white",
                    }}
                  >
                    <img
                      src={achievementFormData.icon}
                      alt="icon preview"
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {achievementFormData.iconName}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleRemoveAchievementIcon}
                      sx={{ color: "#f28c63" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {editingAchievement && !achievementFormData.icon && (
                  <Typography variant="caption" sx={{ color: "#666", mt: 1, display: "block" }}>
                    Current icon will be kept if you don't upload a new one
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Value *"
                  fullWidth
                  value={achievementFormData.value}
                  onChange={(e) => handleAchievementChange("value", e.target.value)}
                  placeholder="e.g., 9+, 100+, 1500+, 25+"
                  variant="outlined"
                  helperText="Enter the number or statistic"
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Label *"
                  fullWidth
                  value={achievementFormData.label}
                  onChange={(e) => handleAchievementChange("label", e.target.value)}
                  placeholder="e.g., Years of Experience, Travel Experts"
                  variant="outlined"
                  helperText="Enter the description"
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#1976d2",
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  {editingAchievement && (
                    <Button
                      variant="outlined"
                      onClick={resetAchievementForm}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        "&:hover": {
                          borderColor: "#1565c0",
                          backgroundColor: "rgba(25, 118, 210, 0.04)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={editingAchievement ? handleUpdateAchievement : handleAddAchievement}
                    startIcon={!editingAchievement && <AddIcon />}
                    sx={{
                      background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                      borderRadius: 2,
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {editingAchievement ? "Update Achievement" : "Add Achievement"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Achievements List */}
        <Typography variant="subtitle1" fontWeight={600} mb={2} sx={{ color: "#1976d2" }}>
          Current Achievements ({achievements.length})
        </Typography>

        <Grid container spacing={3}>
          {achievements.map((achievement) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={achievement.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  boxShadow: "none",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ position: "relative" }}>
                    {achievement.icon && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mb: 2,
                          height: 80,
                        }}
                      >
                        <img
                          src={achievement.icon}
                          alt="achievement icon"
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            console.error("Failed to load image:", achievement.icon);
                            e.target.style.display = "none";
                          }}
                        />
                      </Box>
                    )}
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{ color: "#1976d2", mb: 1 }}
                    >
                      {achievement.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                      {achievement.label}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAchievement(achievement)}
                        sx={{
                          color: "#1976d2",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        sx={{
                          color: "#f28c63",
                          "&:hover": {
                            backgroundColor: "rgba(242, 140, 99, 0.04)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {achievements.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              backgroundColor: "#fafafa",
              borderRadius: 3,
              border: "2px dashed #e0e0e0",
            }}
          >
            <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
              No achievements added yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Click "Add Achievement" to showcase your key achievements
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 4, borderColor: "#f0f0f0" }} />

      {/* ================= Final Submit Button ================= */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          pt: 2,
          pb: 4,
        }}
      >
        <Typography variant="body2" sx={{ color: "#666" }}>
          Hero: {hasImages ? `${images.filter(img => img.file !== null || img.existingUrl !== null).length} images` : "No images"} | 
          Features: {features.length} | 
          Achievements: {achievements.length}
        </Typography>
        <Button
          variant="contained"
          onClick={handleFinalSubmit}
          disabled={saving}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            borderRadius: 2,
            px: 6,
            py: 1.5,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "1.1rem",
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
              boxShadow: "none",
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : "Save All"}
        </Button>
      </Box>
    </Box>
  );
};

export default HeroSectionForm;