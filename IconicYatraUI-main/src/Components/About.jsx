import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
} from "@mui/material";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import {
  FlightTakeoff,
  Public,
  EmojiPeople,
  Star,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Visibility,
  Flag,
  Security,
  AutoAwesome,
  Nature,
  TrendingUp,
  Lightbulb,
} from "@mui/icons-material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PublicIcon from "@mui/icons-material/Public";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import aboutBanner from "../assets/Banner/aboutBanner.jpeg";
import about from "../assets/Banner/about.jpeg";
// Add this import for the new image
import legendaryTravel from "../assets/Banner/about.jpg";

const team = [
  {
    name: "Amit Sharma",
    role: "Founder & CEO",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Travel enthusiast with 15+ years of industry experience",
  },
  {
    name: "Priya Kapoor",
    role: "Travel Consultant",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Specialist in luxury and adventure travel packages",
  },
  {
    name: "Ravi Verma",
    role: "Tour Manager",
    img: "https://randomuser.me/api/portraits/men/76.jpg",
    bio: "Expert in cultural immersion experiences",
  },
];

const values = [
  {
    icon: <FlightTakeoff sx={{ fontSize: 40 }} />,
    title: "Adventure & Discovery",
    description:
      "Exploring new horizons and creating stories that last a lifetime",
  },
  {
    icon: <Public sx={{ fontSize: 40 }} />,
    title: "Cultural Connection",
    description: "Fostering cultural understanding and authentic experiences",
  },
  {
    icon: <EmojiPeople sx={{ fontSize: 40 }} />,
    title: "Personalized Service",
    description: "Tailored itineraries that cater to every traveler's needs",
  },
];

