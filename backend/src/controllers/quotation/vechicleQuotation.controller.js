import { Vehicle } from "../../models/quotation/vehicle.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Lead } from "../../models/lead.model.js";
import nodemailer from "nodemailer";
import Company from "../../models/company.model.js";
import ReceivedVoucher from "../../models/payment.model.js";
import {
  buildVehicleQuotationBookingEmail,
  buildVehicleQuotationPdfPreviewEmail,
} from "../../utils/vehicleQuotationMailerTemplates.js";

const generateVehicleQuotationId = async () => {
  const lastVehicle = await Vehicle.findOne({})
    .sort({ createdAt: -1 })
    .select("vehicleQuotationId");

  let nextNumber = "0001";

  if (lastVehicle?.vehicleQuotationId) {
    const lastNumber = parseInt(
      lastVehicle.vehicleQuotationId.split("_").pop(),
    );
    nextNumber = String(lastNumber + 1).padStart(4, "0");
  }

  return `ICYR_QT_V_${nextNumber}`;
};

export const createVehicle = asyncHandler(async (req, res) => {
  console.log("Req", req.body);
  const {
    basicsDetails: { clientName, vehicleType, tripType, noOfDays, perDayCost },
    costDetails: { totalCost, discount, gstOn, applyGst },
    pickupDropDetails: {
      pickupDate,
      pickupTime,
      pickupLocation,
      dropDate,
      dropTime,
      dropLocation,
    },
    signatureDetails: { contactDetails },
  } = req.body;

  // Required field validation
  if (
    !clientName ||
    !vehicleType ||
    !tripType ||
    !noOfDays ||
    !perDayCost ||
    !totalCost ||
    !pickupDate ||
    !pickupTime ||
    !pickupLocation ||
    !dropDate ||
    !dropTime ||
    !dropLocation ||
    !gstOn ||
    !applyGst
  ) {
    throw new ApiError(400, "Please provide all required fields!");
  }

  const vehicleQuotationId = await generateVehicleQuotationId();

  const newVehicle = await Vehicle.create({
    basicsDetails: {
      clientName,
      vehicleType,
      tripType,
      noOfDays,
      perDayCost,
    },
    costDetails: {
      totalCost,
    },
    pickupDropDetails: {
      pickupDate,
      pickupTime,
      pickupLocation,
      dropDate,
      dropTime,
      dropLocation,
    },
    discount,
    tax: {
      gstOn,
      applyGst,
    },
    signatureDetails: {
      contactDetails,
    },
    vehicleQuotationId,
  });

  if (!newVehicle) {
    throw new ApiError(500, "Failed to create vehicle quotation");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newVehicle,
        "Vehicle quotation created successfully",
      ),
    );
});

export const getAllVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(
      new ApiResponse(200, vehicles, "Vehicle quotations fetched successfully"),
    );
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const vehicle = await Vehicle.findOne({ vehicleQuotationId });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }
  const lead = await Lead.findOne({
    "personalDetails.fullName": vehicle.basicsDetails.clientName,
  });
  if (!lead) {
    throw new ApiError(
      404,
      `Lead not found for client ${vehicle.basicsDetails.clientName}`,
    );
  }
  const responseData = {
    vehicle,
    lead,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "Vehicle quotation fetched successfully",
      ),
    );
});
export const updateVehicle = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const {
    clientName,
    vehicleType,
    tripType,
    noOfDays,
    perDayCost,
    totalCost,
    pickupDate,
    pickupTime,
    pickupLocation,
    dropDate,
    dropTime,
    dropLocation,
    discount,
    gstOn,
    applyGst,
    contactDetails,
  } = req.body;

  const updatedVehicle = await Vehicle.findByOneAndUpdate(
    { vehicleQuotationId },
    {
      basicsDetails: {
        clientName,
        vehicleType,
        tripType,
        noOfDays,
        perDayCost,
      },
      costDetails: {
        totalCost,
      },
      pickupDropDetails: {
        pickupDate,
        pickupTime,
        pickupLocation,
        dropDate,
        dropTime,
        dropLocation,
      },
      discount,
      tax: {
        gstOn,
        applyGst,
      },
      signatureDetails: {
        contactDetails,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedVehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVehicle,
        "Vehicle quotation updated successfully",
      ),
    );
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const deletedVehicle = await Vehicle.findOneAndDelete({ vehicleQuotationId });

  if (!deletedVehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Vehicle quotation deleted successfully"));
});

