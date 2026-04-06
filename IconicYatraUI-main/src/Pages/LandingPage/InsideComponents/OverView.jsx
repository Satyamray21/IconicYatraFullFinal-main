import React, { useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseIcon from "@mui/icons-material/Close";

import QuoteForm from "./ContectForm";

/* ------------------ Feature Card ------------------ */

const FeatureCard = ({
  image,
  title,
  description,
  quoteText,
  whatsappText,
  onQuoteClick,
}) => (
  <Card
    sx={{
      textAlign: "center",
      borderRadius: 4,
      background: "#f7f7f7",
      border: "1px solid #e6e6e6",
      height: "100%",
      transition: "0.3s",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
      },
    }}
  >
    <CardContent sx={{ p: 4 }}>
      
      {/* Image */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        {image && (
          <Box
            component="img"
            src={image}
            alt={title}
            sx={{
              width: 60,
              height: 60,
              objectFit: "contain",
            }}
          />
        )}
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 1.5,
          color: "#333",
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: "#666",
          lineHeight: 1.7,
          mb: 3,
        }}
      >
        {description}
      </Typography>

      {/* Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onQuoteClick}
          sx={{
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "12px",
            px: 1.8,
            py: 0.4,
            borderColor: "#1976d2",
            color: "#1976d2",
          }}
        >
          {quoteText || "Get Free Quote"}
        </Button>

        <Button
          size="small"
          variant="contained"
          startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
          href={`https://wa.me/917053900957?text=${encodeURIComponent(
            whatsappText || "Hello"
          )}`}
          target="_blank"
          sx={{
            backgroundColor: "#25D366",
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "12px",
            px: 1.8,
            py: 0.4,
            "&:hover": {
              backgroundColor: "#1ebe5d",
            },
          }}
        >
          Chat with Us
        </Button>
      </Box>
    </CardContent>
  </Card>
);

/* ------------------ Main Component ------------------ */

function OverView({ landingData }) {
  const [openQuote, setOpenQuote] = useState(false);

  const handleOpenQuote = () => {
    setOpenQuote(true);
  };

  const handleCloseQuote = () => {
    setOpenQuote(false);
  };

  if (!landingData) return null;

  return (
    <>
      <Box sx={{ py: 8, background: "#fff" }}>
        <Container maxWidth="lg">

          <Grid container spacing={4}>
            {landingData?.overviewSections?.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item._id}>
                <FeatureCard
                  image={item?.overviewImage?.url}
                  title={item?.overviewTitle}
                  description={item?.overviewDescription}
                  quoteText={item?.overviewGetFreeQuoteButton}
                  whatsappText={item?.overviewChatWithUsButton}
                  onQuoteClick={handleOpenQuote}
                />
              </Grid>
            ))}
          </Grid>

        </Container>
      </Box>

      {/* Dialog */}
      <Dialog
        open={openQuote}
        onClose={handleCloseQuote}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 5 }}>
          Get Free Quote

          <IconButton
            onClick={handleCloseQuote}
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

export default OverView;
