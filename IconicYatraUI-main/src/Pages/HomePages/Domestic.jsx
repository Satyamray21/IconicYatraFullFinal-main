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
import { BASE_URL, destinationAxios } from "../../Utils/axiosInstance";
import { Pagination } from "@mui/material";
import InquiryFormDialog from "../../Components/InquiryFormDialog";

const normalizeText = (value = "") =>
  String(value).toLowerCase().trim().replace(/\s+/g, " ");
const slugifyValue = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
const DEFAULT_DOMESTIC_DESCRIPTION =
  "Explore the beauty of India with our curated domestic tours";

const Domestic = () => {
  const { destination } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState({});
  const [page, setPage] = useState(1);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState("");
  const [domesticDescriptionsBySlug, setDomesticDescriptionsBySlug] = useState(
    {},
  );
  const [domesticAllDescription, setDomesticAllDescription] = useState("");

  const {
    domestic: packages = [],
    loading,
    error,
    totalPages = 1,
    totalPackages = 0,
  } = useSelector((state) => state.packages);

  const [selectedDestination, setSelectedDestination] = useState("All");

  // ✅ Fetch packages (fetch more when filtering by sector to show all matches)
  useEffect(() => {
    const limit = destination ? 200 : 9;
    dispatch(fetchDomesticPackages({ page, limit }));
  }, [dispatch, page, destination]);

  useEffect(() => {
    let isMounted = true;

    const fetchDomesticDescriptions = async () => {
      try {
        const res = await destinationAxios.get("/?tourType=Domestic");
        if (!isMounted) return;

        const map = (Array.isArray(res.data) ? res.data : []).reduce(
          (acc, item) => {
            const sector = item?.sector?.trim();
            if (!sector) return acc;
            acc[slugifyValue(sector)] = item?.description?.trim() || "";
            return acc;
          },
          {},
        );

        setDomesticDescriptionsBySlug(map);
        const allDescriptionItem = (
          Array.isArray(res.data) ? res.data : []
        ).find((item) => !item?.sector);
        setDomesticAllDescription(
          allDescriptionItem?.tourTypeDescription?.trim() || "",
        );
      } catch (error) {
        if (isMounted) {
          setDomesticDescriptionsBySlug({});
          setDomesticAllDescription("");
        }
      }
    };

    fetchDomesticDescriptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Handle destination/sector filter from route
  // Reset page only when route changes, not when package data updates.
  useEffect(() => {
    if (destination && destination !== "All") {
      const routeSlug = String(destination).toLowerCase().trim();

      const matchedBySector = packages?.find(
        (pkg) => slugifyValue(pkg.sector) === routeSlug,
      );

      if (matchedBySector?.sector) {
        setSelectedDestination(matchedBySector.sector);
      } else {
        const matchedByTitle = packages?.find(
          (pkg) =>
            slugifyValue(pkg.title) === routeSlug ||
            normalizeText(pkg.title) ===
              normalizeText(routeSlug.replace(/-/g, " ")),
        );
        setSelectedDestination(matchedByTitle ? matchedByTitle.title : "All");
      }
    } else {
      setSelectedDestination("All");
    }

    setPage(1);
  }, [destination]);
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/INR");
        const data = await res.json();
        setRates(data.rates || {});
      } catch (err) {
        console.error("Currency fetch error", err);
      }
    };

    fetchRates();
  }, []);
  // ✅ Filter packages
  const filteredPackages =
    selectedDestination === "All"
      ? packages
      : packages.filter(
          (pkg) =>
            slugifyValue(pkg.sector) === slugifyValue(selectedDestination) ||
            normalizeText(pkg.title) === normalizeText(selectedDestination),
        );

  const currentPackages = filteredPackages || [];
  const selectedDescription =
    selectedDestination === "All"
      ? domesticAllDescription || DEFAULT_DOMESTIC_DESCRIPTION
      : domesticDescriptionsBySlug[slugifyValue(selectedDestination)] ||
        DEFAULT_DOMESTIC_DESCRIPTION;

  // ✅ Navigate to details page (pass package data)
  const handleCardClick = (pkg) => {
    navigate(`/package/${pkg._id}`, { state: pkg });
    window.scrollTo(0, 0);
  };

  // ✅ Handle query button click
  const handleQueryClick = (pkg) => {
    setSelectedPackageTitle(pkg.title);
    setInquiryDialogOpen(true);
  };

  // ✅ Price helpers
  const getStandardHotelPrice = (pkg) => {
    if (pkg?.startingPrice) return pkg.startingPrice;
    if (pkg?.price) return pkg.price;

    if (!pkg.destinationNights?.length) return null;

    const firstDestination = pkg.destinationNights[0];

    if (!firstDestination?.hotels?.length) return null;

    const standardHotel = firstDestination.hotels.find(
      (hotel) => hotel.category === "standard",
    );

    if (standardHotel && standardHotel.pricePerPerson > 0) {
      return standardHotel.pricePerPerson;
    }

    return null;
  };
  const convertPrice = (price) => {
    if (!price) return null;

    // INR → selected currency
    if (currency === "INR") return price;

    const rate = rates[currency];
    if (!rate) return price;

    let converted = price * rate;

    // ✅ increase by 25 if not INR
    converted += 25;

    return converted;
  };
  const formatPrice = (price) => {
    if (!price) return "Price on request";

    const converted = convertPrice(price);

    const symbols = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };

    return `${symbols[currency] || currency} ${Math.round(converted).toLocaleString()}`;
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
    <>
      <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 6 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ padding: "8px", borderRadius: "5px" }}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Box>
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
              <MUILink
                underline="hover"
                color="inherit"
                component={Link}
                to="/"
              >
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
              {selectedDescription}
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
                      onQueryClick={() => handleQueryClick(pkg)}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {selectedDestination === "All" && totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={5}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => {
                      setPage(value);
                      dispatch(
                        fetchDomesticPackages({ page: value, limit: 9 }),
                      );
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

export default Domestic;
