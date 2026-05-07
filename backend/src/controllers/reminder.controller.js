import { asyncHandler } from '../utils/asyncHandler.js';
import { Reminder } from '../models/Reminder.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { logActivity } from '../utils/ActivityLog.js';

export const createReminder = asyncHandler(async (req, res) => {
    const { title, description, type, priority, dateTime, relatedTo } = req.body;

    const reminder = await Reminder.create({
        title,
        description,
        type,
        priority,
        dateTime,
        relatedTo,
        createdBy: req.user?.id
    });

    await logActivity({
        action: "CREATE",
        model: "Reminder",
        refId: reminder._id.toString(),
        description: `Reminder "${title}" created by ${req.user?.name || req.user?.staffUserId || 'System'}`,
        user: req.user?.name || req.user?.staffUserId || "System",
    });

    return res.status(201).json(new ApiResponse(201, reminder, "Reminder created successfully"));
});

export const getReminders = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reminders = await Reminder.find(filter).sort({ dateTime: 1 });
    return res.status(200).json(new ApiResponse(200, reminders, "Reminders fetched successfully"));
});

export const updateReminderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const oldReminder = await Reminder.findById(id);
    if (!oldReminder) return res.status(404).json(new ApiResponse(404, null, "Reminder not found"));

    const reminder = await Reminder.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    await logActivity({
        action: "Status Changed",
        model: "Reminder",
        refId: id,
        description: `Reminder "${reminder.title}" status changed from ${oldReminder.status} to ${status} by ${req.user?.name || req.user?.staffUserId || 'System'}`,
        user: req.user?.name || req.user?.staffUserId || "System",
    });

    return res.status(200).json(new ApiResponse(200, reminder, "Reminder status updated"));
});

export const deleteReminder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    await Reminder.findByIdAndDelete(id);

    if (reminder) {
        await logActivity({
            action: "DELETE",
            model: "Reminder",
            refId: id,
            description: `Reminder "${reminder.title}" deleted by ${req.user?.name || req.user?.staffUserId || 'System'}`,
            user: req.user?.name || req.user?.staffUserId || "System",
        });
    }

    return res.status(200).json(new ApiResponse(200, null, "Reminder deleted"));
});
