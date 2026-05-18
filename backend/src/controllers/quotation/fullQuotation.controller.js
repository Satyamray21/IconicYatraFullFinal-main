import { fullQuotation } from "../../models/quotation/fullQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { clearPattern } from "../../utils/cache.js";
import { v4 as uuidv4 } from "uuid";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { logActivity } from "../../utils/ActivityLog.js";
/* =====================================================
   STEP 1 - CREATE OR RESUME QUOTATION
===================================================== */
export const createOrResumeStep1 = asyncHandler(async (req, res) => {
    let { clientDetails, accommodation, pickupDrop, quotationValidity, quotation } = req.body;

    // Parse JSON strings sent from frontend
    try {
        clientDetails = JSON.parse(clientDetails || "{}");
        accommodation = JSON.parse(accommodation || "{}");
        pickupDrop = JSON.parse(pickupDrop || "{}");
        quotationValidity = JSON.parse(quotationValidity || "{}");
        quotation = JSON.parse(quotation || "{}");
    } catch (err) {
        throw new ApiError(400, "Invalid JSON format in request body");
    }

    // Resume existing quotation if quotationId provided
    if (req.body.quotationId) {
        const existing = await fullQuotation.findOne({ quotationId: req.body.quotationId });
        if (existing) {
            return res
                .status(200)
                .json(new ApiResponse(200, existing, "Resumed existing quotation draft"));
        }
    }

    // Upload banner image (if provided)
    if (req.file) {
        const cloudResult = await uploadOnCloudinary(req.file.path);
        if (cloudResult && cloudResult.secure_url) {
            quotation.bannerImage = cloudResult.secure_url;
        }
    }

    // Validate required fields
    if (!clientDetails.clientName || !quotation.quotationTitle) {
        throw new ApiError(400, "Missing required client or quotation details");
    }

    const quotationId = `QT-${uuidv4().slice(0, 8).toUpperCase()}`;

    const newQuotation = await fullQuotation.create({
        quotationId,
        clientDetails,
        accommodation,
        pickupDrop,
        quotationValidity,
        quotation,
        currentStep: 1,
    });

    await logActivity({
        action: "CREATE",
        model: "FullQuotation",
        refId: quotationId,
        description: `New full quotation ${quotationId} drafted for ${clientDetails.clientName} by ${req.user?.name || 'Admin'}`,
        user: req.user?.name || "Admin",
    });

    await clearPattern('dashboard:stats:*');
    return res
        .status(201)
        .json(new ApiResponse(201, newQuotation, "Step 1: Quotation draft created"));
});


/* =====================================================
   STEP 2 - UPDATE STAY LOCATION
===================================================== */
export const updateStep2 = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { stayLocation } = req.body;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    // Transform frontend data to match schema with accommodation plans
    quotation.stayLocation = stayLocation.map((loc, index) => ({
        city: loc.name, // Note: frontend uses 'name', schema uses 'city'
        order: index + 1,
        nights: Number(loc.nights) || 1,
        // Initialize empty accommodation plans
        standard: {},
        deluxe: {},
        superior: {}
    }));

    quotation.currentStep = Math.max(quotation.currentStep, 2);
    await quotation.save();

    await clearPattern('dashboard:stats:*');
    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Step 2: Stay location saved"));
});


/* =====================================================
   STEP 3 - UPDATE ITINERARY
===================================================== */
export const updateStep3 = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { itinerary } = req.body;
    const files = req.files;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    // Parse itinerary
    let itineraryArray;
    try {
        itineraryArray = typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary;
    } catch (error) {
        throw new ApiError(400, "Invalid itinerary format");
    }

    if (!Array.isArray(itineraryArray)) {
        throw new ApiError(400, "Itinerary must be an array");
    }

    // Get files array - handle different multer configurations
    let filesArray = [];
    if (files) {
        if (Array.isArray(files)) {
            filesArray = files;
        } else if (files.images && Array.isArray(files.images)) {
            filesArray = files.images;
        } else if (files.images && !Array.isArray(files.images)) {
            filesArray = [files.images];
        }
    }

    console.log('Files received:', filesArray.length);
    console.log('Itinerary items:', itineraryArray.length);

    const updatedItinerary = await Promise.all(
        itineraryArray.map(async (item, index) => {
            let imageUrl = item.image || null;

            // Check if there's a corresponding file
            if (filesArray[index]) {
                const file = filesArray[index];
                console.log(`Processing file for day ${index + 1}:`, file.originalname);

                try {
                    const uploaded = await uploadOnCloudinary(file.path, "itinerary");

                    if (!uploaded) {
                        console.warn(`Cloudinary returned null for file: ${file.originalname}`);
                        return { ...item, image: imageUrl }; // Return without updating image
                    }

                    if (!uploaded.secure_url) {
                        console.warn(`Cloudinary upload successful but no secure_url for: ${file.originalname}`);
                        return { ...item, image: imageUrl }; // Return without updating image
                    }

                    imageUrl = uploaded.secure_url;
                    console.log(`Image uploaded successfully for day ${index + 1}:`, imageUrl);

                } catch (uploadError) {
                    console.error(`Error uploading image for day ${index + 1}:`, uploadError.message);
                    // Continue with existing imageUrl
                }
            }

            return {
                ...item,
                image: imageUrl,
            };
        })
    );

    quotation.itinerary = updatedItinerary;
    quotation.currentStep = Math.max(quotation.currentStep, 3);
    await quotation.save();

    await clearPattern('dashboard:stats:*');
    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Step 3: Itinerary saved"));
});

