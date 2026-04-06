import express from "express";
import {
  createAssociate,
  getAllAssociates,
  getAssociateById,
  updateAssociate,
  deleteAssociate,
} from "../controllers/associates.controller.js";

const router = express.Router();

router.post("/", createAssociate);
router.get("/", getAllAssociates);
router.get("/:id", getAssociateById);
router.put("/:id", updateAssociate);
router.delete("/:id", deleteAssociate);

export default router;
