import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import SubjectIcon from "@mui/icons-material/Subject";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { keyframes } from "@mui/system";
import carrerBanner from "../assets/Banner/careersBanner.jpg";
import teamImage1 from "../assets/Banner/banner1.jpg";
import teamImage2 from "../assets/Banner/banner2.jpg";
import teamImage3 from "../assets/Banner/banner3.jpg";
import teamImage4 from "../assets/Banner/banner4.jpg";

// Animation for floating elements
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export default function CareersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    subject: "",
    resume: null,
  });

  const [resumeName, setResumeName] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const perks = [
    {
      icon: <FlightTakeoffIcon fontSize="large" color="primary" />,
      title: "Travel Perks",
      desc: "Experience the destinations we create for our travelers.",
    },
    {
      icon: <WorkIcon fontSize="large" color="primary" />,
      title: "Growth Opportunities",
      desc: "Advance your career with training, mentorship, and projects that inspire.",
    },
    {
      icon: <EmojiEventsIcon fontSize="large" color="primary" />,
      title: "Impactful Work",
      desc: "Help people build unforgettable travel memories.",
    },
    {
      icon: <PeopleIcon fontSize="large" color="primary" />,
      title: "Supportive Team",
      desc: "Join passionate explorers who share your love for travel.",
    },
  ];

  const jobs = [
    { title: "Travel Consultant", type: "Full-Time", location: "Delhi, India" },
    {
      title: "Digital Marketing Executive",
      type: "Full-Time",
      location: "Remote / Hybrid",
    },
    {
      title: "Operations Executive",
      type: "Full-Time",
      location: "Mumbai, India",
    },
    {
      title: "Content Creator / Blogger",
      type: "Part-Time",
      location: "Remote",
    },
  ];

  const teamImages = [teamImage1, teamImage2, teamImage3, teamImage4];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is PDF
      if (file.type === "application/pdf") {
        // Check file size (max 5MB)
        if (file.size <= 5 * 1024 * 1024) {
          setFormData({
            ...formData,
            resume: file,
          });
          setResumeName(file.name);
        } else {
          setSnackbarMessage("File size should be less than 5MB");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
        }
      } else {
        setSnackbarMessage("Please upload only PDF files");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.email ||
      !formData.subject ||
      !formData.resume
    ) {
      setSnackbarMessage("Please fill in all fields and upload your resume");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbarMessage("Please enter a valid email address");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setSnackbarMessage("Please enter a valid 10-digit mobile number");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    // Show success message
    setSnackbarMessage(
      "Application submitted successfully! We'll get back to you soon.",
    );
    setSnackbarSeverity("success");
    setOpenSnackbar(true);

    // Reset form
    setFormData({
      name: "",
      mobile: "",
      email: "",
      subject: "",
      resume: null,
    });
    setResumeName("");

    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData);
  };

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          color: "#fff",
          py: 12,
          textAlign: "center",
          background: `url(${carrerBanner}) center/cover no-repeat`,
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
            backgroundColor: "rgba(0, 0, 0, 0.5)", // dark overlay with 50% opacity
            zIndex: 1,
          }}
        />

        {/* Content */}
        <Container sx={{ position: "relative", zIndex: 2 }}>
          <Typography
            variant={isMobile ? "h4" : "h2"}
            fontWeight="bold"
            sx={{ animation: `${float} 6s ease-in-out infinite` }}
          >
            Careers at Iconic Yatra
          </Typography>
          <Typography variant="h6" mt={2} sx={{ maxWidth: 700, mx: "auto" }}>
            Join our journey. Create memories. Build your career in travel with
            us.
          </Typography>
        </Container>
      </Box>

      {/* Why Work With Us */}
      <Container sx={{ py: 8 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          color="primary"
        >
          Why Work With Us?
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 700, mx: "auto" }}
        >
          We're building a culture that empowers our team to grow professionally
          while exploring the world.
        </Typography>
        <Grid container spacing={4}>
          {perks.map((perk, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  textAlign: "center",
                  py: 4,
                  borderRadius: 3,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "inline-flex",
                      p: 2,
                      borderRadius: "50%",
                      bgcolor: "#f5f5f5",
                      mb: 2,
                    }}
                  >
                    {perk.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" mt={2}>
                    {perk.title}
                  </Typography>
                  <Typography variant="body2" mt={1} color="text.secondary">
                    {perk.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Life at Iconic Yatra */}
      <Container sx={{ py: 8 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          color="primary"
        >
          Life at Iconic Yatra
        </Typography>
        <Grid container spacing={3}>
          {teamImages.map((image, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Box
                component="img"
                src={image}
                alt={`Team ${i + 1}`}
                sx={{
                  width: "100%",
                  borderRadius: 3,
                  height: 250,
                  objectFit: "cover",
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Career Application Form */}
      <Container sx={{ py: 8 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          color="primary"
        >
          Apply Now
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 700, mx: "auto" }}
        >
          Fill out the form below and we'll get back to you as soon as possible.
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            maxWidth: 800,
            mx: "auto",
          }}
        >
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Name Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {/* Mobile Number Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter your mobile number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {/* Email Field */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {/* Subject Field */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter subject (e.g., Application for Travel Consultant)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SubjectIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {/* Resume Upload Field */}
              <Grid size={{ xs: 12 }}>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  style={{ display: "block", width: "100%" }}
                >
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{
                      py: 3,
                      border: "2px dashed",
                      borderColor: "primary.main",
                      backgroundColor: "#f8f9ff",
                      width: "100%", // Explicit width
                      "&:hover": {
                        backgroundColor: "#f0f2ff",
                        borderColor: "primary.dark",
                      },
                    }}
                    startIcon={<AttachFileIcon />}
                  >
                    {resumeName ? resumeName : "Upload Resume (PDF only)"}
                  </Button>
                </label>

                {/* Show selected file name with success indicator */}
                {resumeName && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">
                      File selected: {resumeName}
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  * Max file size: 5MB. Only PDF files are accepted.
                </Typography>
              </Grid>

              {/* Submit Button */}
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 2,
                    mt: 2,
                    borderRadius: 3,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Submit Application
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "#fff",
          py: 5,
          textAlign: "center",
        }}
      >
        <Container>
          <Typography variant="h4" fontWeight="bold">
            Ready for Your Next Adventure?
          </Typography>
        </Container>
      </Box>

      {/* Snackbar for messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%", fontWeight: "medium" }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}