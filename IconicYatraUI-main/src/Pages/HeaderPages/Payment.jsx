import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AccountBalance,
  CreditCard,
  QrCode,
  Payment,
  Security,
  Download,
  Share,
} from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RazorpayButton from "../../RazorPay/PaymentButton";
import { useSelector } from "react-redux";
import AllCards from "../../assets/Card/all-cards-logo.png";

const PaymentOption = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [copiedField, setCopiedField] = useState(null);
  const { data: company } = useSelector((state) => state.companyUI);

  const bankDetails = company?.bankDetails || [];
  const qrCodes = company?.company?.qrCodes || [];

  const handleDownloadQR = (qrImage, name) => {
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${name}_QR.png`;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Options - Iconic Yatra",
          text: "Check out the payment options for Iconic Yatra",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor:
          "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Breadcrumb */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(45deg, #ffffff 30%, #f8f9fa 90%)",
          border: "1px solid #e0e0e0",
        }}
      >
        <Breadcrumbs separator="›">
          <MuiLink
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Home
          </MuiLink>

          <Typography color="primary.main" fontWeight={600}>
            <Payment sx={{ mr: 1, fontSize: 20 }} />
            Payment Option
          </Typography>
        </Breadcrumbs>
      </Paper>

      <Grid container spacing={4}>
        {/* LEFT SIDE */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
              background:
                "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                background:
                  "linear-gradient(45deg, #d32f2f 30%, #f44336 90%)",
                p: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Payment <span style={{ color: "#ffd54f" }}>Options</span>
              </Typography>
            </Box>

            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              {/* Security */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 4,
                  p: 2,
                  backgroundColor: "#e8f5e9",
                  borderRadius: 2,
                  border: "2px dashed #4caf50",
                }}
              >
                <Security sx={{ color: "#4caf50", mr: 2 }} />
                <Typography fontWeight="bold" color="#2e7d32">
                  🔒 100% Secure Payment Processing
                </Typography>
              </Box>

              {/* NET BANKING */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AccountBalance
                    sx={{ color: "primary.main", mr: 2, fontSize: 30 }}
                  />
                  <Typography variant="h5" fontWeight="bold">
                    Net Banking
                  </Typography>
                </Box>

                {/* ✅ Added text */}
                <Typography
                  variant="body1"
                  sx={{ mb: 3, color: "text.secondary" }}
                >
                  Transfer funds directly from your bank account using the
                  details below:
                </Typography>

                <Grid container spacing={3}>
                  {bankDetails.map((bank) => (
                    <Grid size={{ xs: 12, md: 6 }} key={bank._id}>
                      <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Chip
                          label={bank.bankName}
                          sx={{
                            backgroundColor: bank.color || "#1976d2",
                            color: "#fff",
                            mb: 2,
                          }}
                        />

                        {Object.entries(bank).map(([key, value]) => {
                          if (
                            [
                              "_id",
                              "__v",
                              "color",
                              "createdAt",
                              "updatedAt",
                              "bankName",
                            ].includes(key)
                          )
                            return null;

                          return (
                            <Box key={key} sx={{ mb: 1 }}>
                              <Typography variant="caption">
                                {key}:
                              </Typography>
                              <Typography>{value}</Typography>
                            </Box>
                          );
                        })}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* CREDIT / DEBIT + EASEBUZZ */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CreditCard
                    sx={{ color: "#ff9800", mr: 2, fontSize: 30 }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="#ff9800"
                  >
                    Credit / Debit Cards
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        backgroundColor: "#fff3e0",
                        border: "2px dashed #ff9800",
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        💡 All cards accepted. 3% extra charges apply.
                      </Typography>

                      <RazorpayButton />
                    </Paper>
                  </Grid>

                  {/* Easebuzz Design */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        textAlign: "center",
                        background:
                          "linear-gradient(145deg, #ffffff 0%, #f3f6fb 100%)",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        Easebuzz
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        3% Extra Pay with Easebuzz
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                      >
                        In this Method you can use all type of payments
                        such as upi, debit card, credit card, etc.
                      </Typography>
                      <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    mb: 3,
  }}
>
  <img
    src={AllCards}
    alt="Accepted Cards"
    style={{
      maxWidth: "100%",
      height: "40px",
      objectFit: "contain",
    }}
  />
</Box>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate("/easebuzz")}
                        sx={{
                          backgroundColor: "#2e7d32",
                          fontWeight: "bold",
                          py: 1.3,
                          borderRadius: 2,
                        }}
                      >
                        PAY NOW
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* PAYMENT INSTRUCTIONS */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, color: "primary.main" }}
                >
                  📋 Payment Instructions
                </Typography>

                <Grid container spacing={2}>
                  {[
                    "Local / at par AC Payee Cheque should be drawn in the name of Iconic Yatra",
                    "Cash payments at our office during office hours. Please collect receipts",
                    "Booking subject to NEFT/RTGS transfers. Cheque clearance within 3 working days",
                  ].map((instruction, index) => (
                    <Grid size={{ xs: 12, md: 4 }} key={index}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          height: "100%",
                          textAlign: "center",
                          background:
                            "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">
                          {instruction}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT SIDE QR (unchanged) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
              background:
                "linear-gradient(145deg, #ffffff 0%, #f0f4ff 100%)",
              border: "1px solid",
              borderColor: "divider",
              position: "sticky",
              top: 20,
            }}
          >
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Scan to Pay
              </Typography>

              <Grid container spacing={4} justifyContent="center">
                {qrCodes.map((qr, index) => (
                  <Grid item xs={6} key={qr._id || index}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Chip label={qr.name} sx={{ mb: 2 }} />

                      <img
                        src={qr.url}
                        alt="QR"
                        style={{
                          width: "100%",
                          maxWidth: 200,
                          borderRadius: 12,
                        }}
                      />

                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={() =>
                            handleDownloadQR(qr.url, qr.name)
                          }
                        >
                          Save
                        </Button>

                        <Button
                          size="small"
                          startIcon={<Share />}
                          onClick={handleShare}
                        >
                          Share
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentOption;