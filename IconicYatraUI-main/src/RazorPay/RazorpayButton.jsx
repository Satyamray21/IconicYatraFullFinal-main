import React, { useState } from "react";
import { Box, Typography, TextField, InputAdornment, Button } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import Logo from "../assets/Logo/logoiconic.jpg";

export default function FullyCustomRazorpayButton() {
    const [amount, setAmount] = useState();

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const res = await loadRazorpayScript();
        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            return;
        }

        const options = {
            key: razorpayKey,
            amount: amount * 100,
            currency: "INR",
            name: "ICONIC YATRA",
            description: "Payment for Booking",
            image: Logo,
            handler: function (response) {
                console.log("Payment successful", response);
                alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            },
            prefill: {
                name: "",
                email: "",
                contact: "",
            },
            notes: { amount: amount },
            theme: { color: "#FF5722" }
        };


        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                mt: 2,
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
                🔒 Secure Payment
            </Typography>

            <TextField
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                variant="outlined"
                label="Enter Amount"
                sx={{ width: "250px" }}
            />

            {/* Fully custom styled Razorpay payment button */}
            <Button
                onClick={handlePayment}
                sx={{
                    background: "linear-gradient(135deg, #FF6B6B 30%, #FF8E53 90%)",
                    color: "#fff",
                    fontWeight: "bold",
                    px: 5,
                    py: 1.5,
                    borderRadius: "50px",
                    fontSize: "1rem",
                    textTransform: "none",
                    boxShadow: "0 4px 15px rgba(255, 105, 135, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    "&:hover": {
                        background: "linear-gradient(135deg, #FF8E53 30%, #FF6B6B 90%)",
                        boxShadow: "0 6px 20px rgba(255, 105, 135, 0.8)",
                    },
                }}
            >
                <CreditCardIcon fontSize="small" />
                Pay ₹{amount}
            </Button>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Powered by Razorpay
            </Typography>
        </Box>
    );
}
