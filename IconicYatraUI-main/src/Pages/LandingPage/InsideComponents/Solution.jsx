import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";

import QuoteForm from "./ContectForm";

const sliderItems = [
  "Explore the Beauty of Darjeeling & Sikkim",
  "Comfortable Stays and Smooth Transportation in the Himalayas",
  "Personalized Darjeeling and Sikkim Trip Planning",
  "Best Tea Gardens, Monasteries & Mountain Landscapes in One Tour",
];

function Solution({ landingData }) {

  const [openDialog, setOpenDialog] = useState(false);

  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);

  if (!landingData) return null;

  return (
    <>
      <Box sx={{ pt: 8, pb: 0, background: "#ffffff" }}>
        <Container maxWidth="lg">

          {/* Heading */}
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {landingData?.solutionTitle}
          </Typography>

          <Typography align="center" sx={{ color: "#6c7a89", mb: 6 }}>
            {landingData?.solutionDescription}
          </Typography>

          {/* Cards */}
          <Grid container spacing={4}>
            {landingData?.solutionItems?.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    background: "#f5f6f8",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                      
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                         
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                        }}
                      >
                        {item.icon?.url && (
                          <img
                            src={item.icon.url}
                            alt={item.title}
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>

                    </Box>

                    {/* Places List */}
                    <List dense>
                      {item.description?.split("\n").map((place, i) => (
                        <ListItem key={i} sx={{ pl: 1, py: 0.3 }}>
                          <ListItemText
                            primary={place}
                            primaryTypographyProps={{
                              sx: { fontSize: "0.95rem" },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Bottom Button */}
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleOpen}
              sx={{
                background: "linear-gradient(90deg,#ff8a3d,#f0652f)",
                px: 4,
                py: 1.5,
                borderRadius: "30px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              Plan a Custom Darjeeling & Sikkim Trip
            </Button>

            <Typography sx={{ mt: 2, color: "#6c7a89" }}>
              Want a personalized itinerary? Click the button and our travel
              experts will design a perfect Himalayan tour for you.
            </Typography>
          </Box>

        </Container>

        {/* Slider Bar */}
        <Box
          sx={{
            width: "100%",
            overflow: "hidden",
            mt: 4,
            background: "linear-gradient(90deg,#ff8a3d,#f0652f)",
            py: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "scrollText 25s linear infinite",
              alignItems: "center",
            }}
          >
            {[...sliderItems, ...sliderItems].map((text, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", mx: 3 }}
              >
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                  }}
                >
                  {text}
                </Typography>

                <StarIcon sx={{ color: "#fff", fontSize: 18, mx: 2 }} />
              </Box>
            ))}
          </Box>

          <style>
            {`
            @keyframes scrollText {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            `}
          </style>
        </Box>
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 5 }}>
          Plan Your Trip

          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <QuoteForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Solution;
