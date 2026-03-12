import React from "react";
import { Box, Container, Grid, Typography, Paper } from "@mui/material";

const steps = [
  {
    number: "1",
    title: "Choose Your Darjeeling & Sikkim Package",
    description:
      "Explore our curated tour packages covering Darjeeling, Gangtok, Pelling, Tsomgo Lake, Yumthang Valley, and other breathtaking Himalayan destinations.",
  },
  {
    number: "2",
    title: "Customize Your Itinerary",
    description:
      "Add hotels, sightseeing spots, monasteries, tea garden tours, and adventure activities based on your interests and travel preferences.",
  },
  {
    number: "3",
    title: "Confirm Your Booking",
    description:
      "Receive a detailed travel plan for your Darjeeling and Sikkim trip and confirm your booking with secure and hassle-free payment options.",
  },
  {
    number: "4",
    title: "Enjoy Your Himalayan Trip",
    description:
      "Relax and experience the beauty of tea gardens, mountain landscapes, monasteries, lakes, and local culture while we manage all travel arrangements.",
  },
];

const WorkProcess = () => {
  return (
    <Box sx={{ py: 8, backgroundColor: "#f7f7f7" }}>
      <Container maxWidth="lg">
        
        {/* Section Heading */}
        <Typography
          align="center"
          sx={{
            fontSize: "16px",
            color: "#666",
            mb: 1,
          }}
        >
          Our Work Process
        </Typography>

        <Typography
          align="center"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "26px", md: "34px" },
            mb: 6,
          }}
        >
          Simple & Hassle-Free Darjeeling & Sikkim Travel Planning
        </Typography>

        {/* Cards */}
        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 3,
                  border: "1px solid #e5e5e5",
                  height: "100%",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  },
                }}
              >
                {/* Step Circle */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "#fff",
                    background: "linear-gradient(135deg,#ff7a18,#ff4e50)",
                    border: "3px dashed #ffb199",
                  }}
                >
                  {step.number}
                </Box>

                {/* Title */}
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  {step.title}
                </Typography>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: 1.7,
                  }}
                >
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};

export default WorkProcess;