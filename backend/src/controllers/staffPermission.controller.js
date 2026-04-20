import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { StaffPermission } from "../models/staffPermission.model.js";
import { Staff } from "../models/staff.model.js";
import {
  generateCredentials,
  hashPassword,
  comparePassword,
  getDefaultPermissionsByRole,
  getPermissionModules,
} from "../utils/permission.utils.js";

/** Route param may be Mongo _id, human-readable staffUserId (e.g. ICYR_ST0012), or username. Only ObjectId paths may use staffId field. */
function buildPermissionLookupFilter(staffIdParam) {
  const or = [
    { staffUserId: staffIdParam },
    { "credentials.username": staffIdParam },
  ];
  if (
    typeof staffIdParam === "string" &&
    /^[0-9a-fA-F]{24}$/.test(staffIdParam)
  ) {
    or.push({ staffId: new mongoose.Types.ObjectId(staffIdParam) });
  }
  return { $or: or };
}

function isObjectIdString(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

/** Staff row from the same id the dashboard uses in URLs (Mongo _id or business staffId). */
async function resolveStaffByRouteParam(staffIdParam) {
  if (isObjectIdString(staffIdParam)) {
    return Staff.findById(staffIdParam).select("_id staffId").lean();
  }
  return Staff.findOne({ staffId: staffIdParam }).select("_id staffId").lean();
}

/**
 * Find StaffPermission by staffUserId / username / staff ObjectId, or by linked Staff when
 * e.g. staffUserId in DB does not exactly match the URL (legacy rows, casing, etc.).
 */
async function findPermissionDocByRouteParam(staffIdParam) {
  let permission = await StaffPermission.findOne(
    buildPermissionLookupFilter(staffIdParam)
  );
  if (permission) return permission;

  const staff = await resolveStaffByRouteParam(staffIdParam);
  if (!staff?._id) return null;
  return StaffPermission.findOne({ staffId: staff._id });
}

// ========================
// CREATE STAFF CREDENTIALS AND PERMISSIONS
// ========================
export const createStaffPermission = asyncHandler(async (req, res) => {
  const { staffId: staffParam } = req.params;
  const { role = "Staff" } = req.body;

  const staffLean = await resolveStaffByRouteParam(staffParam);
  if (!staffLean?._id) {
    throw new ApiError(404, "Staff not found");
  }

  const staff = await Staff.findById(staffLean._id);
  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  const staffObjectId = staff._id;

  // Check if permission already exists
  const existing = await StaffPermission.findOne({ staffId: staffObjectId });
  if (existing) {
    throw new ApiError(409, "Permissions already exist for this staff");
  }

  // Generate credentials
  const { username, tempPassword } = generateCredentials(
    staff.personalDetails.fullName,
    staff.staffId
  );

  // Hash password
  const hashedPassword = await hashPassword(tempPassword);

  // Get default permissions for role
  const defaultPermissions = getDefaultPermissionsByRole(role);

  // Create permission record
  const permission = await StaffPermission.create({
    staffId: staffObjectId,
    staffUserId: staff.staffId,
    role,
    credentials: {
      username,
      password: hashedPassword,
      generatedAt: new Date(),
      isTemporary: true,
      tempPassword,
    },
    permissions: defaultPermissions,
    status: "Active",
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        permission: permission,
        credentials: {
          username,
          tempPassword,
          note: "This is a temporary password. Staff must change it on first login.",
        },
      },
      "Staff permission created successfully with temporary credentials"
    )
  );
});

// ========================
// GET STAFF PERMISSION
// ========================
export const getStaffPermission = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    const staff = await resolveStaffByRouteParam(staffId);
    if (staff) {
      const defaultRole = "Staff";
      const placeholder = {
        needsPermissionSetup: true,
        staffMongoId: String(staff._id),
        staffUserId: staff.staffId,
        role: defaultRole,
        permissions: getDefaultPermissionsByRole(defaultRole),
        status: "Inactive",
        credentials: {
          username: "",
          generatedAt: null,
          lastChangedAt: null,
          isTemporary: false,
        },
      };
      return res.status(200).json(
        new ApiResponse(
          200,
          placeholder,
          "No login record yet. Use Create staff login to generate credentials and permissions."
        )
      );
    }
    throw new ApiError(404, "Permission record not found");
  }

  await permission.populate("staffId", "personalDetails staffId");

  // Don't send hashed password to client
  const permissionData = permission.toObject();
  permissionData.credentials.password = undefined;
  permissionData.needsPermissionSetup = false;

  return res
    .status(200)
    .json(
      new ApiResponse(200, permissionData, "Permission fetched successfully")
    );
});

