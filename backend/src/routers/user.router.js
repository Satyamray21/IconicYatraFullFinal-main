import express from "express";
import {
    register,
    login,
    getUsers,
    getUserById,
    getCurrentProfile,
    getMyLoginHistory,
    updateUser,
    updateCurrentUser,
    deleteUser,
    sendResetCode,
    changePassword
} from "../controllers/user.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/user.middleware.js";
import upload from "../middleware/fileUpload.js";

const router = express.Router();

// Auth
router.post("/register", upload.single("profileImg"), register);
router.post("/login", login);


// Forgot password
router.post("/send-reset-code", sendResetCode);
router.post("/change-password", changePassword);

// CRUD (protected)
router.get("/", verifyToken, authorizeRoles("Admin", "Superadmin"), getUsers);
router.get("/me", verifyToken, getCurrentProfile);
router.get("/me/login-history", verifyToken, getMyLoginHistory);
router.put("/me", verifyToken, upload.single("profileImg"), updateCurrentUser);
router.get("/:userId", verifyToken, getUserById);
router.put("/:userId", verifyToken, upload.single("profileImg"), updateUser);
router.delete("/:userId", verifyToken, authorizeRoles("Admin", "Superadmin"), deleteUser);

export default router;
