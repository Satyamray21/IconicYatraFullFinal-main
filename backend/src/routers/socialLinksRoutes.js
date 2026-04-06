import express from "express";
import {
  getSocialLinks,
  updateSocialLinks,
} from "../controllers/socialLinksController.js";

const router = express.Router();

router.get("/", getSocialLinks);
router.put("/", updateSocialLinks);

export default router;
