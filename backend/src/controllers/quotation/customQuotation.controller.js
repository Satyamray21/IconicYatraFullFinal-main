import { CustomQuotation } from "../../models/quotation/customQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import mongoose from "mongoose";

// Counter Schema and Model - defined in the same file
const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    sequence: {
        type: Number,
        default: 0
    }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Helper to generate quotationId with counter
const generateQuotationId = async () => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { name: "customQuotation" },
            { $inc: { sequence: 1 } },
            { upsert: true, new: true, runValidators: true }
        );

        const sequenceNumber = counter.sequence;
        return `ICYR_CQ_${sequenceNumber.toString().padStart(4, "0")}`;
    } catch (error) {
        console.error("Error generating quotation ID with counter:", error);

        // Fallback: get the highest existing quotationId
        try {
            const lastQuotation = await CustomQuotation.findOne().sort({ createdAt: -1 });

            if (!lastQuotation || !lastQuotation.quotationId) {
                return "ICYR_CQ_0001";
            }

            const lastIdNum = parseInt(lastQuotation.quotationId.split("_")[2], 10);
            const newIdNum = lastIdNum + 1;

            return `ICYR_CQ_${newIdNum.toString().padStart(4, "0")}`;
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            // Ultimate fallback - timestamp based
            const timestamp = Date.now().toString().slice(-4);
            return `ICYR_CQ_${timestamp}`;
        }
    }
};

// Create Quotation (Step 1) with retry logic for extra safety
export const createCustomQuotation = asyncHandler(async (req, res) => {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            const quotationId = await generateQuotationId();

            const quotation = await CustomQuotation.create({
                ...req.body,
                quotationId,
            });

            return res
                .status(201)
                .json(new ApiResponse(201, quotation, "Quotation created successfully"));

        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.quotationId) {
                // Duplicate key error, retry with new ID
                retries++;
                console.warn(`Duplicate quotationId detected, retry ${retries}/${maxRetries}`);

                if (retries === maxRetries) {
                    throw new ApiError(500, "Failed to create quotation after multiple attempts. Please try again.");
                }
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 100 * retries));
            } else {
                // Some other error, throw it
                throw error;
            }
        }
    }
});

// Get All Quotations
export const getAllCustomQuotations = asyncHandler(async (req, res) => {
    const quotations = await CustomQuotation.find();

    return res
        .status(200)
        .json(new ApiResponse(200, quotations, "Quotations fetched successfully"));
});

// Get Single Quotation by quotationId
export const getCustomQuotationById = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const quotation = await CustomQuotation.findOne({ quotationId });
    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation fetched successfully"));
});

// Update Full Quotation (Mongo _id)
export const updateCustomQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const updatedQuotation = await CustomQuotation.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!updatedQuotation) {
        throw new ApiError(404, "Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedQuotation, "Quotation updated successfully"));
});

/** Partial update by business quotationId (e.g. ICYR_CQ_0001) — used from finalize / admin UI */
export const updateCustomQuotationByQuotationId = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const updatedQuotation = await CustomQuotation.findOneAndUpdate(
        { quotationId },
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!updatedQuotation) {
        throw new ApiError(404, "Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedQuotation, "Quotation updated successfully"));
});

