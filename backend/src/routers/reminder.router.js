import express from "express";
import { verifyToken } from "../middleware/user.middleware.js";
import {
    createReminder,
    getReminders,
    updateReminderStatus,
    deleteReminder
} from "../controllers/reminder.controller.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createReminder);
router.get("/", getReminders);
router.patch("/:id", updateReminderStatus);
router.delete("/:id", deleteReminder);

export default router;
