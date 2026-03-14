import LandingPage from "../models/landingPage.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/* =========================================================
   CREATE LANDING PAGE
========================================================= */

export const createLandingPage = async (req, res) => {
  try {

    const data = JSON.parse(req.body.data || "{}");

    /* ---------- HERO IMAGE ---------- */

    if (req.files?.heroBackgroundImage) {
      const uploaded = await uploadOnCloudinary(
        req.files.heroBackgroundImage[0].path
      );
      data.heroBackgroundImage = uploaded;
    }

    /* ---------- OWN PACKAGE IMAGE ---------- */

    if (req.files?.ownPackageImage) {
      const uploaded = await uploadOnCloudinary(
        req.files.ownPackageImage[0].path
      );
      data.ownPackageImage = uploaded;
    }

    /* ---------- WHY CHOOSE IMAGE ---------- */

    if (req.files?.whyChooseBannerImage) {
      const uploaded = await uploadOnCloudinary(
        req.files.whyChooseBannerImage[0].path
      );
      data.whyChooseBannerImage = uploaded;
    }

    /* ---------- OVERVIEW IMAGES ---------- */

    if (req.files?.overviewImages && data.overviewSections) {

      for (let i = 0; i < req.files.overviewImages.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.overviewImages[i].path
        );

        if (data.overviewSections[i]) {
          data.overviewSections[i].overviewImage = uploaded;
        }
      }
    }

    /* ---------- SOLUTION ICONS ---------- */

    if (req.files?.solutionIcons && data.solutionItems) {

      for (let i = 0; i < req.files.solutionIcons.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.solutionIcons[i].path
        );

        if (data.solutionItems[i]) {
          data.solutionItems[i].icon = uploaded;
        }
      }
    }

    /* ---------- FEATURE ICONS ---------- */

    if (req.files?.featureIcons && data.packageFeatures) {

      for (let i = 0; i < req.files.featureIcons.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.featureIcons[i].path
        );

        if (data.packageFeatures[i]) {
          data.packageFeatures[i].icon = uploaded;
        }
      }
    }

    const landingPage = await LandingPage.create(data);

    res.status(201).json({
      success: true,
      data: landingPage,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET ALL LANDING PAGES
========================================================= */

export const getLandingPages = async (req, res) => {
  try {

    const pages = await LandingPage.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pages.length,
      data: pages,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET LANDING PAGE BY SLUG
========================================================= */

export const getLandingPageBySlug = async (req, res) => {
  try {

    const { slug } = req.params;

    const page = await LandingPage.findOne({
      slug,
      isActive: true,
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found",
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   UPDATE LANDING PAGE
========================================================= */

export const updateLandingPage = async (req, res) => {
  try {

    const { id } = req.params;

    const data = JSON.parse(req.body.data || "{}");

    const page = await LandingPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found",
      });
    }

    /* ---------- HERO IMAGE ---------- */

    if (req.files?.heroBackgroundImage) {

      const uploaded = await uploadOnCloudinary(
        req.files.heroBackgroundImage[0].path
      );

      data.heroBackgroundImage = uploaded;
    }

    /* ---------- OWN PACKAGE IMAGE ---------- */

    if (req.files?.ownPackageImage) {

      const uploaded = await uploadOnCloudinary(
        req.files.ownPackageImage[0].path
      );

      data.ownPackageImage = uploaded;
    }

    /* ---------- WHY CHOOSE IMAGE ---------- */

    if (req.files?.whyChooseBannerImage) {

      const uploaded = await uploadOnCloudinary(
        req.files.whyChooseBannerImage[0].path
      );

      data.whyChooseBannerImage = uploaded;
    }

    /* ---------- OVERVIEW IMAGES ---------- */

    if (req.files?.overviewImages && data.overviewSections) {

      for (let i = 0; i < req.files.overviewImages.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.overviewImages[i].path
        );

        if (data.overviewSections[i]) {
          data.overviewSections[i].overviewImage = uploaded;
        }
      }
    }

    /* ---------- SOLUTION ICONS ---------- */

    if (req.files?.solutionIcons && data.solutionItems) {

      for (let i = 0; i < req.files.solutionIcons.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.solutionIcons[i].path
        );

        if (data.solutionItems[i]) {
          data.solutionItems[i].icon = uploaded;
        }
      }
    }

    /* ---------- FEATURE ICONS ---------- */

    if (req.files?.featureIcons && data.packageFeatures) {

      for (let i = 0; i < req.files.featureIcons.length; i++) {

        const uploaded = await uploadOnCloudinary(
          req.files.featureIcons[i].path
        );

        if (data.packageFeatures[i]) {
          data.packageFeatures[i].icon = uploaded;
        }
      }
    }

    const updatedPage = await LandingPage.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedPage,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   DELETE LANDING PAGE
========================================================= */

export const deleteLandingPage = async (req, res) => {
  try {

    const { id } = req.params;

    const page = await LandingPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found",
      });
    }

    await LandingPage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Landing page deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
