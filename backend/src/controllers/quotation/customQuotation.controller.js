import { CustomQuotation } from "../../models/quotation/customQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { getCache, setCache, clearPattern } from "../../utils/cache.js";
import { logActivity } from "../../utils/ActivityLog.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Company from "../../models/company.model.js";
import EmailAccount from "../../models/emailAccount.model.js";
import Bank from "../../models/bankDetails.js";
import GlobalSettings from "../../models/globalSettings.model.js";
import {
  buildCustomQuotationNormalEmail,
  buildCustomQuotationPdfPreviewEmail,
  buildCustomQuotationBookingEmail,
  buildHotelConfirmationEmail,
  packageTotals,
} from "../../utils/customQuotationMailerTemplates.js";
import ReceivedVoucher from "../../models/payment.model.js";
import { buildHotelConfirmationPdf } from "../../utils/hotelConfirmationPdf.js";

// Counter Schema and Model - defined in the same file
const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Helper to generate quotationId with counter
const generateQuotationId = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "customQuotation" },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true, runValidators: true },
    );

    const sequenceNumber = counter.sequence;
    return `ICYR_CQ_${sequenceNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating quotation ID with counter:", error);

    // Fallback: get the highest existing quotationId
    try {
      const lastQuotation = await CustomQuotation.findOne().sort({
        createdAt: -1,
      });

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
        currentStep: 1,
      });

      await logActivity({
        action: "CREATE",
        model: "CustomQuotation",
        refId: quotationId,
        description: `Custom Quotation ${quotationId} (${req.body.clientDetails?.clientName || 'Guest'}) created by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
      });

      return res
        .status(201)
        .json(
          new ApiResponse(201, quotation, "Quotation created successfully"),
        );
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.quotationId
      ) {
        // Duplicate key error, retry with new ID
        retries++;
        console.warn(
          `Duplicate quotationId detected, retry ${retries}/${maxRetries}`,
        );

        if (retries === maxRetries) {
          throw new ApiError(
            500,
            "Failed to create quotation after multiple attempts. Please try again.",
          );
        }
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 100 * retries));
      } else {
        // Some other error, throw it
        throw error;
      }
    } finally {
      await clearPattern('dashboard:stats:*');
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

  try {
    const updatedQuotation = await CustomQuotation.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedQuotation) {
      throw new ApiError(404, "Quotation not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedQuotation, "Quotation updated successfully"),
      );
  } catch (error) {
    throw error;
  } finally {
    await clearPattern('dashboard:stats:*');
  }
});

