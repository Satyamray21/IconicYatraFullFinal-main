import React, { useState } from 'react';
import { Typography, Grid, Box, Divider } from '@mui/material';
import PackageCard from '../../Components/PackageCard';
import InquiryFormDialog from '../../Components/InquiryFormDialog';

import img1 from "../../assets/packageimg/package1.png";
import img2 from "../../assets/packageimg/package2.png";
import img3 from "../../assets/packageimg/package3.png";
import img4 from "../../assets/packageimg/package4.jpg";
import img5 from "../../assets/packageimg/package5.png";
import img6 from "../../assets/packageimg/package6.png";
import img7 from "../../assets/packageimg/package2.png";
import img8 from "../../assets/packageimg/package4.jpg";

const packages = [
  { image: img1, title: 'Mussoorie -Rishikesh- Nainital', id: '1', dpkg: '1' },
  { image: img2, title: '8N Amazing Nepal', id: '2', dpkg: '1' },
  { image: img3, title: 'Manali Volvo 3 Nights Tour ', id: '3', dpkg: '1' },
  { image: img4, title: 'Explore Kerala', id: '4', dpkg: '1' },
  { image: img5, title: 'Best of Kerala 6 N', id: '5', dpkg: '1' },
  { image: img6, title: '07 Nights / 08 Days Scenic Kerala', id: '6', dpkg: '1' },
  { image: img7, title: 'Southern Hills 4N', id: '7', dpkg: '1' },
  { image: img8, title: 'Kathmandu-Pokhara / 4N-5D', id: '8', dpkg: '1' }
];

const AllLatestPackages = () => {
  const [openInquiry, setOpenInquiry] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState("");

  const handlePackageClick = (id, dpkg) => {
    window.location.href = `/package-details?id=${id}&Dpkg=${dpkg}`;
  };

  const handleSendQuery = (destination) => {
    setSelectedDestination(destination);
    setOpenInquiry(true);
  };

  const handleInquirySubmit = (formData) => {
    console.log("Inquiry submitted:", formData);
    // Call API here
    setOpenInquiry(false);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, width: '100%' }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          ALL LATEST <span style={{ color: 'red' }}>PACKAGES</span>
        </Typography>
        <Divider sx={{ mt: 1, borderColor: '#ccc', borderBottomWidth: 5 }} />
      </Box>

      {/* Show all packages */}
      <Grid container spacing={3} sx={{ textAlign: 'center', justifyContent: 'center' }}>
        {packages.map((pkg, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 320, margin: '13px' }}>
              <PackageCard
                {...pkg}
                onClick={() => handlePackageClick(pkg.id, pkg.dpkg)}
                onQueryClick={() => handleSendQuery(pkg.title)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Inquiry Form Modal */}
      <InquiryFormDialog
        open={openInquiry}
        handleClose={() => setOpenInquiry(false)}
        onSubmit={handleInquirySubmit}
        defaultDestination={selectedDestination}
        title="Inquiry for Package"
      />
    </Box>
  );
};

export default AllLatestPackages;
