import { FlightQuotation } from "../../models/quotation/flightQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getCache, setCache, clearPattern } from "../../utils/cache.js";
import { logActivity } from "../../utils/ActivityLog.js";
import { generateBookingId } from "../../utils/bookingIdGenerator.js";
import { Lead } from "../../models/lead.model.js"
import emailQueue from "../../utils/emailQueue.js";
import Company from "../../models/company.model.js";
import EmailAccount from "../../models/emailAccount.model.js";
import ReceivedVoucher from "../../models/payment.model.js";
import {
    buildFlightQuotationNormalEmail,
    buildFlightQuotationBookingEmail,
} from "../../utils/flightQuotationMailerTemplates.js";
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
        status, // optional from client
        companyId,
        companyName
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

    const defaultPolicies = {
        inclusionPolicy: [
            "Economy class airfare",
            "Applicable airport taxes",
            "Standard baggage allowance as per airline policy"
        ],
        exclusionPolicy: [
            "Any meals or snacks not specified in the inclusions",
            "Seat selection and preferred seating charges",
            "Extra baggage charges beyond the standard allowance",
            "Travel Insurance",
            "Any items of personal nature (tips, laundry, etc.)",
            "Anything not explicitly mentioned in the inclusions"
        ],
        paymentPolicy: [
            "At the time of reservation, a non-refundable booking amount of 20% of package cost + 5% GST is required.",
            "20% at reservation + 100% Flight/Train cost",
            "60% after booking confirmation",
            "Balance before departure"
        ],
        termsAndConditions: [
            "Fares are subject to availability at the time of booking",
            "Tickets are non-refundable and non-changeable unless specified otherwise",
            "Passport must be valid for at least 6 months from the date of travel"
        ]
    };

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
        leadId: lead.leadId,
        policies: defaultPolicies,
        companyId,
        companyName
    });

    await logActivity({
        action: "CREATE",
        model: "FlightQuotation",
        refId: flightQuotationId,
        description: `Flight Quotation ${flightQuotationId} (${clientDetails.clientName}) created by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    // ✅ Send response with quotation + full lead info
    await clearPattern("flightQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    return res.status(201).json(
        new ApiResponse(201, {
            quotation,
            leadDetails: lead,
        }, "Flight quotation created successfully", "database")
    );
});




export const getAllFlightQuotations = asyncHandler(async (req, res) => {
    const cacheKey = "flightQuotations:all";
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(
            new ApiResponse(
                200,
                cachedData,
                "Flight quotations fetched from cache",
                "cache"
            )
        );
    }

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

    await setCache(cacheKey, quotationsWithLead, 3600);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                quotationsWithLead,
                "Flight quotations fetched from database",
                "database"
            )
        );
});



export const getFlightQuotationById = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;

    const cacheKey = `flightQuotation:${flightQuotationId}`;
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(
            new ApiResponse(200, cachedData, "Flight quotation fetched from cache", "cache")
        );
    }

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

    await setCache(cacheKey, responseData, 3600);

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Flight quotation fetched from database", "database"));
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

    await clearPattern(`flightQuotation:${flightQuotationId}`);
    await clearPattern("flightQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Flight quotation updated successfully", "database"));
});

export const deleteFlightQuotationById = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;

    const quotation = await FlightQuotation.findOneAndDelete({ flightQuotationId });

    if (!quotation) throw new ApiError(404, "Flight quotation not found");

    await logActivity({
        action: "DELETE",
        model: "FlightQuotation",
        refId: flightQuotationId,
        description: `Flight Quotation ${flightQuotationId} (${quotation.clientDetails?.clientName || 'Guest'}) deleted by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    await clearPattern(`flightQuotation:${flightQuotationId}`);
    await clearPattern("flightQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Flight quotation deleted successfully"));
});