// Step-wise Update
// Step-wise Update
export const updateQuotationStep = asyncHandler(async (req, res) => {
    console.log("🔄 ========== UPDATE STEP REQUEST START ==========");

    let quotationId, stepNumber, stepData;
    const files = req.files || {};

    console.log("📦 Request body keys:", Object.keys(req.body));
    console.log("📸 Files received:", Object.keys(files));

    // Parse FormData correctly
    if (req.body.quotationId && req.body.stepNumber && req.body.stepData) {
        quotationId = req.body.quotationId;
        stepNumber = parseInt(req.body.stepNumber, 10);
        stepData =
            typeof req.body.stepData === "string"
                ? JSON.parse(req.body.stepData)
                : req.body.stepData;
    } else {
        ({ quotationId, stepNumber, stepData } = req.body);
    }

    if (!quotationId) throw new ApiError(400, "Quotation ID is required");
    if (!stepNumber || isNaN(stepNumber))
        throw new ApiError(400, "Valid step number is required");

    console.log("🔍 Searching for quotation:", quotationId);
    const quotation = await CustomQuotation.findOne({ quotationId });
    if (!quotation) throw new ApiError(404, `Quotation not found: ${quotationId}`);

    console.log("✅ Found Quotation:", quotation.quotationId);
    console.log("📝 Processing Step:", stepNumber);

    try {
        // ✅ STEP 3 - Tour Details (with Banner Image)
        if (stepNumber === 3) {
            console.log("🖼 Step 3 - Updating Tour Details + Banner Image");

            let bannerUrl = quotation.tourDetails?.bannerImage || null;

            // Upload new banner if provided
            if (files.bannerImage?.[0]) {
                const uploaded = await uploadOnCloudinary(files.bannerImage[0].path);
                if (uploaded?.url) bannerUrl = uploaded.url;
            }

            // 🔥 Update ONLY Step 3 fields
            const fieldsToUpdate = {
                arrivalCity: stepData.arrivalCity,
                departureCity: stepData.departureCity,
                arrivalDate: stepData.arrivalDate,
                departureDate: stepData.departureDate,
                quotationTitle: stepData.quotationTitle,
                notes: stepData.notes,
                transport: stepData.transport,
                validFrom: stepData.validFrom,
                validTill: stepData.validTill,
                bannerImage: bannerUrl
            };

            // 🔥 Update only provided keys
            Object.keys(fieldsToUpdate).forEach(key => {
                if (fieldsToUpdate[key] !== undefined) {
                    quotation.tourDetails[key] = fieldsToUpdate[key];
                }
            });

            console.log("✅ Step 3 updated without overwriting nested objects");
        }



        // ✅ STEP 4 - Itinerary with Multiple Images
        else if (stepNumber === 4) {
            console.log("🗓 Step 4 - Updating Itinerary Days + Images");

            const processedItinerary = [...(stepData.itinerary || [])];

            // FIX: Collect all itineraryImages files correctly
            const itineraryFiles = Array.isArray(files.itineraryImages)
                ? files.itineraryImages
                : Object.values(files).filter((f) => f.fieldname === "itineraryImages");

            console.log("📸 Total itineraryImages received:", itineraryFiles.length);

            const isNoopItineraryFile = (f) =>
                !f ||
                !f.size ||
                (f.originalname && String(f.originalname).includes("itinerary-noop"));

            for (let i = 0; i < processedItinerary.length; i++) {
                const file = itineraryFiles[i];

                if (isNoopItineraryFile(file)) {
                    continue;
                }

                console.log(`☁️ Uploading image for day ${i + 1}:`, file.originalname);
                const uploaded = await uploadOnCloudinary(file.path);

                if (uploaded?.url) {
                    processedItinerary[i].image = uploaded.url;
                }
            }

            quotation.tourDetails.itinerary = processedItinerary;
        }


        // ✅ STEP 1, 2, 5, 6 - Standard updates
        else if ([1, 2, 5, 6].includes(stepNumber)) {
            switch (stepNumber) {
                case 1:
                    quotation.clientDetails = stepData;
                    break;

                case 2:
                    quotation.pickupDrop = stepData;
                    break;

                case 5:
                    console.log("🚗 STEP 5 RECEIVED DATA:", stepData);

                    quotation.tourDetails.vehicleDetails = {
                        basicsDetails: {
                            ...(quotation.tourDetails.vehicleDetails?.basicsDetails || {}),
                            clientName: stepData.basicsDetails?.clientName,
                            vehicleType: stepData.basicsDetails?.vehicleType,
                            tripType: stepData.basicsDetails?.tripType,
                            noOfDays: stepData.basicsDetails?.noOfDays,
                            perDayCost: stepData.basicsDetails?.perDayCost,
                        },

                        costDetails: {
                            ...(quotation.tourDetails.vehicleDetails?.costDetails || {}),
                            totalCost: stepData.costDetails?.totalCost,
                            perDayCost: stepData.costDetails?.perDayCost,
                            ratePerKm: stepData.costDetails?.ratePerKm,
                            kmPerDay: stepData.costDetails?.kmPerDay,
                            driverAllowance: stepData.costDetails?.driverAllowance,
                            tollParking: stepData.costDetails?.tollParking,
                        },

                        pickupDropDetails: {
                            ...(quotation.tourDetails.vehicleDetails?.pickupDropDetails || {}),
                            pickupDate: stepData.pickupDropDetails?.pickupDate,
                            pickupTime: stepData.pickupDropDetails?.pickupTime,
                            pickupLocation: stepData.pickupDropDetails?.pickupLocation,
                            dropDate: stepData.pickupDropDetails?.dropDate,
                            dropTime: stepData.pickupDropDetails?.dropTime,
                            dropLocation: stepData.pickupDropDetails?.dropLocation,
                        },
                    };
                    break;

                case 6:
                    console.log("🧾 Step 6 - Final Quotation Merge");

                    if (stepData.clientDetails)
                        quotation.clientDetails = {
                            ...quotation.clientDetails,
                            ...stepData.clientDetails,
                        };

                    if (stepData.pickupDrop && Array.isArray(stepData.pickupDrop))
                        quotation.pickupDrop = stepData.pickupDrop;

                    if (stepData.tourDetails) {
                        quotation.tourDetails = {
                            ...quotation.tourDetails,
                            ...stepData.tourDetails,
                        };

                        if (stepData.tourDetails.quotationDetails) {
                            quotation.tourDetails.quotationDetails = {
                                ...quotation.tourDetails.quotationDetails,
                                ...stepData.tourDetails.quotationDetails,
                            };

                            // ✅ Handle packageCalculations merge specifically
                            if (stepData.tourDetails.quotationDetails.packageCalculations) {
                                quotation.tourDetails.quotationDetails.packageCalculations = {
                                    // Keep existing package calculations if they exist
                                    ...quotation.tourDetails.quotationDetails.packageCalculations,
                                    // Merge with new package calculations
                                    ...stepData.tourDetails.quotationDetails.packageCalculations,

                                    // Ensure all package types are properly merged
                                    standard: {
                                        ...(quotation.tourDetails.quotationDetails.packageCalculations?.standard || {}),
                                        ...(stepData.tourDetails.quotationDetails.packageCalculations?.standard || {})
                                    },
                                    deluxe: {
                                        ...(quotation.tourDetails.quotationDetails.packageCalculations?.deluxe || {}),
                                        ...(stepData.tourDetails.quotationDetails.packageCalculations?.deluxe || {})
                                    },
                                    superior: {
                                        ...(quotation.tourDetails.quotationDetails.packageCalculations?.superior || {}),
                                        ...(stepData.tourDetails.quotationDetails.packageCalculations?.superior || {})
                                    }
                                };
                            }
                        }
                    }

                    if (stepData.vehicleDetails)
                        quotation.tourDetails.vehicleDetails = {
                            ...quotation.tourDetails.vehicleDetails,
                            ...stepData.vehicleDetails,
                        };

                    break;
            }
        }
        // ✅ Handle invalid step numbers
        else {
            throw new ApiError(400, `Invalid step number: ${stepNumber}`);
        }

        await quotation.save();
        console.log("✅ Step", stepNumber, "updated successfully!");

        return res
            .status(200)
            .json(new ApiResponse(200, quotation, `Step ${stepNumber} updated successfully`));
    } catch (error) {
        console.error("💥 Error during quotation update:", error);
        throw error;
    }
});

