import React,{ useEffect, useState} from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
  IconButton,
} from "@mui/material";

import CallIcon from "@mui/icons-material/Call";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import logo from "../../assets/Logo/logoiconic1.png";
import landing from "../../assets/LandingImages/darjrrling.jpg";
import {useSelector} from "react-redux"
import { useParams } from "react-router-dom";
import OverView from "./InsideComponents/OverView";
import DomesticPackage from "./InsideComponents/DomesticPackage";
import OwnPackage from "./InsideComponents/OwnPackage";
import Solution from "./InsideComponents/Solution";
import PackagesFeatures from "./InsideComponents/PackagesFeatures";
import WhyChooseSection from "./InsideComponents/WhyChooseSection";
import WorkProcess from "./InsideComponents/WorkProcess";
import HelpSupportSection from "./InsideComponents/HelpSupportSection";
import FAQSection from "./InsideComponents/FAQSection";
import FooterSection from "./InsideComponents/FooterSection";
import axios from "axios";
export default function LandingPage() {
   const { data: company, status } = useSelector(
  (state) => state.companyUI
);
   const { slug } = useParams();
  const [landingData, setLandingData] = useState(null);
  const [loading, setLoading] = useState(true);
   useEffect(() => {

    const fetchLanding = async () => {
      try {

        const res = await axios.get(
  `${import.meta.env.VITE_BASE_URL}/api/v1/landing-pages/slug/${slug}`
);


        setLandingData(res.data.data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLanding();

  }, [slug]);

  if (loading) return <div>Loading...</div>;
  return (
    <>
      <Box>
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            bgcolor: "#f4f4f4",
            py: { xs: 1.5, md: 2 },
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Container maxWidth="lg">
            <Grid container alignItems="center" spacing={2}>
              
              {/* Logo + Text */}
              <Grid size={{xs:12, md:8}}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <img src={company?.company?.headerLogo?.url} alt="India Tour24" style={{ height: 45 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: 13, md: 14 } }}
                  >
                    {landingData?.headerDescription}
                  </Typography>
                </Stack>
              </Grid>

              {/* Phone */}
              <Grid size={{xs:12, md:4}}>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: "flex-start", md: "flex-end" }}
                  alignItems="center"
                >
                  <CallIcon color="error" />
                  <Typography fontWeight={600}>{company?.company?.call}</Typography>
                </Stack>
              </Grid>

            </Grid>
          </Container>
        </Box>

        {/* ================= HERO SECTION ================= */}
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: "100vh", md: "85vh" },
            display: "flex",
            alignItems: "center",
            py: { xs: 6, md: 0 },
            backgroundImage: `url(${landingData?.heroBackgroundImage?.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.2))",
            }}
          />

          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
            <Grid container spacing={4} alignItems="center">

              {/* LEFT CONTENT */}
              <Grid item xs={12} md={7}>
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color="white"
                  sx={{
                    mb: 2,
                    fontSize: {
                      xs: "1.9rem",
                      sm: "2.4rem",
                      md: "3rem",
                    },
                  }}
                >
                 {landingData?.heroTitle}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "#f1f1f1",
                    mb: 3,
                    maxWidth: 600,
                    fontSize: { xs: 14, md: 16 },
                  }}
                >
                 {landingData?.heroDescription}
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    bgcolor: "#25D366",
                    px: 3,
                    py: 1.2,
                    borderRadius: "30px",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#1ebe5d" },
                  }}
                >
                  Chat for {landingData?.heroButtonText}
                </Button>
              </Grid>

            </Grid>
          </Container>
        </Box>

        {/* ================= FLOATING BUTTONS ================= */}
        <Box
          sx={{
            position: "fixed",
            right: { xs: 15, md: 20 },
            bottom: { xs: 20, md: 30 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 10,
          }}
        >
          <IconButton
           onClick={() => window.open(`tel:${company?.company?.call}`)}
            sx={{
              bgcolor: "#fff",
              boxShadow: 3,
              width: { xs: 45, md: 50 },
              height: { xs: 45, md: 50 },
            }}
          >
            <CallIcon color="primary" />
          </IconButton>

          <IconButton
          onClick={() => {
  let phone = company?.company?.call || "";
  const text =
    landingData?.overviewSections?.[0]?.overviewChatWithUsButton || "";

  // remove + and spaces
  phone = phone.replace(/\D/g, "");

  const encodedText = encodeURIComponent(text);

  window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
}}


            sx={{
              bgcolor: "#25D366",
              color: "#fff",
              width: { xs: 45, md: 50 },
              height: { xs: 45, md: 50 },
            }}
          >
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ================= OTHER SECTIONS ================= */}
    <OverView landingData={landingData} />

<DomesticPackage slug={slug} />
<OwnPackage landingData={landingData} />

<Solution landingData={landingData} />

<PackagesFeatures landingData={landingData} />

<WhyChooseSection landingData={landingData}/>
<WorkProcess landingData={landingData} />

<HelpSupportSection slug={slug} />
<FAQSection landingData={landingData} />
<FooterSection slug={slug} />
    </>
  );
}