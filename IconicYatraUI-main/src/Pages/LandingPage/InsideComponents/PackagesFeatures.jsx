import React from "react";
import { Box, Container, Grid, Typography, Card, CardContent } from "@mui/material";

import ApartmentIcon from "@mui/icons-material/Apartment";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import MapIcon from "@mui/icons-material/Map";
import FlightIcon from "@mui/icons-material/Flight";

const features = [
  {
    title: "Handpicked Stays",
    desc: "Stay at carefully selected hotels, mountain resorts, and cozy homestays across Darjeeling, Gangtok, Pelling, and other scenic Himalayan destinations.",
    icon: <ApartmentIcon sx={{ fontSize: 40, color: "#0f6b4b" }} />,
  },
  {
    title: "Daily Meals",
    desc: "Enjoy delicious local cuisine including Tibetan, Nepali, and Himalayan specialties with breakfast and meal options included in your package.",
    icon: <RestaurantIcon sx={{ fontSize: 40, color: "#ff9800" }} />,
  },
  {
    title: "Private Transfers",
    desc: "Comfortable private cabs and local transport for smooth travel between Darjeeling, Gangtok, Lachung, Tsomgo Lake, and other destinations.",
    icon: <DirectionsCarIcon sx={{ fontSize: 40, color: "#2196f3" }} />,
  },
  {
    title: "Dedicated Support",
    desc: "24/7 travel assistance from our experts to ensure your Darjeeling and Sikkim tour remains safe, comfortable, and memorable.",
    icon: <HeadsetMicIcon sx={{ fontSize: 40, color: "#9c27b0" }} />,
  },
  {
    title: "Custom Itineraries",
    desc: "Flexible travel plans designed around your interests whether it’s honeymoon trips, family holidays, adventure tours, or cultural experiences.",
    icon: <MapIcon sx={{ fontSize: 40, color: "#ff5722" }} />,
  },
  {
    title: "Optional Airfare",
    desc: "Choose packages with or without flights depending on your departure city and travel preferences.",
    icon: <FlightIcon sx={{ fontSize: 40, color: "#4caf50" }} />,
  },
];

function PackagesFeatures() {
  return (
    <Box sx={{ background: "#f3f4f6", py: 8 }}>
      <Container maxWidth="lg">

        {/* Heading */}
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 600, mb: 6 }}
        >
          All-Inclusive Darjeeling & Sikkim Tour Packages
        </Typography>

        {/* Grid */}
        <Grid container spacing={4}>
          {features.map((item, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                  height: "100%",
                }}
              >
                <CardContent sx={{ display: "flex", gap: 2, p: 3 }}>
                  
                  {/* Icon */}
                  <Box>{item.icon}</Box>

                  {/* Text */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ color: "#6c7a89", lineHeight: 1.6 }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
}

export default PackagesFeatures;