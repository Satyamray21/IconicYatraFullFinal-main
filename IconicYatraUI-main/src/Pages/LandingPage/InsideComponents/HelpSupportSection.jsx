import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Stack,
} from "@mui/material";

import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import WorkIcon from "@mui/icons-material/Work";
import StarIcon from "@mui/icons-material/Star";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SellIcon from "@mui/icons-material/Sell";
import SettingsIcon from "@mui/icons-material/Settings";
import confusedImg from "../../../assets/LandingImages/confused.png";

const features = [
  {
    icon: <SupportAgentIcon sx={{ fontSize: 40, color: "#8BC34A" }} />,
    title: "24/7 Assistance",
  },
  {
    icon: <WorkIcon sx={{ fontSize: 40, color: "#64B5F6" }} />,
    title: "10+ Years Expertise",
  },
  {
    icon: <StarIcon sx={{ fontSize: 40, color: "#FFA726" }} />,
    title: "4.9 Rated Service",
  },
  {
    icon: <CreditCardIcon sx={{ fontSize: 40, color: "#3F51B5" }} />,
    title: "Secure Online Payment",
  },
  {
    icon: <SellIcon sx={{ fontSize: 40, color: "#FF7043" }} />,
    title: "Best Price Guarantee",
  },
  {
    icon: <SettingsIcon sx={{ fontSize: 40, color: "#8BC34A" }} />,
    title: "100% Customizable Trips",
  },
];

const HelpSupportSection = () => {
  return (
    <Box sx={{ background: "#f4f4f4", py: 6 }}>
      <Container maxWidth="lg">
        
        {/* Top Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 5,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Left */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
  sx={{
    width: 80,
    height: 80,
    borderRadius: 2,
    background: "#f1f1f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Box
    component="img"
    src={confusedImg}
    alt="confused"
    sx={{
      width: 80,
      height: 80,
      objectFit: "contain",
    }}
  />
</Box>

            <Box>
              <Typography fontWeight={600}>
                Confused Where to Begin Your Move?
              </Typography>

              <Typography variant="body2">
                • Talk to Our Travel Experts
              </Typography>
              <Typography variant="body2">
                • Explore Popular Packages
              </Typography>
              <Typography variant="body2">
                • Get a Free Quote
              </Typography>
            </Box>
          </Stack>

          {/* Right */}
          <Stack spacing={1} alignItems="center">
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(45deg,#ff7a18,#ff4e50)",
                borderRadius: 5,
                px: 3,
              }}
            >
              GET A CALL BACK
            </Button>

            <Typography variant="body2" color="text.secondary">
              - Or Call -
            </Typography>

            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(45deg,#ff7a18,#ff4e50)",
                borderRadius: 5,
                px: 3,
              }}
            >
              +91-9998768015
            </Button>
          </Stack>
        </Paper>

        {/* Feature Cards */}
<Grid container spacing={3} alignItems="stretch">
  {features.map((item, index) => (
    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={index} sx={{ display: "flex" }}>
      <Paper
        elevation={0}
        sx={{
          textAlign: "center",
          p: 3,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          transition: "0.3s",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          "&:hover": {
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
            transform: "translateY(-4px)",
          },
        }}
      >
        <Box mb={1}>{item.icon}</Box>

        <Typography fontSize={14} fontWeight={500}>
          {item.title}
        </Typography>
      </Paper>
    </Grid>
  ))}
</Grid>

      </Container>
    </Box>
  );
};

export default HelpSupportSection;