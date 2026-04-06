import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Breadcrumbs,
  Link as MUILink,
  Chip,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack,
  CalendarToday,
  People,
  Warning,
  Schedule,
  Hotel,
  ExpandMore,
  LocalOffer,
  Info,
  Star,
  Close,
  Send
} from "@mui/icons-material";
import { fetchPackageById, clearSelected } from "../Features/packageSlice";

const PackageDetail = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);

  const { selected, loading, error } = useSelector(state => state.packages);

  // ✅ UPDATED: Better policy content extraction with numbered lists
  const getPolicyContent = (policyArray) => {
    if (!policyArray || !Array.isArray(policyArray) || policyArray.length === 0) return [];

    try {
      // Agar HTML content hai toh structured list mein convert karo
      if (policyArray[0] && typeof policyArray[0] === 'string' &&
        (policyArray[0].includes('<p>') || policyArray[0].includes('<h') || policyArray[0].includes('<ul'))) {

        const combinedHtml = policyArray.join(' ');

        // HTML se content extract karo
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = combinedHtml;

        const extractedItems = [];

        // <li> tags extract karo
        const listItems = tempDiv.querySelectorAll('li');
        if (listItems.length > 0) {
          listItems.forEach(li => {
            const text = li.textContent.trim();
            if (text) extractedItems.push(text);
          });
        }

        // <p> tags extract karo
        if (extractedItems.length === 0) {
          const paragraphs = tempDiv.querySelectorAll('p');
          paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text && !text.startsWith('<') && text.length > 10) {
              extractedItems.push(text);
            }
          });
        }

        // Agar kuch nahi mila toh direct text extract karo
        if (extractedItems.length === 0) {
          const plainText = combinedHtml
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .split(/\n|\.\s+/)
            .filter(item => item.trim().length > 10);

          extractedItems.push(...plainText);
        }

        return extractedItems.filter(item => item && item.trim().length > 0);
      }

      // Agar plain text array hai toh directly return karo
      return policyArray.filter(item => item && String(item).trim().length > 0);

    } catch (error) {
      console.error('Error processing policy content:', error);
      // Fallback: Simple text extraction
      return policyArray.map(item =>
        String(item).replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim()
      ).filter(text => text.length > 0);
    }
  };

  // Tab Panel Component - ✅ MOVED inside component
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`package-tabpanel-${index}`}
      aria-labelledby={`package-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  useEffect(() => {
    if (packageId) {
      dispatch(fetchPackageById(packageId));
    }
    return () => {
      dispatch(clearSelected());
    };
  }, [dispatch, packageId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleQueryOpen = () => {
    setQueryDialogOpen(true);
  };

  const handleQueryClose = () => {
    setQueryDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBackClick} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!selected) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBackClick} sx={{ mb: 2 }}>
          Back
        </Button>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" color="error" gutterBottom>
            Package Not Found
          </Typography>
          <Button variant="contained" component={Link} to="/domestic">
            Browse All Packages
          </Button>
        </Paper>
      </Container>
    );
  }

  // ✅ MOVED: packageData declaration before usage
  const packageData = selected;

  // ✅ MOVED: Policy data extraction after packageData declaration
  const inclusionPolicy = getPolicyContent(packageData.policy?.inclusionPolicy);
  const exclusionPolicy = getPolicyContent(packageData.policy?.exclusionPolicy);
  const paymentPolicy = getPolicyContent(packageData.policy?.paymentPolicy);
  const cancellationPolicy = getPolicyContent(packageData.policy?.cancellationPolicy);
  const termsAndConditions = getPolicyContent(packageData.policy?.termsAndConditions);

  return (
    <>
      <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          {/* Back Button */}
          <Button startIcon={<ArrowBack />} onClick={handleBackClick} sx={{ mb: 2 }} variant="outlined">
            Back to Packages
          </Button>

          {/* Breadcrumbs */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <MUILink underline="hover" color="inherit" component={Link} to="/">
                Home
              </MUILink>
              <MUILink underline="hover" color="inherit" component={Link} to="/domestic">
                Domestic Packages
              </MUILink>
              <Typography color="text.primary">{packageData.title}</Typography>
            </Breadcrumbs>
          </Paper>

          {/* Package Header */}
          <Card elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: "hidden" }}>
            <CardMedia
              component="img"
              height="400"
              image={
                packageData.bannerImage
                  ? packageData.bannerImage.startsWith("http")
                    ? packageData.bannerImage
                    : `https://api.iconicyatra.com${packageData.bannerImage.startsWith("/") ? "" : "/upload/"}${packageData.bannerImage}`
                  : "https://via.placeholder.com/800x400?text=No+Image"
              }
              alt={packageData.title}
              sx={{ objectFit: "cover" }}
            />
            <Box sx={{ p: 4, backgroundColor: "#fff" }}>
              <Typography variant="h3" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                {packageData.title}
              </Typography>

              <Grid container spacing={4} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Schedule color="primary" /></ListItemIcon>
                      <ListItemText
                        primary="Duration"
                        secondary={packageData.stayLocations?.map(s => `${s.nights} Nights in ${s.city}`).join(", ")}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Hotel color="primary" /></ListItemIcon>
                      <ListItemText
                        primary="Total Nights"
                        secondary={packageData.stayLocations?.reduce((sum, loc) => sum + loc.nights, 0)}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CalendarToday color="primary" /></ListItemIcon>
                      <ListItemText
                        primary="Valid Till"
                        secondary={new Date(packageData.validTill).toDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><People color="primary" /></ListItemIcon>
                      <ListItemText
                        primary="Meal Plan"
                        secondary={packageData.mealPlan?.planType}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>

              {packageData.notes && (
                <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.8 }}>
                  {packageData.notes}
                </Typography>
              )}
            </Box>
          </Card>

          {/* Action Buttons */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3, backgroundColor: "#fff" }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Button
                  fullWidth
                  variant={activeTab === 0 ? "contained" : "outlined"}
                  color="primary"
                  startIcon={<Schedule />}
                  onClick={() => setActiveTab(0)}
                  sx={{ py: 1.5 }}
                >
                  Itinerary
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.7 }}>
                <Button
                  fullWidth
                  variant={activeTab === 1 ? "contained" : "outlined"}
                  color="secondary"
                  startIcon={<Info />}
                  onClick={() => setActiveTab(1)}
                  sx={{ py: 1.5 }}
                >
                  Inclusions/Exclusions
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Button
                  fullWidth
                  variant={activeTab === 3 ? "contained" : "outlined"}
                  color="secondary"
                  startIcon={<Hotel />}
                  onClick={() => setActiveTab(3)}
                  sx={{ py: 1.5 }}
                >
                  Hotels/Price
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.7 }}>
                <Button
                  fullWidth
                  variant={activeTab === 4 ? "contained" : "outlined"}
                  color="primary"
                  startIcon={<LocalOffer />}
                  onClick={() => setActiveTab(4)}
                  sx={{ py: 1.5 }}
                >
                  Terms & Conditions
                </Button>
              </Grid>
              {/* Send Query Button */}
              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<Send />}
                  onClick={handleQueryOpen}
                  sx={{
                    px: 4,
                    py: 1,
                    fontSize: "1.1rem",
                    borderRadius: 3,
                    boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
                    "&:hover": {
                      boxShadow: "0px 6px 20px rgba(0,0,0,0.3)",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  Send Query
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Tab Content */}
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, backgroundColor: "#fff" }}>
            {/* Itinerary Tab */}
            <TabPanel value={activeTab} index={0}>
              <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3, fontWeight: "bold" }}>
                Detailed Itinerary
              </Typography>

              {packageData.days?.map((day, index) => (
                <Card
                  key={index}
                  elevation={2}
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "transform 0.3s ease",
                    "&:hover": { transform: "translateY(-5px)", boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }
                  }}
                >
                  <Grid container spacing={0}>
                    {day.dayImage && (
                      <Grid size={{ xs: 12, md: 5 }}>
                        <CardMedia
                          component="img"
                          image={
                            day.dayImage && day.dayImage.trim() !== ""
                              ? day.dayImage.startsWith("http")
                                ? day.dayImage
                                : `https://api.iconicyatra.com/upload/${day.dayImage}`
                              : "https://via.placeholder.com/300x200?text=No+Image"
                          }
                          alt={day.title}
                          sx={{
                            height: 250,
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "scale(1.05)" }
                          }}
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, md: day.dayImage ? 7 : 12 }}>
                      <Box sx={{ p: 4, backgroundColor: "#fafafa" }}>
                        <Typography variant="h5" gutterBottom color="secondary" sx={{ fontWeight: "bold" }}>
                          {day.title}
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                          {day.notes}
                        </Typography>
                        {day.aboutCity && (
                          <Typography variant="body2" sx={{ mt: 2, fontStyle: "italic", color: "text.secondary" }}>
                            {day.aboutCity}
                          </Typography>
                        )}
                        {day.selectedSightseeing?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                              Sightseeing:
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                              {day.selectedSightseeing.map((s, idx) => (
                                <Chip key={idx} label={s} color="primary" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </TabPanel>

            {/* Inclusions Tab - UPDATED with Policy Data */}
            <TabPanel value={activeTab} index={1}>
              <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3, fontWeight: "bold" }}>
                Package Inclusions & Exclusions
              </Typography>

              <Grid container spacing={4}>
                {/* Inclusions */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#f0f8f0" }}>
                    <Typography variant="h5" gutterBottom color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star color="success" />
                      What's Included
                    </Typography>
                    <List>
                      {inclusionPolicy.length > 0 ? (
                        inclusionPolicy.map((inclusion, index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <Typography color="success.main">✓</Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={inclusion}
                              primaryTypographyProps={{ style: { lineHeight: 1.6 } }}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No inclusions specified.
                        </Typography>
                      )}
                    </List>
                  </Card>
                </Grid>

                {/* Exclusions */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff0f0" }}>
                    <Typography variant="h5" gutterBottom color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Close color="error" />
                      What's Not Included
                    </Typography>
                    <List>
                      {exclusionPolicy.length > 0 ? (
                        exclusionPolicy.map((exclusion, index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <Typography color="error">✗</Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={exclusion}
                              primaryTypographyProps={{ style: { lineHeight: 1.6 } }}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No exclusions specified.
                        </Typography>
                      )}
                    </List>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Hotels Tab - WITH MATERIAL-UI TABLE COMPONENT */}
            <TabPanel value={activeTab} index={3}>
              <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3, fontWeight: "bold" }}>
                Accommodation & Pricing
              </Typography>

              {packageData.destinationNights?.map((destination, destIndex) => (
                <Card key={destIndex} elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                  <Typography variant="h5" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Hotel color="primary" />
                    {destination.destination} - {destination.nights} Nights
                  </Typography>

                  <Box sx={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '16px', textAlign: 'left', border: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            Hotel Category
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', border: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            Hotel Name
                          </th>
                          <th style={{ padding: '16px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            Nights
                          </th>
                          <th style={{ padding: '16px', textAlign: 'right', border: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            Price/Night
                          </th>
                          <th style={{ padding: '16px', textAlign: 'right', border: '1px solid #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            Total Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {destination.hotels?.map((hotel, hotelIndex) => {
                          const totalPrice = hotel.pricePerPerson * destination.nights;
                          return (
                            <tr
                              key={hotelIndex}
                              style={{
                                backgroundColor: hotelIndex % 2 === 0 ? '#fafafa' : '#ffffff',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e3f2fd';
                                e.currentTarget.style.transform = 'scale(1.01)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = hotelIndex % 2 === 0 ? '#fafafa' : '#ffffff';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <td style={{ padding: '16px', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={hotel.category.toUpperCase()}
                                    color={
                                      hotel.category === 'standard' ? 'primary' :
                                        hotel.category === 'deluxe' ? 'secondary' :
                                          'success'
                                    }
                                    variant="filled"
                                    size="medium"
                                  />
                                </Box>
                              </td>
                              <td style={{ padding: '16px', border: '1px solid #e0e0e0', fontSize: '15px' }}>
                                {hotel.hotelName}
                              </td>
                              <td style={{ padding: '16px', border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: '500' }}>
                                {destination.nights}
                              </td>
                              <td style={{ padding: '16px', border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: '600', color: '#1976d2' }}>
                                ₹{hotel.pricePerPerson?.toLocaleString()}
                              </td>
                              <td style={{ padding: '16px', border: '1px solid #e0e0e0', textAlign: 'right', fontWeight: '700', color: '#2e7d32', fontSize: '16px' }}>
                                ₹{totalPrice?.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>

                  {/* Price Comparison */}
                  {destination.hotels?.length > 1 && (
                    <Box sx={{ mt: 3, p: 3, backgroundColor: '#fff3e0', borderRadius: 2, border: '1px solid #ffb74d' }}>
                      <Typography variant="h6" gutterBottom color="warning.main">
                        💰 Price Comparison
                      </Typography>
                      <Grid container spacing={2}>
                        {destination.hotels.map((hotel, index) => (
                          <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: 'white' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {hotel.category}
                              </Typography>
                              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', my: 1 }}>
                                ₹{(hotel.pricePerPerson * destination.nights)?.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ₹{hotel.pricePerPerson?.toLocaleString()}/night
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Call to Action */}
                  <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom color="info.main">
                      🏨 Ready to Book?
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Contact us for special discounts and customized packages
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Send />}
                      onClick={handleQueryOpen}
                    >
                      Get Best Price
                    </Button>
                  </Box>
                </Card>
              )) || (
                  <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Hotel sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Accommodation Details Coming Soon
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      We're working on getting the best hotels and prices for you.
                    </Typography>
                    <Button variant="outlined" onClick={handleQueryOpen}>
                      Contact for Hotel Details
                    </Button>
                  </Paper>
                )}
            </TabPanel>

            {/* Terms & Conditions Tab - UPDATED with Numbered List */}
            <TabPanel value={activeTab} index={4}>
              <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3, fontWeight: "bold" }}>
                Policies & Terms
              </Typography>

              <Grid container spacing={3}>
                {/* Payment Policy */}
                {paymentPolicy.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#e3f2fd" }}>
                      <Typography variant="h5" gutterBottom color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalOffer color="info" />
                        Payment Policy
                      </Typography>
                      <List>
                        {paymentPolicy.map((term, index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start', paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <Typography
                                variant="body1"
                                color="info.main"
                                sx={{
                                  fontWeight: 'bold',
                                  backgroundColor: '#1976d2',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 24,
                                  height: 24,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={term}
                              primaryTypographyProps={{
                                style: {
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }
                              }}
                              sx={{ marginLeft: 1 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>
                )}

                {/* Cancellation Policy */}
                {cancellationPolicy.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff8e1" }}>
                      <Typography variant="h5" gutterBottom color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning color="warning" />
                        Cancellation Policy
                      </Typography>
                      <List>
                        {cancellationPolicy.map((term, index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start', paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <Typography
                                variant="body1"
                                color="warning.main"
                                sx={{
                                  fontWeight: 'bold',
                                  backgroundColor: '#ed6c02',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 24,
                                  height: 24,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={term}
                              primaryTypographyProps={{
                                style: {
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }
                              }}
                              sx={{ marginLeft: 1 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>
                )}

                {/* Terms & Conditions */}
                {termsAndConditions.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card elevation={2} sx={{ p: 3, borderRadius: 3, backgroundColor: "#f3e5f5" }}>
                      <Typography variant="h5" gutterBottom color="secondary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info color="secondary" />
                        Terms & Conditions
                      </Typography>
                      <List>
                        {termsAndConditions.map((term, index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start', paddingLeft: 0 }}>
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <Typography
                                variant="body1"
                                color="secondary.main"
                                sx={{
                                  fontWeight: 'bold',
                                  backgroundColor: '#9c27b0',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 24,
                                  height: 24,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={term}
                              primaryTypographyProps={{
                                style: {
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }
                              }}
                              sx={{ marginLeft: 1 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>
                )}

                {/* Agar koi policy nahi hai */}
                {paymentPolicy.length === 0 && cancellationPolicy.length === 0 && termsAndConditions.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Policies Available
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Please contact us for detailed policies and terms.
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

          </Paper>
        </Container>
      </Box>

      {/* Query Dialog */}
      <Dialog
        open={queryDialogOpen}
        onClose={handleQueryClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "primary.main", color: "white" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Send Query About {packageData.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Interested in this package? Send us your query and we'll get back to you with the best offer!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact form will be implemented here...
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleQueryClose} color="primary">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Send />}
          >
            Send Query
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call to Action */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "#f5f5f5",
          color: "#333",
          mt: 4,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          Ready to Book This Package?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Contact us for pricing and availability
        </Typography>
        <Button variant="contained" color="secondary" size="large" component={Link} to="/contact">
          Contact Us Now
        </Button>
      </Paper>
    </>
  );
};

export default PackageDetail;