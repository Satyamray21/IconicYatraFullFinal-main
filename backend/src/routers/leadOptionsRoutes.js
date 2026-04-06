import express from "express";
import { deleteLeadOption } from "../controllers/leadOptionsController.js";

const router = express.Router();

// DELETE request
router.delete("/:id", deleteLeadOption);

export default router;