import { Notification } from "../models/Notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
    const { name } = req.user;
    
    if (!name) {
        throw new ApiError(401, "User name not found in token");
    }

    const notifications = await Notification.find({ recipient: name })
        .sort({ createdAt: -1 })
        .limit(20);

    return res.status(200).json(
        new ApiResponse(200, notifications, "Notifications fetched successfully")
    );
});

export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    const { name } = req.user;

    await Notification.updateMany(
        { recipient: name, isRead: false },
        { isRead: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "All notifications marked as read")
    );
});
