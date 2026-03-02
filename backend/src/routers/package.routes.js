import { Router } from "express";
import upload from "../middleware/fileUpload.js";
import {
    createPackage,
    updateStep1,
    updateTourDetails,
    uploadBanner,
    uploadDayImage,
    getById,
    listPackages,
    remove,
    getPopularTours,
    makeAllPopular,
    getPackagesByCategory,
    getPackagesByTourType // ✅ NEW: Import the new function
} from "../controllers/package.controller.js";

const router = Router();

// create (can be used by Step 1 submit)
router.post("/", createPackage);

// step-wise updates
router.put("/:id/step1", updateStep1);
router.put("/:id/tour-details", updateTourDetails);

// uploads
router.post("/:id/banner", upload.single("banner"), uploadBanner);
router.post("/:id/days/:dayIndex/image", upload.single("dayImage"), uploadDayImage);

// ✅ NEW: Routes for specific tour types
router.get("/tour-type/domestic", (req, res) => getPackagesByTourType({ params: { tourType: "Domestic" }, query: req.query }, res));
router.get("/tour-type/international", (req, res) => getPackagesByTourType({ params: { tourType: "International" }, query: req.query }, res));
router.get("/tour-type/yatra", (req, res) => getPackagesByTourType({ params: { tourType: "Yatra" }, query: req.query }, res));
router.get("/tour-type/holiday", (req, res) => getPackagesByTourType({ params: { tourType: "Holiday" }, query: req.query }, res));
router.get("/tour-type/special", (req, res) => getPackagesByTourType({ params: { tourType: "Special" }, query: req.query }, res));
router.get("/tour-type/latest", (req, res) => getPackagesByTourType({ params: { tourType: "Latest" }, query: req.query }, res));

// ✅ NEW: Dynamic route for any tour type
router.get("/tour-type/:tourType", getPackagesByTourType);

router.get("/category/yatra", (req, res) =>
  getPackagesByCategory(
    { params: { packageCategory: "Yatra" }, query: req.query },
    res
  )
);

router.get("/category/holiday", (req, res) =>
  getPackagesByCategory(
    { params: { packageCategory: "Holiday" }, query: req.query },
    res
  )
);

router.get("/category/special", (req, res) =>
  getPackagesByCategory(
    { params: { packageCategory: "Special" }, query: req.query },
    res
  )
);

router.get("/category/latest", (req, res) =>
  getPackagesByCategory(
    { params: { packageCategory: "Latest" }, query: req.query },
    res
  )
);

router.get("/popular", getPopularTours);
router.get("/make-all-popular", makeAllPopular);
// read
router.get("/:id", getById);
router.get("/", listPackages);

// delete
router.delete("/:id", remove);


export default router;