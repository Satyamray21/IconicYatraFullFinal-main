import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  Divider,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInternationalPackages, clearError } from '../Features/packageSlice';

const InternationalPackage = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get state from Redux store
  const {
    international: internationalPackages,
    loading,
    error
  } = useSelector((state) => state.packages);

  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:900px)');
  const cardsToShow = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidthPercent = 100 / cardsToShow;

  // Fetch international packages on component mount
  useEffect(() => {
    dispatch(fetchInternationalPackages());
  }, [dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Auto slide effect
  useEffect(() => {
    if (internationalPackages.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: scrollRef.current.offsetWidth / cardsToShow,
          behavior: 'smooth',
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [cardsToShow, internationalPackages.length]);

  const handlePackageClick = (packageId) => {
    navigate(`/internationalpackage/${packageId}`);
  };

  const handleQueryClick = (pkg, e) => {
    e.stopPropagation();
    console.log("Query for international package:", pkg);
    // You can open a modal or navigate to query page
    // navigate(`/query?package=${pkg._id}&type=international`);
  };

  // Function to get standard hotel price - SAME AS SPECIAL & DOMESTIC PACKAGES
  const getStandardHotelPrice = (pkg) => {
    if (!pkg.destinationNights || pkg.destinationNights.length === 0) {
      return "Price on request";
    }

    const firstDestination = pkg.destinationNights[0];
    if (!firstDestination.hotels || firstDestination.hotels.length === 0) {
      return "Price on request";
    }

    // Find standard hotel category
    const standardHotel = firstDestination.hotels.find(
      hotel => hotel.category === "standard"
    );

    if (standardHotel && standardHotel.pricePerPerson > 0) {
      return `₹${standardHotel.pricePerPerson.toLocaleString()}`;
    }

    return "Price on request";
  };

  // Format duration from stayLocations
  const formatDuration = (pkg) => {
    if (pkg?.stayLocations && pkg.stayLocations.length > 0) {
      const totalNights = pkg.stayLocations.reduce((sum, location) => sum + (location.nights || 0), 0);
      const totalDays = totalNights + 1;
      return `${totalDays}D/${totalNights}N`;
    }
    return "";
  };

  return (
    <Box sx={{
      px: 3,
      py: 5,
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      // Background color removed for clean look
    }}>
      {/* Section Title */}
      <Box textAlign="center" mb={3}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: "text.primary",
            mb: 1
          }}
        >
          ✈️ INTERNATIONAL <span style={{ color: '#2196F3' }}>PACKAGES</span>
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: "text.secondary",
            mb: 2
          }}
        >
          Discover Amazing Destinations Around the World
        </Typography>
        <Divider sx={{
          borderColor: '#2196F3',
          borderBottomWidth: 3,
          mx: 'auto',
          width: '200px',
          borderRadius: 2
        }} />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            mx: 2,
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && internationalPackages.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Cards */}
      <Grid>
        {internationalPackages.length > 0 ? (
          <Box
            ref={scrollRef}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'scroll',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory',
              width: '100%',
              px: 2,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {internationalPackages.map((pkg) => (
              <Box
                key={pkg._id || pkg.id}
                onClick={() => handlePackageClick(pkg._id || pkg.id)}
                sx={{
                  flex: `0 0 calc(${cardWidthPercent}% - 16px)`,
                  height: isMobile ? 220 : isTablet ? 240 : 280,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  scrollSnapAlign: 'center',
                  backgroundImage: `url(${pkg.bannerImage || pkg.headerImage || pkg.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'all 0.4s ease',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  '&:hover': {
                    transform: 'scale(1.05) translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                  },
                  '&::before': {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
                    opacity: 0.7,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 0.9,
                  }
                }}
              >
                {/* Country Flag Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    color: '#333',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {pkg.destinationCountry || 'International'}
                </Box>

                {/* Duration Badge */}
                {pkg.stayLocations && pkg.stayLocations.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(33, 150, 243, 0.95)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {formatDuration(pkg)}
                  </Box>
                )}

                {/* Price Badge - UPDATED TO SHOW STARTING FROM PRICE */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 45,
                    right: 12,
                    backgroundColor: 'rgba(255, 87, 34, 0.95)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  Starting {getStandardHotelPrice(pkg)}
                </Box>

                {/* Content Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <Typography
                    variant={isMobile ? 'body1' : 'h6'}
                    fontWeight="bold"
                    textAlign="center"
                    sx={{
                      mb: 1,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: isMobile ? '2.5rem' : '3rem'
                    }}
                  >
                    {pkg.title || pkg.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    textAlign="center"
                    sx={{
                      mb: 2,
                      opacity: 0.9,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {pkg.sector || pkg.destination}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        borderRadius: '20px',
                        px: 2,
                        backgroundColor: '#FF5722',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(255,87,34,0.3)',
                        '&:hover': {
                          backgroundColor: '#E64A19',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(255,87,34,0.4)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => handleQueryClick(pkg, e)}
                    >
                      Send Query
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        borderRadius: '20px',
                        px: 2,
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderColor: 'white',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          // No packages message
          !loading && !error && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                🌍 No international packages available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We're adding amazing international destinations soon!
              </Typography>
            </Box>
          )
        )}
      </Grid>

      {/* Navigation Arrows */}
      {internationalPackages.length > cardsToShow && (
        <>
          <Button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({
                  left: -scrollRef.current.offsetWidth / cardsToShow,
                  behavior: 'smooth',
                });
              }
            }}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 'auto',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'white',
              color: '#2196F3',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: '#2196F3',
                color: 'white',
                transform: 'translateY(-50%) scale(1.1)'
              },
              transition: 'all 0.3s ease',
              zIndex: 3,
            }}
          >
            ‹
          </Button>
          <Button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({
                  left: scrollRef.current.offsetWidth / cardsToShow,
                  behavior: 'smooth',
                });
              }
            }}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 'auto',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'white',
              color: '#2196F3',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: '#2196F3',
                color: 'white',
                transform: 'translateY(-50%) scale(1.1)'
              },
              transition: 'all 0.3s ease',
              zIndex: 3,
            }}
          >
            ›
          </Button>
        </>
      )}
    </Box>
  );
};

export default InternationalPackage;