import React from 'react';
import Slider from 'react-slick';
import { Box, Typography, Container } from '@mui/material';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import  img1 from "../assets/Gellary/G1.jpeg";
import  img2 from "../assets/Gellary/G11.jpg";
import  img3 from "../assets/Gellary/G12.jpg"
import  img4 from "../assets/Gellary/G9.jpg"
import  img5 from "../assets/Gellary/G14.jpeg"
import  img6 from "../assets/Gellary/G6.jpg"
import  img7 from "../assets/Gellary/G18.jpg"
import  img8 from "../assets/Gellary/G5.jpeg"
const galleryImages = [
 img1,
 img2,
 img3,
 img4,
 img5,
 img6,
 img7,
 img8
];

const Gallery = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 800,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: false,
    pauseOnHover: true,
    slidesToShow: 4, // Desktop par 4 images
    responsive: [
      {
        breakpoint: 1200, // large tablets / small desktops
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 900, // tablets
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 600, // mobile
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 5 }, background: '#e7e7e7' }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        sx={{
          background: 'linear-gradient(90deg, #ff5722, #e91e63)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        mb={4}
      >
        GALLERY
      </Typography>

      <Slider {...settings}>
        {galleryImages.map((img, index) => (
          <Box
            key={index}
            sx={{
              px: 1.5, // Same left-right padding
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              component="img"
              src={img}
              alt={`Gallery ${index + 1}`}
              sx={{
                width: '100%',
                height: { xs: 180, sm: 220, md: 250 },
                borderRadius: 3,
                objectFit: 'cover',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                },
              }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default Gallery;
