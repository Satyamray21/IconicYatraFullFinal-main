import QuickQuotation from "../../models/quotation/quickQuotation.model.js";
import { Lead } from "../../models/lead.model.js";
import Package from "../../models/package.model.js";
import Company from "../../models/company.model.js";
import EmailAccount from "../../models/emailAccount.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import ReceivedVoucher from "../../models/payment.model.js";
import GlobalSettings from "../../models/globalSettings.model.js";
import Bank from "../../models/bankDetails.js";
import {
  adaptQuickQuotationForCustomMailer,
  buildCustomQuotationNormalEmail,
  buildCustomQuotationPdfPreviewEmail,
  buildCustomQuotationBookingEmail,
  buildHotelConfirmationEmail,
  packageTotals,
} from "../../utils/customQuotationMailerTemplates.js";
import { buildHotelConfirmationPdf, quotationWithConfirmedHotels } from "../../utils/hotelConfirmationPdf.js";
import { buildPaymentReceiptPdf } from "../../utils/paymentReceiptPdf.js";
import emailQueue from "../../utils/emailQueue.js";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getCache, setCache, clearPattern } from "../../utils/cache.js";
import { logActivity } from "../../utils/ActivityLog.js";
import { generateBookingId } from "../../utils/bookingIdGenerator.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Resolve local image path (logo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../../../public/logoiconic.jpg");

// Read image and convert to Base64
const logoBase64 = fs.existsSync(logoPath)
  ? fs.readFileSync(logoPath).toString("base64")
  : null;

const logoSrc = logoBase64
  ? `data:image/png;base64,${logoBase64}`
  : "https://www.iconicyatra.com/static/media/logo.7803301b9efb5c74d172.png";

/**
 * Dashboard lists show quoteId as QT- + last 6 hex chars of Mongo _id.
 * Accept either full ObjectId or that display ref in :id route params.
 */
async function resolveQuickQuotationMongoId(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (/^[a-f\d]{24}$/i.test(s)) return s;

  // Support ICYR_Q_ prefix (e.g. ICYR_Q_0013)
  if (/^ICYR_Q_\d+$/i.test(s)) {
    const quotation = await QuickQuotation.findOne({ quickQuotationId: s }).select("_id").lean();
    return quotation ? String(quotation._id) : null;
  }

  const m = /^QT-([a-f\d]{6})$/i.exec(s);
  if (!m) return null;
  const suffix = m[1].toLowerCase();
  const rows = await QuickQuotation.aggregate([
    {
      $project: { _id: 1, suf: { $substrCP: [{ $toString: "$_id" }, 18, 6] } },
    },
    { $match: { $expr: { $eq: [{ $toLower: "$suf" }, suffix] } } },
    { $limit: 2 },
  ]);
  if (rows.length === 0) return null;
  if (rows.length > 1) {
    throw new ApiError(
      400,
      "Multiple quotations match this short id; use the full quotation id from the list.",
    );
  }
  return String(rows[0]._id);
}

function mergeQuotationDetails(prev = {}, next = {}) {
  const out = { ...prev, ...next };
  if (next.signatureDetails && typeof next.signatureDetails === "object") {
    out.signatureDetails = {
      ...(prev.signatureDetails && typeof prev.signatureDetails === "object"
        ? prev.signatureDetails
        : {}),
      ...next.signatureDetails,
    };
  }
  if (next.rooms && typeof next.rooms === "object") {
    out.rooms = { ...(prev.rooms || {}), ...next.rooms };
  }
  if (next.companyMargin && typeof next.companyMargin === "object") {
    out.companyMargin = {
      ...(prev.companyMargin || {}),
      ...next.companyMargin,
    };
  }
  if (next.taxes && typeof next.taxes === "object") {
    out.taxes = { ...(prev.taxes || {}), ...next.taxes };
  }
  if (next.mattress && typeof next.mattress === "object") {
    out.mattress = { ...(prev.mattress || {}), ...next.mattress };
  }
  return out;
}

function mergePackageSnapshot(prev = {}, next = {}) {
  if (!next || typeof next !== "object") return prev || {};
  const out = { ...prev, ...next };
  if (next.quotationDetails && typeof next.quotationDetails === "object") {
    out.quotationDetails = mergeQuotationDetails(
      prev.quotationDetails || {},
      next.quotationDetails,
    );
  }
  return out;
}