/** Partial update by business quotationId (e.g. ICYR_CQ_0001) — used from finalize / admin UI */
export const updateCustomQuotationByQuotationId = asyncHandler(
  async (req, res) => {
    const { quotationId } = req.params;

    try {

      const updatedQuotation = await CustomQuotation.findOneAndUpdate(
        { quotationId },
        { $set: req.body },
        { new: true, runValidators: true },
      );

      if (!updatedQuotation) {
        throw new ApiError(404, "Quotation not found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedQuotation,
            "Quotation updated successfully",
          ),
        );
    } catch (error) {
      throw error;
    } finally {
      await clearPattern('dashboard:stats:*');
    }
  },
);

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
  if (!quotation)
    throw new ApiError(404, `Quotation not found: ${quotationId}`);

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
        bannerImage: bannerUrl,
      };

      // 🔥 Update only provided keys
      Object.keys(fieldsToUpdate).forEach((key) => {
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
              ...(quotation.tourDetails.vehicleDetails?.pickupDropDetails ||
                {}),
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
            // Normalize incoming keys (some clients may send keys with trailing spaces).
            const incomingTourDetails = Object.entries(
              stepData.tourDetails || {},
            ).reduce((acc, [k, v]) => {
              acc[String(k).trim()] = v;
              return acc;
            }, {});

            // Also sanitize already-saved malformed keys on existing documents
            // (e.g. "vendorDetails " from previous bad writes).
            const currentTourDetailsRaw =
              typeof quotation.tourDetails?.toObject === "function"
                ? quotation.tourDetails.toObject()
                : { ...(quotation.tourDetails || {}) };
            const currentTourDetails = {};
            Object.entries(currentTourDetailsRaw || {}).forEach(([k, v]) => {
              const trimmed = String(k).trim();
              // Skip malformed vendorDetails variants; we'll rebuild from clean source below.
              if (trimmed === "vendorDetails" && k !== "vendorDetails") {
                return;
              }
              currentTourDetails[trimmed] = v;
            });

            // Prevent Mongoose cast errors when vendorDetails comes as undefined/non-object.
            const rawVendorDetails =
              incomingTourDetails.vendorDetails ??
              incomingTourDetails["vendorDetails "];
            if (
              rawVendorDetails === undefined ||
              rawVendorDetails === null ||
              rawVendorDetails === "undefined" ||
              rawVendorDetails === "null" ||
              typeof rawVendorDetails !== "object" ||
              Array.isArray(rawVendorDetails)
            ) {
              delete incomingTourDetails.vendorDetails;
              delete incomingTourDetails["vendorDetails "];
            } else {
              incomingTourDetails.vendorDetails = {
                vendorType: rawVendorDetails.vendorType || undefined,
                hotelVendorName: rawVendorDetails.hotelVendorName || undefined,
                vehicleVendorName:
                  rawVendorDetails.vehicleVendorName || undefined,
              };
              delete incomingTourDetails["vendorDetails "];
            }

            const mergedTourDetails = {
              ...currentTourDetails,
              ...incomingTourDetails,
            };
            const mergedVendor = mergedTourDetails.vendorDetails;
            if (
              mergedVendor === undefined ||
              mergedVendor === null ||
              mergedVendor === "undefined" ||
              mergedVendor === "null" ||
              typeof mergedVendor !== "object" ||
              Array.isArray(mergedVendor)
            ) {
              delete mergedTourDetails.vendorDetails;
            }

            quotation.tourDetails = mergedTourDetails;

            if (incomingTourDetails.quotationDetails) {
              quotation.tourDetails.quotationDetails = {
                ...quotation.tourDetails.quotationDetails,
                ...incomingTourDetails.quotationDetails,
              };

              // ✅ Handle packageCalculations merge specifically
              if (incomingTourDetails.quotationDetails.packageCalculations) {
                quotation.tourDetails.quotationDetails.packageCalculations = {
                  // Keep existing package calculations if they exist
                  ...quotation.tourDetails.quotationDetails.packageCalculations,
                  // Merge with new package calculations
                  ...incomingTourDetails.quotationDetails.packageCalculations,

                  // Ensure all package types are properly merged
                  standard: {
                    ...(quotation.tourDetails.quotationDetails
                      .packageCalculations?.standard || {}),
                    ...(incomingTourDetails.quotationDetails.packageCalculations
                      ?.standard || {}),
                  },
                  deluxe: {
                    ...(quotation.tourDetails.quotationDetails
                      .packageCalculations?.deluxe || {}),
                    ...(incomingTourDetails.quotationDetails.packageCalculations
                      ?.deluxe || {}),
                  },
                  superior: {
                    ...(quotation.tourDetails.quotationDetails
                      .packageCalculations?.superior || {}),
                    ...(incomingTourDetails.quotationDetails.packageCalculations
                      ?.superior || {}),
                  },
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

    quotation.currentStep = Math.max(
      Number(quotation.currentStep) || 1,
      stepNumber,
    );

    await quotation.save();
    console.log("✅ Step", stepNumber, "updated successfully!");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          quotation,
          `Step ${stepNumber} updated successfully`,
        ),
      );
  } catch (error) {
    console.error("💥 Error during quotation update:", error);
    throw error;
  } finally {
    await clearPattern('dashboard:stats:*');
  }
}
);

