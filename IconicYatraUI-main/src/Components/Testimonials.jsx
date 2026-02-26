import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import {
  FormatQuote,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Place,
  Groups,
  FamilyRestroom,
  Favorite,
} from "@mui/icons-material";
import FlightIcon from "@mui/icons-material/Flight";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import testimonialBanner from "../assets/Banner/testimonialBanner.jpg"
// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Testimonial data
const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Adventure Traveler",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "Iconic Yatra crafted the most incredible trekking experience in the Himalayas. Their attention to detail and knowledgeable guides made it a trip of a lifetime!",
    location: "Himachal Pradesh, India",
    type: "adventure",
    highlight: "Himalayan Trek Expedition",
    date: "March 2023",
  },
  {
    name: "Priya Sharma",
    role: "Honeymooner",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "Our Maldives honeymoon was absolutely magical thanks to Iconic Yatra. They surprised us with a private dinner on the beach that we'll never forget!",
    location: "Maldives",
    type: "luxury",
    highlight: "Luxury Honeymoon Package",
    date: "January 2023",
  },
  {
    name: "The Gupta Family",
    role: "Family Vacation",
    avatar: "https://randomuser.me/api/portraits/med/women/67.jpg",
    rating: 4.5,
    text: "Traveling with kids can be challenging, but Iconic Yatra made our Singapore trip seamless. The kid-friendly activities and accommodations were perfect!",
    location: "Singapore",
    type: "family",
    highlight: "Family Fun Package",
    date: "June 2023",
  },
  {
    name: "Amit & Sunita",
    role: "Cultural Explorers",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    rating: 5,
    text: "The cultural tour of Rajasthan exceeded our expectations. We experienced authentic local traditions and stayed in heritage hotels that were breathtaking.",
    location: "Rajasthan, India",
    type: "cultural",
    highlight: "Royal Rajasthan Tour",
    date: "November 2022",
  },
  {
    name: "Neha Patel",
    role: "Solo Traveler",
    avatar: "https://randomuser.me/api/portraits/women/28.jpg",
    rating: 5,
    text: "As a solo female traveler, safety is my priority. Iconic Yatra provided a wonderful balance of independence and support during my Bali trip.",
    location: "Bali, Indonesia",
    type: "solo",
    highlight: "Solo Explorer Package",
    date: "August 2023",
  },
  {
    name: "Corporate Solutions Team",
    role: "Business Travel",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
    rating: 4.5,
    text: "Iconic Yatra handled our company's annual retreat flawlessly. From flights to accommodations and team-building activities, everything was perfectly organized.",
    location: "Goa, India",
    type: "corporate",
    highlight: "Corporate Retreat Package",
    date: "February 2023",
  },
];

// Statistics data
const stats = [
  { number: "10K+", label: "Happy Travelers" },
  { number: "25+", label: "Destinations" },
  { number: "98%", label: "Satisfaction Rate" },
  { number: "12", label: "Years Experience" },
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TestimonialsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tabValue, setTabValue] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredTestimonials =
    tabValue === "all"
      ? testimonials
      : testimonials.filter((t) => t.type === tabValue);

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === filteredTestimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? filteredTestimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          py: 12,
          textAlign: "center",
          color: "#fff",
          background: `url(${testimonialBanner}) center/cover no-repeat`,
        }}
      >
        {/* Overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Simple black overlay at 50% opacity
            zIndex: 1,
          }}
        />

        {/* Content */}
        <Container sx={{ position: "relative", zIndex: 2 }}>
          <Typography
            variant="h2"
            fontWeight="bold"
            gutterBottom
            sx={{
              animation: `${float} 6s ease-in-out infinite`,
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            Traveler Stories
          </Typography>
          <Typography
            variant="h5"
            sx={{ maxWidth: 800, mx: "auto", mb: 4 }}
          >
            Discover why thousands of travelers trust Iconic Yatra to create their perfect journeys
          </Typography>
        </Container>
      </Box>


      {/* Stats Section */}
      <Container sx={{ py: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
              <Box
                sx={{
                  textAlign: "center",
                  animation: `${fadeIn} 0.5s ease-in-out ${index * 0.1}s both`,
                }}
              >
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {stat.number}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: "background.default", py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
          >
            What Our Travelers Say
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 700, mx: "auto" }}
          >
            Real stories from real travelers who explored the world with Iconic
            Yatra
          </Typography>

          {/* Filter Tabs */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons="auto"
            >
              <Tab label="All" value="all" />
              <Tab icon={<Favorite />} label="Honeymoon" value="luxury" />
              <Tab icon={<FamilyRestroom />} label="Family" value="family" />
              <Tab icon={<Place />} label="Adventure" value="adventure" />
              <Tab icon={<Groups />} label="Corporate" value="corporate" />
            </Tabs>
          </Box>

          {/* Featured Testimonial Carousel */}
          <Box sx={{ position: "relative", mb: 8 }}>
            <Card
              sx={{
                p: 4,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.light,
                  0.1
                )} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
              }}
            >
              <FormatQuote
                sx={{
                  fontSize: 60,
                  color: "primary.main",
                  opacity: 0.2,
                  mb: 2,
                }}
              />

              <Typography variant="h6" sx={{ fontStyle: "italic", mb: 3 }}>
                "{filteredTestimonials[currentIndex].text}"
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  src={filteredTestimonials[currentIndex].avatar}
                  sx={{ width: 60, height: 60, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {filteredTestimonials[currentIndex].name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredTestimonials[currentIndex].role}
                  </Typography>
                </Box>
              </Box>

              <Rating
                value={filteredTestimonials[currentIndex].rating}
                readOnly
              />

              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Place fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {filteredTestimonials[currentIndex].location}
                </Typography>
                <Chip
                  label={filteredTestimonials[currentIndex].highlight}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              </Box>
            </Card>

            <IconButton
              onClick={handlePrev}
              sx={{
                position: "absolute",
                left: -20,
                top: "50%",
                bgcolor: "background.paper",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "primary.main", color: "white" },
              }}
            >
              <KeyboardArrowLeft />
            </IconButton>

            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                bgcolor: "background.paper",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "primary.main", color: "white" },
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
          </Box>

          {/* All Testimonials Grid */}
          <Grid container spacing={4}>
            {filteredTestimonials.map((testimonial, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    p: 3,
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <FormatQuote
                    sx={{
                      fontSize: 40,
                      color: "primary.main",
                      opacity: 0.2,
                      mb: 1,
                    }}
                  />

                  <Typography
                    variant="body1"
                    sx={{ fontStyle: "italic", mb: 2 }}
                  >
                    "{testimonial.text}"
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      src={testimonial.avatar}
                      sx={{ width: 50, height: 50, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Rating value={testimonial.rating} readOnly size="small" />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                      <Place
                        fontSize="small"
                        color="primary"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2">
                        {testimonial.location}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.date}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Create Your Story?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
            Join thousands of happy travelers who have experienced the world
            with Iconic Yatra
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label="Adventure Tours"
              icon={<FlightIcon sx={{ color: "#fff !important" }} />}
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />

            <Chip
              label="Adventure Tours"
              icon={<BeachAccessIcon sx={{ color: "#fff !important" }} />}
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />

            <Chip
              label="Adventure Tours"
              icon={<AccountBalanceIcon sx={{ color: "#fff !important" }} />}
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />

            <Chip
              label="Adventure Tours"
              icon={<BusinessCenterIcon sx={{ color: "#fff !important" }} />}
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
