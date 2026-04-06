// src/Pages/HomePages/FixDeparture.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link as MUILink
} from '@mui/material';
import PackageCard from '../../Components/PackageCard'; //  adjust path if needed

const FixDeparture = () => {
  const { destination } = useParams(); //  Get URL param
  const [selectedDestination, setSelectedDestination] = useState(destination || 'All');

  // 🔹 Sample Package Data
  const packages = [
    {
      id: 1,
      title: 'Europe',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_408/pkg_408_main.png?1751611781411',
      class:"img-responsive img-rounded",
      queryLink: 'https://example.com/query/europe'
    },
    {
      id: 2,
      title: 'Thailand',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_75/pkg_75_main.jpg?1751613238511',
      queryLink: 'https://example.com/query/thailand'
    },
    {
      id: 3,
      title: 'Singapore',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_315/pkg_315_main.png?1751613328441',
      queryLink: 'https://example.com/query/singapore'
    },
     {
      id: 4,
      title: 'Singapore',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_314/pkg_314_main.png?1751613328441',
      queryLink: 'https://example.com/query/singapore'
    },
    {
      id: 5,
      title: 'Baku',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_212/pkg_212_main.png?1751612819850',
      queryLink: 'https://example.com/query/baku'
    },
 {
      id: 6,
      title: 'Baku',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_211/pkg_211_main.png?1751612819850',
      queryLink: 'https://example.com/query/baku'
    },
   {
      id: 7,
      title: 'LADAKH',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_211/pkg_211_main.png?1751612819850',
      queryLink: 'https://example.com/query/Ladakh'
    },
    {
      id: 8,
      title: 'LADAKH',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_389/pkg_389_main.jpg?1751613511735',
      queryLink: 'https://example.com/query/Ladakh'
    },
    {
      id: 9,
      title: 'Malaysia',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_317/pkg_317_main.png?1751613833268',
      queryLink: 'https://example.com/query/Malaysia'
    },
   {
      id: 10,
      title: 'Malaysia',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_316/pkg_316_main.png?1751613833268',
      queryLink: 'https://example.com/query/Malaysia'
    },
 {
      id: 11,
      title: 'Sri Lanka',
      image: 'https://www.travserver.com/travelingfuns/uploads/packages/pkg_212/pkg_212_main.png?1751612819850',
      queryLink: 'https://example.com/query/SriLanka'
    },
  ];

  const destinations = ['All', ...new Set(packages.map(pkg => pkg.title))];

  useEffect(() => {
    if (destination) {
      const formatted = destination.replace(/-/g, ' ').toLowerCase();
      const matched = destinations.find((d) => d.toLowerCase() === formatted);
      setSelectedDestination(matched || 'All');
    }
  }, [destination]);

  const filteredPackages =
    selectedDestination === 'All'
      ? packages
      : packages.filter((pkg) => pkg.title.toLowerCase() === selectedDestination.toLowerCase());

  return (
    <Box sx={{py:3, backgroundColor: '#f5f5f5' , width:'100%',  }}>
      {/*  Breadcrumb */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, mx: 1,  }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 0.5 }}>
        <MUILink underline="hover" color="inherit" component={Link} to="/">
          Home
        </MUILink>

        <MUILink underline="hover" color="inherit" component={Link} to="/fixed/all">
          Fixed Departure
        </MUILink>

        <Typography color="text.primary">
          {selectedDestination}
        </Typography>
      </Breadcrumbs>
      </Paper>
      {/*  Dropdown to change destination */}
      
      {/* Cards Grid */}
      <Grid container spacing={2} sx={{backgroundPosition: 'center', justifyContent: 'center',textAlign: 'center',py:3}}>
        {filteredPackages.length > 0 ? (
          filteredPackages.map((pkg) => (
            <Grid item key={pkg.id}>
              <PackageCard
                image={pkg.image}
                title={pkg.title}
                queryLink={pkg.queryLink}
              />
            </Grid>
          ))
        ) : (
          <Typography variant="h6" sx={{ mt: 4 }}>
            No result found.
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default FixDeparture;
