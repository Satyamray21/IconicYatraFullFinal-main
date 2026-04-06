import React ,{useState,useEffect} from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Link,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import logo from "../../assets/Logo/logoiconic.jpg";
import { useDispatch, useSelector } from "react-redux";
import { initiatePayment, resetPayment } from "../../Features/paymentSlice";

export default function PaymentPage() {
    const dispatch = useDispatch();
  const { loading, paymentUrl, error } = useSelector((state) => state.payment);
  const [form, setForm] = useState({
    amount: "",
    firstname: "",
    email: "",
    phone: "",
    productinfo: "Tour Booking - Iconic Yatra",
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };
  const redirectToEasebuzz = (accessKey) => {
    const baseUrl =
      import.meta.env.VITE_EASEBUZZ_ENV === "live"
        ? "https://pay.easebuzz.in/pay"
        : "https://testpay.easebuzz.in/pay";

    window.location.href = `${baseUrl}/${accessKey}`;
  };
   const handlePay = async () => {
    if (!form.amount || Number(form.amount) < 1)
      return alert("Enter valid amount");

    if (!form.firstname || !form.email || !form.phone)
      return alert("Please fill all fields");

    try {
      const result = await dispatch(initiatePayment(form)).unwrap();

      if (result?.status === 1 && result?.data) {
        redirectToEasebuzz(result.data);
        dispatch(resetPayment());
      } else {
        alert("Payment initiation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#dfe6f1,#cfd9df)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 1.5, sm: 2, md: 3 },
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 1000,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Grid container>
          {/* LEFT SIDE */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              color: "#fff",
              position: "relative",
              background:
                "linear-gradient(180deg,#5a7bd6 0%, #3b4f8f 100%)",
              px: { xs: 3, sm: 4 },
              py: { xs: 5, md: 4 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
              gap: { xs: 4, md: 0 },
            }}
          >
            <Box>
              {/* LOGO */}
              <Box
                component="img"
                src={logo}
                alt="Iconic Yatra"
                sx={{
                  width: { xs: 140, sm: 160, md: 180 },
                  maxWidth: "100%",
                  objectFit: "contain",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={500}
                sx={{ fontSize: { xs: "18px", md: "20px" } }}
              >
                Iconic Yatra
              </Typography>
            </Box>

            {/* Footer Contact */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
                fontSize: { xs: 13, sm: 14 },
                opacity: 0.9,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon fontSize="small" />
                info@iconicyatra.com
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon fontSize="small" />
                +91 7053900957
              </Box>
            </Box>
          </Grid>

          {/* RIGHT SIDE FORM */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                p: { xs: 3, sm: 4, md: 4 },
              }}
            >
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid size={{ xs: 12 }}>
                  <Typography fontWeight={600}>Amount *</Typography>
                  <TextField
  fullWidth
  placeholder="Enter Amount"
  value={form.amount}
  onChange={handleChange("amount")}
/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography fontWeight={600}>Name *</Typography>
                  <TextField
  fullWidth
  placeholder="Enter Your Name"
  value={form.firstname}
  onChange={handleChange("firstname")}
/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography>Email *</Typography>
                  <TextField
  fullWidth
  placeholder="Enter Your Email"
  value={form.email}
  onChange={handleChange("email")}
/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography fontWeight={600}>
                    Phone Number *
                  </Typography>
                  <TextField
  fullWidth
  placeholder="Enter Your Phone Number"
  value={form.phone}
  onChange={handleChange("phone")}
/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography fontWeight={600}>
                    Purpose of Payment *
                  </Typography>
                  <TextField
  multiline
  rows={3}
  fullWidth
  value={form.productinfo}
  onChange={handleChange("productinfo")}
/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Save my details"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label={
                      <Typography fontSize={14}>
                        I accept{" "}
                        <Link href="#" underline="hover">
                          Terms and Conditions
                        </Link>{" "}
                        &{" "}
                        <Link href="#" underline="hover">
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                </Grid>

                {/* Pay Button */}
                <Grid size={{ xs: 12 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePay}
                    disabled={loading}
                    size="large"
                    sx={{
                      mt: 1,
                      py: 1.6,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: { xs: 15, md: 16 },
                      background:
                        "linear-gradient(90deg,#6a5af9,#7b61ff)",
                    }}
                  >
                    Pay
                  </Button>
                </Grid>

                {/* Powered By */}
                <Grid size={{ xs: 12 }} textAlign="center">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Powered by Easebuzz
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}