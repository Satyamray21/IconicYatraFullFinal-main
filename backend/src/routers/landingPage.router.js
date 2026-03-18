import express from "express";
import { upload } from "../middleware/imageMulter.middleware.js";

import {
  createLandingPage,
  getLandingPages,
  getLandingPageBySlug,
  updateLandingPage,
  deleteLandingPage,
  getLandingPageById,
} from "../controllers/landingPage.controller.js";

const router = express.Router();

/* =========================================================
   CREATE LANDING PAGE
========================================================= */

router.post(
  "/",
  upload.fields([
    { name: "heroBackgroundImage", maxCount: 1 },
    { name: "ownPackageImage", maxCount: 1 },
    { name: "whyChooseBannerImage", maxCount: 1 },

    { name: "overviewImages", maxCount: 20 },
    { name: "solutionIcons", maxCount: 20 },
    { name: "featureIcons", maxCount: 20 },
  ]),
  createLandingPage
);


/* =========================================================
   GET ALL LANDING PAGES
========================================================= */

router.get("/", getLandingPages);


/* =========================================================
   GET LANDING PAGE BY SLUG
========================================================= */

router.get("/slug/:slug", getLandingPageBySlug);


/* =========================================================
   UPDATE LANDING PAGE
========================================================= */

router.put(
  "/:id",
  upload.fields([
    { name: "heroBackgroundImage", maxCount: 1 },
    { name: "ownPackageImage", maxCount: 1 },
    { name: "whyChooseBannerImage", maxCount: 1 },

    { name: "overviewImages", maxCount: 20 },
    { name: "solutionIcons", maxCount: 20 },
    { name: "featureIcons", maxCount: 20 },
  ]),
  updateLandingPage
);


/* =========================================================
   DELETE LANDING PAGE
========================================================= */

router.delete("/:id", deleteLandingPage);

router.get("/:id", getLandingPageById);


export default router;
