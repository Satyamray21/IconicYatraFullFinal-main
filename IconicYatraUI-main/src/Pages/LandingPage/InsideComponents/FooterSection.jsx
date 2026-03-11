import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
} from "@mui/material";

const FooterSection = () => {
  return (
    <Box sx={{ background: "#3e434b", color: "#fff", pt: 6 }}>

      {/* Top Footer */}
      <Container maxWidth="lg">
        <Grid container spacing={4}>

          {/* Connect */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Connect with Our Team
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            <Typography sx={{ mb: 1 }}>
              +91 7053900957
            </Typography>

            <Typography>
              info@iconicyatra.com
            </Typography>
          </Grid>

          {/* Address */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Address
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            <Typography sx={{ mb: 2 }}>
              B-38, Second floor Sector-64, Noida UP 201301
            </Typography>

            <Typography variant="body2">
              Welcome to Iconic Yatra – where every journey becomes an unforgettable memory! We are a premier travel company specializing in domestic and international tour packages, dedicated to providing experiences that combine comfort, adventure, and cultural discovery.Welcome to Iconic Yatra – where every journey becomes an unforgettable memory! We are a premier travel company specializing in domestic and international tour packages, dedicated to providing experiences that combine comfort, adventure, and cultural discovery.
            </Typography>
          </Grid>

          {/* Contact Form */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Contact With us!
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            <TextField
              fullWidth
              placeholder="Enter Your Name*"
              size="small"
              sx={{ mb: 2, background: "#fff", borderRadius: 5 }}
            />

            <TextField
              fullWidth
              placeholder="Enter Your Email"
              size="small"
              sx={{ mb: 2, background: "#fff", borderRadius: 5 }}
            />

            <TextField
              fullWidth
              placeholder="Enter phone number*"
              size="small"
              sx={{ mb: 2, background: "#fff", borderRadius: 5 }}
            />

            <TextField
              fullWidth
              placeholder="Enter Your City"
              size="small"
              sx={{ mb: 2, background: "#fff", borderRadius: 5 }}
            />

            <Button
              fullWidth
              sx={{
                background: "linear-gradient(90deg,#ff8a00,#e52e71)",
                color: "#fff",
                borderRadius: 5,
                py: 1.2,
                fontWeight: 600,
                "&:hover": {
                  background: "linear-gradient(90deg,#ff8a00,#e52e71)",
                },
              }}
            >
              REQUEST A CALLBACK
            </Button>
          </Grid>
        </Grid>
      </Container>

      {/* Privacy Text */}
      <Box
        sx={{
          background: "#f5f5f5",
          color: "#333",
          textAlign: "center",
          py: 2,
          mt: 5,
          px: 2,
        }}
      >
        <Typography fontSize={14}>
          We are committed to safeguarding the personal information and data
          you share with us. Your trust is important to us, and we want to
          ensure that you are fully informed about how we handle your data.
          To learn more about our data protection practices and your rights.
        </Typography>
      </Box>

      {/* Bottom Footer */}
      <Box
        sx={{
          background: "#2e3238",
          color: "#fff",
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid size={{xs:12, md:6}}>
              <Typography fontSize={14}>
                © 2025 IconicYatra All Right Reserved.
                <span style={{ color: "#4da3ff", marginLeft: 8 }}>
                  Privacy Policy
                </span>
              </Typography>
            </Grid>

            <Grid size={{xs:12, md:6}} textAlign={{ xs: "left", md: "right" }}>
              <Typography fontSize={14}>
                Designed & Marketing By www.iconicyatra.com
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

    </Box>
  );
};

export default FooterSection;