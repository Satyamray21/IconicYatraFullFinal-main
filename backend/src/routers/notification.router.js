import { Router } from "express";
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/user.middleware.js";

const router = Router();

router.use(verifyToken);

router.get("/my-notifications", getMyNotifications);
router.patch("/mark-as-read/:id", markAsRead);
router.patch("/mark-all-read", markAllAsRead);

export default router;