// ==========================
// Create QuickQuotation
// ==========================
export const createQuickQuotation = async (req, res) => {
  try {
    const {
      customerName,
      title,
      email,
      phone,
      clientLocation,
      packageId,
      adults,
      children,
      kids,
      infants,
      message,
      transportation,
      totalCost,
      calculationMethod,
      perPersonAdultCost,
      perPersonChildCost,
      perPersonMattressCost,
      standardAdultCost,
      standardChildCost,
      standardMattressCost,
      deluxeAdultCost,
      deluxeChildCost,
      deluxeMattressCost,
      superiorAdultCost,
      superiorChildCost,
      superiorMattressCost,
      pickupPoint,
      dropPoint,
      arrivalDate,
      departureDate,
      numberOfPax,
      noOfRooms,
      noOfMattress,
      roomType,
      noOfVehicles,
      transportationCost,
      hotelTotalCost,
      standardCost,
      deluxeCost,
      superiorCost,
      mealPlan,
      packageSnapshot: packageSnapshotInput,
    } = req.body;

    if (!customerName || !email || !packageId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const packageSnapshot = {
      ...pkg,
      ...(packageSnapshotInput && typeof packageSnapshotInput === "object"
        ? packageSnapshotInput
        : {}),
      clientLocation:
        (clientLocation && String(clientLocation).trim()) ||
        packageSnapshotInput?.clientLocation ||
        "",
      quotationDetails: {
        ...(pkg?.quotationDetails && typeof pkg.quotationDetails === "object"
          ? pkg.quotationDetails
          : {}),
        arrivalDate: arrivalDate || "",
        departureDate: departureDate || "",
        numberOfPax: Number(numberOfPax) || 0,
        noOfRooms: Number(noOfRooms) || 0,
        noOfMattress: Number(noOfMattress) || 0,
        roomType: roomType || "",
        transportationCost: Number(transportationCost) || 0,
        hotelTotalCost: Number(hotelTotalCost) || 0,
        standardCost: Number(standardCost) || 0,
        deluxeCost: Number(deluxeCost) || 0,
        superiorCost: Number(superiorCost) || 0,
        mealPlan:
          mealPlan ||
          packageSnapshotInput?.mealPlan ||
          pkg?.mealPlan?.planType ||
          "",
      },
    };

    const newQuotation = await QuickQuotation.create({
      customerName,
      title: title || "Mr",
      email,
      phone,
      clientLocation: String(clientLocation || "").trim(),
      packageId,
      adults,
      children,
      kids: kids ?? 0,
      infants: infants ?? 0,
      noOfRooms: noOfRooms ?? 0,
      noOfMattress: noOfMattress ?? 0,
      noOfVehicles: noOfVehicles ?? 0,
      roomType: roomType || "",
      message,

      pickupPoint: pickupPoint || "",
      dropPoint: dropPoint || "",

      transportation: transportation || pkg.transportation || "",
      totalCost: totalCost || 0,
      calculationMethod: calculationMethod || "package",
      perPersonAdultCost: perPersonAdultCost || 0,
      perPersonChildCost: perPersonChildCost || 0,
      perPersonMattressCost: perPersonMattressCost || 0,

      standardAdultCost: standardAdultCost || 0,
      standardChildCost: standardChildCost || 0,
      standardMattressCost: standardMattressCost || 0,

      deluxeAdultCost: deluxeAdultCost || 0,
      deluxeChildCost: deluxeChildCost || 0,
      deluxeMattressCost: deluxeMattressCost || 0,

      superiorAdultCost: superiorAdultCost || 0,
      superiorChildCost: superiorChildCost || 0,
      superiorMattressCost: superiorMattressCost || 0,

      packageSnapshot,
      policy: pkg.policy,
    });

    const shortRef = `QT-${newQuotation._id.toString().slice(-6).toUpperCase()}`;
    await logActivity({
      action: "CREATE",
      model: "QuickQuotation",
      refId: shortRef,
      description: `New quick quotation ${shortRef} created for ${customerName} by ${req.user?.name || 'Admin'}`,
      user: req.user?.name || "Admin",
    });

    await clearPattern("quickQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    res.status(201).json(
      new ApiResponse(201, newQuotation, "Quick quotation created successfully", "database")
    );
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Get All Quick Quotations
// ==========================
export const getAllQuickQuotations = async (req, res) => {
  try {
    const cacheKey = "quickQuotations:all";
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { count: cachedData.length, quotations: cachedData },
          "Quotations fetched from cache",
          "cache"
        )
      );
    }

    const quotations = await QuickQuotation.find()
      .populate("packageId", "packageName price duration")
      .sort({ createdAt: -1 });

    await setCache(cacheKey, quotations, 3600); // Cache for 1 hour

    res.status(200).json(
      new ApiResponse(
        200,
        { count: quotations.length, quotations },
        "Quotations fetched from database",
        "database"
      )
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Get Single Quick Quotation
// ==========================
export const getQuickQuotationById = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });

    const cacheKey = `quickQuotation:${mongoId}`;
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      return res.status(200).json(
        new ApiResponse(200, cachedData, "Quotation fetched from cache", "cache")
      );
    }

    const quotation =
      await QuickQuotation.findById(mongoId).populate("packageId");

    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const quotationData = quotation.toObject ? quotation.toObject() : quotation;
    await setCache(cacheKey, quotationData, 3600); // Cache for 1 hour

    res.status(200).json(
      new ApiResponse(200, quotationData, "Quotation fetched from database", "database")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Update Quick Quotation
// ==========================
export const updateQuickQuotation = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });

    const existing = await QuickQuotation.findById(mongoId).lean();
    if (!existing)
      return res.status(404).json({ message: "Quotation not found" });

    const body = { ...req.body };
    if (body.packageSnapshot && typeof body.packageSnapshot === "object") {
      body.packageSnapshot = mergePackageSnapshot(
        existing.packageSnapshot || {},
        body.packageSnapshot,
      );
    }
    if (body.policy && typeof body.policy === "object") {
      body.policy = {
        ...(existing.policy && typeof existing.policy === "object"
          ? existing.policy
          : {}),
        ...body.policy,
      };
    }
    if (body.vendorDetails && typeof body.vendorDetails === "object") {
      body.vendorDetails = {
        ...(existing.vendorDetails || {}),
        ...body.vendorDetails,
      };
    }

    const updated = await QuickQuotation.findByIdAndUpdate(mongoId, body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Quotation not found" });

    // Invalidate Cache
    await clearPattern(`quickQuotation:${mongoId}`);
    await clearPattern("quickQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");

    const shortRef = `QT-${updated._id.toString().slice(-6).toUpperCase()}`;
    await logActivity({
      action: "UPDATE",
      model: "QuickQuotation",
      refId: shortRef,
      description: `Quick quotation ${shortRef} updated by ${req.user?.name || 'Admin'}`,
      user: req.user?.name || "Admin",
    });

    await clearPattern('dashboard:stats:*');
    res.status(200).json(
      new ApiResponse(200, updated, "Quotation updated successfully", "database")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/** POST multipart field `bannerImage` — Cloudinary URL saved on packageSnapshot.bannerImage */
export const uploadQuickQuotationBanner = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });
    const file = req.file;
    if (!file?.path)
      return res.status(400).json({ message: "bannerImage file required" });

    const uploaded = await uploadOnCloudinary(file.path, file.mimetype);
    if (!uploaded?.secure_url) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    const existing = await QuickQuotation.findById(mongoId).lean();
    if (!existing)
      return res.status(404).json({ message: "Quotation not found" });

    const mergedSnap = mergePackageSnapshot(existing.packageSnapshot || {}, {
      bannerImage: uploaded.secure_url,
    });

    const updated = await QuickQuotation.findByIdAndUpdate(
      mongoId,
      { packageSnapshot: mergedSnap },
      { new: true },
    );

    await clearPattern('dashboard:stats:*');
    res
      .status(200)
      .json({ message: "Banner image uploaded", quotation: updated });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/** POST multipart field `image` — returns { url } for itinerary day images */