export const addItinerary = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;
  const { itinerary } = req.body; // should be array of {title, description}

  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    throw new ApiError(400, "Please provide at least one itinerary entry");
  }

  const updatedVehicle = await Vehicle.findOneAndUpdate(
    { vehicleQuotationId },
    { $push: { itinerary: { $each: itinerary } } },
    { new: true, runValidators: true },
  );

  if (!updatedVehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVehicle.itinerary,
        "Itinerary added successfully",
      ),
    );
});

export const editItinerary = asyncHandler(async (req, res) => {
  const { vehicleQuotationId, itineraryId } = req.params;
  const { title, description } = req.body;

  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicleQuotationId, "itinerary._id": itineraryId },
    {
      $set: {
        "itinerary.$.title": title,
        "itinerary.$.description": description,
      },
    },
    { new: true, runValidators: true },
  );

  if (!vehicle) {
    throw new ApiError(404, "Vehicle or itinerary entry not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vehicle.itinerary,
        "Itinerary entry updated successfully",
      ),
    );
});

export const viewItinerary = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const vehicle = await Vehicle.findOne(
    { vehicleQuotationId },
    { itinerary: 1, _id: 0 },
  );

  if (!vehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  const responseData = {
    note: "Itinerary Route Plan: This is only a tentative schedule for sightseeing and travel. The actual sequence might change depending on the local conditions.",
    itinerary: vehicle.itinerary,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Itinerary fetched successfully"));
});

/** Partial update by business vehicleQuotationId — used from finalize / admin UI */
export const updateVehicleQuotationByQuotationId = asyncHandler(
  async (req, res) => {
    const { vehicleQuotationId } = req.params;

    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { vehicleQuotationId },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedVehicle) {
      throw new ApiError(404, "Vehicle quotation not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVehicle,
          "Vehicle quotation updated successfully",
        ),
      );
  },
);

/** Finalize vehicle quotation */
export const finalizeVehicleQuotation = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;
  const { finalizedVendorsWithAmounts } = req.body || {};

  const vehicle = await Vehicle.findOne({ vehicleQuotationId });
  if (!vehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  vehicle.finalizeStatus = "finalized";
  vehicle.finalizedAt = new Date();
  if (
    Array.isArray(finalizedVendorsWithAmounts) &&
    finalizedVendorsWithAmounts.length > 0
  ) {
    vehicle.finalizedVendorsWithAmounts = finalizedVendorsWithAmounts.map(
      (vendor) => ({
        vendorName: vendor.vendorName || "",
        vendorType: vendor.vendorType || "Other",
        amount: Number(vendor.amount) || 0,
        remarks: vendor.remarks || "",
      }),
    );
  }

  await vehicle.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, vehicle, "Vehicle quotation finalized successfully"),
    );
});

