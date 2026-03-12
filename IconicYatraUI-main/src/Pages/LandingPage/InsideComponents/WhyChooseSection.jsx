import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import img from "../../../assets/LandingImages/sikkim.jpg";

const leftFeatures = [
  {
    title: "Tailor-Made Darjeeling & Sikkim Itineraries",
    desc: "Plan your perfect Himalayan getaway with customized itineraries covering Darjeeling, Gangtok, Pelling, Lachung, Yumthang Valley, and more.",
  },
  {
    title: "Handpicked Scenic Destinations",
    desc: "From the famous Darjeeling tea gardens to Tsomgo Lake, Tiger Hill, and the breathtaking Yumthang Valley, explore the most scenic places in the Eastern Himalayas.",
  },
  {
    title: "Value-for-Money Packages",
    desc: "Affordable Darjeeling and Sikkim tour packages designed to give you the best travel experiences without compromising on comfort and quality.",
  },
];

const rightFeatures = [
  {
    title: "End-to-End Travel Support",
    desc: "We handle hotel bookings, transport, sightseeing tours, and local experiences so you can enjoy a smooth and stress-free Himalayan holiday.",
  },
  {
    title: "Trusted Local Expertise",
    desc: "Our travel experts and local guides provide authentic insights into the culture, monasteries, tea estates, and traditions of Darjeeling and Sikkim.",
  },
  {
    title: "Flexible Trip Customization",
    desc: "Easily modify your travel plans including destinations, hotels, or travel dates so your Darjeeling and Sikkim trip perfectly suits your schedule.",
  },
];

function WhyChooseSection() {
  return (
    <Box sx={{ background: "#f5f6f8", py: 8 }}>
      <Container maxWidth="lg">
        {/* Heading */}
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 6 }}>
          Why Choose Our Darjeeling & Sikkim Tour Packages
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
              alt="Darjeeling and Sikkim Map"
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