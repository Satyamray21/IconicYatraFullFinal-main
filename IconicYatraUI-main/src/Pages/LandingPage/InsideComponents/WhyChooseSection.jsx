import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";

function WhyChooseSection({ landingData }) {

  if (!landingData) return null;

  const reasons = landingData?.whyChooseReasons || [];

  const mid = Math.ceil(reasons.length / 2);
  const leftFeatures = reasons.slice(0, mid);
  const rightFeatures = reasons.slice(mid);

  return (
    <Box sx={{ background: "#f5f6f8", py: 8 }}>
      <Container maxWidth="lg">

        {/* Heading */}
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 600, mb: 6 }}
        >
          {landingData?.whyChooseTitle}
        </Typography>

        <Grid container spacing={4} alignItems="center">

          {/* LEFT SIDE */}
          <Grid size={{ xs: 12, md: 4 }}>
            {leftFeatures.map((item) => (
              <Card
                key={item._id}
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
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* CENTER IMAGE */}
          <Grid size={{ xs: 12, md: 4 }} textAlign="center">
            <Box
              component="img"
              src={landingData?.whyChooseBannerImage?.url}
              alt="Why Choose Us"
              loading="lazy"
              sx={{
                width: "100%",
                maxWidth: 450,
              }}
            />
          </Grid>

          {/* RIGHT SIDE */}
          <Grid size={{ xs: 12, md: 4 }}>
            {rightFeatures.map((item) => (
              <Card
                key={item._id}
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
                    {item.description}
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
