import express from "express";
import {
    createDay,
    getAllDays,
    getDayById,
    updateDay,
    deleteDay,
} from "../controllers/day.controller.js";

const router = express.Router();

router.post("/", createDay);
router.get("/", getAllDays);
router.get("/:id", getDayById);
router.put("/:id", updateDay);
router.delete("/:id", deleteDay);

export default router;
