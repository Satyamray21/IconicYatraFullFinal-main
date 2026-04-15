import Package from "../models/package.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ----------------------
// Improved Helpers
// ----------------------
// ----------------------
// Improved Helpers
// ----------------------
function calculateStatus(validFrom, validTill, isNewPackage = false) {
    const now = new Date();
    
    // Reset time part for accurate date comparison
    now.setHours(0, 0, 0, 0);

    // For new packages being created, if no validFrom is provided, set it to active
    if (isNewPackage && !validFrom && !validTill) {
        return "active";
    }

    // If both dates are provided
    if (validFrom && validTill) {
        const fromDate = new Date(validFrom);
        const tillDate = new Date(validTill);
        
        // Reset time for both dates
        fromDate.setHours(0, 0, 0, 0);
        tillDate.setHours(0, 0, 0, 0);
        
        return now >= fromDate && now <= tillDate ? "active" : "deactive";
    }

    // If only validFrom is provided
    if (validFrom) {
        const fromDate = new Date(validFrom);
        fromDate.setHours(0, 0, 0, 0);
        return now >= fromDate ? "active" : "deactive";
    }

    // If only validTill is provided
    if (validTill) {
        const tillDate = new Date(validTill);
        tillDate.setHours(0, 0, 0, 0);
        return now <= tillDate ? "active" : "deactive";
    }

    // If no dates provided, default to active for new packages
    return isNewPackage ? "active" : "deactive";
}

// ✅ UPDATED: Tour Type Validation Helper
function validateTourType(tourType) {
    const validTourTypes = ["Domestic", "International"];
    return validTourTypes.includes(tourType) ? tourType : "Domestic";
}
function validatePackageCategory(category) {
    const valid = ["Spiritual", "Holiday", "Latest", "Yatra", "Special"];
    return valid.includes(category) ? category : "Holiday";
}


// ----------------------
// Enhanced Normalize helpers
// ----------------------
function normalizeDays(days) {
    if (!Array.isArray(days) || days.length === 0) {
        return [{
            title: "",
            notes: "",
            aboutCity: "",
            dayImage: "",
            sightseeing: [],
            selectedSightseeing: []
        }];
    }

    return days.map(day => ({
        title: day.title?.trim() || "",
        notes: day.notes?.trim() || "",
        aboutCity: day.aboutCity?.trim() || "",
        dayImage: day.dayImage || "",
        sightseeing: Array.isArray(day.sightseeing) ? day.sightseeing : [],
        selectedSightseeing: Array.isArray(day.selectedSightseeing) ? day.selectedSightseeing : []
    }));
}

function normalizeMealPlan(mealPlan) {
    if (!mealPlan || typeof mealPlan !== 'object') {
        return {
            planType: "CP",
            description: "",
        };
    }

    return {
        planType: ["AP", "CP", "EP", "MAP"].includes(mealPlan.planType) ? mealPlan.planType : "CP",
        description: mealPlan.description?.trim() || "",
    };
}

function normalizeDestinationNights(destNights) {
    if (!Array.isArray(destNights)) return [];

    return destNights.map(d => ({
        destination: d.destination?.trim() || "",
        nights: Math.max(1, Number(d.nights) || 1),
        hotels: Array.isArray(d.hotels) ? d.hotels.map(h => ({
            category: ["standard", "deluxe", "superior"].includes(h.category) ? h.category : "standard",
            hotelName: h.hotelName?.trim() || "TBD",
            pricePerPerson: Math.max(0, Number(h.pricePerPerson) || 0),
        })) : []
    }));
}

