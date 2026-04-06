import express from "express";
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    getNextInvoiceNumber,
} from "../controllers/invoice.controller.js";

const router = express.Router();
router.post('/create', createInvoice);
router.get('/get', getInvoices);
router.get("/next-number", getNextInvoiceNumber);


router.route("/:id")
    .get(getInvoiceById)
    .put(updateInvoice)
    .delete(deleteInvoice);

export default router;