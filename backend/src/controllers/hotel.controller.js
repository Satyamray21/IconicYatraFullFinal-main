import Hotel from "../models/hotel.model.js";
import { findHotelByIdOrHotelId } from "../utils/findHotelById.js";

// Helper: parse JSON safely
const tryParseJSON = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

// Helper: Parse all body fields - UPDATE THIS FUNCTION
const parseBodyFields = (bodyData) => {
    const jsonFields = [
        'contactDetails', 'location', 'socialMedia', 'facilities',
        'hotelType', 'rooms', 'tempRoomDetails', 'tempMattressCost', 'tempPeakCost'
    ];

    jsonFields.forEach(field => {
        if (typeof bodyData[field] === 'string') {
            try {
                bodyData[field] = JSON.parse(bodyData[field]);
            } catch (error) {
                console.warn(`Failed to parse ${field}:`, bodyData[field]);
                // Agar parse fail ho to original value hi rakho
            }
        }
    });
    return bodyData;
};

// Helper: Handle room images properly - UPDATE THIS FUNCTION
const handleRoomImages = (bodyData, roomImages) => {
    if (!roomImages || !bodyData.tempRoomDetails || !Array.isArray(bodyData.tempRoomDetails)) {
        return;
    }

    let imageIndex = 0;

    bodyData.tempRoomDetails.forEach((season) => {
        if (season.roomDetails && Array.isArray(season.roomDetails)) {
            season.roomDetails.forEach((roomDetail) => {
                if (imageIndex < roomImages.length) {
                    roomDetail.images = [`/upload/${roomImages[imageIndex].filename}`];
                    imageIndex++;
                } else {
                    roomDetail.images = [];
                }
            });
        }
    });
};

