import express from "express";
import {
    createDay,
    getAllDays,
    getDayById,
    updateDay,
    deleteDay,
} from "../controllers/day.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/", requirePermission("canEditPackage"), createDay);
router.get("/", requirePermission("canAccessPackages"), getAllDays);
router.get("/:id", requirePermission("canAccessPackages"), getDayById);
router.put("/:id", requirePermission("canEditPackage"), updateDay);
router.delete("/:id", requirePermission("canDeletePackage"), deleteDay);

export default router;
