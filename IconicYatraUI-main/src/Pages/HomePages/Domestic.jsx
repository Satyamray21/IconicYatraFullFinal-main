// src/Pages/HomePages/Domestic.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Breadcrumbs,
  Link as MUILink,
  Container,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomesticPackages } from "../../Features/packageSlice";
import PackageCard from "../../Components/PackageCard";
import { BASE_URL } from "../../Utils/axiosInstance";
import { Pagination } from "@mui/material";

const Domestic = () => {
  const { destination } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [page, setPage] = useState(1);

  const {
    domestic: packages = [],
    loading,
    error,
    totalPages = 1,
    totalPackages = 0,
  } = useSelector((state) => state.packages);

  const [selectedDestination, setSelectedDestination] = useState("All");

  // ✅ Fetch packages (avoid unnecessary API calls)
  useEffect(() => {
  if (packages.length === 0) {
    dispatch(fetchDomesticPackages({ page, limit: 9 }));
  }
}, [dispatch, packages.length]);


  // ✅ Handle destination filter
  useEffect(() => {
    if (destination && destination !== "All") {
      const formattedDestination = destination
        .replace(/-/g, " ")
        .toLowerCase()
        .trim();

      const matched = packages?.find(
        (pkg) => pkg.title.toLowerCase().trim() === formattedDestination
      );

      setSelectedDestination(matched ? matched.title : "All");
    } else {
      setSelectedDestination("All");
    }

    setPage(1);
  }, [destination]);

  // ✅ Filter packages
  const filteredPackages =
    selectedDestination === "All"
      ? packages
      : packages.filter(
          (pkg) =>
            pkg.title.toLowerCase().trim() ===
            selectedDestination.toLowerCase().trim()
        );

  const currentPackages = filteredPackages || [];

  // ✅ Navigate to details page (pass package data)
  const handleCardClick = (pkg) => {
    navigate(`/package/${pkg._id}`, { state: pkg });
    window.scrollTo(0, 0);
  };

  // ✅ Price helpers
  const getStandardHotelPrice = (pkg) => {
    if (pkg?.startingPrice) return pkg.startingPrice;
    if (pkg?.price) return pkg.price;

    if (!pkg.destinationNights?.length) return null;

    const firstDestination = pkg.destinationNights[0];

    if (!firstDestination?.hotels?.length) return null;

    const standardHotel = firstDestination.hotels.find(
      (hotel) => hotel.category === "standard"
    );

    if (standardHotel && standardHotel.pricePerPerson > 0) {
      return standardHotel.pricePerPerson;
    }

    return null;
  };

  const formatPrice = (price) => {
    if (!price) return "Price on request";
    return `₹${price.toLocaleString()}`;
  };

  const getPriceDisplay = (pkg) => {
    const price = getStandardHotelPrice(pkg);
    if (!price) return "Price on request";

    const prefix = pkg?.startingPrice ? "Starting " : "";
    return `${prefix}${formatPrice(price)}`;
  };

  // ❌ Error state
  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
          }}
        >
          <Breadcrumbs aria-label="breadcrumb">
            <MUILink underline="hover" color="inherit" component={Link} to="/">
              Home
            </MUILink>

            <MUILink
              underline="hover"
              color="inherit"
              component={Link}
              to="/domestic"
            >
              Domestic Packages
            </MUILink>

            <Typography color="text.primary" fontWeight="bold">
              {selectedDestination === "All"
                ? "All Packages"
                : selectedDestination}
            </Typography>
          </Breadcrumbs>
        </Paper>

        {/* Heading */}
        <Box textAlign="center" mb={5}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(90deg, #ff5722, #e91e63)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {selectedDestination === "All"
              ? "All Domestic Packages"
              : selectedDestination}
          </Typography>

          <Divider
            sx={{
              width: "150px",
              mx: "auto",
              my: 2,
              height: "4px",
              borderRadius: 2,
              background: "linear-gradient(90deg, #ff9800, #f44336)",
            }}
          />

          <Typography variant="subtitle1" color="text.secondary">
            Discover the best domestic travel packages
          </Typography>
        </Box>

        {/* Packages Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : filteredPackages.length > 0 ? (
          <>
            <Grid container spacing={2}>
              {currentPackages.map((pkg) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4 }}
                  key={pkg._id}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 20px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <PackageCard
                    image={
                      pkg.bannerImage
                        ? pkg.bannerImage.startsWith("http")
                          ? pkg.bannerImage
                          : pkg.bannerImage.startsWith("/upload/")
                          ? `${BASE_URL}${pkg.bannerImage}`
                          : `${BASE_URL}/upload/${pkg.bannerImage}`
                        : "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    title={pkg.title || "No Title"}
                    location={`${pkg.sector || "Unknown Sector"}, ${
                      pkg.arrivalCity || "Unknown City"
                    }`}
                    price={getPriceDisplay(pkg)}
                    onClick={() => handleCardClick(pkg)}
                    onQueryClick={() => console.log("Query:", pkg._id)}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={5}>
               <Pagination
  count={totalPages}
  page={page}
  onChange={(e, value) => {
    setPage(value);
    dispatch(fetchDomesticPackages({ page: value, limit: 9 }));
    window.scrollTo(0, 0);
  }}
  color="primary"
  size="large"
/>

              </Box>
            )}
          </>
        ) : (
          <Paper
            elevation={3}
            sx={{
              p: 5,
              mt: 4,
              textAlign: "center",
              borderRadius: 2,
              backgroundColor: "#fff",
            }}
          >
            <Typography variant="h5" color="text.secondary">
              No packages found for "{selectedDestination}"
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Please try selecting a different destination filter.
            </Typography>
          </Paper>
        )}

        {/* Footer Info */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: "center",
            mt: 6,
            fontStyle: "italic",
          }}
        >
          Showing {(page - 1) * 9 + 1} - {(page - 1) * 9 + packages.length} of{" "}
          {totalPackages} packages
        </Typography>
      </Container>
    </Box>
  );
};

export default Domestic;
