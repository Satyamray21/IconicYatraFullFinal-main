import jwt from "jsonwebtoken";
import { Staff } from "../models/staff.model.js";
import { User } from "../models/user.model.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// Verify Token Middleware
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        
        // Resolve ID
        if (decoded?.id != null && typeof decoded.id === "object" && decoded.id.$oid) {
            decoded.id = String(decoded.id.$oid);
        } else if (decoded?.id != null) {
            decoded.id = String(decoded.id);
        }

        // Auto-resolve name if missing (for activity logs)
        if (!decoded.name) {
            if (decoded.staffUserId) {
                const staff = await Staff.findOne({ staffId: decoded.staffUserId }).select("personalDetails.fullName").lean();
                if (staff) decoded.name = staff.personalDetails?.fullName;
            } else if (decoded.userKey) {
                const user = await User.findOne({ userId: decoded.userKey }).select("fullName").lean();
                if (user) decoded.name = user.fullName;
            }
        }

        req.user = decoded; // { id, role, name, staffUserId?, userKey? }
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Role-based authorization Middleware
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    };
};
