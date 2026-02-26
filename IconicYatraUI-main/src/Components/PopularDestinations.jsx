import React from 'react'
import { Box, Divider, Typography } from '@mui/material'

const PopularDestinations = () => {
  return (
    <Box textAlign="center" mb={3} px={3} py={5}>
      <Typography variant="h5" fontWeight="bold">
        Popular <span style={{ color: 'red' }}>Destinations</span>
      </Typography>
      <Divider sx={{ borderColor: '#ff5722', borderBottomWidth: 3, mx: 'auto', width: '200px' }} />
    </Box >
  )
}

export default PopularDestinations
