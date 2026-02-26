import express from 'express'

import {
    addBankDetails,
    getAllBankDetails,
    getBankDetailsById,
    updateBankDetails,
    deleteBankDetails,
} from "../../controllers/common/bankDetails.controller.js"

const router = express.Router();

router.post("/addBankDetails", addBankDetails);
router.get("/allBankDetails", getAllBankDetails);
router.get("/viewBankDetails/:id", getBankDetailsById)
router.put("/updateBankDetails/:id", updateBankDetails);
router.delete("/deleteBankDetails/:id", deleteBankDetails);


export default router;