const FINAL_PACKAGES = ["Standard", "Deluxe", "Superior"];

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
  if (senderAccount && senderAccount.length === 24) {
    try {
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

  const user = useSecondary
    ? process.env.gmail2 || process.env.EMAIL_USER2 || process.env.gmail || process.env.EMAIL_USER
    : process.env.gmail || process.env.EMAIL_USER;

  const pass = useSecondary
    ? process.env.app_pass2 ||
    process.env.EMAIL_PASS2 ||
    process.env.app_pass ||
    process.env.EMAIL_PASS
    : process.env.app_pass || process.env.EMAIL_PASS;

  return { user, pass, service: "gmail" };
};


/** Receive vouchers only — matches dashboard `summarizeVoucherAmounts` (Cr / Receive Voucher). */
const sumReceivedFromClient = (vouchers) => {
  let receivedFromClient = 0;
  for (const v of vouchers || []) {
    const n = Number(v?.amount) || 0;
    const isReceive =
      v?.drCr === "Cr" || v?.paymentType === "Receive Voucher";
    if (isReceive) receivedFromClient += n;
  }
  return receivedFromClient;
};

/**
 * Fills booking-mail payment lines when the client does not pass customText.booking amounts.
 * Uses vouchers with quotationRef === quotation.quotationId and package total from packageTotals.
 */
const loadBookingPaymentDefaults = async (quotation) => {
  const quotationId = quotation?.quotationId;
  if (!quotationId) return {};

  const vouchers = await ReceivedVoucher.find({
    quotationRef: quotationId,
  }).lean();
  const receivedAmount = sumReceivedFromClient(vouchers);
  const { total } = packageTotals(quotation);
  const dueAmount = Math.max(0, total - receivedAmount);

  return { receivedAmount, dueAmount };
};

const mergeBookingEmailPayload = async (quotation, meta, bookingCustom = {}) => {
  const defaults = await loadBookingPaymentDefaults(quotation);
  return {
    ...meta,
    ...defaults,
    ...bookingCustom,
  };
};

const readBookingOverridesFromRequest = (reqBody = {}) => {
  const customText = reqBody?.customText || {};
  const booking = customText?.booking || {};
  // Accept fallback keys from older/newer frontend payload shapes.
  const topLevel = {
    nextPayableAmount: reqBody?.nextPayableAmount,
    dueDate: reqBody?.dueDate || reqBody?.paymentDueDate,
    receivedAmount: reqBody?.receivedAmount,
    dueAmount: reqBody?.dueAmount,
  };
  return {
    ...(customText?.nextPayableAmount !== undefined
      ? { nextPayableAmount: customText.nextPayableAmount }
      : {}),
    ...(customText?.dueDate !== undefined ? { dueDate: customText.dueDate } : {}),
    ...(customText?.paymentDueDate !== undefined
      ? { dueDate: customText.paymentDueDate }
      : {}),
    ...(customText?.receivedAmount !== undefined
      ? { receivedAmount: customText.receivedAmount }
      : {}),
    ...(customText?.dueAmount !== undefined ? { dueAmount: customText.dueAmount } : {}),
    ...(topLevel.nextPayableAmount !== undefined
      ? { nextPayableAmount: topLevel.nextPayableAmount }
      : {}),
    ...(topLevel.dueDate !== undefined ? { dueDate: topLevel.dueDate } : {}),
    ...(topLevel.receivedAmount !== undefined
      ? { receivedAmount: topLevel.receivedAmount }
      : {}),
    ...(topLevel.dueAmount !== undefined ? { dueAmount: topLevel.dueAmount } : {}),
    ...booking,
  };
};

const loadEmailMeta = async (company) => {
  const globalSettings = await GlobalSettings.findOne().lean();
  const accountHolder = company?.companyName;
  const bankDetails = accountHolder
    ? await Bank.find({
      accountHolderName: { $regex: `^${accountHolder}$`, $options: "i" },
    }).lean()
    : [];
  const pickHttp = (v) => {
    const s = typeof v === "string" ? v.trim() : "";
    return /^https?:\/\//i.test(s) ? s : "";
  };

  return {
    companyName: company?.companyName || "Iconic Travel",
    companyWebsite: company?.companyWebsite || "",
    globalInclusions: globalSettings?.inclusions || [],
    globalExclusions: globalSettings?.exclusions || [],
    globalCancellationPolicy: globalSettings?.cancellationPolicy || "",
    globalPaymentPolicy: globalSettings?.paymentPolicy || "",
    globalTermsAndConditions: globalSettings?.termsAndConditions || "",
    companyTermsConditions: company?.termsConditions || "",
    companyCancellationPolicyUrl: pickHttp(company?.cancellationPolicy),
    companyPaymentLink: pickHttp(company?.paymentLink),
    bankDetails,
  };
};

export const finalizeCustomQuotation = asyncHandler(async (req, res) => {
  const { quotationId } = req.params;
  const { finalizedPackage, finalizedPackages, finalizedVendorsWithAmounts } = req.body || {};

  try {

    // Support both single and multiple packages
    let packagesToFinalize = [];

    if (Array.isArray(finalizedPackages) && finalizedPackages.length > 0) {
      // Multiple packages - validate each
      packagesToFinalize = finalizedPackages.filter(pkg =>
        pkg && String(pkg).trim() && FINAL_PACKAGES.includes(String(pkg).trim())
      );
      if (packagesToFinalize.length === 0) {
        throw new ApiError(400, "At least one valid package required (Standard, Deluxe, or Superior)");
      }
    } else if (finalizedPackage && String(finalizedPackage).trim()) {
      // Single package (backward compatibility)
      const pkg = String(finalizedPackage).trim();
      if (!FINAL_PACKAGES.includes(pkg)) {
        throw new ApiError(400, `Invalid package: ${pkg}. Must be Standard, Deluxe, or Superior`);
      }
      packagesToFinalize = [pkg];
    } else {
      throw new ApiError(400, "finalizedPackage(s) must be Standard, Deluxe, or Superior");
    }

    const quotation = await CustomQuotation.findOne({ quotationId });
    if (!quotation) {
      throw new ApiError(404, "Quotation not found");
    }

    quotation.finalizeStatus = "finalized";
    quotation.finalizedPackage = packagesToFinalize[0]; // Keep for backward compatibility
    quotation.finalizedPackages = packagesToFinalize; // New field for multiple packages
    quotation.finalizedAt = new Date();

    // Store vendor details with amounts if provided
    if (Array.isArray(finalizedVendorsWithAmounts) && finalizedVendorsWithAmounts.length > 0) {
      quotation.finalizedVendorsWithAmounts = finalizedVendorsWithAmounts.map(vendor => ({
        vendorName: vendor.vendorName || "",
        vendorType: vendor.vendorType || "Other",
        amount: Number(vendor.amount) || 0,
        remarks: vendor.remarks || "",
      }));
    }

    await quotation.save();

    await logActivity({
      action: "FINALIZE",
      model: "CustomQuotation",
      refId: quotationId,
      description: `Custom Quotation ${quotationId} (${quotation.clientDetails?.clientName || 'Guest'}) finalized with ${packagesToFinalize.join(", ")} package(s) by ${req.user?.name || 'System'}`,
      user: req.user?.name || "System",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, quotation, "Quotation finalized successfully"));
  } catch (error) {
    throw error;
  } finally {
    await clearPattern('dashboard:stats:*');
  }
});

// Build email preview from custom quotation data
export const previewCustomQuotationMail = asyncHandler(async (req, res) => {
  const { quotationId } = req.params;
  const quotation = await CustomQuotation.findOne({ quotationId }).lean();
  if (!quotation) throw new ApiError(404, "Quotation not found");

  const customText = req.body?.customText || {};
  const bookingOverrides = readBookingOverridesFromRequest(req.body || {});
  const selectedCompany = await resolveCompanyForEmail({
    companyId: req.body?.companyId,
    companyName: req.body?.companyName,
  });
  const meta = await loadEmailMeta(selectedCompany);
  const normal = buildCustomQuotationNormalEmail(
    quotation,
    customText.normal || {},
    meta,
  );
  const bookingPayload = await mergeBookingEmailPayload(
    quotation,
    meta,
    bookingOverrides,
  );
  const booking = buildCustomQuotationBookingEmail(quotation, bookingPayload);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        quotationId,
        normal: {
          subject: `Quotation ${quotationId} - ${quotation?.clientDetails?.clientName || "Guest"}`,
          body: normal,
        },
        booking: {
          subject: `Booking Confirmation ${quotationId} - ${quotation?.clientDetails?.clientName || "Guest"}`,
          body: booking,
        },
      },
      "Custom quotation email preview generated",
    ),
  );
});