const resolveCompanyForEmail = async ({ companyId, companyName }) => {
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

const resolveMailAuth = (senderAccount) => {
  const useSecondary = String(senderAccount || "").toLowerCase() === "gmail2";
  const user = useSecondary
    ? process.env.gmail2 ||
      process.env.EMAIL_USER2 ||
      process.env.gmail ||
      process.env.EMAIL_USER
    : process.env.gmail || process.env.EMAIL_USER;
  const pass = useSecondary
    ? process.env.app_pass2 ||
      process.env.EMAIL_PASS2 ||
      process.env.app_pass ||
      process.env.EMAIL_PASS
    : process.env.app_pass || process.env.EMAIL_PASS;
  return { user, pass };
};

const sumReceivedFromClient = (vouchers = []) => {
  let total = 0;
  for (const v of vouchers) {
    const isReceive = v?.drCr === "Cr" || v?.paymentType === "Receive Voucher";
    if (isReceive) total += Number(v?.amount) || 0;
  }
  return total;
};

export const previewVehicleQuotationMail = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;
   const companyId = req.query.companyId;
  const companyName = req.query.companyName;
  const vehicle = await Vehicle.findOne({ vehicleQuotationId }).lean();
  if (!vehicle) throw new ApiError(404, "Vehicle quotation not found");

  const lead = await Lead.findOne({
    "personalDetails.fullName": vehicle.basicsDetails.clientName,
  }).lean();

  const selectedCompany = await resolveCompanyForEmail({
    companyId,
    companyName,
  });
  const companyMeta = {
    companyName: selectedCompany?.companyName || "Iconic Travel",
    companyWebsite: selectedCompany?.companyWebsite || "",
  };

  const quotationData = { vehicle, lead };
  const vouchers = await ReceivedVoucher.find({
    quotationRef: vehicleQuotationId,
  }).lean();
  const receivedAmount = sumReceivedFromClient(vouchers);
  const normalBody = buildVehicleQuotationPdfPreviewEmail(
    quotationData,
    companyMeta,
  );
  const bookingBody = buildVehicleQuotationBookingEmail(quotationData, {
    ...companyMeta,
    receivedAmount,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicleQuotationId,
        normal: {
          subject: `Quotation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`,
          body: normalBody,
        },
        booking: {
          subject: `Booking Confirmation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`,
          body: bookingBody,
        },
      },
      "Vehicle quotation email preview generated",
    ),
  );
});

export const sendVehicleQuotationMail = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;
  const {
    to,
    cc,
    type = "normal",
    subject,
    bodyHtml,
    senderAccount,
    companyId,
    companyName,
    customText = {},
    pdfAttachment,
    previewPdfMode = false,
  } = req.body || {};

  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new ApiError(400, "Receiver email is required");
  }

  const vehicle = await Vehicle.findOne({ vehicleQuotationId }).lean();
  if (!vehicle) throw new ApiError(404, "Vehicle quotation not found");
  const lead = await Lead.findOne({
    "personalDetails.fullName": vehicle.basicsDetails.clientName,
  }).lean();
  const selectedCompany = await resolveCompanyForEmail({
    companyId,
    companyName,
  });
  const auth = resolveMailAuth(senderAccount);
  if (!auth.user || !auth.pass) {
    throw new ApiError(
      500,
      "Sender email credentials are not configured for selected account",
    );
  }
  const companyMeta = {
    companyName: selectedCompany?.companyName || "Iconic Travel",
    companyWebsite: selectedCompany?.companyWebsite || "",
  };
  const quotationData = { vehicle, lead };
  const vouchers = await ReceivedVoucher.find({
    quotationRef: vehicleQuotationId,
  }).lean();
  const receivedAmount = sumReceivedFromClient(vouchers);

  const generatedBody =
    type === "booking"
      ? buildVehicleQuotationBookingEmail(quotationData, {
          ...companyMeta,
          ...(customText?.booking || {}),
          receivedAmount,
        })
      : buildVehicleQuotationPdfPreviewEmail(quotationData, companyMeta);

  const body =
    type === "booking"
      ? generatedBody
      : previewPdfMode
        ? buildVehicleQuotationPdfPreviewEmail(quotationData, companyMeta)
        : String(bodyHtml || "").trim() || generatedBody;

  const finalSubject =
    subject ||
    (type === "booking"
      ? `Booking Confirmation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`
      : `Quotation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: auth.user, pass: auth.pass },
  });

  const providedPdfAttachment =
    pdfAttachment &&
    typeof pdfAttachment === "object" &&
    String(pdfAttachment.contentBase64 || "").trim()
      ? {
          filename: String(pdfAttachment.filename || "quotation.pdf").trim(),
          content: Buffer.from(
            String(pdfAttachment.contentBase64).trim(),
            "base64",
          ),
          contentType:
            String(pdfAttachment.mimeType || "").trim() || "application/pdf",
        }
      : null;

  await transporter.sendMail({
    from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
    to,
    cc: cc && String(cc).trim() ? cc : undefined,
    replyTo: selectedCompany?.email || auth.user,
    subject: finalSubject,
    html: body,
    text: body.replace(/<[^>]*>/g, ""),
    attachments: providedPdfAttachment ? [providedPdfAttachment] : [],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicleQuotationId,
        type,
        senderAccount: senderAccount || "gmail1",
      },
      "Mail sent successfully",
    ),
  );
});
