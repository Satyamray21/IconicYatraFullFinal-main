import { StaffPermission } from "../models/staffPermission.model.js";
import { Staff } from "../models/staff.model.js";
import { User } from "../models/user.model.js";

async function resolveStaffMongoIdFromParam(param) {
  if (typeof param !== "string") return null;
  if (/^[0-9a-fA-F]{24}$/.test(param)) {
    const byId = await Staff.findById(param).select("_id").lean();
    if (byId) return byId._id;
  }
  const byCode = await Staff.findOne({ staffId: param }).select("_id").lean();
  return byCode?._id ?? null;
}

/**
 * After verifyToken: req.user = { id, role }.
 * Staff dashboard logins use Staff _id and have a StaffPermission row.
 * User model logins (Superadmin / Admin / Executive) use User _id and have no StaffPermission.
 */
export const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: "Unauthorized",
          error: "Unauthorized",
        });
      }

      const staffPerm = await StaffPermission.findOne({
        staffId: req.user.id,
      })
        .select("permissions status isLocked")
        .lean();

      if (staffPerm) {
        if (staffPerm.status !== "Active" || staffPerm.isLocked) {
          return res.status(403).json({
            message: "Account is inactive or locked",
            error: "Account is inactive or locked",
          });
        }
        if (!staffPerm.permissions?.[permissionKey]) {
          return res.status(403).json({
            message: "You do not have permission to perform this action",
            error: "Forbidden",
          });
        }
        return next();
      }

      const user = await User.findById(req.user.id).select("userRole").lean();
      if (!user) {
        return res.status(403).json({
          message: "Access denied",
          error: "Access denied",
        });
      }

      if (["Superadmin", "Admin", "Executive"].includes(user.userRole)) {
        return next();
      }

      return res.status(403).json({
        message: "Access denied",
        error: "Access denied",
      });
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Staff may read their own permission/login rows; managers may read any.
 * User-model logins (Superadmin / Admin / Executive) always pass.
 */
export const requireManageStaffOrSelfStaffTarget = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "Unauthorized",
      });
    }

    const user = await User.findById(req.user.id).select("userRole").lean();
    if (user && ["Superadmin", "Admin", "Executive"].includes(user.userRole)) {
      return next();
    }

    const staffPerm = await StaffPermission.findOne({
      staffId: req.user.id,
    })
      .select("permissions status isLocked")
      .lean();

    if (!staffPerm || staffPerm.status !== "Active" || staffPerm.isLocked) {
      return res.status(403).json({
        message: "Account is inactive or locked",
        error: "Account is inactive or locked",
      });
    }

    if (staffPerm.permissions?.canManageStaff) {
      return next();
    }

    const targetId = await resolveStaffMongoIdFromParam(req.params.staffId);
    if (targetId && String(targetId) === String(req.user.id)) {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to perform this action",
      error: "Forbidden",
    });
  } catch (err) {
    next(err);
  }
};

/** Permission module metadata (labels/keys) — any active staff or User login. */
export const requireAnyActiveStaffOrUser = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "Unauthorized",
      });
    }

    const user = await User.findById(req.user.id).select("userRole").lean();
    if (user && ["Superadmin", "Admin", "Executive"].includes(user.userRole)) {
      return next();
    }

    const staffPerm = await StaffPermission.findOne({
      staffId: req.user.id,
    })
      .select("status isLocked")
      .lean();

    if (!staffPerm || staffPerm.status !== "Active" || staffPerm.isLocked) {
      return res.status(403).json({
        message: "Account is inactive or locked",
        error: "Account is inactive or locked",
      });
    }

    return next();
  } catch (err) {
    next(err);
  }
};