// controllers/fullQuotation/fullQuotation.controller.js

/* =====================================================
   STEP 4 - ACCOMMODATION DETAILS
===================================================== */
export const updateStep4 = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { stayLocation } = req.body;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    // Update stayLocation with accommodation details
    quotation.stayLocation = stayLocation.map((location, index) => ({
        city: location.city,
        order: location.order,
        nights: Number(location.nights) || 1,
        standard: location.standard || {},
        deluxe: location.deluxe || {},
        superior: location.superior || {}
    }));

    quotation.currentStep = Math.max(quotation.currentStep, 4);
    await quotation.save();

    await clearPattern('dashboard:stats:*');
    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Step 4: Accommodation details saved"));
});

export const getStep4 = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    return res
        .status(200)
        .json(new ApiResponse(200, quotation.stayLocation, "Accommodation details fetched"));
});
/* =====================================================
   STEP 4 - VEHICLE & POLICIES
===================================================== */
export const updateStep5 = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { vehicleDetails } = req.body;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    quotation.vehicleDetails = vehicleDetails;
    // quotation.policies = policies;
    quotation.currentStep = Math.max(quotation.currentStep, 4);
    await quotation.save();

    await clearPattern('dashboard:stats:*');
    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Step 4: Vehicle saved"));
});

/* =====================================================
   STEP 5 - PRICING DETAILS
===================================================== */
export const updateStep6 = async (req, res) => {
    const { quotationId } = req.params;
    const { pricing } = req.body;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });

    // Merge pricing with defaults
    quotation.pricing = {
        totals: pricing.totals || { standard: 0, deluxe: 0, superior: 0 },
        margins: pricing.margins || {
            standard: { percent: "0", value: 0 },
            deluxe: { percent: "0", value: 0 },
            superior: { percent: "0", value: 0 },
        },
        discounts: pricing.discounts || { standard: 0, deluxe: 0, superior: 0 },
        taxes: pricing.taxes || { gstOn: "Full", taxPercent: "18", applyGST: false },
        contactDetails: pricing.contactDetails || "",
    };

    await clearPattern('dashboard:stats:*');
    res.status(200).json({ message: "Step 6: Pricing saved", data: quotation });
};

/* =====================================================
   FINAL STEP - SUBMIT
===================================================== */
export const finalizeQuotation = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    quotation.isDraft = false;
    quotation.isFinalized = true;
    quotation.status = "Submitted";
    quotation.submittedAt = new Date();

    // Generate bookingId if not already present
    if (!quotation.bookingId) {
        const selectedCompany = await resolveCompanyForEmail({
            companyId: req.body?.companyId,
            companyName: req.body?.companyName,
        });
        const compName = selectedCompany?.companyName || req.body?.companyName || "Iconic Travel";
        quotation.companyName = compName;
        if (selectedCompany?._id) quotation.companyId = selectedCompany._id;
        
        const { generateBookingId } = await import("../../utils/bookingIdGenerator.js");
        quotation.bookingId = await generateBookingId(compName);
    }

    await quotation.save();

    await logActivity({
        action: "UPDATE",
        model: "FullQuotation",
        refId: quotationId,
        description: `Full quotation ${quotationId} for ${quotation.clientDetails?.clientName} was finalized by ${req.user?.name || 'Admin'}`,
        user: req.user?.name || "Admin",
    });

    await clearPattern('dashboard:stats:*');
    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation finalized successfully"));
});


/* =====================================================
   UPDATE QUOTATION (Generic)
===================================================== */
export const updateFullQuotation = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const updateData = req.body;

    const quotation = await fullQuotation.findOneAndUpdate(
        { quotationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!quotation) throw new ApiError(404, "Quotation not found");

    await clearPattern('dashboard:stats:*');

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation updated successfully"));
});

/* =====================================================
   GET QUOTATION BY ID
===================================================== */
export const getQuotationById = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const quotation = await fullQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, "Quotation not found");

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation fetched successfully"));
});


/* =====================================================
   VIEW ALL QUOTATIONS
===================================================== */
export const getAllQuotations = asyncHandler(async (req, res) => {
    const quotations = await fullQuotation.find().sort({ createdAt: -1 }); // latest first

    return res
        .status(200)
        .json(new ApiResponse(200, quotations, "All quotations fetched successfully"));
});

const resolveCompanyForEmail = async ({ companyId, companyName }) => {
    const Company = (await import("../../models/company.model.js")).default;
    if (companyId) {
        const byId = await Company.findById(companyId).lean();
        if (byId) return byId;
    }
    if (companyName) {
        const byName = await Company.findOne({
            companyName: { $regex: `^${String(companyName).trim()}$`, $options: "i" },
        }).lean();
        if (byName) return byName;
    }
    return null;
};