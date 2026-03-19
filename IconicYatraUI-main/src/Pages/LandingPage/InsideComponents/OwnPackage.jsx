import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

import QuoteForm from "./ContectForm";

function OwnPackage({ landingData }) {

  const [openDialog, setOpenDialog] = useState(false);

  const handleOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  if (!landingData) return null;

  return (
    <>
      <Box sx={{ py: 8, background: "#f5f5f5" }}>
        <Container maxWidth="lg">

          <Grid container spacing={6} alignItems="center">

            {/* LEFT CONTENT */}
            <Grid size={{ xs: 12, md: 6 }}>
              
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, mb: 2, color: "#1e2b3a" }}
              >
                {landingData?.ownPackageTitle}
              </Typography>

              <Typography
                sx={{
                  color: "#5f6c7b",
                  lineHeight: 1.8,
                  mb: 3,
                }}
              >
                {landingData?.ownPackageDescription}
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 4 }}>
                {landingData?.ownPackageFeatures?.map((item, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <CheckCircleIcon sx={{ color: "#2e7d32" }} />
                    <Typography sx={{ color: "#2b3b4b" }}>
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant="contained"
                onClick={handleOpen}
                sx={{
                  background: "linear-gradient(90deg,#ff8a3d,#f0652f)",
                  px: 4,
                  py: 1.4,
                  borderRadius: "30px",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    background: "linear-gradient(90deg,#f47c32,#e85924)",
                  },
                }}
              >
                Customize My Trip
              </Button>

            </Grid>

            {/* RIGHT IMAGE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component="img"
                src={landingData?.ownPackageImage?.url}
                alt="Tour Package"
                sx={{
                  width: "100%",
                  borderRadius: 3,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              />
            </Grid>

          </Grid>

        </Container>
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 5 }}>
          Customize Your Trip

          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
            }}
          >
            <CloseIcon />
          </IconButton>

        </DialogTitle>

        <DialogContent>
          <QuoteForm />
        </DialogContent>

      </Dialog>
    </>
  );
}

export default OwnPackage;
