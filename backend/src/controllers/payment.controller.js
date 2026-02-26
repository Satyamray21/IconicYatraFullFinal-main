import ReceivedVoucher from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Company from "../models/company.model.js";
// @desc    Create a new voucher
export const createVoucher = asyncHandler(async (req, res) => {
    const {
        paymentType,
        date,
        accountType,
        partyName,
        paymentMode,
        referenceNumber,
        particulars,
        amount,
        invoice,
        companyId
    } = req.body; // req.body is now JSON

    if (!date || !accountType || !partyName || !paymentMode || !particulars || !amount) {
        res.status(400);
        throw new Error("Please provide all required fields.");
    }

    const lastVoucher = await ReceivedVoucher.findOne().sort({ receiptNumber: -1 });
    const nextReceiptNumber = lastVoucher?.receiptNumber ? lastVoucher.receiptNumber + 1 : 1;
    const invoiceId = `R-${nextReceiptNumber}`;

    const voucher = await ReceivedVoucher.create({
        paymentType,
        date,
        accountType,
        partyName,
        paymentMode,
        referenceNumber,
        particulars,
        amount,
        invoice,
        receiptNumber: nextReceiptNumber,
        invoiceId,
        companyId,
    });

    res.status(201).json({
        success: true,
        message: "Voucher created successfully",
        data: voucher,
    });
});


// @desc    Get all vouchers
export const getAllVouchers = asyncHandler(async (req, res) => {
    const vouchers = await ReceivedVoucher.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: vouchers.length,
        data: vouchers
    });
});

// @desc    Get voucher by ID
export const getVoucherById = asyncHandler(async (req, res) => {
    const voucher = await ReceivedVoucher.findById(req.params.id)
        .populate({
            path: "companyId",
            select:
                "companyName address phone email gstin stateCode logo authorizedSignatory termsConditions paymentLink", // ✅ fixed
        });
    if (!voucher) {
        res.status(404);
        throw new Error("Voucher not found");
    }
    res.status(200).json({ success: true, data: voucher });
});

// @desc    Update voucher
export const updateVoucher = asyncHandler(async (req, res) => {
    const updatedVoucher = await ReceivedVoucher.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    if (!updatedVoucher) {
        res.status(404);
        throw new Error("Voucher not found");
    }
    res.status(200).json({ success: true, message: "Voucher updated", data: updatedVoucher });
});

// @desc    Delete voucher
export const deleteVoucher = asyncHandler(async (req, res) => {
    const deleted = await ReceivedVoucher.findByIdAndDelete(req.params.id);
    if (!deleted) {
        res.status(404);
        throw new Error("Voucher not found");
    }
    res.status(200).json({ success: true, message: "Voucher deleted" });
});