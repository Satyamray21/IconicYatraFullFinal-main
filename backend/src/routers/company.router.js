import express from "express";
import {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
} from "../controllers/company.controller.js";
import { upload } from "../middleware/imageMulter.middleware.js";

const router = express.Router();

// handle multiple uploads: logo + signature
router.post(
    "/",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "signature", maxCount: 1 },
    ]),
    createCompany
);

router.get("/", getCompanies);
router.get("/:id", getCompanyById);

router.put(
    "/:id",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "signature", maxCount: 1 },
    ]),
    updateCompany
);

router.delete("/:id", deleteCompany);

export default router;