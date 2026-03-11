import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import gujaratImage from "../../../assets/LandingImages/mid2.webp"; 

function OwnPackage() {
  const features = [
    "Choose destinations you want to cover",
    "Decide your travel dates and duration",
    "Select budget, hotels, and transport options",
    "Get a personalized itinerary crafted just for you",
  ];

  return (
    <Box sx={{ py: 8, background: "#f5f5f5" }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          
          {/* LEFT CONTENT */}
          <Grid size={{xs:12, md:6}}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 2, color: "#1e2b3a" }}
            >
              Create Your Own Gujarat Tour Package
            </Typography>

            <Typography
              sx={{
                color: "#5f6c7b",
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              Not finding the right package? Don’t worry! We offer fully
              customizable Gujarat tour packages designed as per your travel
              dates, budget, and interests.
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 4 }}>
              {features.map((item, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <CheckCircleIcon sx={{ color: "#2e7d32" }} />
                  <Typography sx={{ color: "#2b3b4b" }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#ff8a3d,#f0652f)",
                px: 4,
                py: 1.4,
                borderRadius: "30px",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(90deg,#f47c32,#e85924)",
                },
              }}
            >
              Customize My Trip
            </Button>
          </Grid>

          {/* RIGHT IMAGE */}
          <Grid size={{xs:12, md:6}}>
            <Box
              component="img"
              src={gujaratImage}
              alt="Gujarat Tour"
              sx={{
                width: "100%",
                borderRadius: 3,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default OwnPackage;