// ✅ Confirm Flight Quotation API
export const confirmFlightQuotation = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;
    const { pnrList, finalFareList, finalFare, baseFare, gstType, gstPercentage, gstAmount, companyId, companyName } = req.body;

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
    }

    // ✅ Update GST and Fare fields
    if (baseFare !== undefined) quotation.baseFare = baseFare;
    if (gstType) quotation.gstType = gstType;
    if (gstPercentage !== undefined) quotation.gstPercentage = gstPercentage;
    if (gstAmount !== undefined) quotation.gstAmount = gstAmount;
    if (companyId) quotation.companyId = companyId;
    if (companyName) quotation.companyName = companyName;

    // ✅ Update total final fare
    quotation.finalFare = finalFare
        ? Number(finalFare) // ✅ Use manual value if provided
        : (Number(baseFare || 0) + Number(gstAmount || 0)) || finalFareList.reduce((sum, fare) => sum + Number(fare || 0), 0);

    quotation.status = "Confirmed";

    // Generate bookingId if not already present
    if (!quotation.bookingId) {
        const selectedCompany = await resolveCompanyForEmail({
            companyId: req.body?.companyId,
            companyName: req.body?.companyName,
        });
        const compName = selectedCompany?.companyName || quotation.companyName || "Iconic Travel";
        quotation.companyName = compName;
        if (selectedCompany?._id) quotation.companyId = selectedCompany._id;
        quotation.bookingId = await generateBookingId(compName);
    }

    await quotation.save();

    await logActivity({
        action: "CONFIRM",
        model: "FlightQuotation",
        refId: flightQuotationId,
        description: `Flight Quotation ${flightQuotationId} (${quotation.clientDetails?.clientName || 'Guest'}) confirmed by ${req.user?.name || 'System'}`,
        user: req.user?.name || "System",
    });

    await clearPattern(`flightQuotation:${flightQuotationId}`);
    await clearPattern("flightQuotations:all");
    await clearPattern("quotations:search:*");
    await clearPattern("quotations:stats");
    await clearPattern('dashboard:stats:*');

    return res.status(200).json(
        new ApiResponse(200, quotation, "Flight quotation confirmed successfully", "database")
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
    ? process.env.app_pass2 || process.env.EMAIL_PASS2 || process.env.app_pass || process.env.EMAIL_PASS
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

export const previewFlightQuotationMail = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;
    const companyId = req.query.companyId;
    const companyName = req.query.companyName;

    const quotation = await FlightQuotation.findOne({ flightQuotationId }).lean();
    if (!quotation) throw new ApiError(404, "Flight quotation not found");

    const lead = await Lead.findOne({
        "personalDetails.fullName": quotation?.clientDetails?.clientName,
    }).lean();

    const selectedCompany = await resolveCompanyForEmail({ companyId, companyName });
    const vouchers = await ReceivedVoucher.find({ quotationRef: flightQuotationId }).lean();
    const receivedAmount = sumReceivedFromClient(vouchers);

    const companyMeta = {
        companyName: selectedCompany?.companyName || "Iconic Travel",
        companyWebsite: selectedCompany?.companyWebsite || "",
        termsAndConditions: selectedCompany?.termsConditions || "",
        cancellationPolicyUrl: selectedCompany?.cancellationPolicy || "",
        paymentLink: selectedCompany?.paymentLink || "",
        bankDetails: Array.isArray(selectedCompany?.bankDetails) ? selectedCompany.bankDetails : [],
        receivedAmount,
        signature: selectedCompany?.signature || `Warm Regards,\n${selectedCompany?.companyName || "Iconic Travel"}`
    };

    const quotationData = { quotation, lead };
    const normalBody = buildFlightQuotationNormalEmail(quotationData, companyMeta);
    const bookingBody = buildFlightQuotationBookingEmail(quotationData, companyMeta);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                flightQuotationId,
                normal: {
                    subject: `Quotation ${flightQuotationId} - ${quotation?.personalDetails?.fullName || "Guest"}`,
                    body: normalBody,
                },
                booking: {
                    subject: `Booking Confirmation ${flightQuotationId} - ${quotation?.personalDetails?.fullName || "Guest"}`,
                    body: bookingBody,
                },
            },
            "Flight quotation email preview generated",
        ),
    );
});

