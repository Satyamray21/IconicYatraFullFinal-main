import { Router } from "express";
import { getRedisNotifications, clearRedisNotifications, deleteRedisNotification } from "../controllers/redisNotification.controller.js";

const router = Router();

router.route("/").get(getRedisNotifications).delete(clearRedisNotifications);
router.route("/:index").delete(deleteRedisNotification);

export default router;
