import { FlightQuotation } from "../../models/quotation/flightQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Lead } from "../../models/lead.model.js"
const generateFlightQuotationId = async () => {
    const lastQuotation = await FlightQuotation.findOne({})
        .sort({ createdAt: -1 })
        .select("flightQuotationId");

    let nextNumber = "0001";

    if (lastQuotation?.flightQuotationId) {
        const lastNumber = parseInt(lastQuotation.flightQuotationId.split("_").pop());
        nextNumber = String(lastNumber + 1).padStart(4, "0");
    }

    return `ICYR_QT_F_${nextNumber}`;
};


export const createFlightQuotation = asyncHandler(async (req, res) => {

    const {
        tripType,
        clientDetails,
        flightDetails,
        adults,
        childs,
        infants,
        anyMessage,
        personalDetails,
        status // optional from client
    } = req.body;

    // ✅ Validate required fields
    if (
        !tripType ||
        !clientDetails?.clientName ||
        !personalDetails?.fullName ||
        !personalDetails?.mobileNumber ||
        !personalDetails?.emailId
    ) {
        throw new ApiError(400, "Required fields are missing");
    }

    // ✅ Validate flightDetails count based on tripType
    if (tripType === "oneway" && flightDetails.length !== 1) {
        throw new ApiError(400, "Oneway trip must have exactly 1 flight detail");
    }
    if (tripType === "roundtrip" && flightDetails.length !== 2) {
        throw new ApiError(400, "Roundtrip must have exactly 2 flight details");
    }
    if (tripType === "multicity" && flightDetails.length < 2) {
        throw new ApiError(400, "Multicity trip must have at least 2 flight details");
    }

    // ✅ Generate dynamic title
    const title = `Flight Quotation for ${clientDetails.clientName}`;

    // ✅ Find the lead based on client name
    const lead = await Lead.findOne({ "personalDetails.fullName": clientDetails.clientName });

    if (!lead) {
        throw new ApiError(404, `Lead not found for client ${clientDetails.clientName}`);
    }

    // ✅ Generate unique Flight Quotation ID
    const flightQuotationId = await generateFlightQuotationId();

    // ✅ Create quotation
    const quotation = await FlightQuotation.create({
        flightQuotationId,
        tripType,
        clientDetails,
        title,
        flightDetails,
        adults,
        childs,
        infants,
        anyMessage,
        personalDetails,
        status: status || "New",
        quotation_type: "flight",
        leadId: lead.leadId
    });

    // ✅ Send response with quotation + full lead info
    return res.status(201).json(
        new ApiResponse(201, {
            quotation,
            leadDetails: lead,  // <--- Include full lead info here
        }, "Flight quotation created successfully")
    );
});




export const getAllFlightQuotations = asyncHandler(async (req, res) => {
    // Fetch all quotations sorted by createdAt (latest first)
    const quotations = await FlightQuotation.find().sort({ createdAt: -1 });

    if (!quotations || quotations.length === 0) {
        throw new ApiError(404, "No flight quotations found");
    }

    // Fetch lead info for each quotation based on client name
    const quotationsWithLead = await Promise.all(
        quotations.map(async (quotation) => {
            const lead = await Lead.findOne({
                "personalDetails.fullName": quotation.clientDetails.clientName,
            });

            return {
                ...quotation.toObject(),
                lead: lead || null, // If no lead found, send null
            };
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                quotationsWithLead,
                "Flight quotations with lead details fetched successfully"
            )
        );
});



export const getFlightQuotationById = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;

    // Find the quotation first
    const quotation = await FlightQuotation.findOne({ flightQuotationId });
    if (!quotation) {
        throw new ApiError(404, "Flight quotation not found");
    }

    // Fetch lead information based on client name from quotation
    const lead = await Lead.findOne({
        "personalDetails.fullName": quotation.clientDetails.clientName,
    });

    if (!lead) {
        throw new ApiError(
            404,
            `Lead not found for client ${quotation.clientDetails.clientName}`
        );
    }

    // Combine quotation + lead information
    const responseData = {
        quotation,
        lead,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Flight quotation fetched successfully"));
});



export const updateFlightQuotationById = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;
    const updateData = req.body;

    const quotation = await FlightQuotation.findOneAndUpdate(
        { flightQuotationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!quotation) throw new ApiError(404, "Flight quotation not found");

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Flight quotation updated successfully"));
});

export const deleteFlightQuotationById = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;

    const quotation = await FlightQuotation.findOneAndDelete({ flightQuotationId });

    if (!quotation) throw new ApiError(404, "Flight quotation not found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Flight quotation deleted successfully"));
});


// ✅ Confirm Flight Quotation API
export const confirmFlightQuotation = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;
    const { pnrList, finalFareList, finalFare } = req.body;

    const quotation = await FlightQuotation.findOne({ flightQuotationId });

    if (!quotation) {
        throw new ApiError(404, "Flight quotation not found");
    }

    if (quotation.status === "Confirmed") {
        throw new ApiError(400, "Quotation is already confirmed");
    }

    if (quotation.status === "Cancelled") {
        throw new ApiError(400, "Cannot confirm a cancelled quotation");
    }

    if (quotation.status === "New") {
        quotation.status = "Completed";
    }

    // ✅ Update PNRs
    if (pnrList && Array.isArray(pnrList)) {
        if (pnrList.length !== quotation.flightDetails.length) {
            throw new ApiError(400, "PNR list length must match flight details length");
        }
        quotation.pnrList = pnrList;
    }

    // ✅ Update final fares per flight
    if (finalFareList && Array.isArray(finalFareList)) {
        if (finalFareList.length !== quotation.flightDetails.length) {
            throw new ApiError(400, "Final fare list length must match flight details length");
        }
        quotation.finalFareList = finalFareList;

        // ✅ Update total final fare
        quotation.finalFare = finalFare
            ? Number(finalFare) // ✅ Use manual value if provided
            : finalFareList.reduce((sum, fare) => sum + Number(fare || 0), 0);
    }

    quotation.status = "Confirmed";
    await quotation.save();

    return res.status(200).json(
        new ApiResponse(200, quotation, "Flight quotation confirmed successfully")
    );
});



