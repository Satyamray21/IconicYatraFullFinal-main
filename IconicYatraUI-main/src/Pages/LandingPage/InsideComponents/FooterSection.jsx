import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography
} from "@mui/material";

import ContactForm from "../InsideComponents/ContectForm";
import {useSelector} from "react-redux"
const FooterSection = () => {
  const { data: company, status } = useSelector(
  (state) => state.companyUI
);
  return (
    <Box sx={{ background: "#3e434b", color: "#fff", pt: 6 }}>

      {/* Top Footer */}
      <Container maxWidth="lg">
        <Grid container spacing={4}>

          {/* Connect */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Connect with Our Team
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            <Typography sx={{ mb: 1 }}>
              {company?.company?.call}
            </Typography>

            <Typography>
             {company?.company?.email}
            </Typography>
          </Grid>

          {/* Address */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Address
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            <Typography sx={{ mb: 2 }}>
             {company?.company?.address}
            </Typography>

            <Typography variant="body2">
             {company?.company?.about}
            </Typography>
          </Grid>

          {/* Contact Form */}
          <Grid size={{xs:12, md:4}}>
            <Typography fontWeight={600} mb={2}>
              Contact With us!
            </Typography>

            <Box sx={{ borderBottom: "1px solid #6c6c6c", mb: 2 }} />

            {/* Using Formik Contact Form */}
            <ContactForm />
          </Grid>

        </Grid>
      </Container>

      {/* Privacy Text */}
      <Box
        sx={{
          background: "#f5f5f5",
          color: "#333",
          textAlign: "center",
          py: 2,
          mt: 5,
          px: 2,
        }}
      >
        <Typography fontSize={14}>
          We are committed to safeguarding the personal information and data
          you share with us. Your trust is important to us, and we want to
          ensure that you are fully informed about how we handle your data.
          To learn more about our data protection practices and your rights.
        </Typography>
      </Box>

      {/* Bottom Footer */}
      <Box
        sx={{
          background: "#2e3238",
          color: "#fff",
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">

            <Grid size={{xs:12, md:6}}>
              <Typography fontSize={14}>
                © 2025 {company?.company?.companyName} All Right Reserved.
                <span style={{ color: "#4da3ff", marginLeft: 8 }}>
                  Privacy Policy
                </span>
              </Typography>
            </Grid>

            <Grid size={{xs:12, md:6}} textAlign={{ xs: "left", md: "right" }}>
              <Typography fontSize={14}>
                Designed & Marketing By {company?.company?.companyName}
              </Typography>
            </Grid>

          </Grid>
        </Container>
      </Box>

    </Box>
  );
};

export default FooterSection;