export const uploadQuickQuotationDayImage = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });
    const file = req.file;
    if (!file?.path)
      return res.status(400).json({ message: "image file required" });

    const uploaded = await uploadOnCloudinary(file.path, file.mimetype);
    if (!uploaded?.secure_url) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    res.status(200).json({ url: uploaded.secure_url });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Delete Quick Quotation
// ==========================
export const deleteQuickQuotation = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });

    const deleted = await QuickQuotation.findByIdAndDelete(mongoId);
    if (!deleted)
      return res.status(404).json({ message: "Quotation not found" });

    await logActivity({
      action: "DELETE",
      model: "QuickQuotation",
      refId: `QT-${mongoId.slice(-6).toUpperCase()}`,
      description: `Quick quotation QT-${mongoId.slice(-6).toUpperCase()} (${deleted.customerName}) deleted by ${req.user?.name || 'Admin'}`,
      user: req.user?.name || "Admin",
    });

    await clearPattern(`quickQuotation:${mongoId}`);
    await clearPattern("quickQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Manual Mail Sender (Callable)
// ==========================
export const sendQuotationMail = async (
  toEmail,
  customerName,
  pkg,
  quotation,
  company,
) => {
  try {
    const smtpConfig = {
      service: "gmail",
      auth: {
        user: company.email, // <-- dynamic email
        pass: company.appPassword, // <-- dynamic app password
      },
    };

    const htmlContent = getQuotationEmailTemplate(
      customerName,
      pkg,
      quotation,
      company,
    );

    const mailOptions = {
      from: `"${company.companyName}" <${company.email}>`, // dynamic sender
      to: toEmail,
      subject: `Your Quotation for ${pkg?.title || pkg?.packageName}`,
      html: htmlContent,
      attachments: company.logoCid
        ? [
            {
              filename: company.logoFilename,
              path: company.logoPath,
              cid: company.logoCid,
            },
          ]
        : [],
    };
    await emailQueue.add('sendEmail', { mailOptions, smtpConfig });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// ==========================
// Send Quotation Mail (Manual Trigger)
// ==========================
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
        return { user: account.email, pass: account.appPassword };
      }
    } catch (e) {
      console.warn("EmailAccount lookup failed:", e.message);
    }
  }

  // 2. If company has its own email and app password (legacy/direct), use them
  if (selectedCompany?.email && selectedCompany?.emailAppPassword) {
    return {
      user: selectedCompany.email,
      pass: selectedCompany.emailAppPassword,
    };
  }

  // 3. Fallback to environment variables (gmail1/gmail2)
  const useSecondary = String(senderAccount || "").toLowerCase() === "gmail2";
  const user = useSecondary
    ? process.env.gmail2 || process.env.gmail
    : process.env.gmail;
  const pass = useSecondary
    ? process.env.app_pass2 ||
      process.env.EMAIL_PASS2 ||
      process.env.app_pass ||
      process.env.EMAIL_PASS
    : process.env.app_pass || process.env.EMAIL_PASS;
  return { user, pass };
};

const sumReceivedFromClient = (vouchers) => {
  let receivedFromClient = 0;
  for (const v of vouchers || []) {
    const n = Number(v?.amount) || 0;
    const isReceive = v?.drCr === "Cr" || v?.paymentType === "Receive Voucher";
    if (isReceive) receivedFromClient += n;
  }
  return receivedFromClient;
};

const attachCompanyLogoFields = (company) => {
  const c = { ...company };
  c.logoPath = c.logo ? path.join(__dirname, "../../../public/", c.logo) : null;
  c.logoCid = c.logo ? "companyLogo" : null;
  c.logoFilename = c.logo || null;
  c.appPassword =
    c.email === process.env.gmail
      ? process.env.app_pass
      : process.env.EMAIL_PASS;
  return c;
};

const loadEmailMetaQuick = async (company) => {
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

const stripHtml = (html = "") =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractIntroSummaryForPdf = (text = "") => {
  const normalized = String(text || "").replace(/\r/g, "");
  const strictMatch = normalized.match(
    /(Dear[\s\S]*?SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only\.\.)/i,
  );
  if (strictMatch?.[1]) {
    return strictMatch[1].trim();
  }

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  const detailsIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("details of tour package"),
  );
  if (detailsIdx > 0) return lines.slice(0, detailsIdx).join("\n\n").trim();
  return lines.slice(0, 24).join("\n\n").trim();
};

const buildPdfAttachment = async ({ subject, htmlBody, quotationRef }) => {
  const fullText = stripHtml(htmlBody);
  const text = extractIntroSummaryForPdf(fullText) || fullText;
  const safeRef = String(quotationRef || "quick_quotation").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
  const filename = `${safeRef}_quotation.pdf`;

  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: subject || "Quick Quotation",
          Author: "Iconic Yatra",
        },
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        resolve({
          filename,
          content: Buffer.concat(chunks),
          contentType: "application/pdf",
        });
      });
      doc.on("error", reject);

      doc.fontSize(14).text(subject || "Quick Quotation", { align: "left" });
      doc.moveDown(0.8);
      doc
        .fontSize(10)
        .fillColor("#666666")
        .text(`Reference: ${quotationRef || "-"}`);
      doc.moveDown(1);
      doc
        .fillColor("#000000")
        .fontSize(11)
        .text(text || "No content available", {
          align: "left",
          lineGap: 3,
        });
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

