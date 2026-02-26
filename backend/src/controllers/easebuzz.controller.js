import axios from "axios";
import crypto from "crypto";

export const createPayment = async (req, res) => {
  try {
    const { amount, firstname, email, phone, productinfo } = req.body;

    const txnid = "TXN" + Date.now();
    const key = process.env.EASEBUZZ_KEY;
    const salt = process.env.EASEBUZZ_SALT;

   const surl = `${process.env.BACKEND_URL}/api/v1/easebusspayment/success`;
const furl = `${process.env.BACKEND_URL}/api/v1/easebusspayment/failure`;

    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const paymentData = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
    };

    const easebuzzUrl =
      process.env.EASEBUZZ_ENV === "live"
        ? "https://pay.easebuzz.in/payment/initiateLink"
        : "https://testpay.easebuzz.in/payment/initiateLink";

    const response = await axios.post(
      easebuzzUrl,
      new URLSearchParams(paymentData).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.data?.status === 1) {
      return res.json({
        status: 1,
        data: response.data.data,
      });
    }

    return res.status(400).json({
      status: 0,
      message: response.data?.message || "Payment initiation failed",
    });
  } catch (error) {
    console.error("Easebuzz Error:", error.response?.data || error.message);
    return res.status(500).json({
      status: 0,
      message: "Payment initiation failed",
    });
  }
};