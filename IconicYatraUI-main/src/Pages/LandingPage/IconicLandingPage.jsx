import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  IconButton,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import logo from "../../assets/Logo/logoiconic1.png";
import landing from "../../assets/LandingImages/darjrrling.jpg";

import OverView from "./InsideComponents/OverView";
import DomesticPackage from "../../Components/DomesticPackage";
import OwnPackage from "./InsideComponents/OwnPackage";
import Solution from "./InsideComponents/Solution";
import PackagesFeatures from "./InsideComponents/PackagesFeatures";
import WhyChooseSection from "./InsideComponents/WhyChooseSection";
import WorkProcess from "./InsideComponents/WorkProcess";
import HelpSupportSection from "./InsideComponents/HelpSupportSection";
import FAQSection from "./InsideComponents/FAQSection";
import FooterSection from "./InsideComponents/FooterSection";

export default function LandingPage() {
  return (
    <>
      <Box>
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            bgcolor: "#f4f4f4",
            py: { xs: 1.5, md: 2 },
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Container maxWidth="lg">
            <Grid container alignItems="center" spacing={2}>
              {/* Logo + Text */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <img src={logo} alt="India Tour24" style={{ height: 45 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: 13, md: 14 } }}
                  >
                    Explore the beauty of Darjeeling with scenic tea gardens,
                    Kanchenjunga mountain views, toy train rides, peaceful
                    monasteries, and unforgettable Himalayan experiences with
                    customizable tour packages.
                  </Typography>
                </Stack>
              </Grid>

              {/* Phone */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: "flex-start", md: "flex-end" }}
                  alignItems="center"
                >
                  <CallIcon color="error" />
                  <Typography fontWeight={600}>+91 7053900957</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ================= HERO SECTION ================= */}
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: "100vh", md: "85vh" },
            display: "flex",
            alignItems: "center",
            py: { xs: 6, md: 0 },
            backgroundImage: `url(${landing})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.2))",
            }}
          />

          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
            <Grid container spacing={4} alignItems="center">
              {/* LEFT CONTENT */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="white"
                  sx={{
                    mb: 2,
                    fontSize: {
                      xs: "1.9rem",
                      sm: "2.4rem",
                      md: "3rem",
                    },
                  }}
                >
                  DARJEELING TOUR PACKAGES – TEA GARDENS, TOY TRAIN & HIMALAYAN
                  VIEWS
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "#f1f1f1",
                    mb: 3,
                    maxWidth: 600,
                    fontSize: { xs: 14, md: 16 },
                  }}
                >
                  Discover the charm of Darjeeling with our customized tour
                  packages. Experience breathtaking Himalayan views, lush tea
                  gardens, the famous Darjeeling Himalayan Railway, peaceful
                  monasteries, and the unforgettable sunrise at Tiger Hill with
                  comfortable and hassle-free travel services.
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    bgcolor: "#25D366",
                    px: 3,
                    py: 1.2,
                    borderRadius: "30px",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#1ebe5d" },
                  }}
                >
                  Chat for Darjeeling Package
                </Button>
              </Grid>

              {/* RIGHT FORM */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  elevation={6}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.95)",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    textAlign="center"
                    color="error"
                    mb={3}
                  >
                    Plan Your Darjeeling Trip
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      placeholder="Enter Your Name*"
                      fullWidth
                      size="small"
                    />

                    <TextField
                      placeholder="Enter Your Email"
                      fullWidth
                      size="small"
                    />

                    <TextField
                      placeholder="Enter phone number*"
                      fullWidth
                      size="small"
                    />

                    <TextField
                      placeholder="Enter Your City"
                      fullWidth
                      size="small"
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        py: 1.4,
                        borderRadius: "30px",
                        fontWeight: 700,
                        background:
                          "linear-gradient(90deg,#ff7a18,#ff4e50)",
                      }}
                    >
                      PLAN MY DARJEELING TRIP
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ================= FLOATING BUTTONS ================= */}
        <Box
          sx={{
            position: "fixed",
            right: { xs: 15, md: 20 },
            bottom: { xs: 20, md: 30 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 10,
          }}
        >
          <IconButton
            sx={{
              bgcolor: "#fff",
              boxShadow: 3,
              width: { xs: 45, md: 50 },
              height: { xs: 45, md: 50 },
            }}
          >
            <CallIcon color="primary" />
          </IconButton>

          <IconButton
          onClick={() =>
    window.open(
      "https://wa.me/918130883907?text=Hello%21%20I%20need%20Gujarat%20tour%20package",
      "_blank"
    )
  }
            sx={{
              bgcolor: "#25D366",
              color: "#fff",
              width: { xs: 45, md: 50 },
              height: { xs: 45, md: 50 },
            }}
          >
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </Box>

      {/* OTHER SECTIONS */}
      <OverView />
      <DomesticPackage />
      <OwnPackage />
      <Solution />
      <PackagesFeatures />
      <WhyChooseSection />
      <WorkProcess />
      <HelpSupportSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}