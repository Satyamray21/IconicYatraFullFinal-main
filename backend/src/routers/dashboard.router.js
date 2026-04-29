import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/user.middleware.js";

import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = Router();

router.get("/stats", verifyToken, requirePermission("canAccessDashboard"), getDashboardStats);

export default router;
