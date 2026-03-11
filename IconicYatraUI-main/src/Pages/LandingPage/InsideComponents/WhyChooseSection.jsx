import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import img from "../../../assets/LandingImages/gujrat.png";

const leftFeatures = [
  {
    title: "Tailor-Made Gujarat Itineraries",
    desc: "Plan your ideal Gujarat trip with customized itineraries covering Dwarka, Somnath, Gir, Diu, Kutch, and more according to your interests.",
  },
  {
    title: "Handpicked Scenic Spots",
    desc: "From the Rann of Kutch to Saputara and Gir National Park, explore the most beautiful and peaceful destinations in Gujarat.",
  },
  {
    title: "Value-for-Money Packages",
    desc: "Affordable Gujarat tours without compromising on comfort, experiences, or premium services for a memorable journey.",
  },
];

const rightFeatures = [
  {
    title: "End-to-End Travel Support",
    desc: "We take care of transportation, hotel bookings, sightseeing, and local experiences so you can enjoy a hassle-free Gujarat tour.",
  },
  {
    title: "Trusted Local Expertise",
    desc: "Our experienced guides and travel experts ensure authentic experiences and insider knowledge of Gujarat’s culture and attractions.",
  },
  {
    title: "Flexible Trip Customization",
    desc: "Modify your travel plan anytime—dates, destinations, or activities—so your Gujarat trip perfectly fits your schedule.",
  },
];

function WhyChooseSection() {
  return (
    <Box sx={{ background: "#f5f6f8", py: 8 }}>
      <Container maxWidth="lg">
        {/* Heading */}
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 6 }}>
          Why Choose Our Gujarat Tour Packages
        </Typography>

        <Grid container spacing={4} alignItems="center">
          {/* LEFT SIDE */}
          <Grid size={{ xs: 12, md: 4 }}>
            {leftFeatures.map((item, index) => (
              <Card
                key={index}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                  boxShadow: "none",
                  background: "#ffffff",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6c7a89", lineHeight: 1.6 }}
                  >
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* CENTER IMAGE */}
          <Grid size={{ xs: 12, md: 4 }} textAlign="center">
            <Box
              component="img"
              src={img}
              alt="Gujarat Map"
              sx={{
                width: "100%",
                maxWidth: 450,
              }}
            />
          </Grid>

          {/* RIGHT SIDE */}
          <Grid size={{ xs: 12, md: 4 }}>
            {rightFeatures.map((item, index) => (
              <Card
                key={index}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                  boxShadow: "none",
                  background: "#ffffff",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#6c7a89", lineHeight: 1.6 }}
                  >
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default WhyChooseSection;
