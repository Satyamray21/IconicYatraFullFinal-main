import express from "express";
import upload, { handleMulterError } from "../middleware/fileUpload.js";
import {
    createHotelStep1,
    getHotels,
    getHotelById,
    updateHotel,
    deleteHotel,
    updateStatus,
    updateHotelStep2,
    updateHotelStep3,
    updateHotelStep4,
    getHotelForEdit,
    debugHotel
} from "../controllers/hotel.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

// ✅ Step 1: Create hotel with basic details
router.post(
    "/create-hotel",
    requirePermission("canCreateBooking"),
    upload.fields([
        { name: "mainImage", maxCount: 1 }
    ]),
    handleMulterError,
    createHotelStep1
);

// ✅ Step 2: Update room details
router.put(
    "/update-step2/:id",
    requirePermission("canEditBooking"),
    upload.fields([
        { name: "roomImages", maxCount: 10 },
    ]),
    handleMulterError,
    updateHotelStep2
);

// ✅ Step 3: Update mattress cost
router.put(
    "/update-step3/:id",
    requirePermission("canEditBooking"),
    updateHotelStep3
);

// ✅ Step 4: Update peak cost & final submit
router.put(
    "/update-step4/:id",
    requirePermission("canEditBooking"),
    updateHotelStep4
);

// ✅ Get hotel for editing (with step tracking)
router.get("/edit/:id", requirePermission("canAccessBookings"), getHotelForEdit);

// ✅ Other existing routes...
router.put(
    "/update/:id",
    requirePermission("canEditBooking"),
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "roomImages", maxCount: 10 },
    ]),
    handleMulterError,
    updateHotel
);

router.get("/all-hotel", requirePermission("canAccessBookings"), getHotels);
router.get("/:id", requirePermission("canAccessBookings"), getHotelById);
router.delete("/delete/:id", requirePermission("canDeleteBooking"), deleteHotel);
router.patch("/:id/status", requirePermission("canEditBooking"), updateStatus);
router.get("/debug/:id", requirePermission("canAccessBookings"), debugHotel);

export default router;