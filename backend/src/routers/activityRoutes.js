// routes/activityRoutes.js
import express from "express";
import { ActivityLog } from "../models/ActivityLog.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

// GET all logs
router.get("/", requirePermission("canAccessReports"), async (req, res) => {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.json(logs);
});

export default router;