export const sendFlightQuotationMail = asyncHandler(async (req, res) => {
    const { flightQuotationId } = req.params;
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
        receiptPdf,
    } = req.body || {};

    if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new ApiError(400, "Receiver email is required");
    }

    const quotation = await FlightQuotation.findOne({ flightQuotationId }).lean();
    if (!quotation) throw new ApiError(404, "Flight quotation not found");

    const lead = await Lead.findOne({
        "personalDetails.fullName": quotation?.clientDetails?.clientName,
    }).lean();
    const selectedCompany = await resolveCompanyForEmail({ companyId, companyName });
    const auth = await resolveMailAuth(senderAccount, selectedCompany);
    if (!auth.user || !auth.pass) {
        throw new ApiError(500, "Sender email credentials are not configured for selected account");
    }

    const vouchers = await ReceivedVoucher.find({ quotationRef: flightQuotationId }).lean();
    const receivedAmount = sumReceivedFromClient(vouchers);
    const isBookingMail = type === "booking";
    const companyMeta = {
        companyName: selectedCompany?.companyName || "Iconic Travel",
        companyWebsite: selectedCompany?.companyWebsite || "",
        termsAndConditions: selectedCompany?.termsConditions || "",
        cancellationPolicyUrl: selectedCompany?.cancellationPolicy || "",
        paymentLink: selectedCompany?.paymentLink || "",
        bankDetails: Array.isArray(selectedCompany?.bankDetails) ? selectedCompany.bankDetails : [],
        receivedAmount,
        signature: customText?.signature || selectedCompany?.signature || `Warm Regards,\n${selectedCompany?.companyName || "Iconic Travel"}`,
        ...(isBookingMail ? (customText?.booking || {}) : (customText?.normal || {})),
    };

    const quotationData = { quotation, lead };
    const generatedBody = isBookingMail
            ? buildFlightQuotationBookingEmail(quotationData, companyMeta)
            : buildFlightQuotationNormalEmail(quotationData, companyMeta);
    let body = String(bodyHtml || "").trim() || generatedBody;

    // Append signature if bodyHtml was used and signature is provided
    if (bodyHtml && companyMeta.signature) {
        const isHtmlSig = /<[a-z][\s\S]*>/i.test(companyMeta.signature);
        const sig = isHtmlSig ? companyMeta.signature : companyMeta.signature.replace(/\n/g, "<br/>");
        
        // Use a simpler check for existing signature to avoid duplication
        const cleanSig = sig.replace(/\s/g, "");
        const cleanBody = body.replace(/\s/g, "");
        
        if (!cleanBody.includes(cleanSig)) {
            body += `<br/><br/>${sig}`;
        }
    }
    const finalSubject =
        subject ||
        (type === "booking"
            ? `Booking Confirmation ${flightQuotationId} - ${quotation?.personalDetails?.fullName || "Guest"}`
            : `Quotation ${flightQuotationId} - ${quotation?.personalDetails?.fullName || "Guest"}`);

    const smtpConfig = {
      ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
      auth: { user: auth.user, pass: auth.pass },
    };

    const isBooking = String(type || "").trim().toLowerCase() === "booking";
    const attachments = [];

    // Handle normal PDF attachment (Quotation PDF)
    if (pdfAttachment && pdfAttachment.contentBase64 && String(pdfAttachment.contentBase64).trim()) {
        attachments.push({
            filename: String(pdfAttachment.filename || "quotation.pdf").trim(),
            content: Buffer.from(String(pdfAttachment.contentBase64).trim(), "base64"),
            contentType: String(pdfAttachment.mimeType || "").trim() || "application/pdf",
        });
    }

    // Handle Receipt PDF attachment
    if (receiptPdf && receiptPdf.contentBase64 && String(receiptPdf.contentBase64).trim()) {
        attachments.push({
            filename: String(receiptPdf.filename || "Payment_Receipt.pdf").trim(),
            content: Buffer.from(String(receiptPdf.contentBase64).trim(), "base64"),
            contentType: String(receiptPdf.mimeType || "").trim() || "application/pdf",
        });
    }

    try {
        console.log(`Attempting to send flight ${type} email to: ${to} using account: ${auth.user}`);
        
        const mailOptions = {
            from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
            to,
            cc: cc && String(cc).trim() ? cc : undefined,
            replyTo: selectedCompany?.email || auth.user,
            subject: finalSubject,
            html: body,
            text: body.replace(/<[^>]*>/g, ""),
            attachments: attachments,
        };

        await emailQueue.add('sendEmail', { mailOptions, smtpConfig });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    flightQuotationId,
                    type,
                    senderAccount: senderAccount || "gmail1",
                },
                "Mail sent successfully",
            ),
        );
    } catch (mailError) {
        console.error("Nodemailer Error Details:", {
            message: mailError.message,
            code: mailError.code,
            command: mailError.command,
            response: mailError.response,
            stack: mailError.stack
        });
        
        throw new ApiError(
            500, 
            `Failed to send email: ${mailError.message}. Check SMTP configuration or attachment size.`
        );
    }
});



