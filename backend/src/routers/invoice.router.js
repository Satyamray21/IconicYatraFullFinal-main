import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
  renumberInvoiceMonth,
  renumberCompanyAdvancedReceipts,
} from "../controllers/invoice.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = express.Router();
router.post("/create", requirePermission("canCreateInvoice"), createInvoice);
router.get("/get", requirePermission("canAccessInvoices"), getInvoices);
router.get(
  "/next-number",
  requirePermission("canAccessInvoices"),
  getNextInvoiceNumber,
);
router.post(
  "/renumber-month",
  requirePermission("canEditInvoice"),
  renumberInvoiceMonth,
);
router.post(
  "/renumber-company",
  requirePermission("canEditInvoice"),
  renumberCompanyAdvancedReceipts,
);

router
  .route("/:id")
  .get(requirePermission("canAccessInvoices"), getInvoiceById)
  .put(requirePermission("canEditInvoice"), updateInvoice)
  .delete(requirePermission("canEditInvoice"), deleteInvoice);

export default router;
