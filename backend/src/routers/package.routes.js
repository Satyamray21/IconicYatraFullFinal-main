import { Router } from "express";
import upload from "../middleware/fileUpload.js";
import { verifyToken } from "../middleware/user.middleware.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";
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
router.post("/", verifyToken, requirePermission("canCreatePackage"), createPackage);

// step-wise updates
router.put("/:id/step1", verifyToken, requirePermission("canEditPackage"), updateStep1);
router.put("/:id/tour-details", verifyToken, requirePermission("canEditPackage"), updateTourDetails);

// uploads
router.post("/:id/banner", verifyToken, requirePermission("canEditPackage"), upload.single("banner"), uploadBanner);
router.post("/:id/days/:dayIndex/image", verifyToken, requirePermission("canEditPackage"), upload.single("dayImage"), uploadDayImage);


router.get("/category/:packageCategory", getPackagesByCategory);
// ✅ NEW: Dynamic route for any tour type
router.get("/tour-type/:tourType", getPackagesByTourType);




router.get("/popular", getPopularTours);
router.get("/make-all-popular", verifyToken, requirePermission("canEditPackage"), makeAllPopular);
// read
router.get("/:id", getById);
router.get("/", listPackages);

// delete
router.delete("/:id", verifyToken, requirePermission("canDeletePackage"), remove);


export default router;