function normalizePricing(data) {
    const destinationNights = Array.isArray(data.destinationNights) ? data.destinationNights : [];
    const numberOfRooms = Math.max(1, Number(data.numberOfRooms) || 1);
    const transportationCostPerDay = Math.max(0, Number(data.transportationCostPerDay) || 0);
    const transportationDays = Math.max(0, Number(data.transportationDays) || 0);

    const categoryTotals = destinationNights.reduce((acc, dest) => {
        const nights = Math.max(0, Number(dest?.nights) || 0);
        const hotels = Array.isArray(dest?.hotels) ? dest.hotels : [];

        const standardRate = Math.max(
            0,
            Number(hotels.find((hotel) => hotel?.category === "standard")?.pricePerPerson) || 0
        );
        const deluxeRate = Math.max(
            0,
            Number(hotels.find((hotel) => hotel?.category === "deluxe")?.pricePerPerson) || 0
        );
        const superiorRate = Math.max(
            0,
            Number(hotels.find((hotel) => hotel?.category === "superior")?.pricePerPerson) || 0
        );

        acc.standardHotelTotalCost += (nights * standardRate * numberOfRooms);
        acc.deluxeHotelTotalCost += (nights * deluxeRate * numberOfRooms);
        acc.superiorHotelTotalCost += (nights * superiorRate * numberOfRooms);

        return acc;
    }, {
        standardHotelTotalCost: 0,
        deluxeHotelTotalCost: 0,
        superiorHotelTotalCost: 0,
    });

    const hotelTotalCost = destinationNights.reduce((destTotal, dest) => {
        const nights = Math.max(0, Number(dest?.nights) || 0);
        const hotelRatePerNight = (Array.isArray(dest?.hotels) ? dest.hotels : []).reduce(
            (rateTotal, hotel) => rateTotal + Math.max(0, Number(hotel?.pricePerPerson) || 0),
            0
        );
        return destTotal + (nights * hotelRatePerNight * numberOfRooms);
    }, 0);

    const transportationTotalCost = transportationCostPerDay * transportationDays;
    const calculatedTotalCost = hotelTotalCost + transportationTotalCost;
    const hasManualTotalCost =
        data.manualTotalCost !== null &&
        data.manualTotalCost !== undefined &&
        data.manualTotalCost !== "";
    const manualTotalCost = hasManualTotalCost
        ? Math.max(0, Number(data.manualTotalCost) || 0)
        : null;

    const finalStandardCost = categoryTotals.standardHotelTotalCost + transportationTotalCost;
    const finalDeluxeCost = categoryTotals.deluxeHotelTotalCost + transportationTotalCost;
    const finalSuperiorCost = categoryTotals.superiorHotelTotalCost + transportationTotalCost;

    data.numberOfRooms = numberOfRooms;
    data.transportationCostPerDay = transportationCostPerDay;
    data.transportationDays = transportationDays;
    data.transportationTotalCost = transportationTotalCost;
    data.hotelTotalCost = hotelTotalCost;
    data.standardHotelTotalCost = categoryTotals.standardHotelTotalCost;
    data.deluxeHotelTotalCost = categoryTotals.deluxeHotelTotalCost;
    data.superiorHotelTotalCost = categoryTotals.superiorHotelTotalCost;
    data.calculatedTotalCost = calculatedTotalCost;
    data.finalStandardCost = finalStandardCost;
    data.finalDeluxeCost = finalDeluxeCost;
    data.finalSuperiorCost = finalSuperiorCost;
    data.manualTotalCost = manualTotalCost;
    data.totalCost = manualTotalCost !== null ? manualTotalCost : calculatedTotalCost;

    return data;
}

// ✅ IMPROVED: Policy Normalization with validation
function normalizePolicy(policy) {
    if (!policy || typeof policy !== 'object') {
        return {
            inclusionPolicy: [],
            exclusionPolicy: [],
            paymentPolicy: [],
            cancellationPolicy: [],
            termsAndConditions: []
        };
    }

    // Helper function to normalize policy arrays
    const normalizePolicyArray = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr
            .filter(item => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.trim());
    };

    return {
        inclusionPolicy: normalizePolicyArray(policy.inclusionPolicy),
        exclusionPolicy: normalizePolicyArray(policy.exclusionPolicy),
        paymentPolicy: normalizePolicyArray(policy.paymentPolicy),
        cancellationPolicy: normalizePolicyArray(policy.cancellationPolicy),
        termsAndConditions: normalizePolicyArray(policy.termsAndConditions),
    };
}

