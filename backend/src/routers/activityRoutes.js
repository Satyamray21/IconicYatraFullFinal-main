// routes/activityRoutes.js
import express from "express";
import { ActivityLog } from "../models/ActivityLog.js";

const router = express.Router();

// GET all logs
router.get("/", async (req, res) => {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.json(logs);
});

export default router;