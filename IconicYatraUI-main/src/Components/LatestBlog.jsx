// src/components/GujaratHolidayBlog.jsx
import React from "react";
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    List,
    ListItem,
    Divider,
    Box,
    Chip,
    Button,
    Paper,
    alpha,
} from "@mui/material";
import {
    LocationOn,
    CalendarToday,
    Hotel,
    DirectionsCar,
    Explore,
} from "@mui/icons-material";

import Ahmedabad from "../assets/Blog/Blogimg2.jpg";
import RannofKutch from "../assets/Blog/Blogimg4.jpg";
import GirNationalPark from "../assets/Blog/Blogimg3.jpg";
import DwarkaSomnath from "../assets/Blog/Blogimg1.jpg";
import Saputara from "../assets/Blog/Blogimg5.jpg";
import BhujKutch from "../assets/Blog/Blogimg6.jpg"

export default function LatestBlog() {
    // Different images for each destination (using Unsplash with relevant searches)
    const destinations = [
        {
            title: "Ahmedabad",
            desc: "Ahmedabad, the largest city in Gujarat, is famous for its heritage sites, museums, and vibrant markets. The Ahmedabad city tour typically includes attractions like the Sabarmati Ashram, Kankaria Lake, and the intricate stepwells of Adalaj.",
            image: Ahmedabad,
            tags: ["Heritage", "City", "Cultural"],
        },
        {
            title: "Rann of Kutch",
            desc: "The Rann of Kutch is a breathtaking salt desert, especially spectacular during the Rann Utsav festival. Travelers can enjoy cultural programs, traditional handicrafts, and desert camping, making it a must-visit destination.",
            image: RannofKutch,
            tags: ["Desert", "Festival", "Adventure"],
        },
        {
            title: "Gir National Park",
            desc: "Wildlife enthusiasts will love Gir National Park, home to the majestic Asiatic lions, leopards, and a variety of bird species. Most packages offer guided safaris and nature trails to explore this natural wonder.",
            image: GirNationalPark,
            tags: ["Wildlife", "Safari", "Nature"],
        },
        {
            title: "Dwarka & Somnath",
            desc: "Gujarat is a treasure trove of spiritual sites. Dwarkadhish Temple and Somnath Jyotirlinga attract thousands of devotees every year. Pilgrimage tour packages often include comfortable transport, hotel stays, and guided temple visits.",
            image: DwarkaSomnath,
            tags: ["Temple", "Spiritual", "Pilgrimage"],
        },
        {
            title: "Saputara",
            desc: "Saputara, Gujarat’s only hill station, is perfect for those looking to relax amidst scenic landscapes. Activities include boating in Saputara Lake, trekking to Sunset Point, and visiting local gardens.",
            image: Saputara,
            tags: ["Hill Station", "Nature", "Trekking"],
        },
        {
            title: "Bhuj & Kutch",
            desc: "Bhuj is the gateway to Kutch, offering rich heritage and cultural experiences. Explore local handicrafts, traditional villages, and historical monuments.",
            image: BhujKutch,
            tags: ["Crafts", "Villages", "Heritage"],
        },
    ];

    const features = [
        {
            icon: <Hotel sx={{ mr: 1 }} />,
            text: "Budget-friendly hotels & transport",
        },
        { icon: <CalendarToday sx={{ mr: 1 }} />, text: "Customized itineraries" },
        {
            icon: <Explore sx={{ mr: 1 }} />,
            text: "Cultural immersion experiences",
        },
        {
            icon: <DirectionsCar sx={{ mr: 1 }} />,
            text: "Adventure activities included",
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            {/* Hero Section */}
            <Paper
                sx={{
                    position: "relative",
                    backgroundColor: "grey.800",
                    color: "#fff",
                    mb: 4,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1588418075872-bdcf56b8b13f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        p: { xs: 3, md: 6 },
                        pr: { md: 0 },
                    }}
                >
                    <Typography
                        component="h1"
                        variant="h3"
                        color="inherit"
                        gutterBottom
                        fontWeight="bold"
                    >
                        Affordable Gujarat Holiday Packages 2025
                    </Typography>
                    <Typography variant="h5" color="inherit" paragraph>
                        Explore Gujarat on a budget with our holiday packages. Visit
                        Ahmedabad, Kutch, Gir, Dwarka, Somnath & more. Book affordable tours
                        now!
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="inherit"
                        paragraph
                        sx={{ mb: 3 }}
                    >
                        Discover vibrant culture, majestic temples, and natural wonders with
                        our budget-friendly packages. Visit Ahmedabad, Kutch, Gir, Dwarka,
                        Somnath & more.
                    </Typography>
                    {/* <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Button variant="contained" color="primary" size="large">
                            Book Now
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ color: "white", borderColor: "white" }}
                            size="large"
                        >
                            View Packages
                        </Button>
                    </Box> */}
                </Box>
            </Paper>

            {/* Features Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {features.map((feature, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Paper
                            sx={{
                                p: 3,
                                textAlign: "center",
                                height: "100%",
                                transition: "transform 0.2s",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: 3,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 1,
                                }}
                            >
                                {feature.icon}
                                <Typography variant="body2" fontWeight="medium">
                                    {feature.text}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Introduction */}
            <Box sx={{ mb: 6 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    fontWeight="bold"
                    color="primary"
                    textAlign="center"
                >
                    Affordable Gujarat Holiday Packages: Explore Gujarat on a Budget
                </Typography>
                <Typography
                    variant="body1"
                    paragraph
                    sx={{ fontSize: "1.1rem", lineHeight: 1.7 }}
                >
                    Gujarat, known as the land of vibrant culture, majestic temples, and
                    natural wonders, is one of India’s most captivating travel
                    destinations. From bustling cities to serene landscapes, Gujarat
                    offers a diverse range of experiences for travelers of all kinds. If
                    you are looking for an exciting yet budget-friendly vacation,
                    affordable Gujarat holiday packages are your perfect solution. These
                    packages are designed to give you an unforgettable travel experience
                    without stretching your budget.
                </Typography>
                <Typography
                    variant="body1"
                    paragraph
                    sx={{ fontSize: "1.1rem", lineHeight: 1.7 }}
                >
                    If you are looking for an exciting yet budget-friendly vacation, our
                    affordable Gujarat holiday packages provide the perfect solution with
                    carefully curated experiences that won't break the bank.
                </Typography>
            </Box>

            {/* Why Choose Gujarat */}
            <Box sx={{ mb: 6 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    fontWeight="bold"
                    color="primary"
                    textAlign="center"
                >
                    Why Choose Gujarat for Your Holiday?
                </Typography>
                <Typography
                    variant="body1"
                    paragraph
                    sx={{ fontSize: "1.1rem", lineHeight: 1.7 }}
                >
                    Gujarat is a state that beautifully blends heritage, culture, and
                    natural beauty. Whether you are a history enthusiast, a nature lover,
                    or someone looking for spiritual experiences, Gujarat has something
                    for everyone.
                </Typography>
                <Grid container spacing={3}>
                    {[
                        {
                            title: "Historical & Cultural Tours",
                            description:
                                "Explore the rich heritage of cities like Ahmedabad, Bhuj, and Vadodara, where you can witness centuries-old architecture, museums, and cultural centers.",
                            color: "#ff6b6b",
                        },
                        {
                            title: "Pilgrimage & Spiritual Journeys",
                            description:
                                "Gujarat is home to some of India’s most revered temples, including Somnath Temple, Dwarkadhish Temple, and Somnath Jyotirlinga, making it ideal for spiritual travelers.",
                            color: "#4ecdc4",
                        },
                        {
                            title: "Adventure & Nature Experiences",
                            description:
                                " From the Rann of Kutch desert safari to trekking in the Saputara hills, Gujarat offers thrilling outdoor activities for adventure seekers.",
                            color: "#45b7d1",
                        },
                        {
                            title: "Wildlife Encounters",
                            description:
                                "Gir National Park, the last home of the Asiatic lion, is perfect for wildlife enthusiasts seeking a memorable safari experience.",
                            color: "#96ceb4",
                        },
                    ].map((item, index) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={index}>
                            <Paper
                                sx={{
                                    p: 3,
                                    height: "100%",
                                    borderLeft: `4px solid ${item.color}`,
                                }}
                            >
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    {item.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Destinations */}
            <Box sx={{ mb: 6 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    fontWeight="bold"
                    color="primary"
                    textAlign="center"
                >
                    Popular Destinations in Gujarat Covered by Holiday Packages
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mb: 4 }}
                >
                    Gujarat offers a wide range of attractions that make it a perfect
                    destination for budget travelers. Here’s a look at the popular places
                    covered in most affordable Gujarat tour packages
                </Typography>

                <Grid container spacing={3}>
                    {destinations.map((place, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card
                                sx={{
                                    height: "100%",
                                    transition: "transform 0.3s, box-shadow 0.3s",
                                    "&:hover": {
                                        transform: "translateY(-8px)",
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={place.image}
                                    alt={place.title}
                                    sx={{
                                        transition: "transform 0.3s",
                                        "&:hover": {
                                            transform: "scale(1.05)",
                                        },
                                    }}
                                />
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <LocationOn color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                                            {place.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {place.desc}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                        {place.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Benefits & Tips Side by Side */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: "100%" }}>
                        <Typography
                            variant="h5"
                            gutterBottom
                            fontWeight="bold"
                            color="primary"
                        >
                            Benefits of Booking an Affordable Gujarat Holiday Package
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Booking a well-planned Gujarat tour package has several advantages
                            over planning a trip independently:
                        </Typography>
                        <List dense>
                            {[
                                "Stress-Free Travel: Packages include transportation, hotels, and sightseeing arrangements, eliminating the hassle of planning every detail.",
                                "Cost Savings: Group discounts, early-bird offers, and all-inclusive packages make travel affordable.",
                                "Expert Guidance: Tour guides provide in-depth knowledge about each destination, enhancing your travel experience.",
                                "Time Efficiency: Pre-planned itineraries ensure you cover major attractions without wasting time figuring out routes or tickets.",
                                "Tailored Experiences: Many packages allow customization, whether you want a heritage tour, adventure tour, or wildlife tour.",
                            ].map((item, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mr: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <Typography variant="body2">{item}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: "100%" }}>
                        <Typography
                            variant="h5"
                            gutterBottom
                            fontWeight="bold"
                            color="primary"
                        >
                            Tips for Making Your Gujarat Trip Budget-Friendly
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Even with affordable packages, there are ways to make your Gujarat
                            trip even more cost-effective:
                        </Typography>
                        <List dense>
                            {[
                                "Book Early: Early bookings often come with discounts on hotels and flights",
                                "Travel Off-Season: Avoid peak seasons to get better rates and fewer crowds",
                                "Opt for Group Tours: Group packages reduce per-person costs for transportation and guides.",
                                "Choose Weekend Getaways: Short trips, like a weekend Ahmedabad or Kutch tour, can save money while offering a full experience.",
                                "Include Local Experiences: Street food tours, local markets, and cultural programs are affordable yet immersive experiences.",
                            ].map((item, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            bgcolor: "secondary.main",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mr: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <Typography variant="body2">{item}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Call to Action */}
            <Paper
                sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: alpha("#1976d2", 0.05),
                    borderRadius: 2,
                    mb: 4,
                }}
            >
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                    Ready to Explore Gujarat?
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Book your unforgettable journey today and create memories that last a
                    lifetime
                </Typography>
                <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>
                    Book Your Gujarat Adventure Now
                </Button>
            </Paper>

            {/* Conclusion */}
            <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4"
                    gutterBottom
                    fontWeight="bold"
                    color="primary"
                    textAlign="center">
                    Conclusion
                </Typography>
                <Typography
                    variant="body1"
                    paragraph
                    sx={{ fontSize: "1.1rem", fontStyle: "italic" }}
                >
                    Gujarat is a destination that offers diverse experiences, from
                    spiritual journeys and cultural tours to adventure and wildlife
                    expeditions. With affordable Gujarat holiday packages, travelers can
                    explore the state’s best attractions, enjoy comfortable
                    accommodations, and experience its rich culture—all without
                    overspending. Whether you’re planning a family vacation, a group trip,
                    or a solo adventure, Gujarat promises unforgettable memories. Book
                    your budget-friendly Gujarat tour package today and embark on a
                    journey full of heritage, culture, and adventure
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Book your Gujarat tour today and create unforgettable memories in
                    2025!
                </Typography>
            </Box>
        </Container>
    );
}