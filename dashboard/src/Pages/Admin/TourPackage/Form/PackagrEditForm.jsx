import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Avatar,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Autocomplete, List, ListItem, ListItemText,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  BeachAccess as BeachIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchPackageById,
  updatePackageStep1,
  uploadPackageBanner,
  uploadPackageDayImage,
} from "../../../../features/package/packageSlice";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PackageEditView = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current } = useSelector((state) => state.packages);

  // State
  const [pkg, setPkg] = useState({
    title: "",
    sector: "",
    packageSubType: "",
    arrivalCity: "",
    departureCity: "",
    destinationCountry: "",
    notes: "",
    bannerImage: "",
    stayLocations: [],
    days: [],
    validFrom: "",
    validTill: "",
    category: "",
    offerCostStandard: "",
    offerCostDeluxe: "",
    offerCostSuperior: "",
    status: "deactive",
    mealPlan: {
      planType: "",
      description: "",
    },
    policy: {
      inclusionPolicy: [],
      exclusionPolicy: [],
      paymentPolicy: [],
      cancellationPolicy: [],
      termsAndConditions: []
    }
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchPackageById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (current) {
      // ✅ FIXED: Remove localhost URL conversion - Use Cloudinary URLs directly

      // Hotels ke prices direct pick karo
      let hotelCosts = { Standard: 0, Deluxe: 0, Superior: 0 };
      if (current.destinationNights?.length > 0) {
        current.destinationNights[0].hotels?.forEach((hotel) => {
          if (hotel.category.toLowerCase() === "standard")
            hotelCosts.Standard = hotel.pricePerPerson;
          if (hotel.category.toLowerCase() === "deluxe")
            hotelCosts.Deluxe = hotel.pricePerPerson;
          if (hotel.category.toLowerCase() === "superior")
            hotelCosts.Superior = hotel.pricePerPerson;
        });
      }

      // ✅ FIXED: Policy Data Conversion
      const getPolicyContent = (policyArray) => {
        if (!policyArray || !Array.isArray(policyArray) || policyArray.length === 0) return "";
        // Agar array mein HTML content hai toh directly use karo
        if (policyArray[0].includes('<p>') || policyArray[0].includes('<h')) {
          return policyArray[0]; // Pehla element return karo kyunki HTML format mein hai
        }
        // Agar plain text array hai toh HTML mein convert karo
        return policyArray.map(item => `<p>${item}</p>`).join('');
      };

      setPkg({
        ...pkg,
        _id: current._id,
        title: current.title || "",
        sector: current.sector || "",
        packageSubType: current.packageSubType || "",
        arrivalCity: current.arrivalCity || "",
        departureCity: current.departureCity || "",
        destinationCountry: current.destinationCountry || "",
        notes: current.notes || "",
        // ✅ FIXED: Use Cloudinary URL directly - NO localhost conversion
        bannerImage: current.bannerImage || "",
        stayLocations: current.stayLocations || [],
        // ✅ FIXED: Use Cloudinary URLs directly for day images - NO localhost conversion
        days: (current.days || []).map((d) => ({
          ...d,
          dayImage: d.dayImage || "",
        })),
        validFrom: current.validFrom?.split("T")[0] || "",
        validTill: current.validTill?.split("T")[0] || "",
        category: current.category || "",
        offerCostStandard: hotelCosts.Standard || "",
        offerCostDeluxe: hotelCosts.Deluxe || "",
        offerCostSuperior: hotelCosts.Superior || "",
        status: current.status || "deactive",
        mealPlan: current.mealPlan || { planType: "", description: "" },
        policy: {
          inclusionPolicy: getPolicyContent(current.policy?.inclusionPolicy),
          exclusionPolicy: getPolicyContent(current.policy?.exclusionPolicy),
          paymentPolicy: getPolicyContent(current.policy?.paymentPolicy),
          cancellationPolicy: getPolicyContent(current.policy?.cancellationPolicy),
          termsAndConditions: getPolicyContent(current.policy?.termsAndConditions)
        }
      });
    }
  }, [current]);

  // ✅ FIXED: Banner Upload Handler
  const handleBannerUpload = (file) => {
    if (!pkg._id) {
      alert("Package ID not found");
      return;
    }

    dispatch(uploadPackageBanner({ id: pkg._id, file }))
      .unwrap()
      .then((response) => {
        console.log("Banner upload response:", response);

        // ✅ FIXED: Update state with new banner image from response
        if (response.package?.bannerImage) {
          setPkg(prev => ({
            ...prev,
            bannerImage: response.package.bannerImage
          }));
          alert("✅ Banner updated successfully");
        } else if (response.bannerImage) {
          setPkg(prev => ({
            ...prev,
            bannerImage: response.bannerImage
          }));
          alert("✅ Banner updated successfully");
        } else {
          // If response structure is different, refetch the package
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Banner updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading banner:", error);
        alert("❌ Failed to update banner: " + (error.message || "Unknown error"));
      });
  };

  // ✅ FIXED: Day Image Upload Handler
  const handleDayImageUpload = (dayIndex, file) => {
    if (!pkg._id) {
      alert("Package ID not found");
      return;
    }

    dispatch(uploadPackageDayImage({
      id: pkg._id,
      dayIndex: dayIndex,
      file: file
    }))
      .unwrap()
      .then((response) => {
        console.log("Day image upload response:", response);

        // ✅ FIXED: Update specific day image in state
        if (response.package?.days?.[dayIndex]?.dayImage) {
          const updatedDays = [...pkg.days];
          updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            dayImage: response.package.days[dayIndex].dayImage
          };
          setPkg(prev => ({ ...prev, days: updatedDays }));
          alert("✅ Day image updated successfully");
        } else {
          // If response structure is different, refetch the package
          dispatch(fetchPackageById(pkg._id));
          alert("✅ Day image updated successfully");
        }
      })
      .catch((error) => {
        console.error("❌ Error uploading day image:", error);
        alert("❌ Failed to update day image: " + (error.message || "Unknown error"));
      });
  };

  // Handlers
  const handleStayChange = (index, field, value) => {
    const updated = [...pkg.stayLocations];
    updated[index][field] = value;
    setPkg({ ...pkg, stayLocations: updated });
  };

  const handleDayChange = (index, field, value) => {
    const updated = [...pkg.days];
    updated[index][field] = value;
    setPkg({ ...pkg, days: updated });
  };

  const handleSave = () => {
    if (!pkg) return;

    // ✅ FIXED: Convert HTML back to array format for backend
    const convertHtmlToArray = (htmlString) => {
      if (!htmlString || htmlString.trim() === '') return [];
      return [htmlString];
    };

    // ✅ FIXED: Ensure stayLocations has proper structure with required fields
    const validatedStayLocations = (pkg.stayLocations || []).map((location, index) => ({
      city: location?.city || `City ${index + 1}`,
      nights: location?.nights || 1
    }));

    // ✅ FIXED: Only send fields that actually exist in the package
    const transformedData = {
      // Remove tourType if it doesn't exist in current package
      destinationCountry: pkg.destinationCountry || "India",
      sector: pkg.sector || "",
      packageSubType: Array.isArray(pkg.packageSubType) ? pkg.packageSubType : [pkg.packageSubType || ""],

      // ✅ FIXED: Proper stayLocations structure
      stayLocations: validatedStayLocations.length > 0 ? validatedStayLocations : [
        { city: "Default City", nights: 1 }
      ],

      mealPlan: pkg.mealPlan || { planType: "CP", description: "" },

      // ✅ FIXED: Proper destinationNights structure
      destinationNights: validatedStayLocations.map(location => ({
        destination: location.city,
        nights: location.nights,
        hotels: [
          {
            category: "standard",
            hotelName: "TBD",
            pricePerPerson: Number(pkg.offerCostStandard) || 0,
          },
          {
            category: "deluxe",
            hotelName: "TBD",
            pricePerPerson: Number(pkg.offerCostDeluxe) || 0,
          },
          {
            category: "superior",
            hotelName: "TBD",
            pricePerPerson: Number(pkg.offerCostSuperior) || 0,
          },
        ],
      })),

      // ✅ POLICY DATA
      policy: {
        inclusionPolicy: convertHtmlToArray(pkg.policy?.inclusionPolicy || ""),
        exclusionPolicy: convertHtmlToArray(pkg.policy?.exclusionPolicy || ""),
        paymentPolicy: convertHtmlToArray(pkg.policy?.paymentPolicy || ""),
        cancellationPolicy: convertHtmlToArray(pkg.policy?.cancellationPolicy || ""),
        termsAndConditions: convertHtmlToArray(pkg.policy?.termsAndConditions || "")
      },

      arrivalCity: pkg.arrivalCity || "",
      departureCity: pkg.departureCity || "",
      title: pkg.title || "",
      notes: pkg.notes || "",
      bannerImage: pkg.bannerImage || "",
      validFrom: pkg.validFrom || null,
      validTill: pkg.validTill || null,
      status: pkg.status || "deactive"
    };

    console.log("Sending data to backend:", {
      stayLocations: transformedData.stayLocations,
      policy: transformedData.policy
    });

    // 🔹 Dispatch update
    dispatch(updatePackageStep1({ id: pkg._id, data: transformedData }))
      .unwrap()
      .then(() => {
        alert("✅ Package updated successfully");
        navigate("/tourpackage")
      })
      .catch((err) => {
        console.error("❌ Error updating package:", err);
        console.error("Error details:", err.response?.data);
        alert("❌ Failed to update package: " + (err.message || "Check console for details"));
      });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#eef3f8", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary">
          ✈️ Package Manager
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1, borderRadius: 2 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            sx={{ borderRadius: 2 }}
          >
            Convert to Quotation
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Form */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "white",
              boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              <EditIcon sx={{ mr: 1 }} /> Edit Package
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Basic Info */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Package Title"
                  fullWidth
                  value={pkg.title}
                  onChange={(e) => setPkg({ ...pkg, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Sector"
                  fullWidth
                  value={pkg.sector}
                  onChange={(e) => setPkg({ ...pkg, sector: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Package Sub Type"
                  fullWidth
                  value={pkg.packageSubType}
                  onChange={(e) =>
                    setPkg({ ...pkg, packageSubType: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BeachIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Destination Country"
                  fullWidth
                  value={pkg.destinationCountry}
                  onChange={(e) =>
                    setPkg({ ...pkg, destinationCountry: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {/* Validity + Status */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Validity & Status
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Valid From"
                  type="date"
                  fullWidth
                  value={pkg.validFrom}
                  onChange={(e) =>
                    setPkg({ ...pkg, validFrom: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Valid Till"
                  type="date"
                  fullWidth
                  value={pkg.validTill}
                  onChange={(e) =>
                    setPkg({ ...pkg, validTill: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={pkg.status}
                  onChange={(e) => setPkg({ ...pkg, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="deactive">Deactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Arrival/Departure */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Arrival & Departure
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Arrival City"
                  fullWidth
                  value={pkg.arrivalCity}
                  onChange={(e) =>
                    setPkg({ ...pkg, arrivalCity: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Departure City"
                  fullWidth
                  value={pkg.departureCity}
                  onChange={(e) =>
                    setPkg({ ...pkg, departureCity: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {/* Notes */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={pkg.notes}
              onChange={(e) => setPkg({ ...pkg, notes: e.target.value })}
            />

            {/* Banner - FIXED */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Banner Image
            </Typography>

            <Box
              sx={{
                textAlign: "center",
                p: 2,
                borderRadius: 4,
                background: "linear-gradient(145deg, #ffffffcc, #f3f6faee)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {pkg.bannerImage ? (
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                    height: 250,
                    "&:hover img": { transform: "scale(1.08)" },
                  }}
                >
                  <img
                    src={pkg.bannerImage}
                    alt="Banner"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "16px",
                      transition: "transform 0.6s ease",
                    }}
                  />
                  {/* Gradient Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.6))",
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                      p: 1.5,
                    }}
                  >
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #e3f2fd, #f9f9f9)",
                    boxShadow: "inset 0 6px 15px rgba(0,0,0,0.1)",
                    gap: 1.5,
                  }}
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="placeholder"
                    style={{ width: 90, opacity: 0.5 }}
                  />
                  <Typography color="text.secondary" fontWeight="500">
                    No banner image available
                  </Typography>
                </Box>
              )}

              {/* ✅ FIXED: Upload Button */}
              <Button
                variant="contained"
                component="label"
                sx={{
                  mt: 3,
                  borderRadius: 3,
                  px: 4,
                  py: 1.2,
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  textTransform: "none",
                  background: "linear-gradient(135deg, #42a5f5, #1976d2, #0d47a1)",
                  backgroundSize: "200% 200%",
                  animation: "gradientMove 4s ease infinite",
                  boxShadow: "0 8px 18px rgba(25, 118, 210, 0.35)",
                  "@keyframes gradientMove": {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                  },
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 10px 22px rgba(25,118,210,0.45)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Upload New Banner
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleBannerUpload(e.target.files[0]);
                    }
                  }}
                />
              </Button>
            </Box>

            {/* Days Section - FIXED */}
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3, mb: 2, color: "primary.main" }}
            >
              Itinerary Days
            </Typography>

            {pkg.days.map((day, index) => (
              <Paper
                key={index}
                elevation={3}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  background: "linear-gradient(145deg, #ffffff, #f3f6fa)",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
                }}
              >
                <Grid container spacing={3} alignItems="flex-start">
                  {/* Left Side → Image + Upload */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        border: "2px dashed #ccc",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        backgroundColor: "#f9f9f9",
                        mb: 2,
                      }}
                    >
                      {day.dayImage ? (
                        <img
                          src={day.dayImage}
                          alt={`Day ${index + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No Image
                        </Typography>
                      )}
                    </Box>

                    {/* ✅ FIXED: Day Image Upload Button */}
                    <Button
                      variant="contained"
                      component="label"
                      fullWidth
                      sx={{ textTransform: "none", borderRadius: 2, py: 1.2 }}
                    >
                      {day.dayImage ? "Change Image" : "Upload Image"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleDayImageUpload(index, e.target.files[0]);
                          }
                        }}
                      />
                    </Button>
                  </Grid>

                  {/* Right Side → Title + Description + Selected Sightseeing */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    {/* Title */}
                    <Box sx={{ mb: 2, alignItems: "center", gap: 1 }}>
                      <TextField
                        placeholder="Enter day title"
                        variant="standard"
                        value={day.title}
                        onChange={(e) => handleDayChange(index, "title", e.target.value)}
                        fullWidth
                        InputProps={{ style: { fontSize: "1.1rem", fontWeight: 500 } }}
                      />
                    </Box>

                    {/* Notes */}
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      minRows={3}
                      value={day.notes}
                      onChange={(e) => handleDayChange(index, "notes", e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    {/* Editable Sightseeing Multi-select */}
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Selected Sightseeing
                    </Typography>
                    <Autocomplete
                      multiple
                      freeSolo
                      options={day.sightseeing || []} // Available sightseeing list from API
                      value={day.selectedSightseeing || []}
                      onChange={(e, newValue) =>
                        handleDayChange(index, "selectedSightseeing", newValue)
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, i) => (
                          <Chip
                            key={i}
                            label={option}
                            {...getTagProps({ index: i })}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select or type sightseeing"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Meal Plan */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Meal Plan
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Plan Type"
                  fullWidth
                  value={pkg.mealPlan.planType}
                  onChange={(e) =>
                    setPkg({
                      ...pkg,
                      mealPlan: { ...pkg.mealPlan, planType: e.target.value },
                    })
                  }
                >
                  <MenuItem value="EP">EP (Room Only)</MenuItem>
                  <MenuItem value="CP">CP (Room + Breakfast)</MenuItem>
                  <MenuItem value="MAP">MAP (Breakfast + One Meal)</MenuItem>
                  <MenuItem value="AP">AP (All Meals)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Stay Locations */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Stay Locations
            </Typography>
            {pkg.stayLocations.map((item, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{ p: 2, mb: 2, backgroundColor: "#fafafa", borderRadius: 2 }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="City"
                      fullWidth
                      value={item.city}
                      onChange={(e) =>
                        handleStayChange(index, "city", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Nights"
                      type="number"
                      fullWidth
                      value={item.nights}
                      onChange={(e) =>
                        handleStayChange(index, "nights", e.target.value)
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Costs */}
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              sx={{ mt: 3 }}
            >
              Package Costs
            </Typography>
            <Grid container spacing={2}>
              {["Standard", "Deluxe", "Superior"].map((type, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <TextField
                    label={`${type} Cost`}
                    type="number"
                    fullWidth
                    value={pkg[`offerCost${type}`]}
                    onChange={(e) =>
                      setPkg({ ...pkg, [`offerCost${type}`]: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Policy Section */}
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary"
              sx={{ mt: 4, mb: 3, textAlign: 'center' }}
            >
              📋 Package Policies
            </Typography>

            <Grid container spacing={3}>
              {[
                {
                  key: 'inclusionPolicy',
                  label: '✅ Inclusion Policy',
                  helper: 'What is included in the package'
                },
                {
                  key: 'exclusionPolicy',
                  label: '❌ Exclusion Policy',
                  helper: 'What is not included in the package'
                },
                {
                  key: 'paymentPolicy',
                  label: '💰 Payment Policy',
                  helper: 'Payment terms and conditions'
                },
                {
                  key: 'cancellationPolicy',
                  label: '⏰ Cancellation Policy',
                  helper: 'Cancellation rules and refund policy'
                },
                {
                  key: 'termsAndConditions',
                  label: '📄 Terms & Conditions',
                  helper: 'General terms and conditions'
                }
              ].map((policy) => (
                <Grid size={{ xs: 12 }} key={policy.key}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      {policy.label}
                    </Typography>

                    <Box sx={{
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      overflow: 'hidden',
                      '& .ql-toolbar': {
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: '1px solid #ccc',
                        backgroundColor: '#f8f9fa'
                      },
                      '& .ql-container': {
                        border: 'none',
                        minHeight: '200px',
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif'
                      },
                      '& .ql-editor': {
                        minHeight: '200px',
                        fontSize: '14px'
                      }
                    }}>
                      <ReactQuill
                        value={pkg.policy?.[policy.key] || ""}
                        onChange={(content) => setPkg(prev => ({
                          ...prev,
                          policy: {
                            ...prev.policy,
                            [policy.key]: content
                          }
                        }))}
                        modules={{
                          toolbar: {
                            container: [
                              // Font family and size
                              [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],

                              // Text formatting
                              ['bold', 'italic', 'underline', 'strike'],

                              // Text color and background
                              [{ 'color': [] }, { 'background': [] }],

                              // Lists
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],

                              // Indentation
                              [{ 'indent': '-1' }, { 'indent': '+1' }],

                              // Alignment
                              [{ 'align': [] }],

                              // Headers
                              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                              // Script
                              [{ 'script': 'sub' }, { 'script': 'super' }],

                              // Blockquote and code
                              ['blockquote', 'code-block'],

                              // Links and media
                              ['link', 'image', 'video'],

                              // Clean formatting
                              ['clean']
                            ]
                          }
                        }}
                        formats={[
                          'font', 'size',
                          'bold', 'italic', 'underline', 'strike',
                          'color', 'background',
                          'list', 'bullet', 'indent',
                          'align', 'header',
                          'script', 'blockquote', 'code-block',
                          'link', 'image', 'video'
                        ]}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      💡 {policy.helper} - Use the toolbar above for rich text formatting
                    </Typography>

                    {/* Debug Info */}
                    {pkg.policy?.[policy.key] && (
                      <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                        🔍 Content loaded: {pkg.policy[policy.key].length} characters
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Save */}
            <Box textAlign="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                sx={{ px: 5, borderRadius: 2 }}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Info Panel */}
        <Grid size={{ xs: 12 }}>
          {/* Package Information Card */}
          <Paper
            elevation={6}
            sx={{
              p: 3,
              borderRadius: 4,
              mb: 3,
              background: "linear-gradient(145deg, #f5f7fa, #e0e6ed)",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📋 Package Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Validity
              </Typography>
              <Typography variant="body1">
                {pkg.validFrom || "--"} to {pkg.validTill || "--"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={pkg.status?.toUpperCase() || "DEACTIVE"}
                color={pkg.status === "active" ? "success" : "default"}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Package Sub Type
              </Typography>
              <Typography variant="body1">{pkg.packageSubType || "--"}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Sector
              </Typography>
              <Typography variant="body1">{pkg.sector || "--"}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Arrival / Departure
              </Typography>
              <Box>
                <Typography variant="body1">
                  Arrival: {pkg.arrivalCity || "--"}
                </Typography>
                <Typography variant="body1">
                  Departure: {pkg.departureCity || "--"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              💰 Offer Cost
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Chip
                label={`Standard: ₹${pkg.offerCostStandard || 0}`}
                color="primary"
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={`Deluxe: ₹${pkg.offerCostDeluxe || 0}`}
                color="secondary"
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={`Superior: ₹${pkg.offerCostSuperior || 0}`}
                color="success"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Paper>

          {/* Quick Actions Card */}
          <Paper
            elevation={6}
            sx={{
              p: 3,
              borderRadius: 4,
              background: "linear-gradient(145deg, #f5f7fa, #e0e6ed)",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ⚡ Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Button
              variant="contained"
              fullWidth
              sx={{ mb: 2, borderRadius: 3, backgroundColor: "#1976d2" }}
              startIcon={<DownloadIcon />}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              fullWidth
              sx={{ mb: 2, borderRadius: 3, backgroundColor: "#9c27b0" }}
              startIcon={<DescriptionIcon />}
            >
              Convert to Quotation
            </Button>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 3, backgroundColor: "#d32f2f" }}
              startIcon={<DeleteIcon />}
            >
              Delete Package
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PackageEditView;