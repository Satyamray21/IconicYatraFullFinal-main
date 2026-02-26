import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Divider, Button, Grid } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const txnid = params.get("txnid");
  const amount = params.get("amount");
  const name = params.get("firstname");
  const email = params.get("email");
  const phone = params.get("phone");
  const product = params.get("productinfo");
  const easepayid = params.get("easepayid");
  const date = params.get("addedon");

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f6f8", p: 3 }}>
      <Paper sx={{ maxWidth: 800, mx: "auto", p: 4, borderRadius: 3 }} elevation={3}>
        
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 70, color: "success.main" }} />
          <Typography variant="h4" fontWeight="bold" color="success.main">
            Payment Successful 🎉
          </Typography>
          <Typography>Your booking payment has been confirmed.</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6">Transaction Details</Typography>
        <Typography>Transaction Date: {date}</Typography>
        <Typography>Transaction ID: {txnid}</Typography>
        <Typography>Easebuzz Payment ID: {easepayid}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Billing Details</Typography>
        <Typography>{name}</Typography>
        <Typography>{email}</Typography>
        <Typography>{phone}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Order Details</Typography>
        <Typography>Item: {product}</Typography>
        <Typography>Amount Paid: ₹{amount}</Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container justifyContent="space-between">
          <Typography variant="h6">Grand Total</Typography>
          <Typography variant="h6">₹{amount}</Typography>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography sx={{ mb: 2 }}>
          A confirmation email has been sent. For queries contact support.
        </Typography>

        <Button
          variant="contained"
          color="success"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>

      </Paper>
    </Box>
  );
}