const readBookingOverridesFromRequest = (reqBody = {}) => {
  const customText = reqBody?.customText || {};
  const booking = customText?.booking || {};
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
    ...(customText?.dueDate !== undefined
      ? { dueDate: customText.dueDate }
      : {}),
    ...(customText?.paymentDueDate !== undefined
      ? { dueDate: customText.paymentDueDate }
      : {}),
    ...(customText?.receivedAmount !== undefined
      ? { receivedAmount: customText.receivedAmount }
      : {}),
    ...(customText?.dueAmount !== undefined
      ? { dueAmount: customText.dueAmount }
      : {}),
    ...(topLevel.nextPayableAmount !== undefined
      ? { nextPayableAmount: topLevel.nextPayableAmount }
      : {}),
    ...(topLevel.dueDate !== undefined ? { dueDate: topLevel.dueDate } : {}),
    ...(topLevel.receivedAmount !== undefined
      ? { receivedAmount: topLevel.receivedAmount }
      : {}),
    ...(topLevel.dueAmount !== undefined
      ? { dueAmount: topLevel.dueAmount }
      : {}),
    ...booking,
  };
};

async function mergeQuickBookingEmailPayload(shaped, meta, reqBody, mongoId) {
  const bookingOverrides = readBookingOverridesFromRequest(reqBody || {});
  const vouchers = await ReceivedVoucher.find({
    quotationRef: String(mongoId),
  }).lean();
  const receivedAmount = sumReceivedFromClient(vouchers);
  const { total } = packageTotals(shaped);
  const dueAmount = Math.max(0, total - receivedAmount);
  return {
    ...meta,
    receivedAmount,
    dueAmount,
    ...bookingOverrides,
  };
}

/** Same templates as custom quotation (hotels, itinerary, policies, booking payment block). */
export const previewQuickQuotationMail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const mongoId = await resolveQuickQuotationMongoId(id);
  if (!mongoId) throw new ApiError(404, "Quotation not found");
  const quotation = await QuickQuotation.findById(mongoId)
    .populate("packageId")
    .lean();
  if (!quotation) throw new ApiError(404, "Quotation not found");

  const selectedCompany = await resolveCompanyForEmail({
    companyId: req.body?.companyId,
    companyName: req.body?.companyName,
  });
  if (!selectedCompany) {
    throw new ApiError(400, "Company not found for preview");
  }

  const shaped = adaptQuickQuotationForCustomMailer(quotation);
  const meta = await loadEmailMetaQuick(selectedCompany);
  const normalBody = buildCustomQuotationNormalEmail(
    shaped,
    req.body?.customText?.normal || {},
    meta,
  );
  const bookingPayload = await mergeQuickBookingEmailPayload(
    shaped,
    meta,
    req.body,
    mongoId,
  );
  const bookingBody = buildCustomQuotationBookingEmail(shaped, bookingPayload);

  const shortRef = `QT-${mongoId.slice(-6)}`;
  const pkgTitle = quotation?.packageSnapshot?.displayTitle || quotation?.packageSnapshot?.title || quotation?.packageSnapshot?.packageName || "Quick Quotation";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        normal: {
          subject: `Quotation - ${pkgTitle}`,
          body: normalBody,
        },
        booking: {
          subject: `Booking Confirmation - ${pkgTitle}`,
          body: bookingBody,
        },
      },
      "Quick quotation email preview generated",
    ),
  );
});

