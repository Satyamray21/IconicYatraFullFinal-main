// utils/activityLogger.js
import { ActivityLog } from "../models/ActivityLog.js";

/**
 * Log business activity for auditing
 * @param {Object} params
 * @param {string} params.action - CREATE, UPDATE, DELETE, Status Changed
 * @param {string} params.model - The model name (Lead, Package, etc.)
 * @param {string} params.refId - The readable ID (Lead ID, Invoice No)
 * @param {string} params.user - The name/ID of the staff
 * @param {string} params.description - Human-readable description
 */
export const logActivity = async ({
    action,
    model,
    refId,
    user,
    description,
}) => {
    try {
        await ActivityLog.create({
            action,
            model,
            refId,
            user: user || "System",
            description,
        });
    } catch (error) {
        console.error("Error logging activity:", error.message);
    }
};