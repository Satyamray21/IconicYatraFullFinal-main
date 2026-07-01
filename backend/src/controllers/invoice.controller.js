import Invoice from "../models/invoice.model.js";
import { clearPattern } from "../utils/cache.js";
import Company from "../models/company.model.js";
import EmailAccount from "../models/emailAccount.model.js";
import nodemailer from "nodemailer";
import { logActivity } from "../utils/ActivityLog.js";
import {
    renumberInvoicesAfterDeleteForMonth,
    getCalendarMonthKey,
    getMonthBoundsForKey,
    backfillInvoiceSerialsForExisting,
    getFinancialYearFromDate,
    getCalendarMonthKey as getInvoiceYearMonthKey,
} from "../utils/invoiceSerial.utils.js";
// Create Invoice
export const createInvoice = async (req, res) => {
    try {
        const { companyId } = req.body;

        if (!companyId) {
            return res.status(400).json({ message: "companyId is required" });
        }

        // Check if company exists
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Create invoice
        const invoice = new Invoice(req.body);
        const savedInvoice = await invoice.save();

        // Populate company details in response
        const populatedInvoice = await Invoice.findById(savedInvoice._id)
            .populate("companyId", "companyName address phone email gstin stateCode logo authorizedSignatory");

        await logActivity({
            action: "CREATE",
            model: "Invoice",
            refId: populatedInvoice.invoiceNo,
            description: `Invoice ${populatedInvoice.invoiceNo} generated for ${populatedInvoice.billingName || 'Client'} by ${req.user?.name || 'System'}`,
            user: req.user?.name || "System",
        });
        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            invoice: populatedInvoice,
        });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await clearPattern('dashboard:stats:*');
    }
};

// Get All Invoices
export const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Single Invoice
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: "companyId",
                select:
                    "companyName address phone email gstin stateCode logo authorizedSignatory termsConditions", // ✅ fixed
            });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const IMMUTABLE_INVOICE_KEYS = [
    "advancedReceiptNo",
    "financialYear",
    "invoiceNo",
    "invoiceSerialNo",
];

//Update Invoice
export const updateInvoice = async (req, res) => {
    try {
        const body = { ...req.body };
        for (const key of IMMUTABLE_INVOICE_KEYS) {
            delete body[key];
        }

        const updated = await Invoice.findByIdAndUpdate(req.params.id, body, {
            new: true,
        });
        if (!updated) return res.status(404).json({ message: "Invoice not found" });
        
        await logActivity({
            action: "UPDATE",
            model: "Invoice",
            refId: updated.invoiceNo,
            description: `Invoice ${updated.invoiceNo} for ${updated.billingName || 'Client'} was updated by ${req.user?.name || 'System'}`,
            user: req.user?.name || "System",
        });

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    } finally {
        await clearPattern('dashboard:stats:*');
    }
};