/** Dashboard parity with custom QT: to/cc/type/subject/bodyHtml/senderAccount */
export const sendQuickQuotationEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const mongoId = await resolveQuickQuotationMongoId(id);
  if (!mongoId) throw new ApiError(404, "Quotation not found");
  const {
    to,
    cc,
    type = "normal",
    subject,
    bodyHtml,
    senderAccount,
    companyId,
    companyName,
    pdfAttachment,
    previewPdfMode = false,
    receiptPdf,
    paymentVoucherId,
  } = req.body || {};

  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new ApiError(400, "Receiver email is required");
  }

  const isBookingMail = String(type || "").trim().toLowerCase() === "booking";

  const quotation = await QuickQuotation.findById(mongoId)
    .populate("packageId")
    .lean();
  if (!quotation) throw new ApiError(404, "Quotation not found");

  const selectedCompany = await resolveCompanyForEmail({
    companyId,
    companyName,
  });
  if (!selectedCompany) throw new ApiError(400, "Company not found");

  const shaped = adaptQuickQuotationForCustomMailer(quotation);
  const meta = await loadEmailMetaQuick(selectedCompany);

  const generatedBody =
    isBookingMail
      ? buildCustomQuotationBookingEmail(
          shaped,
          await mergeQuickBookingEmailPayload(shaped, meta, req.body, mongoId),
        )
      : buildCustomQuotationNormalEmail(
          shaped,
          req.body?.customText?.normal || {},
          meta,
        );
  const previewPdfBody = buildCustomQuotationPdfPreviewEmail(
    shaped,
    req.body?.customText?.normal || {},
    meta,
  );
  const body =
    isBookingMail
      ? generatedBody
      : previewPdfMode
        ? previewPdfBody
        : String(bodyHtml || "").trim() || generatedBody;

  const shortRef = `QT-${mongoId.slice(-6)}`;
  const pkgTitle = quotation?.packageSnapshot?.displayTitle || quotation?.packageSnapshot?.title || quotation?.packageSnapshot?.packageName || "Quick Quotation";
  const finalSubject =
    subject ||
    (isBookingMail
      ? `Booking Confirmation - ${pkgTitle}`
      : `Quotation - ${pkgTitle}`);

  const auth = await resolveMailAuth(senderAccount, selectedCompany);
  if (!auth.user || !auth.pass) {
    throw new ApiError(
      500,
      "Sender email credentials are not configured for selected account",
    );
  }

  const smtpConfig = {
    ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
    auth: { user: auth.user, pass: auth.pass },
  };

  const shouldAttachItinerary = !isBookingMail;
  const attachments = [];

  // 1. Itinerary Attachment (Normal mail only)
  if (shouldAttachItinerary) {
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

    const generatedPdfAttachment = providedPdfAttachment
      ? null
      : await buildPdfAttachment({
          subject: finalSubject,
          htmlBody: body,
          quotationRef: `QT-${mongoId.slice(-6)}`,
        });

    if (providedPdfAttachment) attachments.push(providedPdfAttachment);
    else if (generatedPdfAttachment) attachments.push(generatedPdfAttachment);
  }

  // 2. Receipt Attachment (Booking mail only)
  if (isBookingMail) {
    if (receiptPdf && receiptPdf.contentBase64 && String(receiptPdf.contentBase64).trim()) {
        attachments.push({
            filename: receiptPdf.filename || "Payment_Receipt.pdf",
            content: Buffer.from(String(receiptPdf.contentBase64).trim(), "base64"),
            contentType: "application/pdf",
        });
    } else if (paymentVoucherId) {
        const voucher = await ReceivedVoucher.findById(paymentVoucherId).populate("companyId");
        if (voucher) {
            const receiptPdfBuffer = await buildPaymentReceiptPdf(voucher, voucher.companyId || selectedCompany);
            attachments.push({
                filename: `Payment_Receipt_${voucher.invoiceId || paymentVoucherId}.pdf`,
                content: receiptPdfBuffer,
                contentType: "application/pdf",
            });
        }
    }
  }

  try {
    const mailOptions = {
      from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
      to,
      cc: cc && cc.length ? cc : undefined,
      replyTo: selectedCompany?.email || auth.user,
      subject: finalSubject,
      html: body,
      text: body.replace(/<[^>]*>/g, ""), // fallback
      attachments: attachments,
    };
    await emailQueue.add('sendEmail', { mailOptions, smtpConfig });

    await logActivity({
      action: "Status Changed",
      model: "QuickQuotation",
      refId: shortRef,
      description: `Quotation ${shortRef} mailed to ${to} (${type})`,
      user: req.user?.name || "Admin",
    });
  } catch (error) {
    console.error("Quick QT mail error:", error);
    throw new ApiError(500, "Failed to send email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          quotationId: mongoId,
          type,
          senderAccount: senderAccount || "gmail1",
        },
        "Mail sent successfully",
      ),
    );
});

export const finalizeQuickQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const mongoId = await resolveQuickQuotationMongoId(id);
  if (!mongoId) throw new ApiError(404, "Quotation not found");
  const { finalizedPackage, finalizedVendorsWithAmounts } = req.body || {};
  const quotation = await QuickQuotation.findById(mongoId);
  if (!quotation) throw new ApiError(404, "Quotation not found");

  quotation.finalizeStatus = "finalized";
  quotation.finalizedAt = new Date();

  // Generate bookingId if not already present
  if (!quotation.bookingId) {
    const selectedCompany = await resolveCompanyForEmail({
      companyId: req.body?.companyId,
      companyName: req.body?.companyName,
    });
    const companyName = selectedCompany?.companyName || "Iconic Travel";
    quotation.companyName = companyName;
    if (selectedCompany?._id) quotation.companyId = selectedCompany._id;
    quotation.bookingId = await generateBookingId(companyName);
  }
  if (finalizedPackage != null && String(finalizedPackage).trim()) {
    quotation.finalizedPackage = String(finalizedPackage).trim();
  }
  if (
    Array.isArray(finalizedVendorsWithAmounts) &&
    finalizedVendorsWithAmounts.length > 0
  ) {
    quotation.finalizedVendorsWithAmounts = finalizedVendorsWithAmounts.map(
      (vendor) => ({
        vendorName: vendor.vendorName || "",
        vendorType: vendor.vendorType || "Other",
        amount: Number(vendor.amount) || 0,
        remarks: vendor.remarks || "",
      }),
    );
  }
  await quotation.save();

  if (quotation.customerName) {
    const lead = await Lead.findOne({ "personalDetails.fullName": quotation.customerName }).sort({ createdAt: -1 });
    if (lead && lead.status !== 'Confirmed') {
      lead.status = 'Confirmed';
      await lead.save();
      await clearPattern('leads:*');
      await clearPattern(`leads:id:${lead.leadId}`);
    }
  }

  await clearPattern(`quickQuotation:${mongoId}`);
  await clearPattern("quickQuotations:all");
  await clearPattern("quotations:search:*");
  await clearPattern("quotations:stats");
  await clearPattern('dashboard:stats:*');

  return res
    .status(200)
    .json(new ApiResponse(200, quotation, "Quotation finalized successfully"));
});

