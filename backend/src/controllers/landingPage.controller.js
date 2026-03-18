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
    // =============================
// SLIDING TEXT (OBJECT BASED)
// =============================
if (data.slidingText) {
  data.slidingText = data.slidingText
    .map((item) => ({
      ...item,
      text: item.text?.trim(),
    }))
    .filter((item) => item.text && item.text.length > 0);
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
    const data = JSON.parse(req.body.data);

    const page = await LandingPage.findById(id);
    if (!page) {
      return res.status(404).json({ message: "Landing page not found" });
    }

    // =============================
    // HERO IMAGE
    // =============================
    if (req.files?.heroBackgroundImage?.[0]) {
      data.heroBackgroundImage = await uploadOnCloudinary(
        req.files.heroBackgroundImage[0].path
      );
    }

    // =============================
    // OVERVIEW SECTIONS
    // =============================
    if (data.overviewSections) {
      data.overviewSections = data.overviewSections.map((section, index) => {
        const existing = page.overviewSections.find(
          (s) => s._id.toString() === section._id
        );

        let image = existing?.overviewImage || null;

        if (req.files?.overviewImages?.[index]) {
          image = uploadOnCloudinary(req.files.overviewImages[index].path);
        }

        return {
          ...section,
          overviewImage: image,
        };
      });
    }

    // =============================
    // SOLUTIONS
    // =============================
    if (data.solutionItems) {
      data.solutionItems = data.solutionItems.map((item, index) => {
        const existing = page.solutionItems.find(
          (s) => s._id.toString() === item._id
        );

        let icon = existing?.icon || null;

        if (req.files?.solutionIcons?.[index]) {
          icon = uploadOnCloudinary(req.files.solutionIcons[index].path);
        }

        return {
          ...item,
          icon,
        };
      });
    }

    // =============================
    // PACKAGE FEATURES
    // =============================
    if (data.packageFeatures) {
      data.packageFeatures = data.packageFeatures.map((feature, index) => {
        const existing = page.packageFeatures.find(
          (f) => f._id.toString() === feature._id
        );

        let icon = existing?.icon || null;

        if (req.files?.featureIcons?.[index]) {
          icon = uploadOnCloudinary(req.files.featureIcons[index].path);
        }

        return {
          ...feature,
          icon,
        };
      });
    }

    // =============================
    // SIMPLE IMAGE FIELDS
    // =============================
    if (req.files?.ownPackageImage?.[0]) {
      data.ownPackageImage = await uploadOnCloudinary(
        req.files.ownPackageImage[0].path
      );
    }

    if (req.files?.whyChooseBannerImage?.[0]) {
      data.whyChooseBannerImage = await uploadOnCloudinary(
        req.files.whyChooseBannerImage[0].path
      );
    }
    // =============================
// SLIDING TEXT (FIXED)
// =============================
if (data.slidingText) {
  data.slidingText = data.slidingText
    .map((item) => {
      // NEW ITEM (no _id)
      if (!item._id) {
        return {
          text: item.text?.trim(),
        };
      }

      // EXISTING ITEM
      const existing = page.slidingText.find(
        (t) => t._id.toString() === item._id
      );

      return {
        _id: item._id,
        text: item.text?.trim() || existing?.text,
      };
    })
    .filter((item) => item.text && item.text.length > 0);
}


    // =============================
    // FINAL UPDATE
    // =============================
    const updatedPage = await LandingPage.findByIdAndUpdate(id, data, {
      new: true,
    });

    res.json({
      message: "Landing page updated successfully",
      page: updatedPage,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

/* =========================================================
   GET LANDING PAGE BY ID
========================================================= */

export const getLandingPageById = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await LandingPage.findById(id);

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

