import express from 'express'

import {
    addBankDetails,
    getAllBankDetails,
    getBankDetailsById,
    updateBankDetails,
    deleteBankDetails,
} from "../../controllers/common/bankDetails.controller.js"
import { requirePermission } from "../../middleware/staffPermission.middleware.js";

const router = express.Router();

router.post("/addBankDetails", requirePermission("canEditInvoice"), addBankDetails);
router.get("/allBankDetails", requirePermission("canAccessInvoices"), getAllBankDetails);
router.get("/viewBankDetails/:id", requirePermission("canAccessInvoices"), getBankDetailsById);
router.put("/updateBankDetails/:id", requirePermission("canEditInvoice"), updateBankDetails);
router.delete("/deleteBankDetails/:id", requirePermission("canEditInvoice"), deleteBankDetails);


export default router;