export const sendQuickQuotationMail = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName } = req.body; // <-- Now taking company Name

    const mongoId = await resolveQuickQuotationMongoId(id);
    if (!mongoId)
      return res.status(404).json({ message: "Quotation not found" });

    const quotation =
      await QuickQuotation.findById(mongoId).populate("packageId");
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const pkg = quotation.packageSnapshot || quotation.packageId;

    // 🔥 Find company by name
    const company = await Company.findOne({ companyName }).lean();

    if (!company) {
      return res.status(400).json({
        message: `Company '${companyName}' not found`,
      });
    }

    Object.assign(company, attachCompanyLogoFields(company));

    // Send email
    const emailResult = await sendQuotationMail(
      quotation.email,
      quotation.customerName,
      pkg,
      quotation,
      company,
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: emailResult.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Mail sent using company: ${company.companyName}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// Fixed Modern Mail Template (API Data Compatible)
// ==========================
const getQuotationEmailTemplate = (customerName, pkg, quotation, company) => {
  // Format total cost with commas
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Contact for pricing";
    return "₹" + Math.round(amount).toLocaleString("en-IN") + " INR";
  };

  // Calculate values
  const totalAdults = quotation?.adults || 0;
  const totalChildren = quotation?.children || 0;
  const pickupPoint = quotation?.pickupPoint || "Not Provided";
  const dropPoint = quotation?.dropPoint || "Not Provided";

  const baseCost = quotation?.totalCost || 0;
  const totalWithGST = Math.round(baseCost);

  const packageName = pkg?.title || pkg?.packageName || "Tour Package";
  const destination = pkg?.sector || pkg?.destinationCountry || "N/A";

  // Duration Calculation
  let totalNights = 0;
  if (pkg?.stayLocations && Array.isArray(pkg.stayLocations)) {
    totalNights = pkg.stayLocations.reduce(
      (total, location) => total + (location.nights || 0),
      0,
    );
  }

  const nights = totalNights || (pkg?.days ? pkg.days.length - 1 : 0);
  const duration = nights + 1 || (pkg?.days ? pkg.days.length : 0);

  const mealPlan = pkg?.mealPlan?.planType || "CP (Breakfast Only)";
  const arrivalCity = pkg?.arrivalCity || "Airport / Railway Station";
  const departureCity = pkg?.departureCity || "Airport / Railway Station";

  // Hotel Options HTML
  let hotelOptionsHTML = "";

  if (
    pkg?.destinationNights &&
    Array.isArray(pkg.destinationNights) &&
    pkg.destinationNights.length > 0
  ) {
    hotelOptionsHTML = pkg.destinationNights
      .map((d) => {
        const hotels = d.hotels
          ?.map(
            (h) =>
              `${h.category?.toUpperCase() || ""} – ${h.hotelName} (₹${h.pricePerPerson})`,
          )
          .join("<br/>");

        return `
          <li>
            <strong>${d.destination} (${d.nights} Nights)</strong><br/>
            ${hotels || ""}
          </li>
        `;
      })
      .join("");
  } else {
    if (pkg?.stayLocations && Array.isArray(pkg.stayLocations)) {
      pkg.stayLocations.forEach((location) => {
        const cityName = location.city || "City";
        const nights = location.nights || 1;

        hotelOptionsHTML += `
          <li><strong>${cityName} (${nights} Night${nights > 1 ? "s" : ""}):</strong> Premium Deluxe Hotel (3★ Category)</li>`;
      });
    } else {
      hotelOptionsHTML = `<li><strong>All Destinations:</strong> Premium Deluxe Hotels (3★ Category)</li>`;
    }
  }

  // Itinerary HTML
  let itineraryHTML = "";
  if (pkg?.days && Array.isArray(pkg.days)) {
    itineraryHTML = pkg.days
      .map((day, index) => {
        return `
        <div style="margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #eee;">
          <strong>Day ${index + 1}: ${day.title || ""}</strong><br/>
          ${day.notes ? `<div style="margin-top:5px;">${day.notes}</div>` : ""}
          ${
            day.aboutCity
              ? `<div style="margin-top:5px; color:#555;">${day.aboutCity}</div>`
              : ""
          }
        </div>`;
      })
      .join("");
  }

  // Policies
  const cleanHTML = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const inclusionPolicy =
    pkg?.policy?.inclusionPolicy?.[0] ||
    quotation?.policy?.inclusionPolicy?.[0] ||
    "";
  const exclusionPolicy =
    pkg?.policy?.exclusionPolicy?.[0] ||
    quotation?.policy?.exclusionPolicy?.[0] ||
    "";
  const paymentPolicy =
    pkg?.policy?.paymentPolicy?.[0] ||
    quotation?.policy?.paymentPolicy?.[0] ||
    "";
  const cancellationPolicy =
    pkg?.policy?.cancellationPolicy?.[0] ||
    quotation?.policy?.cancellationPolicy?.[0] ||
    "";
  const termsConditions =
    pkg?.policy?.termsAndConditions?.[0] ||
    quotation?.policy?.termsAndConditions?.[0] ||
    "";

  // Transportation
  const transportationValue =
    quotation?.transportation || pkg?.transportation || "As per itinerary";

  // ⭐ FINAL TEMPLATE WITH DYNAMIC COMPANY DATA ⭐
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;color:#000;background:#fff;padding:0;margin:0;line-height:1.7;">

    <!-- HEADER -->
    <div style="background:#0b5394;color:#fff;text-align:center;padding:25px 15px;">
      <img src="cid:companyLogo" alt="${company.companyName}" style="height:80px;margin-bottom:10px;border-radius:10px;">
      <h2 style="margin:5px 0 0;font-size:24px;">GREETING FROM ${company.companyName}!!!</h2>
      <p style="margin:5px 0;font-size:15px;">Your Trusted Travel Partner</p>

      <p style="text-align:center;margin:40px 0;">
        <a href="${company.website}" target="_blank"
          style="background:#ffc107;color:#000;padding:12px 25px;text-decoration:none;font-weight:600;border-radius:5px;">
          Visit Our Official Website
        </a>
      </p>
    </div>

    <!-- BODY -->
    <div style="padding:40px 30px;">
      <p>Dear <strong>${customerName}</strong>,</p>
      <p>Greetings from <strong>${company.companyName}!!!</strong><br>
      Please find below your customized <strong>${packageName}</strong> details and costing.</p>

      <!-- PACKAGE SUMMARY -->
      <div style="background:#f9f9f9;padding:20px;border-left:4px solid #0b5394;margin:25px 0;">
        <h3 style="margin-top:0;color:#0b5394;">Package Summary</h3>
        <p><strong>Destination:</strong> ${destination}</p>
        <p><strong>No. of Pax:</strong> ${totalAdults} Adults, ${totalChildren} Child</p>
        <p><strong>Duration:</strong> ${nights} Nights / ${duration} Days</p>
        <p><strong>Plan:</strong> ${mealPlan}</p>
        <p><strong>Transportation:</strong> ${transportationValue}</p>
        <p><strong>Pick-Up:</strong> ${pickupPoint}</p>
        <p><strong>Drop:</strong> ${dropPoint}</p>
        <p><strong>Total Package Cost:</strong> ${formatCurrency(totalWithGST)}</p>
      </div>

      <!-- HOTEL DETAILS -->
      <h3 style="color:#0b5394;">🏨 Hotel Options</h3>
      <ul>${hotelOptionsHTML}</ul>

      <!-- ITINERARY -->
      <h3 style="color:#0b5394;">🗓️ Day Wise Itinerary</h3>
      <div>${itineraryHTML}</div>

      <!-- INCLUSION -->
      <h3 style="color:#0b5394;">✅ Cost Inclusions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${inclusionPolicy ? cleanHTML(inclusionPolicy) : "Not Provided"}
      </div>

      <!-- EXCLUSION -->
      <h3 style="color:#0b5394;">❌ Cost Exclusions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${exclusionPolicy ? cleanHTML(exclusionPolicy) : "Not Provided"}
      </div>

      <!-- TERMS -->
      <h3 style="color:#0b5394;">📋 Terms & Conditions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${termsConditions ? cleanHTML(termsConditions) : "Not Provided"}
      </div>

      <!-- CANCELLATION -->
      <h3 style="color:#0b5394;">📜 Cancellation Policy</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${cancellationPolicy ? cleanHTML(cancellationPolicy) : "Not Provided"}
      </div>

      <!-- PAYMENT -->
      <h3 style="color:#0b5394;">💳 Payment Policy</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${paymentPolicy ? cleanHTML(paymentPolicy) : "Not Provided"}
      </div>

      <!-- SIGNATURE -->
      <div style="margin-top:50px;text-align:left;">
        <p><strong>Thanks & Best Regards,</strong></p>
        <p><strong>${company.companyName}</strong><br>
        Email: ${company.email}<br>
        Phone: ${company.phone || ""}<br>
        Website: <a href="${company.website}" style="color:#0b5394;">${company.website}</a></p>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f1f1f1;text-align:center;padding:15px;font-size:12px;color:#555;">
      Corporate Office: ${company.address || ""}
    </div>
  </div>
`;
};
export const saveQuickConfirmedHotels = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    const { confirmedHotels } = req.body;

    const quotation = await QuickQuotation.findById(mongoId);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.confirmedHotels = confirmedHotels;
    await quotation.save();

    // Clear cache
    if (mongoId) {
      await clearPattern(`quickQuotation:${mongoId}`);
    }
    await clearPattern("quickQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    res.status(200).json({ success: true, message: "Confirmed hotels saved successfully", data: quotation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendQuickHotelConfirmationMail = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    const { toEmail, cc, subject, bodyHtml, mailType, nextPayableAmount, paymentDueDate, customText, senderAccount, paymentVoucherId, receiptPdf, confirmedHotels } = req.body;

    const quotation = await QuickQuotation.findById(mongoId).lean();
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const outputQuotation = quotationWithConfirmedHotels(quotation, confirmedHotels);

    const company = await resolveCompanyForEmail({ 
      companyId: req.body.companyId || req.user?.companyId, 
      companyName: req.body.companyName || "Iconic Travel" 
    });

    if (!company) {
      return res.status(404).json({ message: "Company settings not found" });
    }

    const meta = await loadEmailMetaQuick(company);
    const pkg = adaptQuickQuotationForCustomMailer(quotation);
    const td = pkg?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const destinations = qd?.destinations || pkg?.destinationNights || [];
    
    const adults = Number(quotation?.adults || qd?.adults) || 0;
    const children = Number(quotation?.children || qd?.children) || 0;
    const kids = Number(quotation?.kids || qd?.kids) || 0;
    
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
      startDate: quotation?.packageSnapshot?.quotationDetails?.arrivalDate,
      endDate: quotation?.packageSnapshot?.quotationDetails?.departureDate,
      packageTitle: quotation?.packageSnapshot?.title,
      destinationSummary: quotation?.packageSnapshot?.destinationSummary,
      stayLocations: quotation?.packageSnapshot?.stayLocations || [],
      pickupPoint: td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint,
      dropPoint: td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint,
      mealPlan: qd?.mealPlan || quotation?.mealPlan
    };

    if (nextPayableAmount !== undefined) options.nextPayableAmount = nextPayableAmount;
    if (paymentDueDate !== undefined) options.dueDate = paymentDueDate;

    let htmlBody = bodyHtml;
    if (!htmlBody) {
      if (mailType === "booking") {
        const shaped = adaptQuickQuotationForCustomMailer(quotation);
        const metaInfo = await loadEmailMetaQuick(company);
        const bookingPayload = await mergeQuickBookingEmailPayload(
          shaped,
          metaInfo,
          {
            nextPayableAmount,
            dueDate: paymentDueDate,
            ...customText,
          },
          mongoId
        );
        htmlBody = buildCustomQuotationBookingEmail(shaped, bookingPayload);
      } else {
        htmlBody = buildHotelConfirmationEmail(outputQuotation, options);
      }
    }

    const pdfBuffer = await buildHotelConfirmationPdf(outputQuotation, options);
    const auth = await resolveMailAuth(senderAccount, company);
    const smtpConfig = {
      ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
      auth: { user: auth.user, pass: auth.pass },
    };

    const mailOptions = {
      from: `"${options.companyName}" <${auth.user}>`,
      to: toEmail || quotation.email,
      cc: cc && cc.length ? cc : undefined,
      subject: subject || (mailType === "booking" ? `Booking Confirmation - ${quotation?.packageSnapshot?.displayTitle || quotation?.packageSnapshot?.title || "Quick Quotation"}` : `Hotel Confirmation Voucher`),
      html: htmlBody,
      attachments: [
        {
          filename: `Hotel_Confirmation_${quotation.quickQuotationId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        }
      ]
    };

    if (receiptPdf && receiptPdf.contentBase64) {
      mailOptions.attachments.push({
        filename: receiptPdf.filename || "Payment_Receipt.pdf",
        content: Buffer.from(receiptPdf.contentBase64, "base64"),
        contentType: "application/pdf",
      });
    } else if (paymentVoucherId) {
      const voucher = await ReceivedVoucher.findById(paymentVoucherId).populate("companyId");
      if (voucher) {
        const receiptPdfBuffer = await buildPaymentReceiptPdf(voucher, voucher.companyId || company);
        mailOptions.attachments.push({
          filename: `Payment_Receipt_${voucher.invoiceId || paymentVoucherId}.pdf`,
          content: receiptPdfBuffer,
          contentType: "application/pdf",
        });
      }
    }

    await emailQueue.add('sendEmail', { mailOptions, smtpConfig });

    res.status(200).json({ success: true, message: "Hotel confirmation mail sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const previewQuickHotelConfirmation = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);
    const { customText, mailType, nextPayableAmount, paymentDueDate, confirmedHotels } = req.body;

    const quotation = await QuickQuotation.findById(mongoId).lean();
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const outputQuotation = quotationWithConfirmedHotels(quotation, confirmedHotels);

    const company = await resolveCompanyForEmail({ 
      companyId: req.body.companyId || req.user?.companyId, 
      companyName: req.body.companyName || "Iconic Travel" 
    });

    const meta = await loadEmailMetaQuick(company);
    const pkg = adaptQuickQuotationForCustomMailer(quotation);
    const td = pkg?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const destinations = qd?.destinations || pkg?.destinationNights || [];
    
    const adults = Number(quotation?.adults || qd?.adults) || 0;
    const children = Number(quotation?.children || qd?.children) || 0;
    const kids = Number(quotation?.kids || qd?.kids) || 0;
    
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
      startDate: quotation?.packageSnapshot?.quotationDetails?.arrivalDate,
      endDate: quotation?.packageSnapshot?.quotationDetails?.departureDate,
      packageTitle: quotation?.packageSnapshot?.title,
      destinationSummary: quotation?.packageSnapshot?.destinationSummary,
      stayLocations: quotation?.packageSnapshot?.stayLocations || [],
      pickupPoint: td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint,
      dropPoint: td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint,
      mealPlan: qd?.mealPlan || quotation?.mealPlan
    };

    if (nextPayableAmount !== undefined) options.nextPayableAmount = nextPayableAmount;
    if (paymentDueDate !== undefined) options.dueDate = paymentDueDate;

    let htmlBody;
    if (mailType === "booking") {
      const shaped = adaptQuickQuotationForCustomMailer(quotation);
      const metaInfo = await loadEmailMetaQuick(company);
      const bookingPayload = await mergeQuickBookingEmailPayload(
        shaped,
        metaInfo,
        {
          nextPayableAmount,
          dueDate: paymentDueDate,
          ...customText,
        },
        mongoId
      );
      htmlBody = buildCustomQuotationBookingEmail(shaped, bookingPayload);
    } else {
      htmlBody = buildHotelConfirmationEmail(outputQuotation, options);
    }

    res.status(200).json({ success: true, data: { html: htmlBody } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadQuickHotelConfirmationPdf = async (req, res) => {
  try {
    const mongoId = await resolveQuickQuotationMongoId(req.params.id);

    const quotation = await QuickQuotation.findById(mongoId).lean();
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const company = await resolveCompanyForEmail({ 
      companyId: req.query.companyId || req.user?.companyId, 
      companyName: req.query.companyName || "Iconic Travel" 
    });

    if (!company) {
      return res.status(404).json({ message: "Company settings not found" });
    }

    const meta = await loadEmailMetaQuick(company);
    const pkg = adaptQuickQuotationForCustomMailer(quotation);
    const td = pkg?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const destinations = qd?.destinations || pkg?.destinationNights || [];

    const adults = Number(quotation?.adults || qd?.adults) || 0;
    const children = Number(quotation?.children || qd?.children) || 0;
    const kids = Number(quotation?.kids || qd?.kids) || 0;

    const options = {
      ...meta,
      ...company,
      guestsLine: `${adults} Adults, ${children + kids} Child`,
      roomsLine: `${qd?.rooms?.numberOfRooms || 1} ${qd?.rooms?.sharingType || "Double sharing"}`,
      packageType: quotation?.finalizedPackage || "Family Tour Package",
      duration: {
        nights: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0),
        days: destinations.reduce((sum, d) => sum + (Number(d?.nights) || 0), 0) + 1
      },
      startDate: quotation?.packageSnapshot?.quotationDetails?.arrivalDate,
      endDate: quotation?.packageSnapshot?.quotationDetails?.departureDate,
      packageTitle: quotation?.packageSnapshot?.title,
      destinationSummary: quotation?.packageSnapshot?.destinationSummary,
      stayLocations: quotation?.packageSnapshot?.stayLocations || [],
      pickupPoint: td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint,
      dropPoint: td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint,
      mealPlan: qd?.mealPlan || quotation?.mealPlan
    };

    const pdfBuffer = await buildHotelConfirmationPdf(quotation, options);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Hotel_Confirmation_${quotation.quotationId || "Voucher"}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
