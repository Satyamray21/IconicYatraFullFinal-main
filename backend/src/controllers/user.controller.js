import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Staff } from "../models/staff.model.js";
import { StaffPermission } from "../models/staffPermission.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import nodemailer from "nodemailer";
import { OTP } from "../models/otp.model.js";
import { comparePassword } from "../utils/permission.utils.js";
import { LoginHistory } from "../models/loginHistory.model.js";
import { saveLoginHistory as persistLoginHistory } from "../utils/loginHistory.utils.js";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "12h";

/** Resolve Mongo id from JWT (handles string, ObjectId, or { $oid }). */
function jwtSubjectId(decoded) {
  if (!decoded || typeof decoded !== "object") return "";
  let v =
    decoded.id ?? decoded._id ?? decoded.userId ?? decoded.sub ?? decoded.user_id;
  if (v == null) return "";
  if (typeof v === "object" && v.$oid != null) v = v.$oid;
  return String(v).trim();
}

async function loadStaffFromTokenPayload(decoded) {
  const raw = jwtSubjectId(decoded);
  if (/^[0-9a-fA-F]{24}$/.test(raw)) {
    const byId = await Staff.findById(raw).lean();
    if (byId) return byId;
    const permByJwt = await StaffPermission.findById(raw).select("staffId").lean();
    if (permByJwt?.staffId) {
      const s = await Staff.findById(permByJwt.staffId).lean();
      if (s) return s;
    }
  }
  if (decoded.staffUserId) {
    const s = await Staff.findOne({ staffId: String(decoded.staffUserId) }).lean();
    if (s) return s;
  }
  if (decoded.staffKey) {
    const s = await Staff.findOne({ staffId: String(decoded.staffKey) }).lean();
    if (s) return s;
  }
  const loginHint = decoded.loginId ?? decoded.username;
  if (loginHint) {
    const perm = await StaffPermission.findOne({
      $or: [
        { staffUserId: String(loginHint) },
        { "credentials.username": String(loginHint) },
      ],
    })
      .select("staffId")
      .lean();
    if (perm?.staffId) {
      const s = await Staff.findById(perm.staffId).lean();
      if (s) return s;
    }
  }
  if (decoded.email) {
    const email = String(decoded.email).trim().toLowerCase();
    if (email) {
      const s = await Staff.findOne({
        $expr: {
          $eq: [
            { $toLower: { $ifNull: ["$personalDetails.email", ""] } },
            email,
          ],
        },
      }).lean();
      if (s) return s;
    }
  }
  return null;
}

async function loadUserFromTokenPayload(decoded) {
  const raw = jwtSubjectId(decoded);
  if (/^[0-9a-fA-F]{24}$/.test(raw)) {
    const u = await User.findById(raw).select("-password").lean();
    if (u) return u;
  }
  if (decoded.userKey) {
    const u = await User.findOne({ userId: String(decoded.userKey) })
      .select("-password")
      .lean();
    if (u) return u;
  }
  if (decoded.email) {
    const email = String(decoded.email).trim().toLowerCase();
    if (email) {
      const u = await User.findOne({ email }).select("-password").lean();
      if (u) return u;
    }
  }
  return null;
}

/** Dashboard profile URL may use User.userId (e.g. AMD_1234) or Staff.staffId / Staff _id / login username. */
async function findStaffByRouteParam(param) {
  if (param == null || param === "") return null;
  const s = String(param).trim();
  if (!s) return null;
  if (/^[0-9a-fA-F]{24}$/.test(s)) {
    const byId = await Staff.findById(s).lean();
    if (byId) return byId;
  }
  const byStaffCode = await Staff.findOne({ staffId: s }).lean();
  if (byStaffCode) return byStaffCode;
  const perm = await StaffPermission.findOne({
    $or: [{ staffUserId: s }, { "credentials.username": s }],
  })
    .select("staffId")
    .lean();
  if (perm?.staffId) {
    return Staff.findById(perm.staffId).lean();
  }
  return null;
}

