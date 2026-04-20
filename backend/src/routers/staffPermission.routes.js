import { Router } from "express";
import {
  createStaffPermission,
  getStaffPermission,
  updateStaffPermissions,
  changeStaffPassword,
  resetStaffPassword,
  toggleStaffStatus,
  getPermissionModulesList,
  getAllStaffPermissions,
  getStaffLoginHistory,
} from "../controllers/staffPermission.controller.js";
import {
  requirePermission,
  requireManageStaffOrSelfStaffTarget,
  requireAnyActiveStaffOrUser,
} from "../middleware/staffPermission.middleware.js";

const router = Router();
const manage = requirePermission("canManageStaff");

// ========================
// Permission Management Routes
// Static paths MUST be registered before "/:staffId" or Express will treat
// e.g. "modules" as a staffId.
// ========================

router.get("/modules/list", requireAnyActiveStaffOrUser, getPermissionModulesList);
router.get("/", manage, getAllStaffPermissions);

router.get("/:staffId/login-history", requireManageStaffOrSelfStaffTarget, getStaffLoginHistory);

router.post("/:staffId/create-permission", manage, createStaffPermission);
router.put("/:staffId/permissions", manage, updateStaffPermissions);
router.post("/:staffId/change-password", requireManageStaffOrSelfStaffTarget, changeStaffPassword);
router.post("/:staffId/reset-password", manage, resetStaffPassword);
router.put("/:staffId/status", manage, toggleStaffStatus);

router.get("/:staffId", requireManageStaffOrSelfStaffTarget, getStaffPermission);

export default router;
