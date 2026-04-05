// routes/homePage.routes.js
import express from "express";
import { upload } from "../middleware/imageMulter.middleware.js";
import {
  saveHomePage,
  getHomePage,
} from "../controllers/homePage.controller.js";

const router = express.Router();

router.post(
  "/save",
  upload.any(), // IMPORTANT
  saveHomePage
);

router.get("/get", getHomePage);

export default router;
