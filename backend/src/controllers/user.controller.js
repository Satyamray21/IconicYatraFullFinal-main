import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer";
import { OTP } from "../models/otp.model.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "12h";

// REGISTER
export const register = async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        console.log("REQ.FILE:", req.file);

        const {
            fullName,
            mobileNumber,
            userRole,
            email,
            password,
            country,
            state,
            city,
        } = req.body;

        let address = {};
        if (req.body.address) {
            try {
                address = JSON.parse(req.body.address); // parse stringified JSON
            } catch (err) {
                console.log("Address parsing error:", err);
            }
        }

        let profileImg = "";
        if (req.file) {
            profileImg = `${req.protocol}://${req.get("host")}/upload/${req.file.filename}`;
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            mobileNumber,
            userRole,
            email,
            password: hashedPassword,
            country,
            state,
            city,
            address,
            profileImg
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                userRole: user.userRole,
                email: user.email,
                country: user.country,
                state: user.state,
                city: user.city,
                address: user.address,
                profileImg: user.profileImg,
                userId: user.userId
            }
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.userRole },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.userRole,
                userId: user.userId,
                profileImg: user.profileImg
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId }).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE USER
export const updateUser = async (req, res) => {
    try {
        const { fullName, mobileNumber, country, state, city } = req.body;

        // handle address parsing
        let address = {};
        if (req.body.address) {
            try {
                if (typeof req.body.address === "string") {
                    address = JSON.parse(req.body.address);
                } else {
                    address = req.body.address;
                }
            } catch (err) {
                console.log("Address parse error:", err);
            }
        }

        // handle profile image
        let profileImg;
        if (req.file) {
            profileImg = `${req.protocol}://${req.get("host")}/upload/${req.file.filename}`;
        }

        const updatedData = {
            fullName,
            mobileNumber,
            country,
            state,
            city,
            address,
        };

        if (profileImg) {
            updatedData.profileImg = profileImg;
        }

        const user = await User.findOneAndUpdate(
            { userId: req.params.userId }, // search by custom userId
            updatedData,
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE USER
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ userId: req.params.userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SEND RESET OTP
export const sendResetCode = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        await OTP.create({ userId: user._id, otp: otpCode, expiresAt });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.gmail,
                pass: process.env.app_pass
            }
        });

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Iconic Yatra - Forgot Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f6f8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .header h1 {
              font-family: 'Brush Script MT', cursive;
              font-size: 28px;
              margin: 0;
            }
            .content {
              padding: 20px;
              color: #333;
            }
            .content h2 {
              color: #1976d2;
            }
            .otp-box {
              text-align: center;
              font-size: 28px;
              font-weight: bold;
              background: #f1f9ff;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              letter-spacing: 4px;
              color: #0d47a1;
            }
            .button {
              display: block;
              width: fit-content;
              background: #1976d2;
              color: white;
              padding: 12px 20px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: auto;
            }
            .footer {
              background: #f4f6f8;
              text-align: center;
              padding: 10px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Iconic Yatra</h1>
              <p>Your Travel Companion</p>
            </div>

            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${user.fullName},</p>
              <p>We received a request to reset your password.</p>
              <p>Your OTP is:</p>
              <div class="otp-box">${otpCode}</div>
              <p>This OTP is valid for <strong>5 minutes</strong>.</p>
              <p>If you did not request this, please ignore this email.</p>
              <a href="https://iconicyatra.com/login" class="button">Login to Iconic Yatra</a>
            </div>

            <div class="footer">
              © 2025 Iconic Yatra. All Rights Reserved.<br>
              Designed with ❤️ for travel lovers.
            </div>
          </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Iconic Yatra" <${process.env.gmail}>`,
            to: email,
            subject: "Iconic Yatra - Password Reset OTP",
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "OTP sent to email" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// CHANGE PASSWORD USING OTP
export const changePassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const otpRecord = await OTP.findOne({ userId: user._id, otp });
        if (!otpRecord) return res.status(400).json({ error: "Invalid OTP" });

        if (otpRecord.expiresAt < new Date())
            return res.status(400).json({ error: "OTP expired" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );

        await OTP.deleteOne({ _id: otpRecord._id });

        res.json({ success: true, message: "Password changed successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

