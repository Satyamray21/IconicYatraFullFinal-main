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

const router = express.Router();

router.route("/")
    .post(createVoucher)
    .get(getAllVouchers);
router.route("/totalPayment").get(getCompanyTotalPayments);
router.get("/by-quotation/:quotationRef", getVouchersByQuotationRef);
router.route("/:id")
    .get(getVoucherById)
    .put(updateVoucher)
    .delete(deleteVoucher);

export default router;