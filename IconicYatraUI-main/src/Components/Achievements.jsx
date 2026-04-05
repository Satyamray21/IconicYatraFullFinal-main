import React from 'react';
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import CountUp from 'react-countup';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';

const AchievementItem = ({ number, suffix, label, icon }) => (
  <Box
    textAlign="center"
    sx={{
      py: 4,
      px: 3,
      background: 'white',
      borderRadius: 3,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
      },
    }}
  >
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
      <img
        src={icon}
        alt={label}
        style={{ width: 40, height: 40, objectFit: "contain" }}
      />
    </Box>

    <Typography variant="h4" fontWeight="bold" color="#333">
      <CountUp end={number} duration={2.5} suffix={suffix} />
    </Typography>

    <Typography variant="subtitle1" mt={1} sx={{ fontWeight: 500, color: '#666' }}>
      {label}
    </Typography>
  </Box>
);

const Achievements = ({data}) => {
   const achievementsList = data?.achievements || [];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

 

  return (
    <Box
      sx={{
        px: 2,
        py: 10,
        background: '#f9f9f9',
      }}
    >
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        gutterBottom
        sx={{
          background: 'linear-gradient(90deg, #ff5722, #e91e63)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
       {data?.title || "Our Achievements"}
      </Typography>

     <Grid
        container
        spacing={4}
        justifyContent="center"
        alignItems="stretch"
        sx={{ maxWidth: '1200px', mx: 'auto' }}
      >
        {achievementsList.map((item, index) => {
          const number = parseInt(item.value);
          const suffix = item.value.replace(number, "");

          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <AchievementItem
                number={number}
                suffix={suffix}
                label={item.label}
                icon={item.icon}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Achievements;