// Delete Invoice
export const deleteInvoice = async (req, res) => {
    try {
        const existing = await Invoice.findById(req.params.id)
            .select("companyId invoiceDate invoiceNo billingName")
            .lean();
        if (!existing) return res.status(404).json({ message: "Invoice not found" });

        const { companyId, invoiceDate } = existing;
        const yearMonth = getCalendarMonthKey(invoiceDate);

        await Invoice.findByIdAndDelete(req.params.id);
        await renumberInvoicesAfterDeleteForMonth(companyId, yearMonth);

        await logActivity({
            action: "DELETE",
            model: "Invoice",
            refId: existing.invoiceNo,
            description: `Invoice ${existing.invoiceNo} for ${existing.billingName || 'Client'} deleted by ${req.user?.name || 'System'}`,
            user: req.user?.name || "System",
        });

        await clearPattern('dashboard:stats:*');

        res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Repair AR sequence 001..n for a month (e.g. after delete outside API or timezone issues). Body: { companyId, yearMonth: "2026-01" } */
export const renumberInvoiceMonth = async (req, res) => {
    try {
        const { companyId, yearMonth } = req.body || {};
        if (!companyId || !yearMonth) {
            return res.status(400).json({
                message: "companyId and yearMonth (YYYY-MM) are required",
            });
        }
        if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
            return res.status(400).json({ message: "yearMonth must be YYYY-MM" });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        await renumberInvoicesAfterDeleteForMonth(companyId, yearMonth);

        const { start, end } = getMonthBoundsForKey(yearMonth);
        const updated = await Invoice.find({
            companyId,
            invoiceDate: { $gte: start, $lte: end },
        })
            .sort({ invoiceDate: 1, createdAt: 1 })
            .select("invoiceNo advancedReceiptNo invoiceDate")
            .lean();

        res.json({
            success: true,
            message: `Renumbered advanced receipts for ${yearMonth}`,
            count: updated.length,
            invoices: updated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Normalize AR-…-### for every calendar month that has invoices.
 * Optional body: { companyId } — limit to one company; omit to repair all companies.
 */
export const renumberCompanyAdvancedReceipts = async (req, res) => {
    try {
        const { companyId } = req.body || {};
        let companyIds;
        if (companyId) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }
            companyIds = [company._id];
        } else {
            companyIds = await Invoice.distinct("companyId");
        }

        const repaired = [];
        const repairedInvoiceNumbers = [];
        for (const compId of companyIds) {
            const cidStr = compId.toString();
            const company = await Company.findById(compId).select("companyName").lean();
            const shortName = company?.companyName
                ? company.companyName
                      .split(" ")
                      .map((w) => w[0].toUpperCase())
                      .join("")
                      .substring(0, 2)
                : "CO";
            const rows = await Invoice.find({ companyId: compId })
                .select("_id invoiceDate createdAt")
                .lean();
            const months = new Set();
            const fyGroups = new Map();
            for (const row of rows) {
                months.add(getCalendarMonthKey(row.invoiceDate));
                const fy = getFinancialYearFromDate(row.invoiceDate);
                if (!fyGroups.has(fy)) fyGroups.set(fy, []);
                fyGroups.get(fy).push(row);
            }
            for (const ym of months) {
                await renumberInvoicesAfterDeleteForMonth(cidStr, ym);
                repaired.push({ companyId: cidStr, yearMonth: ym });
            }
            for (const [financialYear, invoices] of fyGroups.entries()) {
                invoices.sort(
                    (a, b) =>
                        new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime() ||
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                
                // Pass 1: Set temporary invoiceNo to avoid E11000 duplicate key errors
                for (let i = 0; i < invoices.length; i++) {
                    const row = invoices[i];
                    await Invoice.updateOne(
                        { _id: row._id },
                        { $set: { invoiceNo: `TEMP-${row._id}` } }
                    );
                }

                // Pass 2: Set final sequenced invoiceNo
                for (let i = 0; i < invoices.length; i++) {
                    const row = invoices[i];
                    const serialNum = i + 1;
                    const serial = String(serialNum).padStart(3, "0");
                    const yyyymm = getInvoiceYearMonthKey(row.invoiceDate).replace("-", "");
                    const invoiceNo = `${shortName}-${financialYear}/${yyyymm}-${serial}`;
                    await Invoice.updateOne(
                        { _id: row._id },
                        {
                            $set: {
                                financialYear,
                                invoiceSerialNo: serialNum,
                                invoiceNo,
                            },
                        }
                    );
                }
                repairedInvoiceNumbers.push({
                    companyId: cidStr,
                    financialYear,
                    invoices: invoices.length,
                    startSerial: 1,
                    endSerial: invoices.length,
                });
            }
        }

        res.json({
            success: true,
            message:
                "Advanced receipt and invoice numbers repaired. AR runs 001..n per month and invoice serial runs 001..n per financial year.",
            repairedCount: repaired.length,
            repaired,
            repairedInvoiceNumberCount: repairedInvoiceNumbers.length,
            repairedInvoiceNumbers,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getNextInvoiceNumber = async (req, res) => {
    try {
        const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        let nextNo = 1;

        if (lastInvoice?.invoiceNo) {
            const match = lastInvoice.invoiceNo.match(/ICYR_(\d+)/);
            if (match) nextNo = parseInt(match[1]) + 1;
        }

        const formatted = `ICYR_${String(nextNo).padStart(4, "0")}`;
        res.json({ nextNumber: formatted });
    } catch (error) {
        res.status(500).json({ message: "Error generating invoice number" });
    }
};

/**
 * One-time repair for existing invoices to fill invoiceSerialNo.
 * Body: { companyId?: string, year?: number }
 */
export const backfillExistingInvoiceSerials = async (req, res) => {
    try {
        const { companyId, year } = req.body || {};
        if (companyId) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }
        }
        if (year !== undefined && !Number.isFinite(Number(year))) {
            return res.status(400).json({ message: "year must be a number" });
        }

        const result = await backfillInvoiceSerialsForExisting({
            companyId: companyId || null,
            year: year !== undefined ? Number(year) : null,
        });

        return res.status(200).json({
            success: true,
            message:
                "Existing invoice serials backfilled (financial-year sequence starts from 001 per company).",
            ...result,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

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

export const sendInvoiceMail = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      to,
      cc,
      subject,
      bodyHtml,
      senderAccount,
      companyId,
      companyName,
      pdfAttachment,
    } = req.body || {};

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ message: "Receiver email is required" });
    }

    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const selectedCompany = await resolveCompanyForEmail({ companyId, companyName });
    const auth = await resolveMailAuth(senderAccount, selectedCompany);
    if (!auth.user || !auth.pass) {
      return res.status(500).json({ message: "Sender email credentials are not configured" });
    }

    const smtpConfig = {
      ...(auth.service ? { service: auth.service } : { host: auth.host || "smtp.gmail.com", port: auth.port || 587, secure: auth.secure ?? false }),
      auth: { user: auth.user, pass: auth.pass },
    };

    const attachments = [];
    if (pdfAttachment && pdfAttachment.contentBase64) {
      attachments.push({
        filename: pdfAttachment.filename || "invoice.pdf",
        content: Buffer.from(String(pdfAttachment.contentBase64).trim(), "base64"),
        contentType: String(pdfAttachment.mimeType || "").trim() || "application/pdf",
      });
    }

    const transporter = nodemailer.createTransport(smtpConfig);

    const mailOptions = {
      from: `"${selectedCompany?.companyName || "Iconic Travel"}" <${auth.user}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      cc: cc || undefined,
      subject: subject || `Invoice ${invoice.invoiceNo} - ${invoice.billingName}`,
      html: bodyHtml || "Please find attached your invoice.",
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    // Optionally log this activity
    if (req.user) {
      await logActivity({
        action: "Email Sent",
        model: "Invoice",
        refId: invoice.invoiceNo,
        user: req.user._id,
        description: `Invoice email sent to ${to} by ${req.user.name}`
      });
    }

    return res.status(200).json({ success: true, message: "Email sent successfully", info });
  } catch (error) {
    console.error("Error in sendInvoiceMail:", error);
    return res.status(500).json({ message: error.message || "Failed to send email" });
  }
};