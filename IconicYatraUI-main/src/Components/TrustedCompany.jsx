import React from 'react';
import { Box, Typography } from '@mui/material';

const TrustedCompany = () => {
  return (
    <Box sx={{ py: 8, width: '100%', px: { xs: 2, md: 6 } }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1f3c65 0%, #3aa8e5 100%)',
          color: '#fff',
          borderRadius: '40px',
          p: { xs: 4, sm: 6, md: 8 },
          textAlign: 'center',
          boxShadow: '0px 10px 30px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Glow Circle */}
        <Box
          sx={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: 180,
            height: 180,
            background:
              'radial-gradient(circle, rgba(255,87,34,0.4) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: 220,
            height: 220,
            background:
              'radial-gradient(circle, rgba(255,152,0,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />

        {/* Heading */}
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontFamily: 'inherit',
            position: 'relative',
            zIndex: 1,
            display: 'inline-block',
          }}
        >
          Most Trusted Travel Agency
          <Box
            sx={{
              mt: 1,
              height: '4px',
              width: '80%',
              mx: 'auto',
              backgroundColor: '#ff5722',
              borderRadius: '2px',
            }}
          />
        </Typography>

        {/* Content */}
        <Typography
          variant="body1"
          sx={{
            textAlign: 'justify',
            maxWidth: '1000px',
            margin: 'auto',
            mt: 4,
            lineHeight: 1.8,
            fontSize: '1rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Iconic Yatra is the most trusted and reliable travel agency in India.
          Our years of experience and the best team of experts allow us to offer
          premium travel services to our clients. With certified and highly
          experienced professionals, we have successfully served countless happy
          and satisfied travelers by meeting their requirements and expectations.
          <br />
          We provide customized solutions tailored to individual needs, ensuring
          that each journey is unique and memorable. Our services are designed
          to deliver the best possible experience, from planning to execution.
          <br />
          With continuous adaptation to the latest trends and technologies, our
          team ensures that Iconic Yatra stays ahead in delivering exceptional
          travel experiences, making us a leader in the industry.
        </Typography>
      </Box>
    </Box>
  );
};

export default TrustedCompany;
