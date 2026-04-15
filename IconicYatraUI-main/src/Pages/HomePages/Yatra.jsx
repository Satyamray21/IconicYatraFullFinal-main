// src/pages/Yatra/Yatra.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Box,
  Divider,
  Button,
  CircularProgress,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PackageCard from "../../Components/PackageCard";
import bannerImg from "../../assets/Banner/banner3.jpg";
import { fetchYatraPackages } from "../../Features/packageSlice";
import { BASE_URL } from "../../Utils/axiosInstance";

const Yatra = () => {
  const [visibleCount, setVisibleCount] = useState(8);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get yatra packages from Redux store
  const { yatra: yatraPackages, loading, error } = useSelector((state) => state.packages);

  useEffect(() => {
    // Fetch yatra packages when component mounts
    dispatch(fetchYatraPackages());
  }, [dispatch]);

  // Debug: Check what data you're getting
  useEffect(() => {
    console.log("Yatra packages data:", yatraPackages);
    console.log("First package:", yatraPackages[0]);
  }, [yatraPackages]);

  const loadMore = () => setVisibleCount((prev) => prev + 8);

  // ✅ UPDATED: ENHANCED PRICE FUNCTION - SAME AS OTHER PACKAGES
  const getStandardHotelPrice = (pkg) => {
    // Pehle direct price fields check karein
    if (pkg?.startingPrice) {
      return pkg.startingPrice;
    }
    if (pkg?.price) {
      return pkg.price;
    }

    // Fir destinationNights se standard hotel price
    if (!pkg.destinationNights || pkg.destinationNights.length === 0) {
      return null;
    }

    const firstDestination = pkg.destinationNights[0];
    if (!firstDestination.hotels || firstDestination.hotels.length === 0) {
      return null;
    }

    // Find standard hotel category
    const standardHotel = firstDestination.hotels.find(
      hotel => hotel.category === "standard"
    );

    if (standardHotel && standardHotel.pricePerPerson > 0) {
      return standardHotel.pricePerPerson;
    }

    return null;
  };

  // ✅ UPDATED: Get price display with "Starting" text
  const getPriceDisplay = (pkg) => {
    const price = getStandardHotelPrice(pkg);
    if (!price) return "Contact for Price";

    // Agar startingPrice hai to "Starting" show karein, warna normal price
    if (pkg?.startingPrice) {
      return `Starting ₹${price.toLocaleString()}`;
    }
    return `₹${price.toLocaleString()}`;
  };

  // ✅ UPDATED: Check if price is available
  const hasPrice = (pkg) => {
    return pkg?.startingPrice || pkg?.price ||
      (pkg.destinationNights && pkg.destinationNights[0]?.hotels?.some(hotel =>
        hotel.category === "standard" && hotel.pricePerPerson > 0
      ));
  };

  // ✅ UPDATED: Format duration function
  const formatDuration = (pkg) => {
    if (pkg?.stayLocations && pkg.stayLocations.length > 0) {
      const totalNights = pkg.stayLocations.reduce((sum, location) => sum + (location.nights || 0), 0);
      const totalDays = totalNights + 1;
      return `${totalDays}D/${totalNights}N`;
    }
    // Fallback to days array if stayLocations not available
    if (pkg?.days && pkg.days.length > 0) {
      return `${pkg.days.length}D/${pkg.days.length - 1}N`;
    }
    return "Contact for details";
  };

  // Show loading state
  if (loading && yatraPackages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error && yatraPackages.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading packages: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      <Box
        sx={{
          height: { xs: 220, md: 300 },
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.5)",
          }}
        />
        {/* Banner Text */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.8rem", md: "2rem" } }}
          >
            YATRA PACKAGES
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ fontSize: { xs: "1rem", md: "1rem" } }}
          >
            Explore Our Spiritual Journey Packages
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 }, width: "100%", py: 6 }}>
        {/* Title */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            YATRA <span style={{ color: "red" }}>PACKAGES</span>
          </Typography>
          <Divider sx={{ mt: 1, borderColor: "#ccc", borderBottomWidth: 5 }} />
        </Box>

        {/* Show loading while fetching more data */}
        {loading && yatraPackages.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Error alert */}
        {error && yatraPackages.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading more packages: {error}
          </Alert>
        )}

        {/* Cards Grid */}
        {yatraPackages.length > 0 ? (
          <Grid
            container
            spacing={3}
            sx={{ textAlign: "center", justifyContent: "center" }}
          >
            {yatraPackages.slice(0, visibleCount).map((pkg) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                key={pkg._id}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Box
                  sx={{ width: "100%", maxWidth: 320, cursor: "pointer" }}
                  onClick={() => navigate(`/package/${pkg._id}`)}
                >
                  <PackageCard
                    title={pkg.title || "No Title"}
                    image={
                      pkg.bannerImage
                        ? pkg.bannerImage.startsWith("http")
                          ? pkg.bannerImage
                          : pkg.bannerImage.startsWith("/upload/")
                            ? `${BASE_URL}${pkg.bannerImage}`
                            : `${BASE_URL}/upload/${pkg.bannerImage}`
                        : "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    location={`${pkg.sector || "Unknown Sector"}, ${pkg.arrivalCity || "Unknown City"}`}
                    // ✅ UPDATED: Duration with new logic
                    duration={formatDuration(pkg)}
                    // ✅ UPDATED: Price with new logic
                    price={getPriceDisplay(pkg)}
                    finalStandardCost={pkg.finalStandardCost}
                    destinationNights={pkg.destinationNights}
                    id={pkg._id}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          // No packages found
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No yatra packages found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Check the console for detailed package data
            </Typography>
          </Box>
        )}

        {/* Load More Button - Only show if there are more packages to load */}
        {visibleCount < yatraPackages.length && (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={loadMore}
              disabled={loading}
              sx={{
                width: { xs: "100%", sm: 300 },
                backgroundColor: "#4caf50",
                color: "#fff",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 3,
                py: 1.5,
                "&:hover": { backgroundColor: "#43a047" },
                "&:disabled": { backgroundColor: "#cccccc" }
              }}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Yatra;