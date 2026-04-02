import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const WhyChooseUs = ({ data }) => {
  const features = data?.features || [];
  const navigate = useNavigate();

  return (
    <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 8 }}>
      
      {/* Heading */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h4" fontWeight="bold">
          Why Choose <span style={{ color: "#ff5722" }}>Iconic Yatra?</span>
        </Typography>

        <Typography sx={{ mt: 2 }}>
          {data?.mainDescription}
        </Typography>
      </Box>

      {/* Features */}
      <Grid container spacing={3} justifyContent="center">
        {features.map((item, index) => (
          <Grid size={{ xs: 12, md: 3, sm: 6 }} key={index}>
            <Box textAlign="center">

              {/* ✅ Fixed Icon UI */}
              <Paper
                elevation={6}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff5722, #ff9800)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                {/* Inner white circle */}
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={item.icon}
                    alt={item.title}
                    sx={{
                      width: 28,
                      height: 28,
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Paper>

              <Typography variant="h6" fontWeight="bold">
                {item.title}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>

            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WhyChooseUs;
