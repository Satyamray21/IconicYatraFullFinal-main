import React from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import packageImg from "../../../assets/LandingImages/puzzle.png";
import destinationImg from "../../../assets/LandingImages/map.png";
import travelerImg from "../../../assets/LandingImages/diversity.png";

const FeatureCard = ({ image, title, description }) => (
  <Card
    sx={{
      textAlign: "center",
      borderRadius: 4,
      background: "#f7f7f7",
      border: "1px solid #e6e6e6",
      height: "100%",
      transition: "0.3s",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
      },
    }}
  >
    <CardContent sx={{ p: 4 }}>
      {/* Image */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <Box
          component="img"
          src={image}
          alt={title}
          sx={{
            width: 60,
            height: 60,
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 1.5,
          color: "#333",
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: "#666",
          lineHeight: 1.7,
          mb: 3,
        }}
      >
        {description}
      </Typography>

      {/* Button */}
      <Button
        variant="contained"
        startIcon={<WhatsAppIcon />}
        sx={{
          backgroundColor: "#25D366",
          borderRadius: "30px",
          textTransform: "none",
          fontWeight: 600,
          px: 3,
          "&:hover": {
            backgroundColor: "#1ebe5d",
          },
        }}
      >
        Chat with Us
      </Button>
    </CardContent>
  </Card>
);

function OverView() {
  return (
    <Box sx={{ py: 8, background: "#fff" }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              image={packageImg}
              title="Customizable Darjeeling & Sikkim Packages"
              description="Plan your perfect Himalayan getaway with fully customizable Darjeeling and Sikkim tour packages designed to match your travel style, duration, and budget."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              image={destinationImg}
              title="Top Destinations Covered"
              description="Explore beautiful destinations like Darjeeling, Gangtok, Pelling, Lachung, Yumthang Valley, and Tsomgo Lake with carefully curated travel itineraries."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              image={travelerImg}
              title="Tours for Every Traveler"
              description="Whether you're planning a honeymoon, family holiday, adventure trip, or group tour, our Darjeeling and Sikkim packages are designed for every type of traveler."
            />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default OverView;