// ✅ NEW: Date normalization helper
// ✅ FIXED: Date normalization helper
// ✅ FIXED: Date normalization helper
function normalizeDates(data) {
    if (data.validFrom) {
        // Ensure we're working with a Date object and set to start of day
        const fromDate = new Date(data.validFrom);
        fromDate.setHours(0, 0, 0, 0);
        data.validFrom = fromDate;
    }

    if (data.validTill) {
        // Ensure we're working with a Date object and set to end of day
        const tillDate = new Date(data.validTill);
        tillDate.setHours(23, 59, 59, 999);
        data.validTill = tillDate;
        
        // Ensure validTill is after validFrom
        if (data.validFrom && tillDate <= data.validFrom) {
            // Add one day to validFrom
            const nextDay = new Date(data.validFrom);
            nextDay.setDate(nextDay.getDate() + 1);
            nextDay.setHours(23, 59, 59, 999);
            data.validTill = nextDay;
        }
    }

    return data;
}


// ✅ UPDATED: URL normalization helper for Cloudinary
function normalizePackageUrls(packageData) {
    const result = { ...packageData };

    // For Cloudinary - URLs are already absolute, no need to modify
    // Just ensure default image if not present
    if (!result.bannerImage) {
        result.bannerImage = "https://res.cloudinary.com/dyfg3qorw/image/upload/v1/default-banner.jpg";
    }

    // Normalize days with Cloudinary URLs
    result.days = normalizeDays(result.days).map(day => ({
        ...day,
        dayImage: day.dayImage || "https://res.cloudinary.com/dyfg3qorw/image/upload/v1/default-day.jpg"
    }));

    return result;
}

// ----------------------
// CREATE PACKAGE (UPDATED FOR NEW TOUR TYPES)
// ----------------------
export const createPackage = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    // -----------------------------------
    // ✅ PARSE JSON FIELDS (multipart fix)
    // -----------------------------------
    try {
        if (typeof data.days === "string") {
            data.days = JSON.parse(data.days);
        }

        if (typeof data.destinationNights === "string") {
            data.destinationNights = JSON.parse(data.destinationNights);
        }

        if (typeof data.policy === "string") {
            data.policy = JSON.parse(data.policy);
        }

        if (typeof data.mealPlan === "string") {
            data.mealPlan = JSON.parse(data.mealPlan);
        }

        if (typeof data.packageSubType === "string") {
            data.packageSubType = JSON.parse(data.packageSubType);
        }
    } catch (err) {
        return res.status(400).json({
            message: "Invalid JSON format in request body"
        });
    }

    // -----------------------------------
    // ✅ REQUIRED FIELD VALIDATION
    // -----------------------------------
    if (!data.sector?.trim()) {
        return res.status(400).json({ message: "sector is required" });
    }

    if (!Array.isArray(data.packageSubType) || data.packageSubType.length === 0) {
        return res.status(400).json({ message: "packageSubType is required" });
    }

    if (!data.tourType) {
        return res.status(400).json({ message: "tourType is required" });
    }

    // -----------------------------------
    // ✅ VALIDATE TOUR TYPE (ONLY 2)
    // -----------------------------------
    const validTourTypes = ["Domestic", "International"];
    if (!validTourTypes.includes(data.tourType)) {
        return res.status(400).json({
            message: "tourType must be Domestic or International"
        });
    }

    // -----------------------------------
    // ✅ VALIDATE PACKAGE CATEGORY
    // -----------------------------------
    const validCategories = ["Spiritual", "Holiday", "Latest", "Yatra", "Special"];
    if (data.packageCategory && !validCategories.includes(data.packageCategory)) {
        data.packageCategory = "Holiday";
    }

    // -----------------------------------
    // ✅ HANDLE FILE UPLOADS
    // -----------------------------------
    if (req.files?.images) {
        const uploadedImages = [];

        for (const file of req.files.images) {
            const uploadResult = await uploadOnCloudinary(file.path);
            if (uploadResult) {
                uploadedImages.push({
                    url: uploadResult.secure_url,
                    publicId: uploadResult.public_id
                });
            }
        }

        if (uploadedImages.length > 0) {
            data.images = uploadedImages;

            if (!data.thumbnail && uploadedImages[0]) {
                data.thumbnail = uploadedImages[0].url;
                data.thumbnailPublicId = uploadedImages[0].publicId;
            }
        }
    }

    if (req.files?.thumbnail) {
        const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
        if (thumbnailUpload) {
            data.thumbnail = thumbnailUpload.secure_url;
            data.thumbnailPublicId = thumbnailUpload.public_id;
        }
    }

    if (req.files?.banner) {
        const bannerUpload = await uploadOnCloudinary(req.files.banner[0].path);
        if (bannerUpload) {
            data.bannerImage = bannerUpload.secure_url;
            data.bannerPublicId = bannerUpload.public_id;
        }
    }

    // -----------------------------------
    // ✅ NORMALIZE DATA
    // -----------------------------------
    data.days = normalizeDays(data.days);
    data.mealPlan = normalizeMealPlan(data.mealPlan);
    data.destinationNights = normalizeDestinationNights(data.destinationNights);
    data.policy = normalizePolicy(data.policy);
    normalizePricing(data);

    // -----------------------------------
    // ✅ DATE NORMALIZATION
    // -----------------------------------
    normalizeDates(data);

    // -----------------------------------
    // ✅ COUNTRY LOGIC
    // -----------------------------------
    if (data.tourType === "International") {
        if (!data.destinationCountry?.trim()) {
            return res.status(400).json({
                message: "destinationCountry is required for International tours"
            });
        }
    } else {
        data.destinationCountry = "India";
    }

    // -----------------------------------
    // ✅ STATUS CALCULATION
    // -----------------------------------
    data.status = calculateStatus(data.validFrom, data.validTill, true);

    // -----------------------------------
    // ✅ CREATE PACKAGE
    // -----------------------------------
    try {
        const doc = await Package.create(data);
        const responseData = normalizePackageUrls(doc.toObject());

        return res.status(201).json({
            message: "Package created successfully",
            package: responseData
        });
    } catch (err) {
        return res.status(400).json({
            message: "Validation failed",
            error: err.message
        });
    }
});


