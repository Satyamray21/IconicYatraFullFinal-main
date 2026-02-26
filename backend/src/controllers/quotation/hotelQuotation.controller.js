import { HotelQuotation } from "../../models/quotation/hotelQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

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
    const quotation = await HotelQuotation.findOne({ hotelQuotationId: id });

    if (!quotation) {
        throw new ApiError(404, "Hotel Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Hotel Quotation fetched"));
});

// 📌 Delete quotation
export const deleteHotelQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await HotelQuotation.findOneAndDelete({
        hotelQuotationId: id,
    });

    if (!deleted) {
        throw new ApiError(404, "Hotel Quotation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Hotel Quotation deleted"));
});