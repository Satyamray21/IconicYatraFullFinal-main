import React from "react";
import { Box, Container, Grid, Typography, Card, CardContent } from "@mui/material";

function PackagesFeatures({ landingData }) {

  if (!landingData) return null;

  const features = landingData?.packageFeatures || [];

  return (
    <Box sx={{ background: "#f3f4f6", py: 8 }}>
      <Container maxWidth="lg">

        {/* Heading */}
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 600, mb: 6 }}
        >
          {landingData?.packageFeaturesTitle}
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

                  {/* Icon from API */}
                  <Box
                    component="img"
                    src={item?.icon?.url}
                    alt={item.title}
                    sx={{
                      width: 50,
                      height: 50,
                      objectFit: "contain",
                    }}
                  />

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
                      {item.description}
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
