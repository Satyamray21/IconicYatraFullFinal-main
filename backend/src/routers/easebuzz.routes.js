import express from "express";
import { createPayment } from "../controllers/easebuzz.controller.js";
const router = express.Router();

// 🔹 INITIATE
router.post("/initiate", createPayment);

// 🔹 SUCCESS
router.all("/success", (req, res) => {
  const data =
    req.body && Object.keys(req.body).length > 0 ? req.body : req.query;

  console.log("PAYMENT SUCCESS:", req.method);
  console.log("DATA:", data);

  const query = new URLSearchParams({
    txnid: data.txnid || "",
    amount: data.amount || "",
    status: data.status || "",
    easepayid: data.easepayid || "",
    firstname: data.firstname || "",
    email: data.email || "",
    phone: data.phone || "",
    productinfo: data.productinfo || "",
    addedon: data.addedon || "",
  }).toString();

  return res.redirect(
    `${process.env.FRONTEND_URL}/payment-success?${query}`
  );
});

// 🔹 FAILURE
router.all("/failure", (req, res) => {
  const data =
    req.body && Object.keys(req.body).length > 0 ? req.body : req.query;

  console.log("PAYMENT FAILED:", data);

  const query = new URLSearchParams({
    txnid: data.txnid || "",
    amount: data.amount || "",
    firstname: data.firstname || "",
    email: data.email || "",
    phone: data.phone || "",
    productinfo: data.productinfo || "",
    easepayid: data.easepayid || "",
    addedon: data.addedon || "",
    status: data.status || "",
    error: data.error_Message || "",
  }).toString();

  return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?${query}`);
});

export default router;