const FINAL_PACKAGES = ["Standard", "Deluxe", "Superior"];

export const finalizeCustomQuotation = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { finalizedPackage } = req.body || {};

    if (!FINAL_PACKAGES.includes(finalizedPackage)) {
        throw new ApiError(400, "finalizedPackage must be Standard, Deluxe, or Superior");
    }

    const quotation = await CustomQuotation.findOne({ quotationId });
    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }

    quotation.finalizeStatus = "finalized";
    quotation.finalizedPackage = finalizedPackage;
    quotation.finalizedAt = new Date();
    await quotation.save();

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation finalized successfully"));
});

// Delete Quotation
export const deleteCustomQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedQuotation = await CustomQuotation.findByIdAndDelete(id);
    if (!deletedQuotation) {
        throw new ApiError(404, "Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedQuotation, "Quotation deleted successfully"));
});

// Optional: Reset counter (for testing purposes)
export const resetQuotationCounter = asyncHandler(async (req, res) => {
    await Counter.findOneAndUpdate(
        { name: "customQuotation" },
        { sequence: 0 },
        { upsert: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Quotation counter reset successfully"));
});

// Update package calculations + optional company margin / discount (finalize costing edit)
export const updatePackageCalculations = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { packageCalculations, companyMargin, discount, taxes } = req.body;

    const hasPkg =
        packageCalculations &&
        typeof packageCalculations === "object" &&
        Object.keys(packageCalculations).length > 0;
    const hasMargin =
        companyMargin && typeof companyMargin === "object";
    const hasDiscount = discount !== undefined && discount !== null;
    const hasTaxes = taxes && typeof taxes === "object";

    if (!hasPkg && !hasMargin && !hasDiscount && !hasTaxes) {
        throw new ApiError(
            400,
            "Provide packageCalculations, companyMargin, discount, and/or taxes"
        );
    }

    const quotation = await CustomQuotation.findOne({ quotationId });
    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }

    if (!quotation.tourDetails.quotationDetails) {
        quotation.tourDetails.quotationDetails = {};
    }

    if (hasPkg) {
        quotation.tourDetails.quotationDetails.packageCalculations = {
            ...quotation.tourDetails.quotationDetails.packageCalculations,
            ...packageCalculations,
            standard: {
                ...(quotation.tourDetails.quotationDetails.packageCalculations
                    ?.standard || {}),
                ...(packageCalculations.standard || {}),
            },
            deluxe: {
                ...(quotation.tourDetails.quotationDetails.packageCalculations
                    ?.deluxe || {}),
                ...(packageCalculations.deluxe || {}),
            },
            superior: {
                ...(quotation.tourDetails.quotationDetails.packageCalculations
                    ?.superior || {}),
                ...(packageCalculations.superior || {}),
            },
        };
    }

    if (hasMargin) {
        quotation.tourDetails.quotationDetails.companyMargin = {
            ...(quotation.tourDetails.quotationDetails.companyMargin || {}),
            ...companyMargin,
        };
    }

    if (hasDiscount) {
        quotation.tourDetails.quotationDetails.discount = Number(discount) || 0;
    }

    if (hasTaxes) {
        quotation.tourDetails.quotationDetails.taxes = {
            ...(quotation.tourDetails.quotationDetails.taxes || {}),
            ...taxes,
        };
    }

    await quotation.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                quotation,
                "Package calculations updated successfully"
            )
        );
});