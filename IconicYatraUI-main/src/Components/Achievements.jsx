import React from 'react';
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import CountUp from 'react-countup';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';

const AchievementItem = ({ number, suffix, label, Icon }) => (
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
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Icon sx={{ fontSize: 40, color: '#555' }} />
    </Box>
    <Typography variant="h4" fontWeight="bold" color="#333">
      <CountUp end={number} duration={2.5} suffix={suffix} />
    </Typography>
    <Typography variant="subtitle1" mt={1} sx={{ fontWeight: 500, color: '#666' }}>
      {label}
    </Typography>
  </Box>
);

const Achievements = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const achievements = [
    { number: 9, suffix: '+', label: 'Years of Experience', Icon: EmojiEventsIcon },
    { number: 100, suffix: '+', label: 'Travel Experts', Icon: PeopleIcon },
    { number: 1500, suffix: '+', label: 'Happy Travelers', Icon: StarIcon },
    { number: 25, suffix: '+', label: 'Destinations Covered', Icon: PublicIcon },
  ];

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
        Our Achievements
      </Typography>

      <Grid
        container
        spacing={4}
        justifyContent="center"
        alignItems="stretch"
        sx={{ maxWidth: '1200px', mx: 'auto' }}
      >
        {achievements.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <AchievementItem
              number={item.number}
              suffix={item.suffix}
              label={item.label}
              Icon={item.Icon}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Achievements;
