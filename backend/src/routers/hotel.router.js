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
import { verifyToken } from "../middleware/user.middleware.js";

const router = express.Router();

// ✅ Step 1: Create hotel with basic details
router.post(
    "/create-hotel",
    verifyToken,
    upload.fields([
        { name: "mainImage", maxCount: 1 }
    ]),
    handleMulterError,
    createHotelStep1
);

// ✅ Step 2: Update room details
router.put(
    "/update-step2/:id",
    verifyToken,
    upload.fields([
        { name: "roomImages", maxCount: 10 },
    ]),
    handleMulterError,
    updateHotelStep2
);

// ✅ Step 3: Update mattress cost
router.put(
    "/update-step3/:id",
    verifyToken,
    updateHotelStep3
);

// ✅ Step 4: Update peak cost & final submit
router.put(
    "/update-step4/:id",
    verifyToken,
    updateHotelStep4
);

// ✅ Get hotel for editing (with step tracking)
router.get("/edit/:id", verifyToken, getHotelForEdit);

// ✅ Other existing routes...
router.put(
    "/update/:id",
    verifyToken,
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "roomImages", maxCount: 10 },
    ]),
    handleMulterError,
    updateHotel
);

router.get("/all-hotel", verifyToken, getHotels);
router.get("/:id", verifyToken, getHotelById);
router.delete("/delete/:id", verifyToken, deleteHotel);
router.patch("/:id/status", verifyToken, updateStatus);
router.get("/debug/:id", verifyToken, debugHotel);

export default router;