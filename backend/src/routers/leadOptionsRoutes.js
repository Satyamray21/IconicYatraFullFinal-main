import express from "express";
import { deleteLeadOption } from "../controllers/leadOptionsController.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.delete("/:id", requirePermission("canEditLead"), deleteLeadOption);

export default router;