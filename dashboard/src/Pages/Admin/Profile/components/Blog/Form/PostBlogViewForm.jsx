// src/components/ViewBlog.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Stack,
    Divider,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Button,
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SecurityIcon from '@mui/icons-material/Security';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    getBlogByIdentifier,
    selectCurrentBlog,
    selectBlogLoading,
    selectBlogError,
    clearCurrentBlog
} from '../../../../../../features/blog/blogSlice';

const ViewBlog = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Redux state
    const blog = useSelector(selectCurrentBlog);
    const loading = useSelector(selectBlogLoading);
    const error = useSelector(selectBlogError);

    useEffect(() => {
        if (slug) {
            dispatch(getBlogByIdentifier(slug));
        }
        
        return () => {
            dispatch(clearCurrentBlog());
        };
    }, [dispatch, slug]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !blog) {
        return (
            <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, textAlign: 'center' }}>
                <Typography variant="h5" color="error" gutterBottom>
                    {error || 'Blog post not found'}
                </Typography>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/profile?activeTab=blog')}

                    sx={{ mt: 2 }}
                >
                    Back to Blogs
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/latestblogs')}
                sx={{ mb: 2 }}
            >
                Back to Blogs
            </Button>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
                        {blog.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                        <Chip
                            icon={<CategoryIcon />}
                            label={blog.category}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<CalendarTodayIcon />}
                            label={blog.date}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<AccessTimeIcon />}
                            label={blog.readTime}
                            variant="outlined"
                            size="small"
                        />
                    </Stack>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                        {blog.excerpt}
                    </Typography>

                    {/* Featured Image */}
                    {blog.image?.url && (
                        <Box
                            component="img"
                            src={blog.image.url}
                            alt={blog.title}
                            sx={{
                                width: '100%',
                                maxHeight: 500,
                                objectFit: 'cover',
                                borderRadius: 2,
                                mb: 3
                            }}
                        />
                    )}

                    <Divider sx={{ my: 3 }} />
                </Box>

                {/* Main Content */}
                <Grid container spacing={4}>
                    {/* Introduction */}
                    <Grid size={{xs:12}}>
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                            Introduction
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {blog.content?.introduction}
                        </Typography>
                    </Grid>

                    {/* Top Places */}
                    {blog.content?.topPlaces?.length > 0 && (
                        <Grid size={{xs:12}}>
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Top Places to Visit
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack spacing={2}>
                                        {blog.content.topPlaces.map((place, index) => (
                                            <Card key={index} variant="outlined">
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                            <LocationOnIcon />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {place.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {place.desc}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    )}

                    {/* Best Time to Visit */}
                    {blog.content?.bestTimeToVisit && (
                        <Grid size={{xs:12}}>
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <WbSunnyIcon fontSize="large" />
                                    <Typography variant="h6" fontWeight={600}>
                                        Best Time to Visit
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {blog.content.bestTimeToVisit}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Travel Tips */}
                    {blog.content?.travelTips?.length > 0 && (
                        <Grid size={{xs:12}}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Travel Tips
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack spacing={1}>
                                        {blog.content.travelTips.map((tip, index) => (
                                            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                <TipsAndUpdatesIcon color="primary" fontSize="small" />
                                                <Typography variant="body2">{tip}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    )}

                    {/* Cuisine */}
                    {blog.content?.cuisine && (
                        <Grid size={{xs:12}}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <RestaurantIcon color="primary" fontSize="large" />
                                    <Typography variant="h6" fontWeight={600}>
                                        Local Cuisine
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {blog.content.cuisine}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Travel Guide Section */}
                    {blog.content?.travelGuide && (
                        <Grid size={{xs:12}}>
                            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                                Travel Guide
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                {/* Guide Best Time */}
                                {blog.content.travelGuide.bestTime && (
                                    <Grid size={{xs:12}}>
                                        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <WbSunnyIcon />
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    Best Time: {blog.content.travelGuide.bestTime}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Guide Travel Tips */}
                                {blog.content.travelGuide.travelTips?.length > 0 && (
                                    <Grid size={{xs:12, md:6}}>
                                        <Card variant="outlined" sx={{ height: '100%' }}>
                                            <CardContent>
                                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                                    Travel Tips
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {blog.content.travelGuide.travelTips.map((tip, index) => (
                                                        <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                                                            <TipsAndUpdatesIcon color="primary" fontSize="small" />
                                                            <Typography variant="body2">{tip}</Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Safety Tips */}
                                {blog.content.travelGuide.safetyTips?.length > 0 && (
                                    <Grid size={{xs:12, md:6}}>
                                        <Card variant="outlined" sx={{ height: '100%' }}>
                                            <CardContent>
                                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                                    Safety Tips
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {blog.content.travelGuide.safetyTips.map((tip, index) => (
                                                        <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                                                            <SecurityIcon color="primary" fontSize="small" />
                                                            <Typography variant="body2">{tip}</Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Why Choose Us */}
                                {blog.content.travelGuide.whyChoose && (
                                    <Grid size={{xs:12}}>
                                        <Paper variant="outlined" sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <HandshakeIcon color="primary" />
                                                <Typography variant="h6" fontWeight={600}>
                                                    Why Choose Us
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1">
                                                {blog.content.travelGuide.whyChoose}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Services */}
                                {blog.content.travelGuide.services?.length > 0 && (
                                    <Grid size={{xs:12}}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                                    Our Services
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {blog.content.travelGuide.services.map((service, index) => (
                                                        <Grid size={{xs:12, sm:6}} key={index}>
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                <MiscellaneousServicesIcon color="primary" fontSize="small" />
                                                                <Typography variant="body2">{service}</Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Final Note */}
                                {blog.content.travelGuide.finalNote && (
                                    <Grid size={{xs:12}}>
                                        <Paper 
                                            elevation={0} 
                                            sx={{ 
                                                p: 3, 
                                                bgcolor: 'grey.100', 
                                                borderRadius: 2,
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Typography variant="body1" fontStyle="italic">
                                                "{blog.content.travelGuide.finalNote}"
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    )}

                    {/* Conclusion */}
                    {blog.content?.conclusion && (
                        <Grid size={{xs:12}}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Conclusion
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {blog.content.conclusion}
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                {/* Footer Metadata */}
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                        <Grid size={{xs:12, sm:6}}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Blog ID:</strong> {blog.id || blog._id}
                            </Typography>
                        </Grid>
                        <Grid size={{xs:12, sm:6}}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Slug:</strong> {blog.slug}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
};

export default ViewBlog;