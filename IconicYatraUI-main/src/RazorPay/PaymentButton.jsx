// import React, { useEffect, useRef } from "react";

// let isScriptAdded = false;

// export default function RazorpayButton() {
//     const formRef = useRef(null);

//     useEffect(() => {
//         if (isScriptAdded) return;

//         const script = document.createElement("script");
//         script.src = "https://checkout.razorpay.com/v1/payment-button.js";
//         script.dataset.payment_button_id = "pl_JDeyo5oLdkJBxq";
//         script.async = true;

//         if (formRef.current) {
//             formRef.current.appendChild(script);
//             isScriptAdded = true;
//         }

//         return () => {
//             if (formRef.current && script.parentNode === formRef.current) {
//                 formRef.current.removeChild(script);
//                 isScriptAdded = false;
//             }
//         };
//     }, []);

//     return <form ref={formRef}></form>;
// }



import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Box,
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
} from "@mui/material";
import { createOrder, resetRazorpayState } from "../Features/razorpaySlice";

const RazorpayPayment = ({ onSuccess }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.razorpay);

    const [amount, setAmount] = useState("");

    const handlePayment = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const resultAction = await dispatch(createOrder(amount * 1));

        if (createOrder.fulfilled.match(resultAction)) {
            const orderData = resultAction.payload;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "ICONIC YATRA",
                description: "Payment Transaction",
                order_id: orderData.id,
                handler: (response) => {
                    console.log("Payment Success:", response);
                    onSuccess && onSuccess(response);
                    dispatch(resetRazorpayState());
                },
                prefill: {
                    name: "",
                    email: "",
                    contact: "",
                },
                theme: {
                    color: "#1976d2",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            console.error("Order creation failed:", resultAction.payload);
        }
    };

    return (
        <Card
            elevation={5}
            sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)",
                border: "1px solid #e0e0e0",
                p: 3,
                textAlign: "center",
            }}
        >
            <CardContent>
                <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", mb: 2, color: "primary.main" }}
                >
                    💳 Secure Payment
                </Typography>

                <TextField
                    type="number"
                    label="Enter Amount (₹)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 3 }}
                />

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePayment}
                    disabled={loading}
                    sx={{
                        py: 1.5,
                        fontWeight: "bold",
                        fontSize: "1rem",
                        borderRadius: 2,
                        background: "linear-gradient(45deg, #2196f3, #21cbf3)",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                        "&:hover": {
                            background: "linear-gradient(45deg, #1976d2, #00bcd4)",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
                        },
                    }}
                >
                    {loading ? "Processing..." : "🚀 Pay Now"}
                </Button>

                <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 2, color: "text.secondary" }}
                >
                    🔒 100% Secure Payment with Razorpay
                </Typography>
            </CardContent>
        </Card>
    );
};

export default RazorpayPayment;