// ========================
// UPDATE STAFF PERMISSIONS
// ========================
export const updateStaffPermissions = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { permissions, role } = req.body;

  // Validate that at least one field is provided
  if (!permissions && !role) {
    throw new ApiError(400, "Provide permissions or role to update");
  }

  // Find permission record
  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    throw new ApiError(404, "Permission record not found");
  }

  // Update role if provided
  if (role) {
    permission.role = role;
    // Apply default permissions for new role if no specific permissions provided
    if (!permissions) {
      permission.permissions = getDefaultPermissionsByRole(role);
    }
  }

  // Update specific permissions
  if (permissions) {
    permission.permissions = {
      ...permission.permissions,
      ...permissions,
    };
  }

  await permission.save();

  // Don't send hashed password
  const permissionData = permission.toObject();
  permissionData.credentials.password = undefined;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        permissionData,
        "Staff permissions updated successfully"
      )
    );
});

// ========================
// CHANGE STAFF PASSWORD
// ========================
export const changeStaffPassword = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  // Find permission record
  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    throw new ApiError(404, "Permission record not found");
  }

  // Verify current password
  const isPasswordCorrect = await comparePassword(
    currentPassword,
    permission.credentials.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  permission.credentials.password = hashedPassword;
  permission.credentials.lastChangedAt = new Date();
  permission.credentials.isTemporary = false;
  await permission.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// ========================
// RESET STAFF PASSWORD (ADMIN ONLY)
// ========================
export const resetStaffPassword = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  // Find permission record
  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    throw new ApiError(404, "Permission record not found");
  }

  // Find staff to get name
  const staff = await Staff.findById(permission.staffId);

  // Generate new credentials
  const { username, tempPassword } = generateCredentials(
    staff.personalDetails.fullName,
    staff.staffId
  );

  const hashedPassword = await hashPassword(tempPassword);

  // Update password
  permission.credentials.password = hashedPassword;
  permission.credentials.tempPassword = tempPassword;
  permission.credentials.isTemporary = true;
  permission.credentials.lastChangedAt = new Date();
  await permission.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: permission.credentials.username,
        tempPassword,
        note: "Staff must change this password on next login",
      },
      "Password reset successfully with new temporary credentials"
    )
  );
});

// ========================
// TOGGLE STAFF STATUS
// ========================
export const toggleStaffStatus = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!["Active", "Inactive", "Suspended"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be Active, Inactive, or Suspended");
  }

  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    throw new ApiError(404, "Permission record not found");
  }

  permission.status = status;

  if (status === "Suspended") {
    permission.isLocked = true;
    permission.lockedUntil = new Date();
  } else {
    permission.isLocked = false;
    permission.lockedUntil = null;
    permission.loginAttempts = 0;
  }

  await permission.save();

  return res.status(200).json(
    new ApiResponse(200, permission, `Staff status changed to ${status}`)
  );
});

// ========================
// GET ALL PERMISSION MODULES
// ========================
export const getPermissionModulesList = asyncHandler(async (req, res) => {
  const modules = getPermissionModules();

  return res
    .status(200)
    .json(
      new ApiResponse(200, modules, "Permission modules fetched successfully")
    );
});

// ========================
// GET ALL STAFF PERMISSIONS (ADMIN)
// ========================
export const getAllStaffPermissions = asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  // Pagination
  const skip = (page - 1) * limit;

  const permissions = await StaffPermission.find(filter)
    .populate("staffId", "personalDetails staffId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await StaffPermission.countDocuments(filter);

  // Remove sensitive data
  const sanitized = permissions.map((p) => ({
    ...p.toObject(),
    credentials: {
      username: p.credentials.username,
      generatedAt: p.credentials.generatedAt,
      lastChangedAt: p.credentials.lastChangedAt,
      isTemporary: p.credentials.isTemporary,
    },
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: sanitized,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Staff permissions fetched successfully"
    )
  );
});

// ========================
// LOGIN HISTORY
// ========================
export const getStaffLoginHistory = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  // Find permission to get userId
  const permission = await findPermissionDocByRouteParam(staffId);

  if (!permission) {
    throw new ApiError(404, "Permission record not found");
  }

  const { LoginHistory } = await import("../models/loginHistory.model.js");

  const history = await LoginHistory.find({ userId: permission.staffId })
    .sort({ timestamp: -1 })
    .limit(Number(limit))
    .skip(Number(skip))
    .lean();

  const total = await LoginHistory.countDocuments({
    userId: permission.staffId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: history,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
          hasMore: Number(skip) + Number(limit) < total,
        },
      },
      "Login history fetched successfully"
    )
  );
});