// ----------------------
// UPDATE STEP 1 (UPDATED FOR NEW TOUR TYPES)
// ----------------------
export const updateStep1 = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };

    // ✅ VALIDATE TOUR TYPE
    if (data.tourType) {
        data.tourType = validateTourType(data.tourType);
    }

    // Handle file uploads for update
    if (req.files) {
        // Handle banner update
        if (req.files.banner) {
            const bannerUpload = await uploadOnCloudinary(req.files.banner[0].path);
            if (bannerUpload) {
                data.bannerImage = bannerUpload.secure_url;
                data.bannerPublicId = bannerUpload.public_id;
            }
        }

        // Handle thumbnail update
        if (req.files.thumbnail) {
            const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
            if (thumbnailUpload) {
                data.thumbnail = thumbnailUpload.secure_url;
                data.thumbnailPublicId = thumbnailUpload.public_id;
            }
        }

        // Handle images update
        if (req.files.images) {
            const uploadedImages = [];
            for (const file of req.files.images) {
                const uploadResult = await uploadOnCloudinary(file.path);
                if (uploadResult) {
                    uploadedImages.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id
                    });
                }
            }
            if (uploadedImages.length > 0) {
                data.images = uploadedImages;
            }
        }
    }

    // ✅ UPDATED: Validation for International packages
    if (data.tourType === "International" && !data.destinationCountry?.trim()) {
        return res.status(400).json({
            message: "destinationCountry is required for International tours"
        });
    }
     if (data.perPerson !== undefined) {
        data.perPerson = parseInt(data.perPerson) || 1;
    }
    // Normalize data
    data.mealPlan = normalizeMealPlan(data.mealPlan);
    data.destinationNights = normalizeDestinationNights(data.destinationNights);
    data.policy = normalizePolicy(data.policy);
    normalizePricing(data);

    // Normalize dates and calculate status
    normalizeDates(data);
    data.status = calculateStatus(data.validFrom, data.validTill);

    // ✅ UPDATED: Auto-set India for Domestic, Yatra, Holiday, Special, Latest tours
    if (data.tourType && ["Domestic", "Yatra", "Holiday", "Special", "Latest"].includes(data.tourType)) {
        data.destinationCountry = "India";
    }

    const updated = await Package.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    if (!updated) {
        return res.status(404).json({ message: "Package not found" });
    }

    const responseData = normalizePackageUrls(updated.toObject());
    res.json(responseData);
});

