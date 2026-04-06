import express from "express";
import razorpay from "../config/razorpay.js";

const router = express.Router();

router.post("/create-order", async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    try {
        const options = {
            amount: amount * 100,
            currency: "INR",
            payment_capture: 1,
            notes: { amount: amount.toString() }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
