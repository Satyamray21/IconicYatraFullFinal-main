import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  Divider,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomesticPackages, clearError } from "../Features/packageSlice";
import InquiryFormDialog from "../Components/InquiryFormDialog";

const DomesticPackage = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState("");

  // Get state from Redux store
  const {
    domestic: domesticPackages,
    loading,
    error
  } = useSelector((state) => state.packages);

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const cardsToShow = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidthPercent = 100 / cardsToShow;

  // Fetch domestic packages on component mount
  useEffect(() => {
  dispatch(fetchDomesticPackages({ page: 1, limit: 9 }));
}, [dispatch]);


  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Function to get starting price from standard category
  const getStartingPrice = (pkg) => {
    if (!pkg.destinationNights || !Array.isArray(pkg.destinationNights)) {
      return null;
    }

    let totalNights = 0;
    let totalPrice = 0;

    // Calculate total nights and find standard category prices
    pkg.destinationNights.forEach(destination => {
      totalNights += destination.nights || 0;

      // Find standard category hotel for this destination
      const standardHotel = destination.hotels?.find(hotel =>
        hotel.category?.toLowerCase() === 'standard'
      );

      if (standardHotel && standardHotel.pricePerPerson) {
        totalPrice += (standardHotel.pricePerPerson * (destination.nights || 0));
      }
    });

    return totalPrice > 0 ? totalPrice : null;
  };

  // Auto slide effect
  useEffect(() => {
    if (domesticPackages.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: scrollRef.current.offsetWidth / cardsToShow,
          behavior: "smooth",
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [cardsToShow, domesticPackages.length]);

  const handlePackageClick = (packageId) => {
    if (packageId) {
      navigate(`/package/${packageId}`);
    }
  };

  const handleQueryClick = (pkg, e) => {
    e.stopPropagation();
    setSelectedPackageTitle(pkg.title || pkg.name);
    setInquiryDialogOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          px: 3,
          py: 5,
          position: "relative",
          width: "100%",
          overflow: "hidden",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        {/* Section Title */}
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              mb: 1
            }}
          >
            DOMESTIC <span style={{ color: "#FF5722" }}>PACKAGES</span>
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Explore the beauty of India with our curated domestic tours
          </Typography>
          <Divider
            sx={{
              borderColor: "#2196F3",
              borderBottomWidth: 3,
              mx: "auto",
              width: "150px",
              borderRadius: 2
            }}
          />
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
        {loading && domesticPackages.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Cards */}
        <Grid>
          {domesticPackages.length > 0 ? (
            <Box
              ref={scrollRef}
              sx={{
                display: "flex",
                gap: 3,
                overflowX: "scroll",
                overflowY: "hidden",
                scrollBehavior: "smooth",
                scrollSnapType: "x mandatory",
                width: "100%",
                px: 2,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {domesticPackages.map((pkg) => {
                const startingPrice = getStartingPrice(pkg);

                return (
                  <Box
                    key={pkg._id || pkg.id}
                    onClick={() => handlePackageClick(pkg._id || pkg.id)}
                    sx={{
                      flex: `0 0 calc(${cardWidthPercent}% - 16px)`,
                      height: isMobile ? 200 : isTablet ? 220 : 260,
                      borderRadius: "20px",
                      overflow: "hidden",
                      position: "relative",
                      cursor: "pointer",
                      scrollSnapAlign: "center",
                      backgroundImage: `url(${pkg.bannerImage || pkg.headerImage || pkg.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "all 0.4s ease",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                      "&:hover": {
                        transform: "scale(1.05) translateY(-5px)",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)",
                        opacity: 0.7,
                        transition: "opacity 0.3s ease",
                      },
                      "&:hover::before": {
                        opacity: 0.9,
                      }
                    }}
                  >
                    {/* Duration Badge */}
                    {pkg.stayLocations && pkg.stayLocations.length > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          backgroundColor: "rgba(33, 150, 243, 0.9)",
                          color: "white",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {pkg.stayLocations.reduce((sum, loc) => sum + (loc.nights || 0), 0)}N/
                        {pkg.stayLocations.reduce((sum, loc) => sum + (loc.nights || 0), 0) + 1}D
                      </Box>
                    )}

                    {/* Price Badge */}
                    {startingPrice && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          backgroundColor: "rgba(255, 87, 34, 0.9)",
                          color: "white",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        Starts from ₹{startingPrice.toLocaleString()}
                      </Box>
                    )}

                    {/* Content Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 3,
                        color: "white",
                        zIndex: 2,
                      }}
                    >
                      <Typography
                        variant={isMobile ? "body1" : "h6"}
                        fontWeight="bold"
                        textAlign="center"
                        sx={{
                          mb: 1,
                          textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
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
                          textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {pkg.sector || pkg.destination}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderRadius: "20px",
                            px: 2,
                            backgroundColor: "#FF5722",
                            fontWeight: "bold",
                            boxShadow: "0 4px 15px rgba(255,87,34,0.3)",
                            "&:hover": {
                              backgroundColor: "#E64A19",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 20px rgba(255,87,34,0.4)"
                            },
                            transition: "all 0.3s ease"
                          }}
                          onClick={(e) => handleQueryClick(pkg, e)}
                        >
                          Send Query
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderRadius: "20px",
                            px: 2,
                            borderColor: "white",
                            color: "white",
                            fontWeight: "bold",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.1)",
                              borderColor: "white",
                              transform: "translateY(-2px)"
                            },
                            transition: "all 0.3s ease"
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            // No packages message
            !loading && !error && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  🏔️ No domestic packages available at the moment.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back soon for amazing domestic travel deals!
                </Typography>
              </Box>
            )
          )}
        </Grid>

        {/* Navigation Arrows */}
        {domesticPackages.length > cardsToShow && (
          <>
            <Button
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({
                    left: -scrollRef.current.offsetWidth / cardsToShow,
                    behavior: "smooth",
                  });
                }
              }}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: "auto",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "white",
                color: "#2196F3",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundColor: "#2196F3",
                  color: "white",
                  transform: "translateY(-50%) scale(1.1)"
                },
                transition: "all 0.3s ease",
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
                    behavior: "smooth",
                  });
                }
              }}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: "auto",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "white",
                color: "#2196F3",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundColor: "#2196F3",
                  color: "white",
                  transform: "translateY(-50%) scale(1.1)"
                },
                transition: "all 0.3s ease",
                zIndex: 3,
              }}
            >
              ›
            </Button>
          </>
        )}
      </Box>

      {/* Inquiry Form Dialog */}
      <InquiryFormDialog
        open={inquiryDialogOpen}
        handleClose={() => setInquiryDialogOpen(false)}
        title="Domestic Package Inquiry"
        defaultDestination={selectedPackageTitle}
      />
    </>
  );
};

export default DomesticPackage;