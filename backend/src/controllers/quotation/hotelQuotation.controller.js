import { HotelQuotation } from "../../models/quotation/hotelQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { clearPattern } from "../../utils/cache.js";
import { logActivity } from "../../utils/ActivityLog.js";
import mongoose from "mongoose";

// Helper to generate quotationId
const generateQuotationId = async () => {
    const lastQuotation = await HotelQuotation.findOne().sort({ createdAt: -1 });

    if (!lastQuotation || !lastQuotation.hotelQuotationId) {
        return "ICYR_QT_H_0001";
    }

    // Extract the number part
    const lastId = lastQuotation.hotelQuotationId;
    const lastNumber = parseInt(lastId.split("_").pop(), 10); // e.g. "0001" -> 1

    const newNumber = lastNumber + 1;
    const padded = newNumber.toString().padStart(4, "0"); // always 4 digits

    return `ICYR_QT_H_${padded}`;
};

// 📌 Create Hotel Quotation
export const createHotelQuotation = asyncHandler(async (req, res) => {
    const quotationId = await generateQuotationId();

    const newQuotation = await HotelQuotation.create({
        ...req.body,
        hotelQuotationId: quotationId,
    });

    await logActivity({
        action: "CREATE",
        model: "HotelQuotation",
        refId: quotationId,
        description: `Hotel Quotation ${quotationId} (${req.body.clientDetails?.clientName || 'Guest'}) created by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    await clearPattern('dashboard:stats:*');

    return res
        .status(201)
        .json(new ApiResponse(201, newQuotation, "Hotel Quotation created"));
});

// 📌 Get all quotations
export const getAllHotelQuotations = asyncHandler(async (req, res) => {
    const quotations = await HotelQuotation.find().sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, quotations, "All Hotel Quotations"));
});

// 📌 Get single quotation by ID
export const getHotelQuotationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("Fetching Hotel Quotation with ID:", id);
    let quotation;

    // Try finding by MongoDB _id if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
        quotation = await HotelQuotation.findById(id);
    }

    // If not found by _id, try finding by hotelQuotationId
    if (!quotation) {
        quotation = await HotelQuotation.findOne({ hotelQuotationId: id });
    }

    if (!quotation) {
        console.error(`Hotel Quotation not found for ID: ${id}`);
        throw new ApiError(404, `Hotel Quotation not found for ID: ${id}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Hotel Quotation fetched"));
});

// 📌 Delete quotation
export const deleteHotelQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let deleted;

    // Try deleting by MongoDB _id
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        deleted = await HotelQuotation.findByIdAndDelete(id);
    }

    // If not found, try by hotelQuotationId
    if (!deleted) {
        deleted = await HotelQuotation.findOneAndDelete({
            hotelQuotationId: id,
        });
    }

    if (!deleted) {
        throw new ApiError(404, "Hotel Quotation not found");
    }

    await logActivity({
        action: "DELETE",
        model: "HotelQuotation",
        refId: id,
        description: `Hotel Quotation ${id} (${deleted.clientDetails?.clientName || 'Guest'}) deleted by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    await clearPattern('dashboard:stats:*');

    return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Hotel Quotation deleted"));
});

export const finalizeHotelQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { companyId, companyName } = req.body || {};

    let quotation;
    if (mongoose.Types.ObjectId.isValid(id)) {
        quotation = await HotelQuotation.findById(id);
    }
    if (!quotation) {
        quotation = await HotelQuotation.findOne({ hotelQuotationId: id });
    }

    if (!quotation) {
        throw new ApiError(404, "Hotel Quotation not found");
    }

    // Generate bookingId if not already present
    if (!quotation.bookingId) {
        const selectedCompany = await resolveCompanyForEmail({
            companyId,
            companyName,
        });
        const compName = selectedCompany?.companyName || companyName || "Iconic Travel";
        quotation.companyName = compName;
        if (selectedCompany?._id) quotation.companyId = selectedCompany._id;
        
        // Lazy-load generator to avoid circular deps if any
        const { generateBookingId } = await import("../../utils/bookingIdGenerator.js");
        quotation.bookingId = await generateBookingId(compName);
    }

    await quotation.save();

    await logActivity({
        action: "CONFIRM",
        model: "HotelQuotation",
        refId: quotation.hotelQuotationId,
        description: `Hotel Quotation ${quotation.hotelQuotationId} confirmed by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    return res.status(200).json(
        new ApiResponse(200, quotation, "Hotel quotation finalized successfully")
    );
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