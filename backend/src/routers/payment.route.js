import express from "express";
import {
    createVoucher,
    getAllVouchers,
    getVoucherById,
    updateVoucher,
    deleteVoucher
} from "../controllers/payment.controller.js";

const router = express.Router();

router.route("/")
    .post(createVoucher)
    .get(getAllVouchers);

router.route("/:id")
    .get(getVoucherById)
    .put(updateVoucher)
    .delete(deleteVoucher);

export default router;