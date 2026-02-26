import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Skeleton
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const PackageCard = ({
  image,
  title,
  location,
  duration,
  price,
  onClick,
  onQueryClick,
  loading = false,
  elevation = 10
}) => {
  // Handle image error
  const handleImageError = (e) => {
    e.target.src = '/images/placeholder-image.jpg'; // Fallback image
    e.target.alt = 'Image not available';
  };

  if (loading) {
    return (
      <Card sx={{ width: 308, borderRadius: 2, boxShadow: elevation }}>
        <Skeleton variant="rectangular" height={260} />
        <CardContent>
          <Skeleton variant="text" height={32} />
          <Skeleton variant="text" height={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ width: 308, borderRadius: 2, boxShadow: elevation }}>
      <CardActionArea
        onClick={onClick}
        sx={{ position: 'relative' }}
        disabled={!onClick}
      >
        {/* Image with fallback */}
        <CardMedia
          component="img"
          height="260"
          image={image}
          alt={title}
          onError={handleImageError}
          sx={{
            objectFit: 'cover',
            backgroundColor: '#f5f5f5'
          }}
        />

        {/* Duration Chip */}
        {duration && (
          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={duration}
              size="small"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
        )}

        {/* Price Chip */}
        {price && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Chip
              icon={<AttachMoneyIcon />}
              label={price}
              size="small"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
        )}

        {/* Send Query button */}
        <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: 'none',
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onQueryClick();
            }}
          >
            Send Query
          </Button>
        </Box>

        {/* Image Error Overlay */}
        {!image && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)',
              color: 'text.secondary'
            }}
          >
            <ErrorOutlineIcon fontSize="large" />
          </Box>
        )}
      </CardActionArea>

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 120 }}>
        {/* Title */}
        <Typography
          variant="h6"
          fontWeight="bold"
          color="#000"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '64px'
          }}
        >
          {title || 'Package Name Not Available'}
        </Typography>

        {/* Location */}
        {location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {location}
            </Typography>
          </Box>
        )}

        {/* Additional Info - You can add more fields here based on your API response */}
        {/* {pkgData?.days && pkgData?.nights && (
          <Typography variant="body2" color="text.secondary">
            {pkgData.days} Days / {pkgData.nights} Nights
          </Typography>
        )} */}
      </CardContent>
    </Card>
  );
};

PackageCard.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string,
  location: PropTypes.string,
  duration: PropTypes.string,
  price: PropTypes.string,
  onClick: PropTypes.func,
  onQueryClick: PropTypes.func,
  loading: PropTypes.bool,
  elevation: PropTypes.number,
};

PackageCard.defaultProps = {
  image: '/images/placeholder-image.jpg',
  title: 'Package Title',
  onQueryClick: () => console.log('Query button clicked'),
  loading: false,
  elevation: 10,
};

export default PackageCard;