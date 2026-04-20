import express from "express";
import {
    createVoucher,
    getAllVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    getCompanyTotalPayments,
    getVouchersByQuotationRef,
} from "../controllers/payment.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();

router.route("/")
    .post(requirePermission("canCreateInvoice"), createVoucher)
    .get(requirePermission("canAccessInvoices"), getAllVouchers);
router.route("/totalPayment").get(requirePermission("canAccessInvoices"), getCompanyTotalPayments);
router.get("/by-quotation/:quotationRef", requirePermission("canAccessInvoices"), getVouchersByQuotationRef);
router.route("/:id")
    .get(requirePermission("canAccessInvoices"), getVoucherById)
    .put(requirePermission("canEditInvoice"), updateVoucher)
    .delete(requirePermission("canEditInvoice"), deleteVoucher);

export default router;