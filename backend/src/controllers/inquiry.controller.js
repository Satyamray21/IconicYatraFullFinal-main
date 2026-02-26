import Inquiry from "../models/Inquiry.model.js";
import nodemailer from "nodemailer";

export const createInquiry = async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.gmail,
        pass: process.env.app_pass,
      },
    });

    // Attractive HTML email
    const mailOptions = {
      from: `"Iconic Yatra" <${process.env.gmail}>`,
      to: process.env.gmail, // admin email
      subject: `✈ New Travel Inquiry - ${inquiry.destination}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; background:#f9f9f9;">
          <div style="max-width:600px; margin:auto; background:white; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1); overflow:hidden;">
            
            <div style="background:#ff9800; padding:20px; text-align:center;">
              <h2 style="margin:0; color:white;">✈ Iconic Yatra - New Inquiry</h2>
            </div>
            
            <div style="padding:20px; color:#333;">
              <p><b>Name:</b> ${inquiry.name}</p>
              <p><b>Email:</b> ${inquiry.email}</p>
              <p><b>Mobile:</b> ${inquiry.mobile}</p>
              <p><b>No. of Persons:</b> ${inquiry.persons}</p>
              <p><b>Destination:</b> ${inquiry.destination}</p>
              <p><b>Travel Date:</b> ${new Date(inquiry.date).toLocaleDateString()}</p>
            </div>

            <div style="background:#f1f1f1; padding:15px; text-align:center; font-size:14px; color:#555;">
              © ${new Date().getFullYear()} Iconic Yatra. All rights reserved.
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true, message: "Inquiry submitted successfully!", inquiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to submit inquiry" });
  }
};
