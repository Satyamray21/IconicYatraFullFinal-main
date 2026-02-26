// src/pages/Holidays/Holidays.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PackageCard from "../../Components/PackageCard";
import bannerImg from "../../assets/Banner/banner1.jpg";
import { fetchHolidayPackages, clearError } from "../../Features/packageSlice";

const Holidays = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [visibleCount, setVisibleCount] = useState(8);

  // Get state from Redux store
  const {
    holiday: holidayPackages,
    loading,
    error
  } = useSelector((state) => state.packages);

  useEffect(() => {
    // Fetch holiday packages when component mounts
    dispatch(fetchHolidayPackages());
  }, [dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
    if (!price) return "Price on request";

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

  // Format duration function - updated to handle stayLocations
  const formatDuration = (pkg) => {
    if (pkg.stayLocations && pkg.stayLocations.length > 0) {
      const totalNights = pkg.stayLocations.reduce((sum, location) => sum + (location.nights || 0), 0);
      const totalDays = totalNights + 1; // Usually days = nights + 1
      return `${totalDays}D/${totalNights}N`;
    }
    return "";
  };

  const handlePackageClick = (packageId) => {
    navigate(`/package/${packageId}`);
  };

  const handleQueryClick = (pkg) => {
    // Implement your query logic here
    console.log("Query for package:", pkg);
    // You can open a modal or navigate to query page
    // navigate(`/query?package=${pkg.id}&type=holiday`);
  };

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
            HOLIDAY PACKAGES
          </Typography>
          <Typography variant="subtitle1" sx={{ fontSize: "1rem" }}>
            Choose Your Dream Destination
          </Typography>
        </Box>
      </Box>

      {/* Packages Section */}
      <Box
        sx={{ p: { xs: 2, md: 3 }, background: "#f8f8f8", minHeight: "100vh" }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            HOLIDAYS <span style={{ color: "red" }}>PACKAGES</span>
          </Typography>
          <Divider sx={{ mt: 1, borderColor: "#ccc", borderBottomWidth: 5 }} />
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && holidayPackages.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Packages Grid */}
        <Grid
          container
          spacing={2}
          sx={{ justifyContent: "center", textAlign: "center" }}
        >
          {holidayPackages.slice(0, visibleCount).map((pkg) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={pkg._id || pkg.id}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Box
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <PackageCard
                  image={pkg.bannerImage}
                  title={pkg.title}
                  location={pkg.sector}
                  duration={formatDuration(pkg)}
                  // ✅ UPDATED: Price display with new logic
                  price={getPriceDisplay(pkg)}
                  onClick={() => handlePackageClick(pkg._id)}
                  onQueryClick={() => handleQueryClick(pkg)}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* No Packages Message */}
        {!loading && holidayPackages.length === 0 && !error && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No holiday packages available at the moment.
            </Typography>
          </Box>
        )}

        {/* Load More Button */}
        {!loading && visibleCount < holidayPackages.length && (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              onClick={loadMore}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontWeight: "bold",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              Load More
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Holidays;