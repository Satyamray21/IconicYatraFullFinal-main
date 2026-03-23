// src/components/PostBlog.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Alert,
    Snackbar,
    CircularProgress,
    IconButton,
    Stack,
    Divider,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    InputAdornment,
    Tab,
    Tabs
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import SecurityIcon from '@mui/icons-material/Security';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import { styled } from '@mui/material/styles';

import {
    createBlog,
    setFormField,
    resetForm,
    addPlace,
    removePlace,
    addTravelTip,
    removeTravelTip,
    addGuideTravelTip,
    removeGuideTravelTip,
    addService,
    removeService,
    addSafetyTip,
    removeSafetyTip,
    setImagePreview,
    clearImage,
    selectBlogForm,
    selectBlogStatus,
    selectBlogError
} from "../../../../../../features/blog/blogSlice";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const PostBlogForm = () => {
    const dispatch = useDispatch();
    const formData = useSelector(selectBlogForm);
    const status = useSelector(selectBlogStatus);
    const error = useSelector(selectBlogError);
    
    const [activeTab, setActiveTab] = useState(0);
    const [placeInput, setPlaceInput] = useState({ title: '', desc: '' });
    const [tipInput, setTipInput] = useState('');
    const [guideTipInput, setGuideTipInput] = useState('');
    const [serviceInput, setServiceInput] = useState('');
    const [safetyTipInput, setSafetyTipInput] = useState('');
    const [imagePreview, setImagePreviewLocal] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const categories = [
        'India Travel',
        'International Travel',
        'Beach Destinations',
        'Hill Stations',
        'Cultural Tours',
        'Adventure Travel',
        'Honeymoon Packages',
        'Family Tours'
    ];

    // Generate ID and slug from title
    const generateId = (title) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'title') {
            const generatedId = generateId(value);
            dispatch(setFormField({ field: 'title', value }));
            dispatch(setFormField({ field: 'id', value: generatedId }));
            dispatch(setFormField({ field: 'slug', value: generatedId }));
        } else {
            dispatch(setFormField({ field: name, value }));
        }
    };

    const handleDateChange = (newDate) => {
        dispatch(setFormField({ field: 'date', value: newDate }));
    };

    const handleImageChange = (e) => {
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

            dispatch(setImagePreview(file));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewLocal(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        dispatch(clearImage());
        setImagePreviewLocal(null);
    };

    // Top Places Management
    const handleAddPlace = () => {
        if (!placeInput.title.trim() || !placeInput.desc.trim()) {
            setSnackbar({
                open: true,
                message: 'Please fill in both title and description for the place',
                severity: 'warning'
            });
            return;
        }

        dispatch(addPlace(placeInput));
        setPlaceInput({ title: '', desc: '' });
    };

    const handleRemovePlace = (index) => {
        dispatch(removePlace(index));
    };

    // Travel Tips Management
    const handleAddTip = () => {
        if (!tipInput.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a travel tip',
                severity: 'warning'
            });
            return;
        }

        dispatch(addTravelTip(tipInput));
        setTipInput('');
    };

    const handleRemoveTip = (index) => {
        dispatch(removeTravelTip(index));
    };

    // Guide Travel Tips Management
    const handleAddGuideTip = () => {
        if (!guideTipInput.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a guide travel tip',
                severity: 'warning'
            });
            return;
        }

        dispatch(addGuideTravelTip(guideTipInput));
        setGuideTipInput('');
    };

    const handleRemoveGuideTip = (index) => {
        dispatch(removeGuideTravelTip(index));
    };

    // Services Management
    const handleAddService = () => {
        if (!serviceInput.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a service',
                severity: 'warning'
            });
            return;
        }

        dispatch(addService(serviceInput));
        setServiceInput('');
    };

    const handleRemoveService = (index) => {
        dispatch(removeService(index));
    };

    // Safety Tips Management
    const handleAddSafetyTip = () => {
        if (!safetyTipInput.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a safety tip',
                severity: 'warning'
            });
            return;
        }

        dispatch(addSafetyTip(safetyTipInput));
        setSafetyTipInput('');
    };

    const handleRemoveSafetyTip = (index) => {
        dispatch(removeSafetyTip(index));
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.title.trim()) errors.title = 'Blog title is required';
        if (!formData.category) errors.category = 'Category is required';
        if (!formData.date) errors.date = 'Date is required';
        if (!formData.readTime.trim()) errors.readTime = 'Read time is required';
        if (!formData.excerpt.trim()) errors.excerpt = 'Excerpt is required';
        else if (formData.excerpt.trim().length < 20) errors.excerpt = 'Excerpt should be at least 20 characters';
        if (!formData.image) errors.image = 'Image is required';
        
        if (!formData.content.introduction.trim()) {
            errors.introduction = 'Introduction is required';
        } else if (formData.content.introduction.trim().length < 50) {
            errors.introduction = 'Introduction should be at least 50 characters';
        }

        if (formData.content.topPlaces.length === 0) {
            errors.topPlaces = 'At least one top place is required';
        }

        if (!formData.content.bestTimeToVisit.trim()) {
            errors.bestTimeToVisit = 'Best time to visit is required';
        }

        if (formData.content.travelTips.length === 0) {
            errors.travelTips = 'At least one travel tip is required';
        }

        if (!formData.content.cuisine.trim()) {
            errors.cuisine = 'Cuisine information is required';
        }

        if (!formData.content.conclusion.trim()) {
            errors.conclusion = 'Conclusion is required';
        }

        // Travel Guide Section
        if (!formData.content.travelGuide.bestTime.trim()) {
            errors.guideBestTime = 'Guide best time is required';
        }
        if (formData.content.travelGuide.travelTips.length === 0) {
            errors.guideTravelTips = 'At least one guide travel tip is required';
        }
        if (!formData.content.travelGuide.whyChoose.trim()) {
            errors.whyChoose = 'Why choose us text is required';
        }
        if (formData.content.travelGuide.services.length === 0) {
            errors.services = 'At least one service is required';
        }
        if (formData.content.travelGuide.safetyTips.length === 0) {
            errors.safetyTips = 'At least one safety tip is required';
        }
        if (!formData.content.travelGuide.finalNote.trim()) {
            errors.finalNote = 'Final note is required';
        }

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please fill all required fields correctly',
                severity: 'error'
            });
            return;
        }

        // Create FormData for file upload
        const formDataToSend = new FormData();
        
        // Prepare blog data
        const blogData = {
            id: formData.id,
            slug: formData.slug,
            category: formData.category,
            title: formData.title,
            date: formData.date,
            readTime: formData.readTime,
            excerpt: formData.excerpt,
            content: formData.content
        };
        
        formDataToSend.append('blogData', JSON.stringify(blogData));
        
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        const result = await dispatch(createBlog(formDataToSend));
        
        if (createBlog.fulfilled.match(result)) {
            setSnackbar({
                open: true,
                message: 'Blog post created successfully!',
                severity: 'success'
            });
            
            // Reset form
            dispatch(resetForm());
            setImagePreviewLocal(null);
            setActiveTab(0);
        } else {
            setSnackbar({
                open: true,
                message: result.payload || 'Failed to create blog post',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const isLoading = status === 'loading';

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
                        Create New Travel Blog Post
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Share your travel experiences with detailed information, destinations, and tips
                    </Typography>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="blog form tabs">
                            <Tab label="Basic Information" />
                            <Tab label="Main Content" />
                            <Tab label="Travel Guide" />
                        </Tabs>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Tab 1: Basic Information */}
                            {activeTab === 0 && (
                                <>
                                    <Grid size={{xs:12}}>
                                        <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                                            Basic Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Blog Title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                        />
                                    </Grid>

                                    <Grid size={{xs:12, md:6}}>
                                        <TextField
                                            fullWidth
                                            label="Blog ID (Auto-generated)"
                                            name="id"
                                            value={formData.id}
                                            variant="outlined"
                                            disabled
                                        />
                                    </Grid>

                                    <Grid size={{xs:12, md:6}}>
                                        <TextField
                                            fullWidth
                                            label="Slug (Auto-generated)"
                                            name="slug"
                                            value={formData.slug}
                                            variant="outlined"
                                            disabled
                                        />
                                    </Grid>

                                    <Grid size={{xs:12, md:6}}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                name="category"
                                                value={formData.category}
                                                label="Category"
                                                onChange={handleInputChange}
                                            >
                                                {categories.map((cat) => (
                                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid size={{xs:12, md:6}}>
                                        <DatePicker
                                            label="Publication Date"
                                            value={formData.date}
                                            onChange={handleDateChange}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Read Time"
                                            name="readTime"
                                            value={formData.readTime}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            placeholder="6 min read"
                                        />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Excerpt"
                                            name="excerpt"
                                            value={formData.excerpt}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            placeholder="Brief description that appears on blog cards..."
                                        />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                                            Featured Image *
                                        </Typography>
                                        <FormControl fullWidth>
                                            <Box>
                                                {!imagePreview ? (
                                                    <Button
                                                        component="label"
                                                        variant="outlined"
                                                        startIcon={<CloudUploadIcon />}
                                                        sx={{ height: 56 }}
                                                        fullWidth
                                                    >
                                                        Upload Blog Image
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                        />
                                                    </Button>
                                                ) : (
                                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: 300,
                                                                borderRadius: 8,
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                        <IconButton
                                                            onClick={handleRemoveImage}
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                bgcolor: 'rgba(255,255,255,0.8)',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(255,255,255,0.9)'
                                                                }
                                                            }}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                            </Box>
                                        </FormControl>
                                    </Grid>
                                </>
                            )}

                            {/* Tab 2: Main Content */}
                            {activeTab === 1 && (
                                <>
                                    <Grid size={{xs:12}}>
                                        <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                                            Main Content
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Introduction"
                                            name="content.introduction"
                                            value={formData.content.introduction}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={4}
                                            variant="outlined"
                                            placeholder="Write an engaging introduction about the destination..."
                                        />
                                    </Grid>

                                    {/* Top Places Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Top Places {formData.content.topPlaces.length > 0 && 
                                                        `(${formData.content.topPlaces.length} added)`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Add New Place
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{xs:12, md:5}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Place Title"
                                                                value={placeInput.title}
                                                                onChange={(e) => setPlaceInput({
                                                                    ...placeInput,
                                                                    title: e.target.value
                                                                })}
                                                                placeholder="e.g., Munnar"
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12, md:7}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Description"
                                                                value={placeInput.desc}
                                                                onChange={(e) => setPlaceInput({
                                                                    ...placeInput,
                                                                    desc: e.target.value
                                                                })}
                                                                placeholder="Brief description..."
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12}}>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddIcon />}
                                                                onClick={handleAddPlace}
                                                                size="small"
                                                            >
                                                                Add Place
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                {formData.content.topPlaces.length > 0 ? (
                                                    <Stack spacing={2}>
                                                        {formData.content.topPlaces.map((place, index) => (
                                                            <Card key={index} variant="outlined">
                                                                <CardContent>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <Box>
                                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                                {place.title}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {place.desc}
                                                                            </Typography>
                                                                        </Box>
                                                                        <IconButton 
                                                                            size="small" 
                                                                            color="error"
                                                                            onClick={() => handleRemovePlace(index)}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No places added yet. Use the form above to add places.
                                                    </Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Best Time to Visit"
                                            name="content.bestTimeToVisit"
                                            value={formData.content.bestTimeToVisit}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            placeholder="e.g., October to March is the best time to visit..."
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <WbSunnyIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Local Cuisine"
                                            name="content.cuisine"
                                            value={formData.content.cuisine}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            placeholder="Describe the local food and must-try dishes..."
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <RestaurantIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Travel Tips Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Travel Tips {formData.content.travelTips.length > 0 && 
                                                        `(${formData.content.travelTips.length} added)`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Add Travel Tip
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{xs:12}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Travel Tip"
                                                                value={tipInput}
                                                                onChange={(e) => setTipInput(e.target.value)}
                                                                placeholder="e.g., Carry light cotton clothes"
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12}}>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddIcon />}
                                                                onClick={handleAddTip}
                                                                size="small"
                                                            >
                                                                Add Tip
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                {formData.content.travelTips.length > 0 ? (
                                                    <Stack spacing={1}>
                                                        {formData.content.travelTips.map((tip, index) => (
                                                            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="body2">
                                                                        {index + 1}. {tip}
                                                                    </Typography>
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleRemoveTip(index)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No travel tips added yet.
                                                    </Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Conclusion"
                                            name="content.conclusion"
                                            value={formData.content.conclusion}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            placeholder="Write a compelling conclusion..."
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Tab 3: Travel Guide */}
                            {activeTab === 2 && (
                                <>
                                    <Grid size={{xs:12}}>
                                        <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                                            Travel Guide
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Guide - Best Time to Visit"
                                            name="content.travelGuide.bestTime"
                                            value={formData.content.travelGuide.bestTime}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            placeholder="e.g., October to March offers pleasant weather for travel"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <WbSunnyIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Guide Travel Tips */}
                                    <Grid size={{xs:12}}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Guide Travel Tips {formData.content.travelGuide.travelTips.length > 0 && 
                                                        `(${formData.content.travelGuide.travelTips.length} added)`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Add Guide Travel Tip
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{xs:12}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Guide Travel Tip"
                                                                value={guideTipInput}
                                                                onChange={(e) => setGuideTipInput(e.target.value)}
                                                                placeholder="e.g., Carry raincoat during monsoon"
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12}}>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddIcon />}
                                                                onClick={handleAddGuideTip}
                                                                size="small"
                                                            >
                                                                Add Guide Tip
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                {formData.content.travelGuide.travelTips.length > 0 ? (
                                                    <Stack spacing={1}>
                                                        {formData.content.travelGuide.travelTips.map((tip, index) => (
                                                            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="body2">
                                                                        {index + 1}. {tip}
                                                                    </Typography>
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleRemoveGuideTip(index)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No guide travel tips added yet.
                                                    </Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Why Choose Us"
                                            name="content.travelGuide.whyChoose"
                                            value={formData.content.travelGuide.whyChoose}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            placeholder="e.g., Our travel agency creates personalized tour packages"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <HandshakeIcon color="primary" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Services Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Services {formData.content.travelGuide.services.length > 0 && 
                                                        `(${formData.content.travelGuide.services.length} added)`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Add Service
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{xs:12}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Service"
                                                                value={serviceInput}
                                                                onChange={(e) => setServiceInput(e.target.value)}
                                                                placeholder="e.g., Custom tour packages"
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <MiscellaneousServicesIcon color="primary" />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12}}>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddIcon />}
                                                                onClick={handleAddService}
                                                                size="small"
                                                            >
                                                                Add Service
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                {formData.content.travelGuide.services.length > 0 ? (
                                                    <Stack spacing={1}>
                                                        {formData.content.travelGuide.services.map((service, index) => (
                                                            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="body2">
                                                                        • {service}
                                                                    </Typography>
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleRemoveService(index)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No services added yet.
                                                    </Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    {/* Safety Tips Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Safety Tips {formData.content.travelGuide.safetyTips.length > 0 && 
                                                        `(${formData.content.travelGuide.safetyTips.length} added)`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Add Safety Tip
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{xs:12}}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Safety Tip"
                                                                value={safetyTipInput}
                                                                onChange={(e) => setSafetyTipInput(e.target.value)}
                                                                placeholder="e.g., Avoid swimming in unguarded beaches"
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <SecurityIcon color="primary" />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid size={{xs:12}}>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddIcon />}
                                                                onClick={handleAddSafetyTip}
                                                                size="small"
                                                            >
                                                                Add Safety Tip
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>

                                                {formData.content.travelGuide.safetyTips.length > 0 ? (
                                                    <Stack spacing={1}>
                                                        {formData.content.travelGuide.safetyTips.map((tip, index) => (
                                                            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="body2">
                                                                        {index + 1}. {tip}
                                                                    </Typography>
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleRemoveSafetyTip(index)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No safety tips added yet.
                                                    </Typography>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    <Grid size={{xs:12}}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Final Note"
                                            name="content.travelGuide.finalNote"
                                            value={formData.content.travelGuide.finalNote}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            placeholder="e.g., The memories of this destination will stay with you forever"
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Navigation and Submit Buttons */}
                            <Grid size={{xs:12}}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                                        disabled={activeTab === 0}
                                    >
                                        Previous
                                    </Button>
                                    
                                    {activeTab < 2 ? (
                                        <Button
                                            variant="contained"
                                            onClick={() => setActiveTab(prev => Math.min(2, prev + 1))}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={isLoading}
                                            sx={{
                                                py: 1.5,
                                                px: 4,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            {isLoading ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : (
                                                'Publish Blog Post'
                                            )}
                                        </Button>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
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
            </Box>
        </LocalizationProvider>
    );
};

export default PostBlogForm;