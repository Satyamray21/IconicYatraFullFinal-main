import { Router } from "express";
import {
    createLead, viewAllLeads, updateLead, deleteLead, viewAllLeadsReports, viewByLeadId, changeLeadStatus,
    getLeadOptions, addLeadOption
} from "../controllers/lead.controller.js"


const router = Router();

router.route("/create").post(createLead);
router.route("/getAllLead").get(viewAllLeads);
router.route("/get-Count").get(viewAllLeadsReports);
router.route("/viewLeadById/:leadId").get(viewByLeadId);
router.route("/update-Lead/:leadId").put(updateLead);
router.route("/delete-Lead/:leadId").delete(deleteLead);
router.route("/change-status/:leadId").patch(changeLeadStatus)
router.get("/options", getLeadOptions);

router.post("/options/add", addLeadOption);


export default router;