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
import { fetchSpecialPackages, clearError } from "../Features/packageSlice";
import InquiryFormDialog from "../Components/InquiryFormDialog";

const SpecialPackages = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState("");

  // Get state from Redux store
  const {
    special: specialPackages,
    loading,
    error
  } = useSelector((state) => state.packages);

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const cardsToShow = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidthPercent = 100 / cardsToShow;

  // Fetch special packages on component mount
  useEffect(() => {
    dispatch(fetchSpecialPackages());
  }, [dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left:
          direction === "left"
            ? -scrollRef.current.offsetWidth / cardsToShow
            : scrollRef.current.offsetWidth / cardsToShow,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (specialPackages.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: scrollRef.current.offsetWidth / cardsToShow,
          behavior: "smooth",
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [cardsToShow, specialPackages.length]);

  const handlePackageClick = (packageId) => {
    if (packageId) {
      navigate(`/special-package-details/${packageId}`);
    }
  };

  const handleQueryClick = (pkg, e) => {
    e.stopPropagation();
    setSelectedPackageTitle(pkg.title || pkg.name);
    setInquiryDialogOpen(true);
  };

  // Function to get standard hotel price
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

  // Show loading state
  if (loading && specialPackages.length === 0) {
    return (
      <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          SPECIAL <span style={{ color: "red" }}>PACKAGES</span>
        </Typography>
        <Divider
          sx={{
            borderColor: "#ff5722",
            borderBottomWidth: 3,
            mx: "auto",
            width: "200px",
            mb: 3,
          }}
        />
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          px: 3,
          py: 5,
          position: "relative",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            SPECIAL <span style={{ color: "red" }}>PACKAGES</span>
          </Typography>
          <Divider
            sx={{
              borderColor: "#ff5722",
              borderBottomWidth: 3,
              mx: "auto",
              width: "200px",
            }}
          />
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, mx: 2 }}>
            {error}
          </Alert>
        )}

        {/* Cards */}
        <Grid>
          {specialPackages.length > 0 ? (
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
              {specialPackages.map((pkg) => (
                <Box
                  key={pkg._id || pkg.id}
                  onClick={() => handlePackageClick(pkg._id || pkg.id)}
                  sx={{
                    flex: `0 0 calc(${cardWidthPercent}% - 16px)`,
                    height: isMobile ? 220 : isTablet ? 240 : 280,
                    borderRadius: "15px",
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    scrollSnapAlign: "center",
                    backgroundImage: `url(${pkg.bannerImage || pkg.headerImage || pkg.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "transform 0.4s ease",
                    boxShadow: 4,
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: 8,
                    },
                  }}
                >
                  {/* Gradient Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2))",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      p: 2,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "body2" : "body1"}
                      fontWeight="bold"
                      color="#fff"
                      textAlign="center"
                      sx={{
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {pkg.title || pkg.name}
                    </Typography>

                    {/* Price Display */}
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="#ffeb3b"
                      fontWeight="bold"
                      sx={{ mb: 1 }}
                    >
                      Starting from {getStandardHotelPrice(pkg)}
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => handleQueryClick(pkg, e)}
                      sx={{
                        textTransform: "none",
                        fontSize: isMobile ? "0.75rem" : "0.85rem",
                        borderRadius: "20px",
                        px: 2,
                        backgroundColor: "#ff5722",
                        boxShadow: "0px 3px 8px rgba(0,0,0,0.3)",
                        "&:hover": { backgroundColor: "#e64a19" },
                      }}
                    >
                      Send Query
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            // No packages message
            !loading && !error && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No special packages available at the moment.
                </Typography>
              </Box>
            )
          )}
        </Grid>

        {/* Navigation Arrows - Optional */}
        {specialPackages.length > cardsToShow && (
          <>
            <Button
              onClick={() => scroll("left")}
              sx={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: "auto",
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.9)",
                "&:hover": { backgroundColor: "white" },
              }}
            >
              ‹
            </Button>
            <Button
              onClick={() => scroll("right")}
              sx={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: "auto",
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.9)",
                "&:hover": { backgroundColor: "white" },
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
        title="Special Package Inquiry"
        defaultDestination={selectedPackageTitle}
      />
    </>
  );
};

export default SpecialPackages;