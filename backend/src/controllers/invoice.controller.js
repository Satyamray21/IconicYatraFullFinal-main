import Invoice from "../models/invoice.model.js";
import Company from "../models/company.model.js";
import {
    renumberInvoicesAfterDeleteForMonth,
    getCalendarMonthKey,
    getMonthBoundsForKey,
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

        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            invoice: populatedInvoice,
        });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ success: false, message: error.message });
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



const IMMUTABLE_INVOICE_KEYS = ["advancedReceiptNo", "financialYear", "invoiceNo"];

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
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Invoice
export const deleteInvoice = async (req, res) => {
    try {
        const existing = await Invoice.findById(req.params.id)
            .select("companyId invoiceDate")
            .lean();
        if (!existing) return res.status(404).json({ message: "Invoice not found" });

        const { companyId, invoiceDate } = existing;
        const yearMonth = getCalendarMonthKey(invoiceDate);

        await Invoice.findByIdAndDelete(req.params.id);
        await renumberInvoicesAfterDeleteForMonth(companyId, yearMonth);

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
        for (const compId of companyIds) {
            const cidStr = compId.toString();
            const rows = await Invoice.find({ companyId: compId })
                .select("invoiceDate")
                .lean();
            const months = new Set();
            for (const row of rows) {
                months.add(getCalendarMonthKey(row.invoiceDate));
            }
            for (const ym of months) {
                await renumberInvoicesAfterDeleteForMonth(cidStr, ym);
                repaired.push({ companyId: cidStr, yearMonth: ym });
            }
        }

        res.json({
            success: true,
            message: "Advanced receipt numbers set to 001… per company and calendar month (UTC)",
            repairedCount: repaired.length,
            repaired,
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