import cron from "node-cron";
import redisClient from "../config/redis.js";
import { CustomQuotation } from "../models/quotation/customQuotation.model.js";
import QuickQuotation from "../models/quotation/quickQuotation.model.js";
import { HotelQuotation } from "../models/quotation/hotelQuotation.model.js";
import { FlightQuotation } from "../models/quotation/flightQuotation.model.js";
import { Vehicle } from "../models/quotation/vehicle.model.js";
import { parse, isValid, addDays, startOfDay, isSameDay, format } from "date-fns";

// A utility function to parse various date formats that might exist in the DB
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // If it's already a Date object
  if (dateStr instanceof Date) return dateStr;
  
  // Attempt standard parsing
  let date = new Date(dateStr);
  if (isValid(date)) return date;

  // Attempt specific format parsing if standard fails, e.g., DD/MM/YYYY
  date = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(date)) return date;

  date = parse(dateStr, 'MM/dd/yyyy', new Date());
  if (isValid(date)) return date;

  return null;
};

// Helper to format date without time for the message
const formatDateStr = (dateStr) => {
  const parsed = parseDate(dateStr);
  if (parsed) {
    return format(parsed, "dd-MM-yyyy");
  }
  return String(dateStr); // fallback if unparseable
};

// Check if the arrival date is today or exactly 2 days from today
const isTargetDate = (dateStr) => {
  const arrivalDate = parseDate(dateStr);
  if (!arrivalDate) return false;

  const today = startOfDay(new Date());
  const twoDaysFromNow = startOfDay(addDays(today, 2));
  const arrivalDay = startOfDay(arrivalDate);

  return isSameDay(arrivalDay, today) || isSameDay(arrivalDay, twoDaysFromNow);
};

export const startNotificationCron = () => {
  // Run every day at 12:01 AM
  cron.schedule("1 0 * * *", async () => {
    console.log("Running arrival date notification cron job...");
    try {
      if (!redisClient.isReady) {
         console.log("Redis client not ready, skipping cron job.");
         return;
      }

      const notifications = [];

      // Check Custom Quotations
      const customQuotes = await CustomQuotation.find({ finalizeStatus: "finalized" }).lean();
      customQuotes.forEach(q => {
        if (isTargetDate(q.quotationDetails?.arrivalDate)) {
          notifications.push({
            id: q._id.toString(),
            type: "Custom Quotation",
            clientName: q.clientDetails?.clientName || "Unknown",
            arrivalDate: q.quotationDetails.arrivalDate,
            message: `Custom Quotation for ${q.clientDetails?.clientName || "Unknown"} has an arrival date of ${formatDateStr(q.quotationDetails.arrivalDate)}.`,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Check Hotel Quotations
      const hotelQuotes = await HotelQuotation.find({ finalizeStatus: "finalized" }).lean();
      hotelQuotes.forEach(q => {
        if (isTargetDate(q.quotationDetails?.arrivalDate)) {
          notifications.push({
            id: q._id.toString(),
            type: "Hotel Quotation",
            clientName: q.clientDetails?.clientName || "Unknown",
            arrivalDate: q.quotationDetails.arrivalDate,
            message: `Hotel Quotation for ${q.clientDetails?.clientName || "Unknown"} has an arrival date of ${formatDateStr(q.quotationDetails.arrivalDate)}.`,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Check Quick Quotations
      const quickQuotes = await QuickQuotation.find({ finalizeStatus: "finalized" }).lean();
      quickQuotes.forEach(q => {
        const arrivalDate = q.packageSnapshot?.quotationDetails?.arrivalDate || q.pickupTime;
        if (isTargetDate(arrivalDate)) {
          notifications.push({
            id: q._id.toString(),
            type: "Quick Quotation",
            clientName: q.customerName || "Unknown",
            arrivalDate: arrivalDate,
            message: `Quick Quotation for ${q.customerName || "Unknown"} has an arrival date of ${formatDateStr(arrivalDate)}.`,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Check Flight Quotations (using departureDate)
      const flightQuotes = await FlightQuotation.find({ finalizeStatus: "finalized" }).lean();
      flightQuotes.forEach(q => {
        if (isTargetDate(q.departureDate)) {
          notifications.push({
            id: q._id.toString(),
            type: "Flight Quotation",
            clientName: q.clientDetails?.clientName || q.personalDetails?.fullName || "Unknown",
            arrivalDate: q.departureDate,
            message: `Flight Quotation for ${q.clientDetails?.clientName || q.personalDetails?.fullName || "Unknown"} has a departure date of ${formatDateStr(q.departureDate)}.`,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Check Vehicle (using pickupDate)
      const vehicleQuotes = await Vehicle.find({ finalizeStatus: "finalized" }).lean();
      vehicleQuotes.forEach(q => {
        if (isTargetDate(q.pickupDate)) {
          notifications.push({
            id: q._id.toString(),
            type: "Vehicle Quotation",
            clientName: q.basicsDetails?.clientName || "Unknown",
            arrivalDate: q.pickupDate,
            message: `Vehicle Quotation for ${q.basicsDetails?.clientName || "Unknown"} has a pickup date of ${formatDateStr(q.pickupDate)}.`,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Push to Redis List
      if (notifications.length > 0) {
        // Clear previous unread notifications that might be outdated? 
        // For simplicity, we just push them. The frontend/admin can clear them.
        for (const notif of notifications) {
           await redisClient.lPush("notifications:admin", JSON.stringify(notif));
        }
        console.log(`Pushed ${notifications.length} notifications to Redis.`);
      } else {
        console.log("No new notifications for today.");
      }

    } catch (error) {
      console.error("Error in notification cron job:", error);
    }
  });
};