// ----------------------
// UPDATE STEP 2 (UPDATED)
// ----------------------
export const updateTourDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };

    if (!Array.isArray(data.days)) {
        return res.status(400).json({
            message: "days field is required and must be an array"
        });
    }

    data.days = normalizeDays(data.days);

    const existing = await Package.findById(id);
    if (!existing) {
        return res.status(404).json({ message: "Package not found" });
    }

    if (data.destinationNights !== undefined) {
        data.destinationNights = normalizeDestinationNights(data.destinationNights);
    } else {
        data.destinationNights = existing.destinationNights || [];
    }
    normalizePricing(data);

    // Recalculate status based on existing dates
    data.status = calculateStatus(existing.validFrom, existing.validTill);

    const updated = await Package.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    const responseData = normalizePackageUrls(updated.toObject());
    res.json(responseData);
});

// ----------------------
// UPLOAD BANNER (UPDATED)
// ----------------------
export const uploadBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No banner file uploaded" });

    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
        return res.status(500).json({ message: "Failed to upload banner to Cloudinary" });
    }

    const updated = await Package.findByIdAndUpdate(
        id,
        {
            bannerImage: uploadResult.secure_url,
            bannerPublicId: uploadResult.public_id
        },
        { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Package not found" });

    const packageData = updated.toObject();
    res.json({
        message: "Banner uploaded successfully",
        package: packageData
    });
});

// ----------------------
// UPLOAD DAY IMAGE (UPDATED)
// ----------------------
export const uploadDayImage = asyncHandler(async (req, res) => {
    const { id, dayIndex } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: "No dayImage file uploaded" });
    }

    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
        return res.status(500).json({ message: "Failed to upload day image to Cloudinary" });
    }

    const pkg = await Package.findById(id);
    if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
    }

    const idx = Number(dayIndex);
    if (isNaN(idx) || idx < 0) {
        return res.status(400).json({ message: "Invalid dayIndex" });
    }

    // Ensure days array exists and has enough entries
    if (!Array.isArray(pkg.days)) pkg.days = [];
    while (pkg.days.length <= idx) {
        pkg.days.push({
            title: "",
            notes: "",
            aboutCity: "",
            dayImage: "",
            sightseeing: [],
            selectedSightseeing: []
        });
    }

    // ✅ Save Cloudinary URL in DB
    pkg.days[idx].dayImage = uploadResult.secure_url;
    pkg.days[idx].dayImagePublicId = uploadResult.public_id;
    await pkg.save();

    const packageData = pkg.toObject();
    res.json({
        message: "Day image uploaded successfully",
        package: packageData
    });
});

// ----------------------
// GET BY ID (IMPROVED)
// ----------------------
export const getById = asyncHandler(async (req, res) => {
    const doc = await Package.findById(req.params.id);
    if (!doc) {
        return res.status(404).json({ message: "Package not found" });
    }

    const packageData = doc.toObject();
    packageData.status = calculateStatus(packageData.validFrom, packageData.validTill);

    const responseData = normalizePackageUrls(packageData);
    res.json(responseData);
});

