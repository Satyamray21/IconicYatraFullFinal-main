import axios from "axios";
import { LoginHistory } from "../models/loginHistory.model.js";

/**
 * Save login history with IP, location, and ISP details
 * @param {string} userName - Username of the staff
 * @param {string} userId - ObjectId of the staff
 * @param {string} staffId - Staff ID (ICYR_STxxxx format)
 * @param {string} status - "Success" or "Failed"
 * @param {object} req - Express request object
 */
export const saveLoginHistory = async (
  userName,
  userId,
  staffId,
  status,
  req,
) => {
  try {
    // Extract IP address from various possible locations
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      "IP not found";

    // Get geo details from IP API
    let geoData = {
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      isp: "Unknown",
    };

    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000, // 5 second timeout
      });
      geoData = {
        city: response.data.city || "Unknown",
        region: response.data.region || "Unknown",
        country: response.data.country_name || "Unknown",
        isp: response.data.org || "Unknown",
      };
    } catch (geoError) {
      console.warn("⚠️ Could not fetch geo data:", geoError.message);
      // Continue with unknown values if geo API fails
    }

    // Format date-time
    const now = new Date();
    const formattedDateTime = now
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");

    // Save to database
    const loginRecord = await LoginHistory.create({
      userName,
      userId,
      staffId,
      status: status === "Success" ? "Login Successful" : "Login Failed",
      dateTime: formattedDateTime,
      ip: ip === "::1" ? "localhost" : ip,
      isp: geoData.isp,
      city: geoData.city,
      region: geoData.region,
      country: geoData.country,
      userAgent: req.headers["user-agent"] || "Unknown",
      timestamp: now,
    });

    console.log("✅ Login history saved:", {
      userName,
      staffId,
      status,
      ip,
      location: `${geoData.city}, ${geoData.region}, ${geoData.country}`,
    });

    return loginRecord;
  } catch (error) {
    console.error("🚨 Error saving login history:", error.message);
    // Don't throw error - login should succeed even if history saving fails
    return null;
  }
};

/**
 * Get login history for a specific staff
 * @param {string} userId - ObjectId of the staff
 * @param {number} limit - Number of records to fetch
 * @param {number} skip - Number of records to skip (for pagination)
 */
export const getLoginHistoryForStaff = async (userId, limit = 50, skip = 0) => {
  try {
    const history = await LoginHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await LoginHistory.countDocuments({ userId });

    return {
      data: history,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  } catch (error) {
    console.error("Error fetching login history:", error);
    throw error;
  }
};

/**
 * Get login statistics for a staff
 * @param {string} userId - ObjectId of the staff
 * @param {number} days - Number of days to look back
 */
export const getLoginStatistics = async (userId, days = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const stats = await LoginHistory.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalLogins = await LoginHistory.countDocuments({
      userId,
      timestamp: { $gte: dateFrom },
    });

    return {
      totalLogins,
      statsByStatus: stats,
      dateRange: {
        from: dateFrom,
        to: new Date(),
        days,
      },
    };
  } catch (error) {
    console.error("Error fetching login statistics:", error);
    throw error;
  }
};

/**
 * Clear old login history (older than specified days)
 * @param {number} daysToKeep - Keep records only from last N days
 */
export const clearOldLoginHistory = async (daysToKeep = 180) => {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysToKeep);

    const result = await LoginHistory.deleteMany({
      timestamp: { $lt: dateLimit },
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old login history records`);
    return result;
  } catch (error) {
    console.error("Error clearing old login history:", error);
    throw error;
  }
};
