// src/components/PostBlog.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    Chip,
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
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SecurityIcon from '@mui/icons-material/Security';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';

// Import Redux actions and selectors
import {
    createBlog,
    updateBlog,
    getBlogByIdentifier,
    selectCurrentBlog,
    selectBlogStatus,
    selectBlogError,
    clearCurrentBlog
} from '../../../../../../features/blog/blogSlice';

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

const PostBlogFormEdit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    
    // Get edit data from location state
    const editData = location.state?.blog;
    const isEditing = location.state?.isEditing || false;
    const editId = location.state?.blog?._id || null;

    // Redux state
    const currentBlog = useSelector(selectCurrentBlog);
    const status = useSelector(selectBlogStatus);
    const error = useSelector(selectBlogError);
    const isLoading = status === 'loading';

    const [activeTab, setActiveTab] = useState(0);
    
    const [formData, setFormData] = useState({
        id: '',
        slug: '',
        category: '',
        subCategory:'',
        title: '',
        date: null,
        readTime: '',
        excerpt: '',
        image: null,
        content: {
            introduction: '',
            topPlaces: [],
            bestTimeToVisit: '',
            travelTips: [],
            cuisine: '',
            conclusion: '',
            travelGuide: {
                bestTime: '',
                travelTips: [],
                whyChoose: '',
                services: [],
                safetyTips: [],
                finalNote: ''
            }
        }
    });

    const [placeInput, setPlaceInput] = useState({
        title: '',
        desc: ''
    });

    const [tipInput, setTipInput] = useState('');
    const [guideTipInput, setGuideTipInput] = useState('');
    const [serviceInput, setServiceInput] = useState('');
    const [safetyTipInput, setSafetyTipInput] = useState('');
    
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const categories = ['Domestic', 'International'];
    
    const subCategories = [
        'Hill Stations',
        'Beach Destinations',
        'Cultural Tours',
        'Adventure Travel',
        'Honeymoon Packages',
        'Family Tours',
        'Luxury Travel',
        'Wildlife Safari',
        'Religious Tours'
    ];

    // Fetch blog data if editing
    useEffect(() => {
        if (isEditing && editId) {
            dispatch(getBlogByIdentifier(editId));
        }
        return () => {
            dispatch(clearCurrentBlog());
        };
    }, [dispatch, isEditing, editId]);

    // Populate form when blog data is loaded
    useEffect(() => {
        if (isEditing && currentBlog) {
            // Parse the date string back to Date object
            let parsedDate = null;
            if (currentBlog.date) {
                const date = new Date(currentBlog.date);
                if (!isNaN(date.getTime())) {
                    parsedDate = date;
                }
            }

            setFormData({
                id: currentBlog.id || '',
                slug: currentBlog.slug || '',
                category: currentBlog.category || '',
                subCategory: currentBlog.subCategory || '',

                title: currentBlog.title || '',
                date: parsedDate,
                readTime: currentBlog.readTime || '',
                excerpt: currentBlog.excerpt || '',
                image: currentBlog.image?.url || null,
                content: {
                    introduction: currentBlog.content?.introduction || '',
                    topPlaces: currentBlog.content?.topPlaces || [],
                    bestTimeToVisit: currentBlog.content?.bestTimeToVisit || '',
                    travelTips: currentBlog.content?.travelTips || [],
                    cuisine: currentBlog.content?.cuisine || '',
                    conclusion: currentBlog.content?.conclusion || '',
                    travelGuide: {
                        bestTime: currentBlog.content?.travelGuide?.bestTime || '',
                        travelTips: currentBlog.content?.travelGuide?.travelTips || [],
                        whyChoose: currentBlog.content?.travelGuide?.whyChoose || '',
                        services: currentBlog.content?.travelGuide?.services || [],
                        safetyTips: currentBlog.content?.travelGuide?.safetyTips || [],
                        finalNote: currentBlog.content?.travelGuide?.finalNote || ''
                    }
                }
            });

            // Set image preview if image exists
            if (currentBlog.image?.url) {
                setImagePreview(currentBlog.image.url);
            }
        }
    }, [isEditing, currentBlog]);

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
            setFormData(prev => ({
                ...prev,
                [name]: value,
                id: generatedId,
                slug: generatedId
            }));
        } else if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;
                setFormData(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value
                    }
                }));
            } else if (parts.length === 3) {
                const [parent, child, grandChild] = parts;
                setFormData(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: {
                            ...prev[parent][child],
                            [grandChild]: value
                        }
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleDateChange = (newDate) => {
        setFormData(prev => ({
            ...prev,
            date: newDate
        }));
        if (errors.date) {
            setErrors(prev => ({
                ...prev,
                date: ''
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({
                    ...prev,
                    image: 'Please upload an image file'
                }));
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    image: 'Image size should be less than 5MB'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                image: file
            }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            if (errors.image) {
                setErrors(prev => ({
                    ...prev,
                    image: ''
                }));
            }
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null
        }));
        setImagePreview(null);
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

        const newPlace = {
            title: placeInput.title,
            desc: placeInput.desc
        };

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                topPlaces: [...prev.content.topPlaces, newPlace]
            }
        }));

        setPlaceInput({ title: '', desc: '' });
    };

    const handleRemovePlace = (index) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                topPlaces: prev.content.topPlaces.filter((_, i) => i !== index)
            }
        }));
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

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelTips: [...prev.content.travelTips, tipInput]
            }
        }));

        setTipInput('');
    };

    const handleRemoveTip = (index) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelTips: prev.content.travelTips.filter((_, i) => i !== index)
            }
        }));
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

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    travelTips: [...prev.content.travelGuide.travelTips, guideTipInput]
                }
            }
        }));

        setGuideTipInput('');
    };

    const handleRemoveGuideTip = (index) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    travelTips: prev.content.travelGuide.travelTips.filter((_, i) => i !== index)
                }
            }
        }));
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

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    services: [...prev.content.travelGuide.services, serviceInput]
                }
            }
        }));

        setServiceInput('');
    };

    const handleRemoveService = (index) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    services: prev.content.travelGuide.services.filter((_, i) => i !== index)
                }
            }
        }));
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

        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    safetyTips: [...prev.content.travelGuide.safetyTips, safetyTipInput]
                }
            }
        }));

        setSafetyTipInput('');
    };

    const handleRemoveSafetyTip = (index) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                travelGuide: {
                    ...prev.content.travelGuide,
                    safetyTips: prev.content.travelGuide.safetyTips.filter((_, i) => i !== index)
                }
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Blog title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.subCategory) newErrors.subCategory = 'Sub Category is required';

        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.readTime.trim()) newErrors.readTime = 'Read time is required';
        if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
        else if (formData.excerpt.trim().length < 20) newErrors.excerpt = 'Excerpt should be at least 20 characters';
        if (!formData.image) newErrors.image = 'Image is required';
        
        if (!formData.content.introduction.trim()) {
            newErrors['content.introduction'] = 'Introduction is required';
        } else if (formData.content.introduction.trim().length < 50) {
            newErrors['content.introduction'] = 'Introduction should be at least 50 characters';
        }

        if (formData.content.topPlaces.length === 0) {
            newErrors.topPlaces = 'At least one top place is required';
        }

        if (!formData.content.bestTimeToVisit.trim()) {
            newErrors['content.bestTimeToVisit'] = 'Best time to visit is required';
        }

        if (formData.content.travelTips.length === 0) {
            newErrors.travelTips = 'At least one travel tip is required';
        }

        if (!formData.content.cuisine.trim()) {
            newErrors['content.cuisine'] = 'Cuisine information is required';
        }

        if (!formData.content.conclusion.trim()) {
            newErrors['content.conclusion'] = 'Conclusion is required';
        }

        // Travel Guide Section
        if (!formData.content.travelGuide.bestTime.trim()) {
            newErrors['content.travelGuide.bestTime'] = 'Guide best time is required';
        }
        if (formData.content.travelGuide.travelTips.length === 0) {
            newErrors.guideTravelTips = 'At least one guide travel tip is required';
        }
        if (!formData.content.travelGuide.whyChoose.trim()) {
            newErrors['content.travelGuide.whyChoose'] = 'Why choose us text is required';
        }
        if (formData.content.travelGuide.services.length === 0) {
            newErrors.services = 'At least one service is required';
        }
        if (formData.content.travelGuide.safetyTips.length === 0) {
            newErrors.safetyTips = 'At least one safety tip is required';
        }
        if (!formData.content.travelGuide.finalNote.trim()) {
            newErrors['content.travelGuide.finalNote'] = 'Final note is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
        
        // Format the date
        const formattedDate = formData.date instanceof Date 
            ? formData.date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }).replace(/ /g, ' ')
            : formData.date;

        // Prepare blog data
        const blogData = {
            id: formData.id,
            slug: formData.slug,
            category: formData.category,
            subCategory:formData.subCategory,
            title: formData.title,
            date: formattedDate,
            readTime: formData.readTime,
            excerpt: formData.excerpt,
            content: formData.content
        };
        
        formDataToSend.append('blogData', JSON.stringify(blogData));
        
        // Append image if it's a new file (not a URL from edit)
        if (formData.image && typeof formData.image !== 'string') {
            formDataToSend.append('image', formData.image);
        }

        let result;
        if (isEditing && editId) {
            // Update existing blog
            result = await dispatch(updateBlog({ id: editId, formData: formDataToSend }));
        } else {
            // Create new blog
            result = await dispatch(createBlog(formDataToSend));
        }
        
        if ((isEditing && updateBlog.fulfilled.match(result)) || 
            (!isEditing && createBlog.fulfilled.match(result))) {
            setSnackbar({
                open: true,
                message: isEditing ? 'Blog post updated successfully!' : 'Blog post created successfully!',
                severity: 'success'
            });

            if (!isEditing) {
                // Reset form for new post
                setFormData({
                    id: '',
                    slug: '',
                    category: '',
                    subCategory:'',
                    title: '',
                    date: null,
                    readTime: '',
                    excerpt: '',
                    image: null,
                    content: {
                        introduction: '',
                        topPlaces: [],
                        bestTimeToVisit: '',
                        travelTips: [],
                        cuisine: '',
                        conclusion: '',
                        travelGuide: {
                            bestTime: '',
                            travelTips: [],
                            whyChoose: '',
                            services: [],
                            safetyTips: [],
                            finalNote: ''
                        }
                    }
                });
                setImagePreview(null);
                setActiveTab(0);
            } else {
                // Navigate back to blog list after successful update
                setTimeout(() => {
                   navigate('/profile?activeTab=blog');
                }, 2000);
            }
        } else {
            setSnackbar({
                open: true,
                message: result?.payload || `Failed to ${isEditing ? 'update' : 'create'} blog post`,
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

    const handleCancel = () => {
       navigate('/profile?activeTab=blog');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    {/* Header with Back Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" fontWeight={600} color="primary">
                            {isEditing ? 'Edit Travel Blog Post' : 'Create New Travel Blog Post'}
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {isEditing 
                            ? 'Update your travel blog post with detailed information, destinations, and tips' 
                            : 'Share your travel experiences with detailed information, destinations, and tips'
                        }
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
                                    <Grid size={{xs:12}} >
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
                                            error={!!errors.title}
                                            helperText={errors.title}
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
                                        <FormControl fullWidth required error={!!errors.category}>
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
                                            {errors.category && (
                                                <FormHelperText>{errors.category}</FormHelperText>
                                            )}
                                        </FormControl>
                                        <FormControl fullWidth required error={!!errors.subCategory}>
    <InputLabel>Sub Category</InputLabel>
    <Select
        name="subCategory"
        value={formData.subCategory}
        label="Sub Category"
        onChange={handleInputChange}
    >
        {subCategories.map((sub) => (
            <MenuItem key={sub} value={sub}>
                {sub}
            </MenuItem>
        ))}
    </Select>
    {errors.subCategory && (
        <FormHelperText>{errors.subCategory}</FormHelperText>
    )}
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
                                                    required: true,
                                                    error: !!errors.date,
                                                    helperText: errors.date
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
                                            error={!!errors.readTime}
                                            helperText={errors.readTime || "e.g., 6 min read"}
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
                                            error={!!errors.excerpt}
                                            helperText={errors.excerpt || "A brief summary of the blog post"}
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
                                        <FormControl fullWidth error={!!errors.image}>
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
                                            {errors.image && (
                                                <FormHelperText>{errors.image}</FormHelperText>
                                            )}
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
                                            error={!!errors['content.introduction']}
                                            helperText={errors['content.introduction']}
                                            multiline
                                            rows={4}
                                            variant="outlined"
                                            placeholder="Write an engaging introduction about the destination..."
                                        />
                                    </Grid>

                                    {/* Top Places Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion defaultExpanded={formData.content.topPlaces.length > 0}>
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
                                                {errors.topPlaces && (
                                                    <FormHelperText error>{errors.topPlaces}</FormHelperText>
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
                                            error={!!errors['content.bestTimeToVisit']}
                                            helperText={errors['content.bestTimeToVisit']}
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
                                            error={!!errors['content.cuisine']}
                                            helperText={errors['content.cuisine']}
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
                                        <Accordion defaultExpanded={formData.content.travelTips.length > 0}>
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
                                                {errors.travelTips && (
                                                    <FormHelperText error>{errors.travelTips}</FormHelperText>
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
                                            error={!!errors['content.conclusion']}
                                            helperText={errors['content.conclusion']}
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
                                            error={!!errors['content.travelGuide.bestTime']}
                                            helperText={errors['content.travelGuide.bestTime']}
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
                                        <Accordion defaultExpanded={formData.content.travelGuide.travelTips.length > 0}>
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
                                                {errors.guideTravelTips && (
                                                    <FormHelperText error>{errors.guideTravelTips}</FormHelperText>
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
                                            error={!!errors['content.travelGuide.whyChoose']}
                                            helperText={errors['content.travelGuide.whyChoose']}
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
                                        <Accordion defaultExpanded={formData.content.travelGuide.services.length > 0}>
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
                                                {errors.services && (
                                                    <FormHelperText error>{errors.services}</FormHelperText>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>

                                    {/* Safety Tips Section */}
                                    <Grid size={{xs:12}}>
                                        <Accordion defaultExpanded={formData.content.travelGuide.safetyTips.length > 0}>
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
                                                {errors.safetyTips && (
                                                    <FormHelperText error>{errors.safetyTips}</FormHelperText>
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
                                            error={!!errors['content.travelGuide.finalNote']}
                                            helperText={errors['content.travelGuide.finalNote']}
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
                                    <Box>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancel}
                                            sx={{ mr: 2 }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                                            disabled={activeTab === 0}
                                        >
                                            Previous
                                        </Button>
                                    </Box>
                                    
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
                                                isEditing ? 'Update Blog Post' : 'Publish Blog Post'
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

export default PostBlogFormEdit;