// ----------------------
// LIST PACKAGES (UPDATED FOR NEW TOUR TYPES)
// ----------------------
export const listPackages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, tourType, search, status } = req.query;
    const query = {};

    // ✅ UPDATED: Build query with new tour types
    if (tourType) {
        query.tourType = validateTourType(tourType);
    }
    if (status) query.status = status;
    if (search?.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        query.$or = [
            { sector: searchRegex },
            { title: searchRegex },
            { "stayLocations.city": searchRegex },
            { "destinationNights.destination": searchRegex },
            { "destinationNights.hotels.hotelName": searchRegex }
        ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Prevent excessive limits

    const [items, total] = await Promise.all([
        Package.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Package.countDocuments(query)
    ]);

    const responseItems = items.map(doc => {
        const packageData = doc.toObject();
        packageData.status = calculateStatus(packageData.validFrom, packageData.validTill);
        return normalizePackageUrls(packageData);
    });

    res.json({
        items: responseItems,
        total,
        page: Number(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
    });
});

// ----------------------
// GET PACKAGES BY TOUR TYPE (NEW FUNCTION)
// ----------------------
export const getPackagesByTourType = async (req, res) => {
  try {
    const { tourType } = req.params;
    const { page = 1, limit = 9, status = "active" } = req.query; // Default to active only

    const formattedTourType =
      tourType.toLowerCase() === "domestic"
        ? "Domestic"
        : "International";

    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {
      tourType: formattedTourType
    };
    
    // Add status filter if provided (defaults to "active")
    if (status) {
      filter.status = status;
    }

    const packages = await Package.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPackages = await Package.countDocuments(filter);

    res.json({
      packages,
      totalPackages,
      totalPages: Math.ceil(totalPackages / limit),
      currentPage: Number(page),
      filters: {
        tourType: formattedTourType,
        status: status || "all"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





export const getPackagesByCategory = async (req, res) => {
  try {
    const { packageCategory } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status = "active" } = req.query; // Default to active only

    const skip = (page - 1) * limit;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Build filter object
    const filter = {
      packageCategory: { $regex: `^${packageCategory}$`, $options: "i" }
    };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // For active packages, also check dates (optional - depending on your business logic)
    if (status === "active") {
      filter.validFrom = { $lte: now };
      filter.validTill = { $gte: now };
    }

    const totalPackages = await Package.countDocuments(filter);

    const packages = await Package.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalPackages,
      currentPage: page,
      totalPages: Math.ceil(totalPackages / limit),
      filters: {
        packageCategory,
        status: status || "all"
      },
      packages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




// ----------------------
// DELETE
// ----------------------
export const remove = asyncHandler(async (req, res) => {
    const doc = await Package.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Package not found" });

    res.json({ message: "Deleted", id: doc._id });
});

// ----------------------
// GET POPULAR TOURS
// ----------------------
export const getPopularTours = asyncHandler(async (req, res) => {
    const { page = 1, limit = 8 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {
        status: "active"
    };

    const aggregation = [
        { $match: matchStage },

        // ✅ 1st sort (important for picking latest in group)
        { $sort: { createdAt: -1 } },

        {
            $addFields: {
                groupKey: {
                    $cond: [
                        { $eq: ["$tourType", "Domestic"] },
                        "$sector",
                        "$destinationCountry"
                    ]
                }
            }
        },

        {
            $group: {
                _id: "$groupKey",
                doc: { $first: "$$ROOT" }
            }
        },

        { $replaceRoot: { newRoot: "$doc" } },

        // ✅ 2nd sort (VERY IMPORTANT 🔥)
        { $sort: { createdAt: -1 } },

        { $skip: skip },
        { $limit: limitNum },

        {
            $project: {
                _id: 1,
                sector: 1,
                destinationCountry: 1,
                tourType: 1,
                createdAt: 1 // optional (good for debugging)
            }
        }
    ];

    const items = await Package.aggregate(aggregation);

    const totalAgg = await Package.aggregate([
        { $match: matchStage },
        {
            $addFields: {
                groupKey: {
                    $cond: [
                        { $eq: ["$tourType", "Domestic"] },
                        "$sector",
                        "$destinationCountry"
                    ]
                }
            }
        },
        {
            $group: { _id: "$groupKey" }
        },
        { $count: "total" }
    ]);

    const total = totalAgg[0]?.total || 0;

    res.json({
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
    });
});





export const makeAllPopular = asyncHandler(async (req, res) => {
    const result = await Package.updateMany(
        {},
        { $set: { isPopular: true } }
    );

    res.json({
        message: "All packages marked as popular",
        modifiedCount: result.modifiedCount
    });
});

