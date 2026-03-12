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

import darjeelingImage from "../../../assets/LandingImages/darjeeking.jpg";

function OwnPackage() {
  const features = [
    "Choose the destinations you want to explore like Darjeeling, Gangtok, or Pelling",
    "Select your travel dates and trip duration",
    "Pick your preferred hotels, transport, and budget options",
    "Get a personalized Darjeeling & Sikkim itinerary designed for you",
  ];

  return (
    <Box sx={{ py: 8, background: "#f5f5f5" }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          
          {/* LEFT CONTENT */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 2, color: "#1e2b3a" }}
            >
              Create Your Own Darjeeling & Sikkim Tour Package
            </Typography>

            <Typography
              sx={{
                color: "#5f6c7b",
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              Not finding the perfect package? No problem. We offer fully
              customizable Darjeeling and Sikkim tour packages designed around
              your travel preferences, budget, and schedule so you can enjoy a
              memorable Himalayan holiday.
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
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={darjeelingImage}
              alt="Darjeeling and Sikkim Tour"
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