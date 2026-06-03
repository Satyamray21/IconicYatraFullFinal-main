import { Vehicle } from "../../models/quotation/vehicle.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getCache, setCache, clearPattern } from "../../utils/cache.js";
import { logActivity } from "../../utils/ActivityLog.js";
import { generateBookingId } from "../../utils/bookingIdGenerator.js";
import { Lead } from "../../models/lead.model.js";
import nodemailer from "nodemailer";
import Company from "../../models/company.model.js";
import EmailAccount from "../../models/emailAccount.model.js";
import ReceivedVoucher from "../../models/payment.model.js";
import {
  buildVehicleQuotationBookingEmail,
  buildVehicleQuotationPdfPreviewEmail,
} from "../../utils/vehicleQuotationMailerTemplates.js";

// Default exclusions for vehicle quotations
const DEFAULT_EXCLUSIONS = [
  "Travel insurance",
  "Emergency evacuation",
  "Trip cancellation costs",
  "Personal Expenses: Laundry, Room service, Tips, Shopping, Medical expenses",
  "Flight / Train tickets",
  "Entry fees to sightseeing places",
  "Camera / video charges",
  "Ropeway / boating / adventure activities",
  "Meals: Lunch / Dinner / Snacks / Beverages (unless specifically mentioned)",
  "Any extra costs due to unavoidable circumstances (natural calamities, strikes, lockdowns, bad weather, etc.)",
  "Any sightseeing missed / cancelled due to factors beyond our control",
  "Anything not mentioned in Inclusions",
];

// Default inclusions for vehicle quotations
const DEFAULT_INCLUSIONS = [
  "Pick-up & drop from / to the airport or railway station as per the itinerary",
  "All sightseeing & transfers in a well-maintained Private AC/Non-AC vehicle (sedan / SUV / tempo traveller/similar as per group size)",
  "Driver's batta (allowance), fuel charges, parking fees, toll taxes & state permit charges",
  "Vehicle available from 08:00 AM to 08:00 PM daily (extended hours on extra charges)",
  "Note: AC will be switched off in hilly areas & during steep ascents/descents for safety",
]

// Default payment policy for vehicle quotations
const DEFAULT_PAYMENT_POLICY = [
  "At the time of reservation, a non-refundable booking amount of 20% of package cost + 5% GST is required.",
  "20% at reservation + 100% Flight / Train cost",
  "60% after booking confirmation",
  "Balance before departure",
];

// Default Terms and Conditions URL
const DEFAULT_TERMS_AND_CONDITIONS = "https://www.iconicyatra.com/terms-conditions";

/** Resolve vehicle by business id (IY_VQ_xxx) or Mongo _id from URL params. */
const resolveVehicleQuery = (idOrRef) => {
  const raw = String(idOrRef || "").trim();
  if (!raw) return null;
  if (/^[a-f\d]{24}$/i.test(raw)) {
    return { $or: [{ _id: raw }, { vehicleQuotationId: raw }] };
  }
  return { vehicleQuotationId: raw };
};

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
    basicsDetails: { vehiclesSameOrDifferent, clientName, vehicleType, tripType, noOfDays, perDayCost, noOfVehicles },
    multipleVehicles,
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
    (vehiclesSameOrDifferent === "Same" && (!vehicleType || !tripType || !noOfDays || !perDayCost)) ||
    (vehiclesSameOrDifferent === "Different" && (!multipleVehicles || multipleVehicles.length === 0)) ||
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
      vehiclesSameOrDifferent,
      clientName,
      vehicleType: vehicleType || "",
      tripType: tripType || "One Way",
      noOfDays: noOfDays || "1",
      perDayCost: perDayCost || "0",
      noOfVehicles: noOfVehicles || "1",
    },
    multipleVehicles: multipleVehicles || [],
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
    exclusions: DEFAULT_EXCLUSIONS,
    inclusions: DEFAULT_INCLUSIONS,
    policies: {
      inclusionPolicy: DEFAULT_INCLUSIONS,
      exclusionPolicy: DEFAULT_EXCLUSIONS,
      paymentPolicy: DEFAULT_PAYMENT_POLICY,
      termsAndConditions: [DEFAULT_TERMS_AND_CONDITIONS],
    },
    vehicleQuotationId,
  });

  if (!newVehicle) {
    throw new ApiError(500, "Failed to create vehicle quotation");
  }

  await logActivity({
    action: "CREATE",
    model: "VehicleQuotation",
    refId: vehicleQuotationId,
    description: `Vehicle Quotation ${vehicleQuotationId} (${clientName}) created by ${req.user?.name || 'System'}`,
    user: req.user?.name || "System",
  });

  await clearPattern("vehicleQuotations:all");
  await clearPattern("quotations:search:*");
  await clearPattern("quotations:stats");
  await clearPattern('dashboard:stats:*');

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newVehicle,
        "Vehicle quotation created successfully",
        "database"
      ),
    );
});

