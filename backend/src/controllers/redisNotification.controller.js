import redisClient from "../config/redis.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all unread notifications
export const getRedisNotifications = asyncHandler(async (req, res) => {
  if (!redisClient.isReady) {
    return res.status(503).json(new ApiResponse(503, [], "Redis not available"));
  }

  // Get all notifications from the list
  const notifications = await redisClient.lRange("notifications:admin", 0, -1);
  
  const parsedNotifications = notifications.map(notif => JSON.parse(notif));

  return res.status(200).json(new ApiResponse(200, parsedNotifications, "Notifications fetched successfully"));
});

// Clear all notifications
export const clearRedisNotifications = asyncHandler(async (req, res) => {
  if (!redisClient.isReady) {
    return res.status(503).json(new ApiResponse(503, null, "Redis not available"));
  }

  await redisClient.del("notifications:admin");

  return res.status(200).json(new ApiResponse(200, null, "Notifications cleared successfully"));
});

// Delete a single notification by index
export const deleteRedisNotification = asyncHandler(async (req, res) => {
  if (!redisClient.isReady) {
    return res.status(503).json(new ApiResponse(503, null, "Redis not available"));
  }

  const { index } = req.params;
  const i = parseInt(index, 10);
  if (isNaN(i)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid index"));
  }

  // Get the item at index
  const item = await redisClient.lIndex("notifications:admin", i);
  if (item) {
    // Because Redis lists don't have a direct remove by index, we temporarily replace it, then LREM
    await redisClient.lSet("notifications:admin", i, "__DELETED__");
    await redisClient.lRem("notifications:admin", 1, "__DELETED__");
  }

  return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
});
