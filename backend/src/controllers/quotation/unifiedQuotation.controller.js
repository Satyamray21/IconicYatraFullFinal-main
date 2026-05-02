import { CustomQuotation } from "../../models/quotation/customQuotation.model.js";
import QuickQuotation from "../../models/quotation/quickQuotation.model.js";
import { Vehicle } from "../../models/quotation/vehicle.model.js";
import { FlightQuotation } from "../../models/quotation/flightQuotation.model.js";
import { HotelQuotation } from "../../models/quotation/hotelQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const searchAllQuotations = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const limit = 10;
  
  const regex = search ? { $regex: search, $options: "i" } : null;

  const [custom, quick, vehicle, flight, hotel] = await Promise.all([
    // Custom Quotations
    CustomQuotation.find(regex ? {
      $or: [
        { quotationId: regex },
        { "clientDetails.clientName": regex }
      ]
    } : {})
      .select("_id quotationId clientDetails.clientName")
      .limit(limit)
      .lean(),

    // Quick Quotations
    QuickQuotation.find(regex ? {
      $or: [
        { quickQuotationId: regex },
        { customerName: regex }
      ]
    } : {})
      .select("_id quickQuotationId customerName")
      .limit(limit)
      .lean(),

    // Vehicle Quotations
    Vehicle.find(regex ? {
      $or: [
        { vehicleQuotationId: regex },
        { "basicsDetails.clientName": regex }
      ]
    } : {})
      .select("_id vehicleQuotationId basicsDetails.clientName")
      .limit(limit)
      .lean(),

    // Flight Quotations
    FlightQuotation.find(regex ? {
      $or: [
        { flightQuotationId: regex },
        { "clientDetails.clientName": regex },
        { "personalDetails.fullName": regex }
      ]
    } : {})
      .select("_id flightQuotationId clientDetails.clientName personalDetails.fullName")
      .limit(limit)
      .lean(),

    // Hotel Quotations
    HotelQuotation.find(regex ? {
      $or: [
        { hotelQuotationId: regex },
        { "clientDetails.clientName": regex }
      ]
    } : {})
      .select("_id hotelQuotationId clientDetails.clientName")
      .limit(limit)
      .lean(),
  ]);

  const results = [
    ...custom.map(q => ({ _id: q._id, quotationId: q.quotationId, clientName: q.clientDetails?.clientName || "N/A", type: "Custom" })),
    ...quick.map(q => ({ _id: q._id, quotationId: q.quickQuotationId, clientName: q.customerName || "N/A", type: "Quick" })),
    ...vehicle.map(q => ({ _id: q._id, quotationId: q.vehicleQuotationId, clientName: q.basicsDetails?.clientName || "N/A", type: "Vehicle" })),
    ...flight.map(q => ({ _id: q._id, quotationId: q.flightQuotationId, clientName: q.clientDetails?.clientName || q.personalDetails?.fullName || "N/A", type: "Flight" })),
    ...hotel.map(q => ({ _id: q._id, quotationId: q.hotelQuotationId, clientName: q.clientDetails?.clientName || "N/A", type: "Hotel" })),
  ];

  return res.status(200).json(new ApiResponse(200, results, "Quotations fetched successfully"));
});
