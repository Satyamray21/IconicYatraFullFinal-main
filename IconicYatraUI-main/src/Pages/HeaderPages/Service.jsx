import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import servicesBg from '../../assets/Banner/banner2.jpg';

const services = [
  'FIT & Group Holidays and Package tours all over India.',
  'Jungle & National Park Safari arrangements.',
  'Hotel reservations all over India.',
  'Tailor-made tours for Individuals, Honeymooners, Groups, Students, Corporate, Business tours.',
  'Car/ Coach Rentals (Budget & Luxury).',
  'Visa and forex assistance.',
  'International/ domestic air ticketing & Railway Reservation, 24-hour Airlines Reservation Counter.',
  'Package tours all over India, Jungle & National Park Safari.'
];

const highlights = [
  { icon: <FlightTakeoffIcon fontSize="large" />, title: 'Worldwide Tours', desc: 'Explore destinations across the globe with our curated packages.' },
  { icon: <HotelIcon fontSize="large" />, title: 'Hotel Reservations', desc: 'Best deals on budget & luxury stays across India & abroad.' },
  { icon: <DirectionsCarIcon fontSize="large" />, title: 'Transport Services', desc: 'From budget cars to luxury coaches, we’ve got your journey covered.' },
  { icon: <NaturePeopleIcon fontSize="large" />, title: 'Adventure & Safari', desc: 'Experience the thrill of nature with customized safari trips.' },
];

const whyChooseUs = [
  { icon: <ThumbUpIcon />, title: 'Trusted Service', desc: 'Thousands of happy customers with 5-star reviews.' },
  { icon: <SecurityIcon />, title: 'Secure & Reliable', desc: 'Your bookings are protected with our trusted partners.' },
  { icon: <SupportAgentIcon />, title: '24/7 Support', desc: 'Always here to assist you at any stage of your journey.' },

  // ✅ NEW CARDS ADDED
  { icon: <PriceCheckIcon />, title: 'Best Price Guarantee', desc: 'Competitive pricing with maximum value for your travel budget.' },
  { icon: <TravelExploreIcon />, title: 'Customized Tour Plans', desc: 'Personalized itineraries designed according to your travel preferences.' },
  { icon: <EventAvailableIcon />, title: 'Easy & Hassle-Free Booking', desc: 'Quick confirmations and smooth booking experience from start to finish.' },
];

const Services = () => {
  return (
    <Box sx={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          height: { xs: 280, md: 300 },
          backgroundImage: `url(${servicesBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, px: 2 }}>
          <Typography variant="h2" fontWeight="bold" sx={{
            fontSize: { xs: '1.8rem', md: '2rem' },
          }}>ICONIC YATRA SERVICES</Typography>
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 400, fontSize: { xs: '1rem', md: '1rem' } }}>
            Making your journey memorable, comfortable & stress-free
          </Typography>
        </Box>
      </Box>

      {/* Breadcrumb */}
      <Paper elevation={1} sx={{ mt: 3, mb: 3, mx: { xs: 2, md: 10 }, p: 2 }}>
        <Breadcrumbs>
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Typography color="text.primary">Services</Typography>
        </Breadcrumbs>
      </Paper>

      {/* Title */}
      <Box sx={{ textAlign: 'center', mb: 5, px: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          OUR <span style={{ color: 'red' }}>SERVICES</span>
        </Typography>
        <Divider sx={{ mt: 1, width: 140, mx: 'auto', borderBottomWidth: 3 }} />
        <Typography
          variant="body1"
          sx={{ mt: 2, maxWidth: 700, mx: 'auto', color: 'text.secondary' }}
        >
          From adventure safaris to luxurious holidays, Iconic Yatra ensures every travel dream turns into reality with personalized services and seamless arrangements.
        </Typography>
      </Box>

      {/* Highlights */}
      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: 'auto', mb: 6, px: 2 }}>
        {highlights.map((item, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={3}
              sx={{
                textAlign: 'center',
                py: 5,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 8 }
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    mb: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    backgroundColor: '#fbe9e7',
                    color: 'red'
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {item.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Services List */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">What We Offer</Typography>
        <Divider sx={{ mt: 1, width: 160, mx: 'auto', borderBottomWidth: 2 }} />
      </Box>

      <Paper elevation={1} sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 4 }, mb: 8 }}>
        <Grid container spacing={2}>
          {services.map((item, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 6 }}>
              <ListItem
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  transition: 'background 0.3s',
                  '&:hover': { backgroundColor: '#f1f1f1' }
                }}
              >
                <ListItemIcon sx={{ minWidth: '32px', color: 'red' }}>
                  <ArrowRightIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Why Choose Us */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h4" fontWeight="bold">
          WHY <span style={{ color: 'red' }}>CHOOSE US?</span>
        </Typography>
        <Divider sx={{ mt: 1, width: 160, mx: 'auto', borderBottomWidth: 3 }} />
      </Box>

      <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto', px: 2, pb: 8 }}>
        {whyChooseUs.map((item, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={2}
              sx={{
                py: 4,
                px: 2,
                textAlign: 'center',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 }
              }}
            >
              <Box sx={{ color: 'red', mb: 2 }}>{item.icon}</Box>
              <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {item.desc}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Services;