import { Router } from "express";
import {
  getGlobalSettings,
  updateGlobalSettings
} from "../controllers/globalSettings.controller.js";

const router = Router();

router.get("/", getGlobalSettings);
router.put("/", updateGlobalSettings);

export default router;
