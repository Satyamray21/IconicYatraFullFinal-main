import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Container,
  useMediaQuery,
  useTheme,
  Box,
  Divider,
} from "@mui/material";
import { Email, WhatsApp, Facebook, Instagram, Twitter, Block } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
 const { data: company, status } = useSelector(
  (state) => state.companyUI
);

  return (
    <Box sx={{ width: "100%" }}>
      <AppBar
        position="static"
        sx={{
          bgcolor: "#1f3c65",
          height: { xs: "45px", sm: "35px" },
          justifyContent: "center",
          py: { xs: 0, md: 1 }
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: isMobile ? "center" : "space-between",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
              gap: isMobile ? 1 : 0,
            }}
          >
            {/* LEFT SECTION (Contacts) */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              sx={{ color: "#fff", fontSize: 14 }}
            >
              {/* Email */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Email fontSize="small" />
                <Typography
                  variant="body2"
                  component="a"
                  href={`mailto:${company?.email}`}
                  sx={{
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": { color: "#ffcc00" },
                  }}
                >
                 {company?.company?.email}
                </Typography>
              </Stack>

              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  bgcolor: "rgba(255,255,255,0.3)",
                  display: { xs: "none", sm: "block" },
                }}
              />

              {/* WhatsApp */}
              <Typography
                variant="body2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 500,
                }}
              >
                <WhatsApp fontSize="small" sx={{ mr: 0.5 }} /> {company?.company?.call}
                
              </Typography>
            </Stack>

            {/* Divider for mobile view */}
            {isMobile && (
              <Divider
                sx={{
                  my: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                  width: "100%",
                  display: { xs: 'none' }
                }}
              />
            )}

            {/* RIGHT SECTION (Navigation + Social Media) */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              sx={{ color: "#fff", fontSize: 14 }}
            >
              {/* Payment */}
              <Typography
                variant="body2"
                onClick={() => navigate("/payment")}
                sx={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  "&:hover": { color: "#ffcc00" },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Payment Now
              </Typography>

              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  bgcolor: "rgba(255,255,255,0.3)",
                  display: { xs: "none", sm: "block" },
                }}
              />

              {/* Admin */}
              {/* <Typography
                variant="body2"
                onClick={() => navigate("/login")}
                sx={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  "&:hover": { color: "#ffcc00" },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Admin
              </Typography> */}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};

export default Header;