const goals = [
  {
    icon: <CrisisAlertIcon sx={{ fontSize: 40 }} />,
    title: "Tailor-Made Experiences",
    description:
      "Create customized tour packages that suit diverse interests and budgets, ensuring every journey is unique and personal.",
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: "Hassle-Free Travel",
    description:
      "Provide seamless, safe, and enjoyable travel experiences from start to finish with meticulous attention to detail.",
  },
  {
    icon: <Lightbulb sx={{ fontSize: 40 }} />,
    title: "Continuous Innovation",
    description:
      "Continuously enhance our services with cutting-edge technology to exceed customer expectations.",
  },
  {
    icon: <Nature sx={{ fontSize: 40 }} />,
    title: "Sustainable Tourism",
    description:
      "Promote responsible tourism practices that respect local communities and preserve environments.",
  },
];

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  return (
    <Box>
      {/* Hero Section with Parallax Effect */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url(${aboutBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: isMobile ? "scroll" : "fixed",
          color: "#fff",
          textAlign: "center",
          py: { xs: 8, sm: 10, md: 15 },
          px: 2,
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: "60vh", sm: "70vh", md: "80vh" },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container sx={{ position: "relative", zIndex: 2 }}>
          <Chip
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {/* 3 Stars */}
                {[...Array(3)].map((_, i) => (
                  <Star key={i} sx={{ color: "gold", fontSize: 20 }} />
                ))}
                <Typography component="span" sx={{ color: "white", ml: 1 }}>
                  Since of 2021
                </Typography>
              </Box>
            }
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "white",
              mb: 3,
              backdropFilter: "blur(10px)",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 1, sm: 2 },
              px: { xs: 1.5, sm: 2.5 },
              borderRadius: "24px",
            }}
          />
          <Typography
            variant="h1"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              mb: 3,
              lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
            }}
          >
            About Iconic Yatra
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 300,
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              lineHeight: 1.6,
              fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
              maxWidth: "800px",
              mx: "auto",
              px: { xs: 1, sm: 0 },
            }}
          >
            Welcome to Iconic Yatra – where every journey becomes an
            unforgettable memory!
          </Typography>
        </Container>
      </Box>

      {/* Introduction Section - Updated with Image on Left */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            color="primary"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              mb: 3,
            }}
          >
            Where Travel Becomes Legendary
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={4}
              sx={{
                borderRadius: { xs: 2, md: 4 },
                overflow: "hidden",
                height: { xs: 300, sm: 350, md: 400, lg: 450 },
                backgroundImage: `url(${legendaryTravel})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: 300,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  mb: 2,
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                }}
              >
                Welcome to Iconic Yatra – where every journey becomes an
                unforgettable memory! We are a premier travel company
                specializing in domestic and international tour packages,
                dedicated to providing experiences that combine comfort,
                adventure, and cultural discovery.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  mb: 2,
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                }}
              >
                At Iconic Yatra, we believe that travel is more than visiting
                places—it's about exploring new horizons, connecting with
                people, and creating stories that last a lifetime. With years of
                expertise and a passionate team of travel professionals, we
                design customized itineraries that cater to every traveler's
                needs.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                }}
              >
                From serene retreats and historical explorations to
                adrenaline-filled adventures, our packages ensure a seamless and
                enriching travel experience.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Mission Section */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            textAlign: "center",
            maxWidth: "800px",
            mx: "auto",
            mb: { xs: 4, md: 6 },
          }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            color="primary"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}
          >
            Our Mission
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              lineHeight: 1.7,
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
            }}
          >
            To provide exceptional and personalized travel experiences that
            inspire exploration, foster cultural understanding, and create
            lifelong memories. We are committed to delivering unmatched service,
            innovative itineraries, and meticulous attention to detail, ensuring
            every journey is enjoyable, safe, and unforgettable.
          </Typography>
        </Box>

        {/* Values Grid */}
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 2 }}>
          {values.map((value, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card
                sx={{
                  textAlign: "center",
                  p: { xs: 3, md: 4 },
                  borderRadius: { xs: 2, md: 4 },
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
                  },
                  minHeight: 280,
                }}
              >
                <Box
                  sx={{
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  {React.cloneElement(value.icon, {
                    sx: { fontSize: { xs: 35, md: 40 } }
                  })}
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
                >
                  {value.title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}
                >
                  {value.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Vision Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
        <Container>
          <Grid container alignItems="center" spacing={{ xs: 4, md: 6 }}>
            <Grid size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 1 }}>
              <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                <Chip
                  icon={<Visibility color="white" />}
                  label="Our Vision"
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    mb: 3,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    py: 1.5,
                    px: 2,
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  gutterBottom
                  color="primary"
                  sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}
                >
                  Shaping the Future of Travel
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.7,
                    mb: 3,
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" }
                  }}
                >
                  To become a globally recognized travel company, renowned for
                  innovation, reliability, and excellence in customer service.
                  We envision a world where every traveler experiences the true
                  essence of destinations, connecting deeply with cultures,
                  nature, and people.
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.7,
                    mb: 3,
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" }
                  }}
                >
                  Through continuous improvement, adoption of cutting-edge
                  technology, and sustainable travel practices, Iconic Yatra
                  strives to transform the travel experience, making us the
                  preferred choice for authentic, memorable, and inspiring
                  journeys.
                </Typography>
                <Box sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", md: "flex-start" }
                }}>
                  <Chip
                    label="Global Recognition"
                    variant="outlined"
                    color="primary"
                    size={isSmallMobile ? "small" : "medium"}
                  />
                  <Chip
                    label="Cultural Connection"
                    variant="outlined"
                    color="primary"
                    size={isSmallMobile ? "small" : "medium"}
                  />
                  <Chip
                    label="Sustainable Innovation"
                    variant="outlined"
                    color="primary"
                    size={isSmallMobile ? "small" : "medium"}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 2 }}>
              <Paper
                elevation={4}
                sx={{
                  borderRadius: { xs: 2, md: 4 },
                  overflow: "hidden",
                  height: { xs: 300, sm: 350, md: 400, lg: 450 },
                  backgroundImage: `url(${about})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: 300,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Goals Section */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Chip
            icon={<Flag color="white" />}
            label="Our Goals & Commitments"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 3,
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: 1.5,
              px: 2,
            }}
          />
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            color="primary"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}
          >
            Our Commitment to Excellence
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
              maxWidth: "800px",
              mx: "auto",
            }}
          >
            We are dedicated to achieving these key objectives to ensure we
            deliver exceptional value and unforgettable experiences to our
            travelers
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {goals.map((goal, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, md: 3 },
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                  minHeight: 200,
                }}
              >
                <Box sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: { xs: 2, sm: 3 },
                  flexDirection: { xs: "column", sm: "row" },
                  textAlign: { xs: "center", sm: "left" }
                }}>
                  <Box sx={{
                    color: "primary.main",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: { xs: "center", sm: "flex-start" },
                    width: { xs: "100%", sm: "auto" }
                  }}>
                    {React.cloneElement(goal.icon, {
                      sx: { fontSize: { xs: 35, md: 40 } }
                    })}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    >
                      {goal.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                    >
                      {goal.description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: { xs: 6, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
        ref={ref}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(45deg, rgba(0,0,0,0.1) 0%, transparent 100%)",
          }}
        />
        <Container sx={{ position: "relative" }}>
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight="bold"
            gutterBottom
            sx={{
              mb: { xs: 4, md: 6 },
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" }
            }}
          >
            Our Journey in Numbers
          </Typography>
          <Grid container spacing={4} textAlign="center">
            {/* Years of Excellence */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" } }}
              >
                {isVisible && <CountUp end={10} duration={2} />}+
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "1rem", sm: "1.1rem" }
                }}
              >
                Years of Excellence
              </Typography>
            </Grid>

            {/* Happy Travelers */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" } }}
              >
                {isVisible && <CountUp end={5000} duration={3} />}+
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "1rem", sm: "1.1rem" }
                }}
              >
                Happy Travelers
              </Typography>
            </Grid>

            {/* Destinations Covered */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" } }}
              >
                {isVisible && <CountUp end={50} duration={2.5} />}+
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "1rem", sm: "1.1rem" }
                }}
              >
                Destinations Covered
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            color="primary"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}
          >
            Meet Our Team
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Passionate travel experts dedicated to crafting your perfect journey
            and turning your travel dreams into reality
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
          {team.map((member, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card
                sx={{
                  textAlign: "center",
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, md: 4 },
                  boxShadow: 3,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                  height: "100%",
                }}
              >
                <Avatar
                  src={member.img}
                  alt={member.name}
                  sx={{
                    width: { xs: 80, sm: 100, md: 120 },
                    height: { xs: 80, sm: 100, md: 120 },
                    mx: "auto",
                    mb: 2,
                    border: "4px solid",
                    borderColor: "primary.main",
                  }}
                />
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                  >
                    {member.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary"
                    fontWeight="medium"
                    gutterBottom
                    sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                  >
                    {member.role}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                  >
                    {member.bio}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <IconButton
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ color: "#3b5998" }}
                    >
                      <Facebook fontSize={isSmallMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ color: "#1DA1F2" }}
                    >
                      <Twitter fontSize={isSmallMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ color: "#E1306C" }}
                    >
                      <Instagram fontSize={isSmallMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ color: "#0077B5" }}
                    >
                      <LinkedIn fontSize={isSmallMobile ? "small" : "medium"} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          textAlign: "center",
          py: { xs: 6, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container sx={{ position: "relative", zIndex: 2 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" } }}
          >
            Ready for Your Next Adventure?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              mb: 4,
              maxWidth: 600,
              mx: "auto",
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
              lineHeight: 1.6
            }}
          >
            At Iconic Yatra, we don't just plan trips—we craft experiences that
            leave a lasting impression. Let us guide you on your next iconic
            journey, turning your travel dreams into reality!
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "#fff",
              color: "primary.main",
              fontWeight: "bold",
              px: { xs: 3, sm: 4 },
              py: 1.5,
              borderRadius: 2,
              fontSize: { xs: "1rem", sm: "1.1rem" },
              "&:hover": {
                bgcolor: "#f5f5f5",
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
              transition: "all 0.3s",
              minWidth: { xs: "200px", sm: "auto" },
            }}
          >
            Plan Your Trip
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutUs;