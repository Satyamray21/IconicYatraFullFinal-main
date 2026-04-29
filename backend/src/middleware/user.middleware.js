import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// Verify Token Middleware
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (decoded?.id != null && typeof decoded.id === "object" && decoded.id.$oid) {
            decoded.id = String(decoded.id.$oid);
        } else if (decoded?.id != null) {
            decoded.id = String(decoded.id);
        }
        req.user = decoded; // { id, role, staffUserId?, userKey? }
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
