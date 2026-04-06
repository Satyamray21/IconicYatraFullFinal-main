// src/Components/SpecialPackageDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Button,
    Fab,
    AppBar,
    Toolbar,
    IconButton,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import {
    Favorite,
    Share,
    LocationOn,
    CalendarToday,
    AccessTime,
    AttachMoney,
    Hotel,
    Restaurant,
    DirectionsCar,
    BeachAccess,
    ExpandMore,
    ArrowBack,
    Bookmark,
    BookmarkBorder,
    FlightTakeoff,
    WbSunny,
    CheckCircle,
    Cancel,
} from "@mui/icons-material";
import { fetchPackageById, clearSelected, clearError } from "../Features/packageSlice";

const SpecialPackageDetail = () => {
    const { packageId } = useParams();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const { selected: packageData, loading, error } = useSelector((state) => state.packages);

    useEffect(() => {
        if (packageId) {
            dispatch(fetchPackageById(packageId));
        }

        return () => {
            dispatch(clearSelected());
            dispatch(clearError());
        };
    }, [dispatch, packageId]);

    // Format duration from stayLocations
    const formatDuration = (pkg) => {
        if (pkg?.stayLocations && pkg.stayLocations.length > 0) {
            const totalNights = pkg.stayLocations.reduce((sum, location) => sum + (location.nights || 0), 0);
            const totalDays = totalNights + 1;
            return `${totalDays}D/${totalNights}N`;
        }
        return "Flexible";
    };

    // Format price
    const formatPrice = (price) => {
        if (!price) return "Custom Quote";
        return `₹${price.toLocaleString()}`;
    };

    // Parse HTML content from policy
    const parseHtmlContent = (htmlString) => {
        return { __html: htmlString };
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
    };

    if (loading) {
        return (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}>
                <Box sx={{ textAlign: "center", color: "white" }}>
                    <CircularProgress sx={{ color: "white", mb: 2 }} />
                    <Typography variant="h6" fontWeight="300">
                        Loading Amazing Package...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
            }}>
                <Alert
                    severity="error"
                    sx={{
                        maxWidth: 400,
                        borderRadius: 3,
                        boxShadow: 3
                    }}
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!packageData) {
        return (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}>
                <Box sx={{ textAlign: "center", color: "white" }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        ✈️
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Package Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        The package you're looking for doesn't exist.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ background: "linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)", minHeight: "100vh" }}>
            {/* Header with Back Button */}
            <AppBar
                position="sticky"
                sx={{
                    background: "transparent",
                    boxShadow: "none",
                    backdropFilter: "blur(10px)",
                    backgroundColor: "rgba(255,255,255,0.9)"
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        sx={{
                            color: "text.primary",
                            mr: 2
                        }}
                        onClick={() => window.history.back()}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                        Package Details
                    </Typography>
                    <IconButton onClick={handleBookmark} sx={{ mr: 1 }}>
                        {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
                    </IconButton>
                    <IconButton>
                        <Share />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{ position: "relative" }}>
                {packageData.bannerImage && (
                    <Box sx={{
                        height: { xs: "50vh", md: "60vh" },
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <CardMedia
                            component="img"
                            image={packageData.bannerImage}
                            alt={packageData.title}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "brightness(0.8)"
                            }}
                        />
                        {/* Gradient Overlay */}
                        <Box sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
                        }} />

                        {/* Package Info Overlay */}
                        <Box sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: { xs: 3, md: 5 },
                            color: "white"
                        }}>
                            <Container maxWidth="lg">
                                <Chip
                                    label={packageData.tourType}
                                    sx={{
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        backdropFilter: "blur(10px)",
                                        mb: 2
                                    }}
                                />
                                <Typography
                                    variant="h3"
                                    fontWeight="bold"
                                    sx={{
                                        fontSize: { xs: "2rem", md: "3rem" },
                                        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                                        mb: 1
                                    }}
                                >
                                    {packageData.title}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <LocationOn sx={{ mr: 0.5, fontSize: "1.2rem" }} />
                                        <Typography variant="h6" fontWeight="300">
                                            {packageData.sector}, {packageData.destinationCountry}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <AccessTime sx={{ mr: 0.5, fontSize: "1.2rem" }} />
                                        <Typography variant="h6" fontWeight="300">
                                            {formatDuration(packageData)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Container>
                        </Box>
                    </Box>
                )}

                {/* Quick Info Cards */}
                <Container maxWidth="lg" sx={{ mt: -4, position: "relative", zIndex: 2 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 3,
                                textAlign: "center",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                borderRadius: 3,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                            }}>
                                <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold">
                                    {formatPrice(packageData.price)}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Starting Price
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 3,
                                textAlign: "center",
                                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                color: "white",
                                borderRadius: 3,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                            }}>
                                <CalendarToday sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    {packageData.validFrom ? new Date(packageData.validFrom).toLocaleDateString() : "Flexible"}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Valid Till {packageData.validTill ? new Date(packageData.validTill).toLocaleDateString() : "Open"}
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{
                                p: 3,
                                textAlign: "center",
                                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                color: "white",
                                borderRadius: 3,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                            }}>
                                <FlightTakeoff sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    {packageData.arrivalCity || "Multiple"} → {packageData.departureCity || "Cities"}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Travel Route
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Navigation Tabs */}
                <Paper sx={{ mb: 4, borderRadius: 3, overflow: "hidden", boxShadow: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': {
                                py: 2,
                                fontWeight: "bold",
                                fontSize: "1rem"
                            }
                        }}
                    >
                        <Tab label="Overview" icon={<WbSunny />} iconPosition="start" />
                        <Tab label="Itinerary" icon={<AccessTime />} iconPosition="start" />
                        <Tab label="Inclusions" icon={<BeachAccess />} iconPosition="start" />
                        <Tab label="Hotels" icon={<Hotel />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* Tab Content */}
                <Box sx={{ mt: 4 }}>
                    {/* Overview Tab */}
                    {activeTab === 0 && (
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                                        About This Package
                                    </Typography>
                                    <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
                                        {packageData.notes || "Discover an unforgettable journey through breathtaking landscapes and cultural experiences. This specially curated package offers the perfect blend of adventure, relaxation, and cultural immersion."}
                                    </Typography>

                                    {/* Highlights */}
                                    <Box sx={{ mt: 4 }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            🌟 Package Highlights
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            <Grid item xs={12} sm={6}>
                                                <List>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <Hotel color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary="Luxury Accommodation"
                                                            secondary="Comfortable stays in premium hotels"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <Restaurant color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary="Gourmet Dining"
                                                            secondary={packageData.mealPlan?.planType || "All meals included"}
                                                        />
                                                    </ListItem>
                                                </List>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <List>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <DirectionsCar color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary="Comfortable Transport"
                                                            secondary="AC vehicles for all transfers"
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <BeachAccess color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary="Guided Tours"
                                                            secondary="Expert local guides"
                                                        />
                                                    </ListItem>
                                                </List>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Quick Facts
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                                                <AccessTime />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Duration"
                                                secondary={formatDuration(packageData)}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                                                <LocationOn />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Destinations"
                                                secondary={packageData.stayLocations?.map(loc => loc.city).join(", ") || packageData.sector}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                                                <Hotel />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Meal Plan"
                                                secondary={packageData.mealPlan?.planType || "As per itinerary"}
                                            />
                                        </ListItem>
                                    </List>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Itinerary Tab */}
                    {activeTab === 1 && packageData.days && packageData.days.length > 0 && (
                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
                                ✈️ Your Journey Itinerary
                            </Typography>
                            {packageData.days.map((dayItem, index) => (
                                <Card key={index} sx={{ mb: 3, borderRadius: 3, boxShadow: 3, overflow: "hidden" }}>
                                    <Grid container>
                                        {/* Day Image - Full width on mobile, side on desktop */}
                                        {dayItem.dayImage && (
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <CardMedia
                                                    component="img"
                                                    sx={{
                                                        width: "100%",
                                                        height: { xs: 200, md: "100%" },
                                                        objectFit: "cover"
                                                    }}
                                                    image={dayItem.dayImage}
                                                    alt={`Day ${index + 1}`}
                                                />
                                            </Grid>
                                        )}
                                        <Grid size={{ xs: 12, md: dayItem.dayImage ? 8 : 12 }}>
                                            <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                                    <Box sx={{
                                                        backgroundColor: "primary.main",
                                                        color: "white",
                                                        borderRadius: "50%",
                                                        width: 40,
                                                        height: 40,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        mr: 2,
                                                        fontWeight: "bold",
                                                        flexShrink: 0
                                                    }}>
                                                        {index + 1}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                            {dayItem.title || `Day ${index + 1}`}
                                                        </Typography>
                                                        {dayItem.aboutCity && (
                                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                                {dayItem.aboutCity}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                {dayItem.notes && (
                                                    <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                                                        {dayItem.notes}
                                                    </Typography>
                                                )}

                                                {dayItem.sightseeing && dayItem.sightseeing.length > 0 && (
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                            🏛️ Sightseeing Highlights:
                                                        </Typography>
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                            {dayItem.sightseeing.map((sight, sightIndex) => (
                                                                <Chip
                                                                    key={sightIndex}
                                                                    label={sight}
                                                                    variant="outlined"
                                                                    size="small"
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Grid>
                                    </Grid>
                                </Card>
                            ))}
                        </Box>
                    )}

                    {/* Inclusions Tab */}
                    {activeTab === 2 && packageData.policy && (
                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
                                📋 Package Policies & Inclusions
                            </Typography>

                            <Grid container spacing={4}>
                                {/* Inclusion Policy */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: "100%" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <CheckCircle color="success" sx={{ mr: 1 }} />
                                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                                What's Included
                                            </Typography>
                                        </Box>
                                        {packageData.policy.inclusionPolicy && packageData.policy.inclusionPolicy.map((policy, index) => (
                                            <Box key={index} sx={{ mb: 2 }}>
                                                <div dangerouslySetInnerHTML={parseHtmlContent(policy)} />
                                            </Box>
                                        ))}
                                    </Card>
                                </Grid>

                                {/* Exclusion Policy */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: "100%" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <Cancel color="error" sx={{ mr: 1 }} />
                                            <Typography variant="h5" fontWeight="bold" color="error.main">
                                                What's Not Included
                                            </Typography>
                                        </Box>
                                        {packageData.policy.exclusionPolicy && packageData.policy.exclusionPolicy.map((policy, index) => (
                                            <Box key={index} sx={{ mb: 2 }}>
                                                <div dangerouslySetInnerHTML={parseHtmlContent(policy)} />
                                            </Box>
                                        ))}
                                    </Card>
                                </Grid>

                                {/* Payment Policy */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                                            💳 Payment Policy
                                        </Typography>
                                        {packageData.policy.paymentPolicy && packageData.policy.paymentPolicy.map((policy, index) => (
                                            <Box key={index} sx={{ mb: 2 }}>
                                                <div dangerouslySetInnerHTML={parseHtmlContent(policy)} />
                                            </Box>
                                        ))}
                                    </Card>
                                </Grid>

                                {/* Cancellation Policy */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                                            ❌ Cancellation Policy
                                        </Typography>
                                        {packageData.policy.cancellationPolicy && packageData.policy.cancellationPolicy.map((policy, index) => (
                                            <Box key={index} sx={{ mb: 2 }}>
                                                <div dangerouslySetInnerHTML={parseHtmlContent(policy)} />
                                            </Box>
                                        ))}
                                    </Card>
                                </Grid>

                                {/* Terms & Conditions */}
                                {packageData.policy.termsAndConditions && (
                                    <Grid size={{ xs: 12 }}>
                                        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                                                📝 Terms & Conditions
                                            </Typography>
                                            {packageData.policy.termsAndConditions.map((term, index) => (
                                                <Box key={index} sx={{ mb: 2 }}>
                                                    <div dangerouslySetInnerHTML={parseHtmlContent(term)} />
                                                </Box>
                                            ))}
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}

                    {/* Hotels Tab */}
                    {activeTab === 3 && packageData.destinationNights && (
                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
                                🏨 Accommodation Details
                            </Typography>

                            {packageData.destinationNights.map((destination, index) => (
                                <Card key={index} sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                            <Hotel color="primary" sx={{ mr: 2 }} />
                                            <Box>
                                                <Typography variant="h5" fontWeight="bold">
                                                    {destination.destination}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    {destination.nights} Night{destination.nights > 1 ? 's' : ''} Stay
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hotel Name</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price Per Person</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {destination.hotels.map((hotel, hotelIndex) => (
                                                        <TableRow key={hotelIndex} sx={{
                                                            '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }
                                                        }}>
                                                            <TableCell>
                                                                <Chip
                                                                    label={hotel.category}
                                                                    color={
                                                                        hotel.category === 'standard' ? 'default' :
                                                                            hotel.category === 'deluxe' ? 'primary' :
                                                                                hotel.category === 'superior' ? 'secondary' : 'default'
                                                                    }
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {hotel.hotelName}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body1" fontWeight="bold" color="primary">
                                                                    ₹{hotel.pricePerPerson?.toLocaleString() || 'TBD'}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                💡 <strong>Note:</strong> Hotel selections are subject to availability. Final hotel confirmations will be provided at the time of booking.
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Box>
            </Container>

            {/* Floating Action Button */}
            <Fab
                variant="extended"
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    backgroundColor: "primary.main",
                    color: "white",
                    fontWeight: "bold",
                    px: 3,
                    '&:hover': {
                        backgroundColor: "primary.dark",
                        transform: "translateY(-2px)"
                    },
                    transition: "all 0.3s ease"
                }}
            >
                <AttachMoney sx={{ mr: 1 }} />
                Get Quote
            </Fab>
        </Box>
    );
};

export default SpecialPackageDetail;