import React, { useRef, useEffect } from "react";
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
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomesticPackages, clearError } from "../../../Features/packageSlice";

const DomesticPackage = () => {

  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { slug } = useParams(); // ✅ get slug from URL

  const {
    domestic: domesticPackages,
    loading,
    error
  } = useSelector((state) => state.packages);

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const cardsToShow = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidthPercent = 100 / cardsToShow;

  // ✅ Fetch packages
  useEffect(() => {
    dispatch(fetchDomesticPackages({ page: 1, limit: 9 }));
  }, [dispatch]);

  // ✅ Clear errors
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // ✅ Filter packages by sector = slug
  const filteredPackages = domesticPackages.filter(
    (pkg) =>
      pkg.sector
        ?.toLowerCase()
        .replace(/\s+/g, "-") === slug?.toLowerCase()
  );

  // Price calculation
  const getStartingPrice = (pkg) => {
    if (!pkg.destinationNights || !Array.isArray(pkg.destinationNights)) {
      return null;
    }

    let totalPrice = 0;

    pkg.destinationNights.forEach(destination => {
      const standardHotel = destination.hotels?.find(
        hotel => hotel.category?.toLowerCase() === "standard"
      );

      if (standardHotel && standardHotel.pricePerPerson) {
        totalPrice += standardHotel.pricePerPerson * (destination.nights || 0);
      }
    });

    return totalPrice > 0 ? totalPrice : null;
  };

  // Auto slider
  useEffect(() => {

    if (filteredPackages.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({
          left: scrollRef.current.offsetWidth / cardsToShow,
          behavior: "smooth",
        });
      }
    }, 4000);

    return () => clearInterval(interval);

  }, [cardsToShow, filteredPackages.length]);

  const handlePackageClick = (packageId) => {
    navigate(`/package/${packageId}`);
  };

  const handleQueryClick = (pkg, e) => {
    e.stopPropagation();
    console.log("Query for domestic package:", pkg);
  };

  return (
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

      {/* Heading */}
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

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && filteredPackages.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Packages */}
      <Grid>
        {filteredPackages.length > 0 ? (

          <Box
            ref={scrollRef}
            sx={{
              display: "flex",
              gap: 3,
              overflowX: "scroll",
              scrollBehavior: "smooth",
              scrollSnapType: "x mandatory",
              px: 2,
              "&::-webkit-scrollbar": { display: "none" }
            }}
          >

            {filteredPackages.map((pkg) => {

              const startingPrice = getStartingPrice(pkg);

              return (
                <Box
                  key={pkg._id}
                  onClick={() => handlePackageClick(pkg._id)}
                  sx={{
                    flex: `0 0 calc(${cardWidthPercent}% - 16px)`,
                    height: isMobile ? 200 : isTablet ? 220 : 260,
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: `url(${pkg.bannerImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "0.4s",
                    "&:hover": {
                      transform: "scale(1.05)"
                    }
                  }}
                >

                  {/* Duration */}
                  {pkg.stayLocations?.length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        bgcolor: "#2196F3",
                        color: "white",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {pkg.stayLocations.reduce((s, l) => s + (l.nights || 0), 0)}N /
                      {pkg.stayLocations.reduce((s, l) => s + (l.nights || 0), 0) + 1}D
                    </Box>
                  )}

                  {/* Price */}
                  {startingPrice && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        bgcolor: "#FF5722",
                        color: "white",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ₹{startingPrice.toLocaleString()}
                    </Box>
                  )}

                  {/* Bottom Content */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      width: "100%",
                      p: 2,
                      color: "white",
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
                    }}
                  >

                    <Typography variant="h6" textAlign="center">
                      {pkg.title}
                    </Typography>

                    <Typography variant="body2" textAlign="center">
                      {pkg.sector}
                    </Typography>

                    <Box display="flex" justifyContent="center" gap={1} mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => handleQueryClick(pkg, e)}
                        sx={{ bgcolor: "#FF5722" }}
                      >
                        Send Query
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: "white", color: "white" }}
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

          !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6">
                No packages available for this destination.
              </Typography>
            </Box>
          )

        )}
      </Grid>

      {/* Arrows */}
      {filteredPackages.length > cardsToShow && (
        <>
          <Button
            onClick={() =>
              scrollRef.current.scrollBy({
                left: -scrollRef.current.offsetWidth / cardsToShow,
                behavior: "smooth"
              })
            }
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              bgcolor: "white"
            }}
          >
            ‹
          </Button>

          <Button
            onClick={() =>
              scrollRef.current.scrollBy({
                left: scrollRef.current.offsetWidth / cardsToShow,
                behavior: "smooth"
              })
            }
            sx={{
              position: "absolute",
              right: 10,
              top: "50%",
              bgcolor: "white"
            }}
          >
            ›
          </Button>
        </>
      )}

    </Box>
  );
};

export default DomesticPackage;
