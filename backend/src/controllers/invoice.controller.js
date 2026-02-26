import Invoice from "../models/invoice.model.js";
import Company from "../models/company.model.js";
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



//Update Invoice
export const updateInvoice = async (req, res) => {
    try {
        const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
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
        const deleted = await Invoice.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Invoice not found" });
        res.json({ message: "Invoice deleted successfully" });
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