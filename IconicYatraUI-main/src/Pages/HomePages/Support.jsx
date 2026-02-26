import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  TextField,
  Button,
} from '@mui/material';
import { Phone, Email, LocationOn } from '@mui/icons-material';

const ContactUs = () => {
  return (
    <Box sx={{ backgroundColor: '#ebebeb', minHeight: '100vh', py: 4 }}>
      {/* Breadcrumb */}
      <Paper elevation={1} sx={{ p: 2, mb: 4, mx: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="/">
            Home
          </Link>
          <Typography color="text.primary">Contact Us</Typography>
        </Breadcrumbs>
      </Paper>

      {/* Contact Info + Map */}

       {/* Contact Form */}
      <Box mt={6} px={4}>
        <Typography variant="h6" mb={2}>
          Contact <Box component="span" sx={{ color: '#d32f2f' }}>FORM</Box>
        </Typography>

        <Grid container spacing={2}>
          {/* Column 1: Name, Email, Mobile */}
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField fullWidth placeholder="Your Name" variant="outlined" size="small" />
              <TextField fullWidth placeholder="Your Email" variant="outlined" size="small" />
              <TextField fullWidth placeholder="Your Mobile No" variant="outlined" size="small" />
            </Box>
          </Grid>

          {/* Column 2: Address */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Your Address"
              multiline='true'
              rows={5}
              variant="outlined"
              size="large"
            />
          </Grid>

          {/* Column 3: Message */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Message"
              multiline
              rows={5}
              variant="outlined"
              size="large"
            />
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box mt={3} display="flex" gap={2}>
          <Button variant="contained" sx={{ backgroundColor: '#1f3556' }}>RESET</Button>
          <Button variant="contained" sx={{ backgroundColor: '#1f3556' }}>SEND</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ContactUs;
