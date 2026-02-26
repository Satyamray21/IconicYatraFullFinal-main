import React from "react";
import { Box, Typography, Container } from "@mui/material";

const ThankYouPage = () => {
  return (
    <Box sx={{ width: "100%", overflowX: "hidden" }}>
      
      {/* ===== HERO SECTION ===== */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 260, md: 350 },
          backgroundImage:
            "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470')", // replace with your image
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        <Typography
          variant="h2"
          sx={{
            position: "relative",
            color: "#fff",
            fontWeight: 700,
            textAlign: "center",
            fontSize: { xs: "2rem", md: "3rem" },
          }}
        >
          Thank You
        </Typography>

        {/* Brush bottom effect */}
        <Box
          sx={{
            position: "absolute",
            bottom: -1,
            width: "100%",
            height: 80,
            background:
              "url('https://www.transparenttextures.com/patterns/brush-aluminium.png')",
            backgroundColor: "#f5f5f5",
          }}
        />
      </Box>

      {/* ===== CONTENT SECTION ===== */}
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          py: { xs: 6, md: 10 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          {/* Colorful Thank You Text */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 3,
              background:
                "linear-gradient(90deg,#ff0080,#ff8c00,#40e0d0,#8a2be2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Thank You!
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#0b2c5f",
              mb: 2,
            }}
          >
            THANKS FOR ENQUIRY WITH US!
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1rem",
            }}
          >
            Thank you, we will contact you soon.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default ThankYouPage;