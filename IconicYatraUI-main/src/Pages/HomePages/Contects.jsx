import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  useMediaQuery,
  Paper,
  Divider,
  useTheme,
  Fade,
  Chip,
  IconButton,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SendIcon from "@mui/icons-material/Send";
import bannerImg from "../../assets/Banner/banner4.jpg";
import { keyframes } from "@emotion/react";
import { useSelector } from "react-redux";

// Animation
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const ContactUs = () => {
  const { data: company, status } = useSelector((state) => state.companyUI);

  const loading = status === "loading";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    destination: "",
    message: "",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // Reset form
    setFormData({
      name: "",
      email: "",
      mobile: "",
      destination: "",
      message: "",
    });
  };

  return (
    <>
      {/* Hero Banner */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 250, md: 350 },
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${bannerImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          textAlign: "center",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            p: { xs: 2, md: 4 },
            borderRadius: 3,
            animation: `${floatAnimation} 6s ease-in-out infinite`,
          }}
        >
          <Chip
            label="Get in Touch"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 2,
              fontSize: "1rem",
              px: 1,
              py: 2,
            }}
          />

          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{
              fontSize: { xs: "2.2rem", md: "3rem" },
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              mb: 1,
            }}
          >
            CONTACT US
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", md: "1.2rem" },
              maxWidth: "600px",
              mx: "auto",
              fontWeight: 300,
            }}
          >
            We're here to assist you anytime, anywhere. Let's start a
            conversation.
          </Typography>
        </Box>
      </Box>

      {/* Main Section */}
      <Box
        sx={{
          py: 8,
          backgroundColor: "#f9f9f9",
          backgroundImage: "radial-gradient(#e0e0e0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <Grid
          container
          spacing={4}
          sx={{ px: { xs: 2, md: 8 }, maxWidth: 1400, mx: "auto" }}
        >
          {/* Left Contact Info (UNCHANGED) */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Fade in={true} timeout={1000}>
              <Paper
                elevation={8}
                sx={{
                  background:
                    "linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)",
                  borderRadius: 4,
                  color: "white",
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    width: "200%",
                    height: "200%",
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                    top: "-50%",
                    left: "-50%",
                    animation: `${floatAnimation} 15s ease-in-out infinite`,
                  },
                }}
              >
                <Box position="relative" zIndex={1}>
                  <Typography
                    variant="h6"
                    color="orange"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Contact Info
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Let's Connect With Us
                  </Typography>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ opacity: 0.9 }}
                  >
                    We will help you regarding your query 24/7
                  </Typography>

                  <Divider
                    sx={{ my: 3, borderColor: "rgba(255,255,255,0.3)" }}
                  />

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    mt={2}
                  >
                    <Box
                      sx={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PhoneIcon sx={{ color: "orange" }} />
                    </Box>
                    <Box>
                      <Typography fontWeight="bold" variant="h6">
                        Phone Numbers
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>+91 1204582960</Typography>
                      <Typography>{company?.company?.call || ""}</Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    mt={3}
                  >
                    <Box
                      sx={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LocationOnIcon sx={{ color: "orange" }} />
                    </Box>
                    <Box>
                      <Typography fontWeight="bold" variant="h6">
                        Office Address
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>
                        {company?.company?.address}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center" mt={3}>
                    <Box
                      sx={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MailOutlineIcon sx={{ color: "orange" }} />
                    </Box>
                    <Box>
                      <Typography fontWeight="bold" variant="h6">
                        Email
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>
                        {company?.company?.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Fade>
          </Grid>

          {/* Right Form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Fade in timeout={1000} style={{ transitionDelay: "200ms" }}>
              <Paper
                elevation={4}
                sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}
              >
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  textAlign="center"
                  mb={4}
                  color="primary"
                >
                  Send Us a Message
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Your Name*"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Your Email*"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                      />
                    </Grid>

                    {/* ✅ NEW FIELD — MOBILE NUMBER */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Mobile Number*"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        fullWidth
                        required
                      />
                    </Grid>

                    {/* ✅ NEW FIELD — DESTINATION */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Your Message*"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        multiline
                        rows={5}
                        fullWidth
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }} textAlign="center">
                      <Button
                        type="submit"
                        variant="contained"
                        endIcon={<SendIcon />}
                        sx={{
                          px: 6,
                          py: 1.8,
                          borderRadius: "30px",
                          fontWeight: "bold",
                        }}
                      >
                        SEND MESSAGE
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Box>

      {/* Google Map (UNCHANGED) */}
      <Box mt={4}>
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.4992636520133!2d77.37238817349676!3d28.614795131144554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce56012bbdd9b%3A0x20e3b9eb57378bd9!2s38%2C%20B%20Block%20Rd%2C%20B%20Block%2C%20Sector%2064%2C%20Noida%2C%20Uttar%20Pradesh%20201307!5e0!3m2!1sen!2sin!4v1759315939359!5m2!1sen!2sin"
          width="100%"
          height="450"
          style={{ border: 0, display: "block" }}
          loading="lazy"
        />
      </Box>
    </>
  );
};

export default ContactUs;