// ----------------------
// Step 1: Create Hotel (Basic Details) - IMPROVED
// ----------------------
export const createHotelStep1 = async (req, res) => {
    try {
        let bodyData = parseBodyFields(req.body);

        if (!bodyData.hotelName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Hotel name is required"
            });
        }

        // ✅ PROPERLY STRUCTURE THE DATA ACCORDING TO SCHEMA
        const hotelData = {
            hotelName: bodyData.hotelName,
            hotelType: bodyData.hotelType,

            // ✅ Contact Details - PROPERLY STRUCTURE
            contactDetails: {
                email: bodyData.email,
                mobile: bodyData.mobile,
                alternateContact: bodyData.alternateContact,
                designation: bodyData.designation,
                contactPerson: bodyData.contactPerson,
            },

            description: bodyData.description,
            cancellationPolicy: bodyData.cancellationPolicy,
            facilities: bodyData.facilities,

            // ✅ Location - PROPERLY STRUCTURE
            location: {
                country: bodyData.country || "India",
                state: bodyData.state,
                city: bodyData.city,
                address: bodyData.address,
                pincode: bodyData.pincode,
            },

            // ✅ Social Media - PROPERLY STRUCTURE
            socialMedia: {
                googleLink: bodyData.googleLink,
            },

            policy: bodyData.policy,
        };

        // Handle main image
        if (req.files?.mainImage) {
            hotelData.mainImage = `/upload/${req.files.mainImage[0].filename}`;
        }

        console.log("🔹 Creating hotel with data:", hotelData);

        const hotel = new Hotel(hotelData);
        const savedHotel = await hotel.save();

        res.status(201).json({
            success: true,
            message: "Hotel basic details saved successfully",
            data: savedHotel,
        });
    } catch (error) {
        console.error("❌ Hotel create error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ----------------------
// Step 2: Update Room Details
// ----------------------

export const updateHotelStep2 = async (req, res) => {
    try {
        console.log("🔹 Step 2 - Raw body data:", req.body);
        console.log("🔹 Step 2 - Files:", req.files);

        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        let tempRoomDetails = [];

        // ✅ Handle tempRoomDetails data
        if (req.body.tempRoomDetails) {
            try {
                // Agar string hai to parse karo, nahi to direct use karo
                if (typeof req.body.tempRoomDetails === 'string') {
                    tempRoomDetails = JSON.parse(req.body.tempRoomDetails);
                } else {
                    tempRoomDetails = req.body.tempRoomDetails;
                }

                // Ensure it's an array
                if (!Array.isArray(tempRoomDetails)) {
                    console.log("🔹 Converting to array");
                    tempRoomDetails = [tempRoomDetails];
                }

                console.log("🔹 Processed tempRoomDetails:", tempRoomDetails);
                console.log("🔹 Type:", typeof tempRoomDetails);
                console.log("🔹 Is Array:", Array.isArray(tempRoomDetails));

            } catch (parseError) {
                console.error("❌ JSON Parse Error:", parseError);
                return res.status(400).json({
                    success: false,
                    message: "Invalid room details format: " + parseError.message
                });
            }
        }

        // ✅ Handle room images
        if (req.files?.roomImages) {
            console.log("🔹 Processing room images:", req.files.roomImages.length);

            let imageIndex = 0;

            // Safely iterate through tempRoomDetails
            if (Array.isArray(tempRoomDetails)) {
                tempRoomDetails.forEach((season, seasonIndex) => {
                    console.log(`🔹 Season ${seasonIndex}:`, season);

                    if (season && typeof season === 'object' && Array.isArray(season.roomDetails)) {
                        season.roomDetails.forEach((roomDetail, roomIndex) => {
                            if (imageIndex < req.files.roomImages.length) {
                                const imageUrl = `/upload/${req.files.roomImages[imageIndex].filename}`;
                                roomDetail.images = [imageUrl];
                                console.log(`🔹 Added image to season ${seasonIndex}, room ${roomIndex}:`, imageUrl);
                                imageIndex++;
                            } else if (!roomDetail.images) {
                                roomDetail.images = [];
                            }
                        });
                    }
                });
            }
        }

        // ✅ Update hotel data
        hotel.tempRoomDetails = tempRoomDetails;

        const updatedHotel = await hotel.save();

        res.status(200).json({
            success: true,
            message: "Room details updated successfully",
            data: updatedHotel,
        });
    } catch (error) {
        console.error("❌ Error updating room details:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ----------------------
// Step 3: Update Mattress Cost
// ----------------------

export const updateHotelStep3 = async (req, res) => {
    console.log("🔹 ===== STEP 3 STARTING =====");
    console.log("🔹 Hotel ID:", req.params.id);

    // Enhanced debugging
    console.log("🔹 Request method:", req.method);
    console.log("🔹 Request headers:", req.headers);
    console.log("🔹 Request body exists:", !!req.body);
    console.log("🔹 Request body type:", typeof req.body);
    console.log("🔹 Full request body:", req.body);

    // Check if body parser is working
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log("❌ Request body is empty or not parsed");

        // Check content-type
        const contentType = req.headers['content-type'];
        console.log("🔹 Content-Type header:", contentType);

        return res.status(400).json({
            success: false,
            message: "Request body is required and must be valid JSON",
            debug: {
                contentType: contentType,
                bodyReceived: !!req.body,
                bodyKeys: req.body ? Object.keys(req.body) : 'none'
            }
        });
    }

    let hotel;

    try {
        // ✅ 1. Find hotel
        console.log("🔹 1. Finding hotel...");
        hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            console.log("❌ Hotel not found");
            return res.status(404).json({
                success: false,
                message: "Hotel not found"
            });
        }

        console.log("🔹 Hotel found:", hotel.hotelName);

        // ✅ 2. Process tempMattressCost data
        console.log("🔹 2. Processing mattress cost data...");

        if (!req.body.tempMattressCost) {
            console.log("❌ tempMattressCost missing in request body");
            console.log("🔹 Available keys in body:", Object.keys(req.body));

            return res.status(400).json({
                success: false,
                message: "tempMattressCost field is required",
                availableFields: Object.keys(req.body)
            });
        }

        let tempMattressCost = [];
        const rawData = req.body.tempMattressCost;

        console.log("🔹 Raw tempMattressCost type:", typeof rawData);
        console.log("🔹 Raw tempMattressCost value:", rawData);

        try {
            // Handle different data types
            if (typeof rawData === 'string') {
                tempMattressCost = JSON.parse(rawData);
            } else if (Array.isArray(rawData)) {
                tempMattressCost = rawData;
            } else if (typeof rawData === 'object') {
                tempMattressCost = [rawData]; // Convert single object to array
            } else {
                console.log("❌ Unexpected data type:", typeof rawData);
                return res.status(400).json({
                    success: false,
                    message: "Invalid data format for tempMattressCost"
                });
            }

            // Ensure it's an array
            if (!Array.isArray(tempMattressCost)) {
                console.log("🔹 Converting to array");
                tempMattressCost = [tempMattressCost];
            }

            console.log("🔹 Processed mattress costs:", tempMattressCost.length);
            console.log("🔹 Data:", JSON.stringify(tempMattressCost, null, 2));

        } catch (parseError) {
            console.error("❌ Parse error:", parseError);
            return res.status(400).json({
                success: false,
                message: "Invalid JSON format in tempMattressCost",
                error: parseError.message
            });
        }

        // ✅ 3. Validate data structure
        console.log("🔹 3. Validating data structure...");
        const isValidData = tempMattressCost.every(item =>
            item && typeof item === 'object' && item.roomType
        );

        if (!isValidData) {
            console.log("❌ Invalid data structure");
            return res.status(400).json({
                success: false,
                message: "Each mattress cost item must have roomType field"
            });
        }

        // ✅ 4. Initialize hotel fields if needed
        console.log("🔹 4. Initializing hotel fields...");
        if (!hotel.tempMattressCost || !Array.isArray(hotel.tempMattressCost)) {
            hotel.tempMattressCost = [];
        }

        // ✅ 5. Update hotel data
        console.log("🔹 5. Updating hotel data...");
        hotel.tempMattressCost = tempMattressCost;

        // ✅ 6. Save hotel
        console.log("🔹 6. Saving hotel...");
        const updatedHotel = await hotel.save();

        console.log("✅ HOTEL SAVED SUCCESSFULLY!");
        console.log("🔹 Updated mattress costs:", updatedHotel.tempMattressCost.length);

        res.status(200).json({
            success: true,
            message: "Mattress cost updated successfully",
            data: {
                _id: updatedHotel._id,
                hotelName: updatedHotel.hotelName,
                tempMattressCost: updatedHotel.tempMattressCost,
                count: updatedHotel.tempMattressCost.length
            }
        });

    } catch (error) {
        console.error("❌ Error in step 3:", error);
        res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};

// ----------------------
// Step 4: Update Peak Cost & Final Submit - ENHANCED DEBUGGING
// ----------------------

export const updateHotelStep4 = async (req, res) => {
    console.log("🔹 ===== STEP 4 STARTING =======");
    console.log("🔹 Hotel ID:", req.params.id);
    console.log("🔹 Request body:", req.body);

    try {
        // Find hotel with all fields
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        console.log("🔹 Hotel found:", hotel.hotelName);
        console.log("🔹 Current hotel data:", {
            hotelName: hotel.hotelName,
            hotelType: hotel.hotelType,
            contactDetails: hotel.contactDetails,
            location: hotel.location,
            socialMedia: hotel.socialMedia,
            facilities: hotel.facilities,
            tempRoomDetails: hotel.tempRoomDetails?.length,
            tempMattressCost: hotel.tempMattressCost?.length,
            tempPeakCost: hotel.tempPeakCost?.length
        });

        let tempPeakCost = [];

        // Handle tempPeakCost data
        if (req.body.tempPeakCost) {
            try {
                let rawData = req.body.tempPeakCost;

                console.log("🔹 Raw tempPeakCost type:", typeof rawData);

                if (typeof rawData === 'string') {
                    tempPeakCost = JSON.parse(rawData);
                } else if (Array.isArray(rawData)) {
                    tempPeakCost = rawData;
                } else if (typeof rawData === 'object') {
                    tempPeakCost = [rawData];
                }

                // Ensure it's an array
                if (!Array.isArray(tempPeakCost)) {
                    tempPeakCost = [tempPeakCost];
                }

                console.log("🔹 Processed tempPeakCost:", tempPeakCost.length);
                console.log("🔹 Peak Cost Data:", JSON.stringify(tempPeakCost, null, 2));

            } catch (parseError) {
                console.error("❌ JSON Parse Error:", parseError);
                return res.status(400).json({
                    success: false,
                    message: "Invalid peak cost format: " + parseError.message
                });
            }
        }

        // ✅ Safely update tempPeakCost
        hotel.tempPeakCost = tempPeakCost || [];

        // Final submit check
        const isFinalSubmit = req.body.finalSubmit === "true" || req.body.finalSubmit === true;
        console.log("🔹 Is Final Submit:", isFinalSubmit);

        if (isFinalSubmit) {
            console.log("🔹 ===== FINAL SUBMIT PROCESSING =====");

            // ✅ CRITICAL: Check if we have all required data
            const tempRoomDetails = hotel.tempRoomDetails || [];
            const tempMattressCost = hotel.tempMattressCost || [];

            console.log("🔹 Data for final combination:");
            console.log("🔹 tempRoomDetails length:", tempRoomDetails.length);
            console.log("🔹 tempMattressCost length:", tempMattressCost.length);
            console.log("🔹 tempPeakCost length:", tempPeakCost.length);

            if (tempRoomDetails.length === 0) {
                console.log("❌ No room details found for final combination");
                return res.status(400).json({
                    success: false,
                    message: "Room details are required before final submission"
                });
            }

            // Combine data into final rooms structure
            hotel.rooms = tempRoomDetails.map((season, seasonIndex) => {
                const seasonData = season || {};

                console.log(`🔹 Processing season ${seasonIndex}:`, seasonData.seasonType);

                return {
                    seasonType: seasonData.seasonType || `Season ${seasonIndex + 1}`,
                    validFrom: seasonData.validFrom,
                    validTill: seasonData.validTill,
                    roomDetails: (seasonData.roomDetails || []).map((roomDetail, roomIndex) => {
                        const roomData = roomDetail || {};
                        const roomType = roomData.roomType || `Room ${roomIndex + 1}`;

                        console.log(`🔹 Processing room ${roomIndex}:`, roomType);

                        // Find matching mattress cost
                        const mattressCost = tempMattressCost.find(mc =>
                            mc && mc.roomType && mc.roomType === roomType
                        );

                        // Find matching peak costs
                        const peakCosts = tempPeakCost.filter(pc =>
                            pc && pc.roomType && pc.roomType === roomType
                        );

                        console.log(`🔹 Room ${roomType}:`, {
                            hasMattressCost: !!mattressCost,
                            peakCostsCount: peakCosts.length,
                            images: roomData.images?.length || 0
                        });

                        return {
                            roomType: roomType,
                            mealPlan: roomData.mealPlan || "EP",
                            images: roomData.images || [],
                            mattressCost: mattressCost ? {
                                mealPlan: mattressCost.mealPlan || "EP",
                                adult: mattressCost.adult || 0,
                                children: mattressCost.children || 0,
                                kidWithoutMattress: mattressCost.kidWithoutMattress || 0
                            } : undefined,
                            peakCost: peakCosts.map(pc => ({
                                title: pc.title || "Peak Cost",
                                validFrom: pc.validFrom,
                                validTill: pc.validTill,
                                surcharge: pc.surcharge || 0,
                                note: pc.note || ""
                            }))
                        };
                    })
                };
            });

            console.log("🔹 Final rooms created:", hotel.rooms.length, "seasons");

            // Mark as completed
            hotel.formCompleted = true;
            hotel.status = "Active";

            // Clear temporary data
            hotel.tempRoomDetails = [];
            hotel.tempMattressCost = [];
            hotel.tempPeakCost = [];

            console.log("🔹 Hotel marked as completed");
        }

        // Save hotel
        console.log("🔹 Saving hotel...");
        const updatedHotel = await hotel.save();

        console.log("✅ HOTEL SAVED SUCCESSFULLY!");
        console.log("🔹 Updated hotel data:", {
            _id: updatedHotel._id,
            hotelName: updatedHotel.hotelName,
            hotelType: updatedHotel.hotelType,
            contactDetails: updatedHotel.contactDetails,
            location: updatedHotel.location,
            rooms: updatedHotel.rooms?.length,
            formCompleted: updatedHotel.formCompleted
        });

        res.status(200).json({
            success: true,
            message: isFinalSubmit ? "Hotel completed successfully!" : "Peak cost updated successfully",
            data: updatedHotel,
        });

    } catch (error) {
        console.error("❌ Error in step 4:", error);
        console.error("❌ Error stack:", error.stack);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ----------------------
// Get Hotel for Edit
// ----------------------
export const getHotelForEdit = async (req, res) => {
    try {
        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        res.status(200).json({
            success: true,
            data: hotel,
            currentStep: hotel.formCompleted ? 'completed' :
                hotel.tempPeakCost?.length > 0 ? 4 :
                    hotel.tempMattressCost?.length > 0 ? 3 :
                        hotel.tempRoomDetails?.length > 0 ? 2 : 1
        });
    } catch (error) {
        console.error("❌ Error fetching hotel:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------
// Original Update Hotel (Keep for backward compatibility)
// ----------------------
export const updateHotel = async (req, res) => {
    try {
        let bodyData = parseBodyFields(req.body);

        // Handle main image
        if (req.files?.mainImage) {
            bodyData.mainImage = `/upload/${req.files.mainImage[0].filename}`;
        }

        // Handle room images
        if (req.files?.roomImages) {
            handleRoomImages(bodyData, req.files.roomImages);
        }

        // Find hotel
        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        // Update only provided fields
        const allowedFields = [
            'hotelName', 'hotelType', 'contactDetails', 'description',
            'cancellationPolicy', 'facilities', 'mainImage', 'location',
            'socialMedia', 'rooms', 'status', 'policy'
        ];

        allowedFields.forEach(field => {
            if (bodyData[field] !== undefined) {
                hotel[field] = bodyData[field];
            }
        });

        const updatedHotel = await hotel.save();

        res.status(200).json({
            success: true,
            message: "Hotel updated successfully",
            data: updatedHotel,
        });
    } catch (error) {
        console.error("❌ Error updating hotel:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ----------------------
// Get All Hotels
// ----------------------
export const getHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.status(200).json({ success: true, data: hotels });
    } catch (error) {
        console.error("❌ Error fetching hotels:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------
// Get Single Hotel
// ----------------------
export const getHotelById = async (req, res) => {
    try {
        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel)
            return res.status(404).json({ success: false, message: "Hotel not found" });

        res.status(200).json({ success: true, data: hotel });
    } catch (error) {
        console.error("❌ Error fetching hotel:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------
// Delete Hotel
// ----------------------
export const deleteHotel = async (req, res) => {
    try {
        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel)
            return res.status(404).json({ success: false, message: "Hotel not found" });

        await hotel.deleteOne();

        res.status(200).json({ success: true, message: "Hotel deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting hotel:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------
// Update Hotel Status
// ----------------------
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const hotel = await findHotelByIdOrHotelId(req.params.id);
        if (!hotel)
            return res.status(404).json({ success: false, message: "Hotel not found" });

        hotel.status = status;
        await hotel.save();

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: hotel,
        });
    } catch (error) {
        console.error("❌ Error updating status:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// controllers/hotel.controller.js
export const debugHotel = async (req, res) => {
    try {
        console.log("🔹 Debug - Hotel ID:", req.params.id);

        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        console.log("🔹 Hotel found:", hotel._id);
        console.log("🔹 All hotel fields:", Object.keys(hotel.toObject()));

        res.status(200).json({
            success: true,
            data: {
                _id: hotel._id,
                hotelName: hotel.hotelName,
                // Check all temporary fields
                hasTempRoomDetails: hotel.tempRoomDetails !== undefined,
                tempRoomDetails: hotel.tempRoomDetails,
                hasTempMattressCost: hotel.tempMattressCost !== undefined,
                tempMattressCost: hotel.tempMattressCost,
                hasTempPeakCost: hotel.tempPeakCost !== undefined,
                tempPeakCost: hotel.tempPeakCost,
                // Check schema
                schemaPaths: Object.keys(Hotel.schema.paths)
            }
        });
    } catch (error) {
        console.error("❌ Debug error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
