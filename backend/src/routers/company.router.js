import express from "express";
import {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    toggleCompanyStatus,
} from "../controllers/company.controller.js";
import { upload } from "../middleware/imageMulter.middleware.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";

const router = express.Router();

// handle multiple uploads: logo + signature
router.post(
    "/",
    requirePermission("canEditInvoice"),
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "signature", maxCount: 1 },
    ]),
    createCompany
);

router.get("/", requirePermission("canAccessInvoices"), getCompanies);
router.get("/:id", requirePermission("canAccessInvoices"), getCompanyById);

router.put(
    "/:id",
    requirePermission("canEditInvoice"),
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "signature", maxCount: 1 },
    ]),
    updateCompany
);

router.delete("/:id", requirePermission("canEditInvoice"), deleteCompany);
router.patch("/:id/status", requirePermission("canEditInvoice"), toggleCompanyStatus);

export default router;