// Send custom quotation email using backend templates
export const sendCustomQuotationMail = asyncHandler(async (req, res) => {
  const { quotationId } = req.params;
  const {
    to,
    cc,
    type = "normal",
    subject,
    bodyHtml,
    customText = {},
    senderAccount,
    companyId,
    companyName,
    pdfAttachment,
    previewPdfMode = false,
  } = req.body || {};

  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new ApiError(400, "Receiver email is required");
  }

  const quotation = await CustomQuotation.findOne({ quotationId }).lean();
  if (!quotation) throw new ApiError(404, "Quotation not found");

  const selectedCompany = await resolveCompanyForEmail({ companyId, companyName });
  const meta = await loadEmailMeta(selectedCompany);

  const generatedBody =
    type === "booking"
      ? buildCustomQuotationBookingEmail(
        quotation,
        await mergeBookingEmailPayload(
          quotation,
          meta,
          readBookingOverridesFromRequest(req.body || {}),
        ),
      )
      : buildCustomQuotationNormalEmail(
        quotation,
        customText.normal || {},
        meta,
      );
  const previewPdfBody = buildCustomQuotationPdfPreviewEmail(
    quotation,
    customText.normal || {},
    meta,
  );
  const body =
    type === "booking"
      ? generatedBody
      : previewPdfMode
        ? previewPdfBody
        : String(bodyHtml || "").trim() || generatedBody;

  const finalSubject =
    subject ||
    (type === "booking"
      ? `Booking Confirmation ${quotationId} - ${quotation?.clientDetails?.clientName || "Guest"}`
      : `Quotation ${quotationId} - ${quotation?.clientDetails?.clientName || "Guest"}`);

  const auth = await resolveMailAuth(senderAccount, selectedCompany);
  if (!auth.user || !auth.pass) {
    throw new ApiError(
      500,
      "Sender email credentials are not configured for selected account",
    );
  }

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

  try {
    await transporter.sendMail({
      from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
      to,
      cc: cc && cc.length ? cc : undefined,
      replyTo: selectedCompany?.email || auth.user,
      subject: finalSubject,
      html: body,
      text: body.replace(/<[^>]*>/g, ""), // fallback
      attachments: (providedPdfAttachment && !isBooking) ? [providedPdfAttachment] : [],
    });
  } catch (error) {
    console.error("Mail Error:", error);
    throw new ApiError(500, "Failed to send email");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        quotationId,
        type,
        senderAccount: senderAccount || "gmail1",
        company: selectedCompany?.companyName || null,
      },
      "Mail sent successfully",
    )
  );
});


