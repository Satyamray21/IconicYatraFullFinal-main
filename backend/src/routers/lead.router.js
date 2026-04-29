import { Router } from "express";
import {
    createLead, viewAllLeads, updateLead, deleteLead, viewAllLeadsReports, viewByLeadId, changeLeadStatus,
    getLeadOptions, addLeadOption
} from "../controllers/lead.controller.js";
import { requirePermission } from "../middleware/staffPermission.middleware.js";

const router = Router();

router
    .route("/create")
    .post(requirePermission("canCreateLead"), createLead);
router
    .route("/getAllLead")
    .get(requirePermission("canAccessLeads"), viewAllLeads);
router
    .route("/get-Count")
    .get(requirePermission("canAccessReports"), viewAllLeadsReports);
router
    .route("/viewLeadById/:leadId")
    .get(requirePermission("canAccessLeads"), viewByLeadId);
router
    .route("/update-Lead/:leadId")
    .put(requirePermission("canEditLead"), updateLead);
router
    .route("/delete-Lead/:leadId")
    .delete(requirePermission("canDeleteLead"), deleteLead);
router
    .route("/change-status/:leadId")
    .patch(requirePermission("canEditLead"), changeLeadStatus);
router.get("/options", requirePermission("canAccessLeads"), getLeadOptions);

router.post("/options/add", requirePermission("canEditLead"), addLeadOption);


export default router;