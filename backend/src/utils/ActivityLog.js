// utils/activityLogger.js
import { ActivityLog } from "../models/ActivityLog.js";

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
            user,
            description,
        });
    } catch (error) {
        console.error("Error logging activity:", error.message);
    }
};