export const getAllVehicles = asyncHandler(async (req, res) => {
  const cacheKey = "vehicleQuotations:all";
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return res.status(200).json(
      new ApiResponse(
        200,
        cachedData,
        "Vehicle quotations fetched from cache",
        "cache"
      )
    );
  }

  const vehicles = await Vehicle.find().sort({ createdAt: -1 });

  await setCache(cacheKey, vehicles, 3600);

  return res
    .status(200)
    .json(
      new ApiResponse(200, vehicles, "Vehicle quotations fetched from database", "database"),
    );
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const cacheKey = `vehicleQuotation:${vehicleQuotationId}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return res.status(200).json(
      new ApiResponse(
        200,
        cachedData,
        "Vehicle quotation fetched from cache",
        "cache"
      ),
    );
  }

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

  await setCache(cacheKey, responseData, 3600);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "Vehicle quotation fetched from database",
        "database"
      ),
    );
});
export const updateVehicle = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const {
    vehiclesSameOrDifferent,
    noOfVehicles,
    multipleVehicles,
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

  const updatedVehicle = await Vehicle.findOneAndUpdate(
    { vehicleQuotationId },
    {
      basicsDetails: {
        vehiclesSameOrDifferent,
        noOfVehicles,
        clientName,
        vehicleType,
        tripType,
        noOfDays,
        perDayCost,
      },
      multipleVehicles,
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

  await clearPattern(`vehicleQuotation:${vehicleQuotationId}`);
  await clearPattern("vehicleQuotations:all");
  await clearPattern("quotations:search:*");
  await clearPattern("quotations:stats");
  await clearPattern('dashboard:stats:*');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVehicle,
        "Vehicle quotation updated successfully",
        "database"
      ),
    );
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const { vehicleQuotationId } = req.params;

  const deletedVehicle = await Vehicle.findOneAndDelete({ vehicleQuotationId });

  if (!deletedVehicle) {
    throw new ApiError(404, "Vehicle quotation not found");
  }

  await logActivity({
    action: "DELETE",
    model: "VehicleQuotation",
    refId: vehicleQuotationId,
    description: `Vehicle Quotation ${vehicleQuotationId} (${deletedVehicle.basicsDetails?.clientName || 'Guest'}) deleted by ${req.user?.name || 'System'}`,
    user: req.user?.name || "System",
  });

  await clearPattern(`vehicleQuotation:${vehicleQuotationId}`);
  await clearPattern("vehicleQuotations:all");
  await clearPattern("quotations:search:*");
  await clearPattern("quotations:stats");
  await clearPattern('dashboard:stats:*');

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
    const { vehicleQuotationId: idParam } = req.params;
    const query = resolveVehicleQuery(idParam);
    if (!query) {
      throw new ApiError(400, "Vehicle quotation id is required");
    }

    const updatedVehicle = await Vehicle.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedVehicle) {
      throw new ApiError(404, "Vehicle quotation not found");
    }

    const refKey = updatedVehicle.vehicleQuotationId || idParam;
    await clearPattern(`vehicleQuotation:${refKey}`);
    await clearPattern(`vehicleQuotation:${idParam}`);
    await clearPattern("vehicleQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("dashboard:stats:*");

    const lead = await Lead.findOne({
      "personalDetails.fullName": updatedVehicle.basicsDetails.clientName,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { vehicle: updatedVehicle, lead },
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

  // Generate bookingId if not already present
  if (!vehicle.bookingId) {
    const selectedCompany = await resolveCompanyForEmail({
      companyId: req.body?.companyId,
      companyName: req.body?.companyName,
    });
    const companyName = selectedCompany?.companyName || "Iconic Travel";
    vehicle.companyName = companyName;
    if (selectedCompany?._id) vehicle.companyId = selectedCompany._id;
    vehicle.bookingId = await generateBookingId(companyName);
  }
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

  await clearPattern(`vehicleQuotation:${vehicleQuotationId}`);
  await clearPattern("vehicleQuotations:all");
  await clearPattern("quotations:search:*");
  await clearPattern("quotations:stats");
  await clearPattern('dashboard:stats:*');

  return res
    .status(200)
    .json(
      new ApiResponse(200, vehicle, "Vehicle quotation finalized successfully", "database"),
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

const resolveMailAuth = async (senderAccount, selectedCompany) => {
  // 1. If senderAccount is a valid MongoDB ID, look up in EmailAccount
  if (senderAccount && senderAccount.length === 24) {    try {
      const account = await EmailAccount.findById(senderAccount).lean();
      if (account) {
        return {
          user: account.email,
          pass: account.appPassword,
          service: account.service,
          host: account.host,
          port: account.port,
          secure: account.secure,
        };
      }
    } catch (e) {
      console.warn("EmailAccount lookup failed:", e.message);
    }
  }

  // 2. If company has its own email and app password, use them
  if (selectedCompany?.email && selectedCompany?.emailAppPassword) {
    return {
      user: selectedCompany.email,
      pass: selectedCompany.emailAppPassword,
      service: "gmail",
    };
  }

  const useSecondary = String(senderAccount || "").toLowerCase() === "gmail2";
  const user =
    useSecondary
      ? process.env.gmail2 ||
      process.env.EMAIL_USER2 ||
      process.env.gmail ||
      process.env.EMAIL_USER
      : process.env.gmail || process.env.EMAIL_USER;
  const pass =
    useSecondary
      ? process.env.app_pass2 ||
      process.env.EMAIL_PASS2 ||
      process.env.app_pass ||
      process.env.EMAIL_PASS
      : process.env.app_pass || process.env.EMAIL_PASS;

  return { user, pass, service: "gmail" };
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
    termsAndConditions: selectedCompany?.termsConditions || "",
    cancellationPolicyUrl: selectedCompany?.cancellationPolicy || "",
    paymentLink: selectedCompany?.paymentLink || "",
    bankDetails: Array.isArray(selectedCompany?.bankDetails)
      ? selectedCompany.bankDetails
      : [],
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
    receiptPdf,
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
  const auth = await resolveMailAuth(senderAccount, selectedCompany);
  if (!auth.user || !auth.pass) {
    throw new ApiError(
      500,
      "Sender email credentials are not configured for selected account",
    );
  }
  const companyMeta = {
    companyName: selectedCompany?.companyName || "Iconic Travel",
    companyWebsite: selectedCompany?.companyWebsite || "",
    termsAndConditions: selectedCompany?.termsConditions || "",
    cancellationPolicyUrl: selectedCompany?.cancellationPolicy || "",
    paymentLink: selectedCompany?.paymentLink || "",
    bankDetails: Array.isArray(selectedCompany?.bankDetails)
      ? selectedCompany.bankDetails
      : [],
  };
  const quotationData = { vehicle, lead };
  const vouchers = await ReceivedVoucher.find({
    quotationRef: { $in: [vehicleQuotationId, String(vehicle._id)] },
  }).lean();
  const receivedAmount = sumReceivedFromClient(vouchers);

  const isBookingMail = type === "booking";
  const companyMetaWithCustom = {
    ...companyMeta,
    receivedAmount,
    signature: customText?.signature,
    ...(isBookingMail ? (customText?.booking || {}) : (customText?.normal || {})),
  };

  const generatedBody = isBookingMail
      ? buildVehicleQuotationBookingEmail(quotationData, companyMetaWithCustom)
      : buildVehicleQuotationPdfPreviewEmail(quotationData, companyMetaWithCustom);

  let body = isBookingMail
      ? generatedBody
      : previewPdfMode
        ? generatedBody
        : String(bodyHtml || "").trim() || generatedBody;

  // Append signature if bodyHtml was used and signature is provided
  if (!isBookingMail && !previewPdfMode && bodyHtml && companyMetaWithCustom.signature) {
    const sig = companyMetaWithCustom.signature.replace(/\n/g, "<br/>");
    if (!body.includes(sig)) {
      body += `<br/><br/>${sig}`;
    }
  }

  const finalSubject =
    subject ||
    (type === "booking"
      ? `Booking Confirmation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`
      : `Quotation ${vehicleQuotationId} - ${vehicle?.basicsDetails?.clientName || "Guest"}`);

  const transporter = nodemailer.createTransport({
    ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
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

  const isBooking = String(type || "").trim().toLowerCase() === "booking";

  const providedReceiptAttachment =
    receiptPdf &&
      typeof receiptPdf === "object" &&
      String(receiptPdf.contentBase64 || "").trim()
      ? {
        filename: String(receiptPdf.filename || "Payment_Receipt.pdf").trim(),
        content: Buffer.from(
          String(receiptPdf.contentBase64).trim(),
          "base64",
        ),
        contentType:
          String(receiptPdf.mimeType || "").trim() || "application/pdf",
      }
      : null;

  const finalAttachments = [];
  if (providedPdfAttachment && !isBooking) {
    finalAttachments.push(providedPdfAttachment);
  }
  if (providedReceiptAttachment && isBooking) {
    finalAttachments.push(providedReceiptAttachment);
  }

  await transporter.sendMail({
    from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
    to,
    cc: cc && String(cc).trim() ? cc : undefined,
    replyTo: selectedCompany?.email || auth.user,
    subject: finalSubject,
    html: body,
    text: body.replace(/<[^>]*>/g, ""),
    attachments: finalAttachments,
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
