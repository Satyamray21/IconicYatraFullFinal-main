import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Divider, Button, Grid } from "@mui/material";

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const txnid = params.get("txnid");
  const amount = params.get("amount");
  const name = params.get("firstname");
  const email = params.get("email");
  const phone = params.get("phone");
  const product = params.get("productinfo");
  const reason = params.get("error_Message") || "Transaction failed";
  const date = params.get("addedon");

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f6f8", p: 3 }}>
      <Paper sx={{ maxWidth: 800, mx: "auto", p: 4, borderRadius: 3 }} elevation={3}>
        <Typography variant="h4" fontWeight="bold" color="error" gutterBottom>
          Oops! Your transaction was unsuccessful
        </Typography>

        <Typography sx={{ mb: 2 }}>
          Please make a note of your Transaction ID for future reference.
        </Typography>

        <Typography sx={{ mb: 3 }}>
          <strong>Reason:</strong> {reason}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6">Transaction Details</Typography>
        <Typography>Transaction Date: {date}</Typography>
        <Typography>Transaction ID: {txnid}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Billing Details</Typography>
        <Typography>{name}</Typography>
        <Typography>{email}</Typography>
        <Typography>{phone}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Order Details</Typography>
        <Typography>Item: {product}</Typography>
        <Typography>Price: ₹{amount}</Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container justifyContent="space-between">
          <Typography variant="h6">Grand Total</Typography>
          <Typography variant="h6">₹{amount}</Typography>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography sx={{ mb: 2 }}>
          For any queries, please contact support.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/payment")}
        >
          Retry Payment
        </Button>
      </Paper>
    </Box>
  );
}