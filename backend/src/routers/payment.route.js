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
    .post(requirePermission("canManagePayments"), createVoucher)
    .get(requirePermission("canAccessPayments"), getAllVouchers);
router.route("/totalPayment").get(requirePermission("canAccessPayments"), getCompanyTotalPayments);
router.get("/by-quotation/:quotationRef", requirePermission("canAccessPayments"), getVouchersByQuotationRef);
router.route("/:id")
    .get(requirePermission("canAccessPayments"), getVoucherById)
    .put(requirePermission("canManagePayments"), updateVoucher)
    .delete(requirePermission("canManagePayments"), deleteVoucher);

export default router;