// Delete Quotation
export const deleteCustomQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedQuotation = await CustomQuotation.findByIdAndDelete(id);
  if (!deletedQuotation) {
    throw new ApiError(404, "Quotation not found");
  }

  await logActivity({
    action: "DELETE",
    model: "CustomQuotation",
    refId: deletedQuotation.quotationId,
    description: `Custom Quotation ${deletedQuotation.quotationId} (${deletedQuotation.clientDetails?.clientName || 'Guest'}) deleted by ${req.user?.name || 'System'}`,
    user: req.user?.name || "System",
  });

  await clearPattern('dashboard:stats:*');

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedQuotation, "Quotation deleted successfully"),
    );
});

// Optional: Reset counter (for testing purposes)
export const resetQuotationCounter = asyncHandler(async (req, res) => {
  await Counter.findOneAndUpdate(
    { name: "customQuotation" },
    { sequence: 0 },
    { upsert: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Quotation counter reset successfully"));
});

// Update package calculations + optional company margin / discount (finalize costing edit)
export const updatePackageCalculations = asyncHandler(async (req, res) => {
  const { quotationId } = req.params;
  const { packageCalculations, companyMargin, discount, taxes } = req.body;

  try {

    const hasPkg =
      packageCalculations &&
      typeof packageCalculations === "object" &&
      Object.keys(packageCalculations).length > 0;
    const hasMargin = companyMargin && typeof companyMargin === "object";
    const hasDiscount = discount !== undefined && discount !== null;
    const hasTaxes = taxes && typeof taxes === "object";

    if (!hasPkg && !hasMargin && !hasDiscount && !hasTaxes) {
      throw new ApiError(
        400,
        "Provide packageCalculations, companyMargin, discount, and/or taxes",
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
          "Package calculations updated successfully",
        ),
      );
  } catch (error) {
    throw error;
  } finally {
    await clearPattern('dashboard:stats:*');
  }
});
export const saveConfirmedHotels = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedHotels } = req.body;

    const quotation = await CustomQuotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.confirmedHotels = confirmedHotels;
    await quotation.save();

    res.status(200).json(new ApiResponse(200, quotation, "Confirmed hotels saved successfully"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendHotelConfirmationMail = async (req, res) => {
  try {
    const { id } = req.params;
    const { toEmail, customText, senderAccount } = req.body;

    const quotation = await CustomQuotation.findById(id).lean();
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const company = await resolveCompanyForEmail({ 
      companyId: req.body.companyId || req.user?.companyId, 
      companyName: req.body.companyName || "Iconic Travel" 
    });

    if (!company) {
      return res.status(404).json({ message: "Company settings not found" });
    }

    const meta = await loadBookingPaymentDefaults(quotation);
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const destinations = qd?.destinations || [];

    const adults = Number(quotation?.clientDetails?.adults || qd?.adults) || 0;
    const children = Number(quotation?.clientDetails?.children || qd?.children) || 0;
    const kids = Number(quotation?.clientDetails?.kids || qd?.kids) || 0;

    const options = {
      ...meta,
      ...company,
      ...customText,
      guestsLine: `${adults} Adults, ${children + kids} Child`,
      roomsLine: `${qd?.rooms?.numberOfRooms || 1} ${qd?.rooms?.sharingType || "Double sharing"}`,
      packageType: quotation?.finalizedPackage || "Family Tour Package",
      duration: {
        nights: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0),
        days: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0) + 1
      },
      startDate: td?.arrivalDate,
      endDate: td?.departureDate,
      packageTitle: td?.quotationTitle,
      destinationSummary: td?.destinationSummary,
      stayLocations: quotation?.pickupDrop || [],
      pickupPoint: td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint,
      dropPoint: td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint,
      mealPlan: qd?.mealPlan || quotation?.mealPlan
    };

    const htmlBody = buildHotelConfirmationEmail(quotation, options);
    const pdfBuffer = await buildHotelConfirmationPdf(quotation, options);
    
    const auth = await resolveMailAuth(senderAccount, company);

    const transporter = nodemailer.createTransport({
      ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
      auth: { user: auth.user, pass: auth.pass },
    });

    const guestName = quotation?.clientDetails?.clientName || quotation?.customerName || "Guest";

    const mailOptions = {
      from: `"${options.companyName}" <${auth.user}>`,
      to: toEmail || quotation.clientDetails?.email,
      subject: `Hotel Confirmation Voucher - ${quotation.quotationId}`,
      html: `
        <p>Dear ${guestName},</p>
        <p>Please find attached the <b>Hotel Confirmation Voucher</b> for your upcoming trip.</p>
        <p>Thank you for choosing ${options.companyName}.</p>
        <br/>
        ${options.additionalNote ? `<div style="background-color: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;"><b>Note:</b> ${options.additionalNote}</div>` : ''}
        <br/>
        <p>Best Regards,</p>
        <p><b>${options.companyName}</b></p>
      `,
      attachments: [
        {
          filename: `Hotel_Confirmation_${quotation.quotationId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json(new ApiResponse(200, null, "Hotel confirmation mail sent successfully"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const previewHotelConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const { customText } = req.body;

    const quotation = await CustomQuotation.findById(id).lean();
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const company = await resolveCompanyForEmail({ 
      companyId: req.body.companyId || req.user?.companyId, 
      companyName: req.body.companyName || "Iconic Travel" 
    });

    const meta = await loadBookingPaymentDefaults(quotation);
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const destinations = qd?.destinations || [];

    const adults = Number(quotation?.clientDetails?.adults || qd?.adults) || 0;
    const children = Number(quotation?.clientDetails?.children || qd?.children) || 0;
    const kids = Number(quotation?.clientDetails?.kids || qd?.kids) || 0;

    const options = {
      ...meta,
      ...company,
      ...customText,
      guestsLine: `${adults} Adults, ${children + kids} Child`,
      roomsLine: `${qd?.rooms?.numberOfRooms || 1} ${qd?.rooms?.sharingType || "Double sharing"}`,
      packageType: quotation?.finalizedPackage || "Family Tour Package",
      duration: {
        nights: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0),
        days: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0) + 1
      },
      startDate: td?.arrivalDate,
      endDate: td?.departureDate,
      packageTitle: td?.quotationTitle,
      destinationSummary: td?.destinationSummary,
      stayLocations: quotation?.pickupDrop || [],
      pickupPoint: td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint,
      dropPoint: td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint,
      mealPlan: qd?.mealPlan || quotation?.mealPlan
    };

    const htmlBody = buildHotelConfirmationEmail(quotation, options);
    res.status(200).json(new ApiResponse(200, { html: htmlBody }, "Preview generated"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a simplified list of quotations for selection dropdowns
export const getQuotationList = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {};
  
  if (search) {
    query = {
      $or: [
        { quotationId: { $regex: search, $options: "i" } },
        { "clientDetails.clientName": { $regex: search, $options: "i" } }
      ]
    };
  }

  const quotations = await CustomQuotation.find(query)
    .select("_id quotationId clientDetails.clientName")
    .limit(20)
    .sort({ createdAt: -1 });

  const formattedQuotations = quotations.map(q => ({
    _id: q._id,
    quotationId: q.quotationId,
    clientName: q.clientDetails?.clientName || "N/A"
  }));

  return res.status(200).json(new ApiResponse(200, formattedQuotations, "Quotation list fetched successfully"));
});
