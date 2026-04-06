import Razorpay from "razorpay";
console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default razorpayInstance;