export const getCurrentProfile = async (req, res) => {
  try {
    const decoded = req.user;
    if (
      !decoded ||
      (!jwtSubjectId(decoded) &&
        !decoded.staffUserId &&
        !decoded.userKey &&
        !decoded.email &&
        !decoded.loginId &&
        !decoded.username)
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let staff = await loadStaffFromTokenPayload(decoded);
    if (staff) {
      const permission = await StaffPermission.findOne({ staffId: staff._id })
        .select("role")
        .lean();
      return res.json(staffToProfilePayload(staff, permission));
    }

    const user = await loadUserFromTokenPayload(decoded);
    if (user) {
      return res.json({ ...user, accountType: "user" });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const decoded = req.user;
    if (
      !decoded ||
      (!jwtSubjectId(decoded) &&
        !decoded.staffUserId &&
        !decoded.userKey &&
        !decoded.email &&
        !decoded.loginId &&
        !decoded.username)
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let staff = await loadStaffFromTokenPayload(decoded);
    if (staff) {
      req.params.userId = staff.staffId;
      return updateUser(req, res);
    }

    const userLean = await loadUserFromTokenPayload(decoded);
    if (userLean?.userId) {
      req.params.userId = userLean.userId;
      return updateUser(req, res);
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function staffToProfilePayload(staff, permissionDoc) {
  const p = staff.personalDetails || {};
  const role = permissionDoc?.role || "Staff";
  return {
    _id: staff._id,
    accountType: "staff",
    fullName: p.fullName,
    name: p.fullName,
    email: p.email,
    mobileNumber: p.mobileNumber,
    userId: staff.staffId,
    userRole: role,
    role,
    profileImg: p.staffPhoto?.url || "",
    country: staff.staffLocation?.country,
    state: staff.staffLocation?.state,
    city: staff.staffLocation?.city,
    address: staff.address,
    staffLocation: staff.staffLocation,
    personalDetails: staff.personalDetails,
    bank: staff.bank,
  };
}

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
      address,
    } = req.body;

    let profileImg = "";
    if (req.file) {
      profileImg = `${req.protocol}://${req.get("host")}/upload/${req.file.filename}`;
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already exists" });

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
      profileImg,
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
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// LOGIN (B2C users by email, or dashboard staff by generated username / staffUserId)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = typeof email === "string" ? email.trim() : "";

    if (!loginId || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: loginId });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await persistLoginHistory(
          loginId,
          user._id,
          user.userId || String(user._id),
          "Failed",
          req,
        );
        return res.status(400).json({ error: "Invalid credentials" });
      }

      await persistLoginHistory(
        user.email || loginId,
        user._id,
        user.userId || String(user._id),
        "Success",
        req,
      );

      const token = jwt.sign(
        {
          id: user._id.toString(),
          role: user.userRole,
          userKey: user.userId,
          email: user.email,
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY },
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.userRole,
          userId: user.userId,
          profileImg: user.profileImg,
        },
      });
    }

    const permission = await StaffPermission.findOne({
      $or: [
        { "credentials.username": loginId },
        { staffUserId: loginId },
      ],
    }).populate("staffId", "personalDetails staffId");

    if (!permission) {
      return res.status(404).json({ error: "User not found" });
    }

    if (permission.status !== "Active") {
      return res.status(403).json({
        error: `Account is ${permission.status}. Contact an administrator.`,
      });
    }

    if (permission.isLocked) {
      return res.status(403).json({
        error: "Account is locked. Contact an administrator.",
      });
    }

    const pwdOk = await comparePassword(
      password,
      permission.credentials.password,
    );
    if (!pwdOk) {
      const failedStaff = permission.staffId;
      if (failedStaff?._id) {
        await persistLoginHistory(
          loginId,
          failedStaff._id,
          failedStaff.staffId || permission.staffUserId || "",
          "Failed",
          req,
        );
      }
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const staff = permission.staffId;
    if (!staff) {
      return res.status(500).json({ error: "Staff profile missing" });
    }

    const staffEmail =
      staff.personalDetails?.email || permission.credentials?.username || "";
    const token = jwt.sign(
      {
        id: staff._id.toString(),
        role: permission.role,
        staffUserId: permission.staffUserId,
        loginId: loginId,
        email: staffEmail || undefined,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    await persistLoginHistory(
      permission.credentials?.username || loginId,
      staff._id,
      staff.staffId || permission.staffUserId || "",
      "Success",
      req,
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        accountType: "staff",
        id: staff._id,
        name: staff.personalDetails?.fullName,
        fullName: staff.personalDetails?.fullName,
        email:
          staff.personalDetails?.email || permission.credentials.username,
        role: permission.role,
        userRole: permission.role,
        userId: staff.staffId,
        profileImg: staff.personalDetails?.staffPhoto?.url || "",
      },
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
    const param = req.params.userId;
    const user = await User.findOne({ userId: param }).select("-password").lean();
    if (user) {
      return res.json({ ...user, accountType: "user" });
    }

    const staff = await findStaffByRouteParam(param);
    if (staff) {
      const permission = await StaffPermission.findOne({ staffId: staff._id })
        .select("role")
        .lean();
      return res.json(staffToProfilePayload(staff, permission));
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const param = req.params.userId;
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
      { userId: param },
      updatedData,
      { new: true },
    ).select("-password");

    if (user) {
      return res.json({
        message: "User updated successfully",
        user: { ...user.toObject?.() ?? user, accountType: "user" },
      });
    }

    const staffLean = await findStaffByRouteParam(param);
    if (!staffLean) {
      return res.status(404).json({ error: "User not found" });
    }

    const set = {};
    if (fullName !== undefined) set["personalDetails.fullName"] = fullName;
    if (mobileNumber !== undefined) set["personalDetails.mobileNumber"] = mobileNumber;
    if (country !== undefined) set["staffLocation.country"] = country;
    if (state !== undefined) set["staffLocation.state"] = state;
    if (city !== undefined) set["staffLocation.city"] = city;
    if (address && Object.keys(address).length > 0) {
      set.address = address;
    }

    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path, req.file.mimetype);
      if (upload) {
        set["personalDetails.staffPhoto.url"] = upload.secure_url;
        set["personalDetails.staffPhoto.publicId"] = upload.public_id;
      }
    }

    let staffDoc;
    if (Object.keys(set).length > 0) {
      staffDoc = await Staff.findByIdAndUpdate(staffLean._id, { $set: set }, {
        new: true,
        runValidators: true,
      }).lean();
    } else {
      staffDoc = await Staff.findById(staffLean._id).lean();
    }

    const permission = await StaffPermission.findOne({ staffId: staffDoc._id })
      .select("role")
      .lean();

    return res.json({
      message: "User updated successfully",
      user: staffToProfilePayload(staffDoc, permission),
    });
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
        pass: process.env.app_pass,
      },
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
      html: htmlTemplate,
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
      { $set: { password: hashedPassword } },
    );

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await LoginHistory.find({ userId });
    res.status(200).json({
      message: "Login history fetched successfully",
      data,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/** Current session: staff JWT id = Staff _id; matches LoginHistory.userId */
export const getMyLoginHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    const lim = Math.min(Number(limit) || 50, 100);
    const sk = Number(skip) || 0;

    const history = await LoginHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(lim)
      .skip(sk)
      .lean();

    const total = await LoginHistory.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: "Login history fetched successfully",
      data: history,
      pagination: {
        total,
        limit: lim,
        skip: sk,
        hasMore: sk + lim < total,
      },
    });
  } catch (error) {
    console.error("Error fetching my login history:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};