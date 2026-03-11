import React from "react";
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
} from "@mui/material";

import TempleHinduIcon from "@mui/icons-material/TempleHindu";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PetsIcon from "@mui/icons-material/Pets";
import LandscapeIcon from "@mui/icons-material/Landscape";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import MapIcon from "@mui/icons-material/Map";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";

const placesData = [
  {
    title: "Spiritual & Pilgrimage",
    icon: <TempleHinduIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#2e7d32",
    places: [
      "Somnath Temple",
      "Dwarkadhish Temple (Dwarka)",
      "Akshardham Temple (Gandhinagar)",
      "Sun Temple (Modhera)",
      "Ambaji Temple",
      "Palitana Temples",
    ],
  },
  {
    title: "Heritage & Historical",
    icon: <AccountBalanceIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#6a1b9a",
    places: [
      "Rani ki Vav (Patan)",
      "Champaner-Pavagadh Park",
      "Sabarmati Ashram",
      "Laxmi Vilas Palace",
      "Junagadh Uparkot Fort",
      "Vijay Vilas Palace (Mandvi)",
    ],
  },
  {
    title: "Wildlife & Nature",
    icon: <PetsIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#ef6c00",
    places: [
      "Gir National Park",
      "Velavadar (Blackbuck NP)",
      "Marine National Park (Jamnagar)",
      "Nalsarovar Bird Sanctuary",
      "Jessore Sloth Bear Sanctuary",
      "Little Rann of Kutch",
    ],
  },
  {
    title: "Desert & Scenic Landscapes",
    icon: <LandscapeIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#f9a825",
    places: [
      "Rann of Kutch",
      "Mandvi Beach",
      "Diu Island",
      "Saputara Hill Station",
      "Polo Forest",
      "White Rann (seasonal events)",
    ],
  },
  {
    title: "Cultural & Unique Experiences",
    icon: <TheaterComedyIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#0288d1",
    places: [
      "Rann Utsav (Kutch)",
      "Navratri Garba (Ahmedabad)",
      "Kutch Handicrafts & Bhuj",
      "Patola Weaving (Patan)",
      "Tribal Culture (Dang)",
      "Local Food Trails",
    ],
  },
  {
    title: "Other Notable Places",
    icon: <MapIcon sx={{ color: "#fff", fontSize: 30 }} />,
    color: "#3949ab",
    places: [
      "Ahmedabad Old City",
      "Vadodara City & Museums",
      "Bhuj & Kutch Villages",
      "Junagadh & Girnar",
      "Bhavnagar Coastal Areas",
      "Porbandar (Birthplace of Gandhi)",
    ],
  },
];

const sliderItems = [
  "Discover Peaceful Escapes & Cultural Experiences in Gujarat",
  "Hassle-Free Stays and Smooth Transportation Across Gujarat",
  "Personalized Gujarat Trip Planning with Local Experts",
  "Best Heritage, Wildlife & Spiritual Destinations in One Tour",
];

function Solution() {
  return (
   <Box sx={{ pt: 8, pb: 0, background: "#ffffff" }}>
      <Container maxWidth="lg">
        {/* Heading */}
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 1 }}>
          Top Places to Visit in Gujarat
        </Typography>

        <Typography align="center" sx={{ color: "#6c7a89", mb: 6 }}>
          Category-wise quick list — use these in menus, package pages, or quick
          links for better user experience and SEO.
        </Typography>

        {/* Cards */}
        <Grid container spacing={4}>
          {placesData.map((item, index) => (
            <Grid size={{xs:12, md:4}} key={index}>
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
                  {/* Header */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        background: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2,
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                  </Box>

                  {/* List */}
                  <List dense>
                    {item.places.map((place, i) => (
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
            Plan a Custom Gujarat Trip
          </Button>

          <Typography sx={{ mt: 2, color: "#6c7a89" }}>
            Want these grouped into packages? Click the button to request a
            tailored itinerary.
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
  );
}

export default Solution;