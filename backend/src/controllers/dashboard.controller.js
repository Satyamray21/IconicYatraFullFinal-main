import { asyncHandler } from '../utils/asyncHandler.js';
import { Lead } from '../models/lead.model.js';
import Package from '../models/package.model.js';
import Invoice from '../models/invoice.model.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { CustomQuotation } from '../models/quotation/customQuotation.model.js';
import { FlightQuotation } from '../models/quotation/flightQuotation.model.js';
import { fullQuotation } from '../models/quotation/fullQuotation.model.js';
import { HotelQuotation } from '../models/quotation/hotelQuotation.model.js';
import QuickQuotation from '../models/quotation/quickQuotation.model.js';
import { Vehicle } from '../models/quotation/vehicle.model.js';
import Enquiry from '../models/enquiry.model.js';
import Blog from '../models/Blog.model.js';
import Hotel from '../models/hotel.model.js';
import { Reminder } from '../models/Reminder.model.js';
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns';

import { getCache, setCache } from '../utils/cache.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { activityDate } = req.query;
  const cacheKey = `dashboard:stats:${activityDate || 'all'}`;

  // Try to get from cache
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log(`[Cache Hit] Dashboard stats fetched from Redis: ${cacheKey}`);
    return res.status(200).json(new ApiResponse(200, cachedData, "Dashboard stats fetched from cache"));
  }

  console.log(`[Cache Miss] Dashboard stats fetched from MongoDB: ${cacheKey}`);

  // --- Trend Calculations ---
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const prevMonthStart = startOfMonth(subMonths(today, 1));
  const prevMonthEnd = endOfMonth(subMonths(today, 1));

  // Helper for trend calculation
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 1. Lead Stats & Trend
  const [leadStats, prevMonthLeads] = await Promise.all([
    Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Lead.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } })
  ]);

  const currentMonthLeads = await Lead.countDocuments({ createdAt: { $gte: currentMonthStart } });
  
  const leadTrendValue = calculateTrend(currentMonthLeads, prevMonthLeads);

  const formattedLeadStats = {
    total: 0,
    active: 0,
    confirmed: 0,
    cancelled: 0,
    trend: leadTrendValue >= 0 ? "up" : "down",
    trendValue: `${leadTrendValue >= 0 ? "+" : ""}${leadTrendValue}%`
  };

  leadStats.forEach(stat => {
    const status = stat._id?.toLowerCase();
    formattedLeadStats.total += stat.count;
    if (status === 'active') formattedLeadStats.active = stat.count;
    else if (status === 'confirmed') formattedLeadStats.confirmed = stat.count;
    else if (status === 'cancelled') formattedLeadStats.cancelled = stat.count;
  });

  // 2. Quotation Stats & Trend
  const [customQ, flightQ, fullQ, hotelQ, quickQ, vehicleQ] = await Promise.all([
    CustomQuotation.countDocuments(),
    FlightQuotation.countDocuments(),
    fullQuotation.countDocuments(),
    HotelQuotation.countDocuments(),
    QuickQuotation.countDocuments(),
    Vehicle.countDocuments()
  ]);

  const [prevCustomQ, prevFlightQ, prevFullQ, prevHotelQ, prevQuickQ, prevVehicleQ] = await Promise.all([
    CustomQuotation.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    FlightQuotation.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    fullQuotation.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    HotelQuotation.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    QuickQuotation.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    Vehicle.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } })
  ]);

  const currentMonthQuotations = await Promise.all([
    CustomQuotation.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    FlightQuotation.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    fullQuotation.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    HotelQuotation.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    QuickQuotation.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    Vehicle.countDocuments({ createdAt: { $gte: currentMonthStart } })
  ]).then(counts => counts.reduce((a, b) => a + b, 0));

  const prevMonthQuotationsTotal = prevCustomQ + prevFlightQ + prevFullQ + prevHotelQ + prevQuickQ + prevVehicleQ;
  const quotationTrendValue = calculateTrend(currentMonthQuotations, prevMonthQuotationsTotal);

  const totalQuotations = customQ + flightQ + fullQ + hotelQ + quickQ + vehicleQ;

  // 3. Tour/Package Stats & Trend
  const packages = await Package.find({}, 'status validFrom validTill createdAt');
  
  const tourStats = {
    total: packages.length,
    active: 0,
    upcoming: 0,
    completed: 0,
    trend: "up",
    trendValue: "+0%"
  };

  let currentMonthTours = 0;
  let prevMonthTours = 0;

  packages.forEach(pkg => {
    const status = pkg.status?.toLowerCase();
    const startDate = pkg.validFrom ? new Date(pkg.validFrom) : null;
    const endDate = pkg.validTill ? new Date(pkg.validTill) : null;
    const createdAt = new Date(pkg.createdAt);

    if (createdAt >= currentMonthStart) currentMonthTours++;
    if (createdAt >= prevMonthStart && createdAt <= prevMonthEnd) prevMonthTours++;

    if (status === 'confirmed' || status === 'active') {
      if (startDate && startDate > today) tourStats.upcoming++;
      else if (endDate && endDate < today) tourStats.completed++;
      else tourStats.active++;
    } else if (status === 'completed') {
      tourStats.completed++;
    }
  });

  const tourTrendValue = calculateTrend(currentMonthTours, prevMonthTours);
  tourStats.trend = tourTrendValue >= 0 ? "up" : "down";
  tourStats.trendValue = `${tourTrendValue >= 0 ? "+" : ""}${tourTrendValue}%`;

  // 4. Invoice & Revenue Stats & Trend
  const invoices = await Invoice.find({}, 'totalAmount invoiceDate createdAt');
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const currentMonthRevenue = invoices
    .filter(inv => {
      const date = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt);
      return date >= currentMonthStart;
    })
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const prevMonthRevenue = invoices
    .filter(inv => {
      const date = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt);
      return date >= prevMonthStart && date <= prevMonthEnd;
    })
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const revenueTrendValue = calculateTrend(currentMonthRevenue, prevMonthRevenue);

  // 5. Monthly Revenue (Last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(subMonths(today, i));

    const revenue = invoices
      .filter(inv => {
        const date = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    monthlyRevenue.push({
      month: format(monthStart, 'MMM'),
      revenue
    });
  }

  // 6. Activities (Recent or Date-filtered)
  let activityFilter = {};
  let activityLimit = 50;

  if (activityDate) {
    const start = startOfDay(new Date(activityDate));
    const end = endOfDay(new Date(activityDate));
    activityFilter = {
      timestamp: { $gte: start, $lte: end }
    };
    activityLimit = 50;
  }

  const recentActivities = await ActivityLog.find(activityFilter)
    .sort({ timestamp: -1 })
    .limit(activityLimit);

  // 7. Others (Enquiries, Blogs, Hotels)
  const [enquiries, blogs, hotels] = await Promise.all([
    Enquiry.countDocuments(),
    Blog.countDocuments(),
    Hotel.countDocuments()
  ]);

  // 8. Upcoming Reminders & Appointments
  const reminders = await Reminder.find({
    status: 'pending',
    dateTime: { $gte: today }
  }).sort({ dateTime: 1 }).limit(10);

  const stats = {
    leads: formattedLeadStats,
    quotations: {
      total: totalQuotations,
      details: { customQ, flightQ, fullQ, hotelQ, quickQ, vehicleQ },
      trend: quotationTrendValue >= 0 ? "up" : "down",
      trendValue: `${quotationTrendValue >= 0 ? "+" : ""}${quotationTrendValue}%`
    },
    tours: tourStats,
    invoices: {
      total: invoices.length,
      revenue: totalRevenue,
      monthlyRevenue,
      trend: revenueTrendValue >= 0 ? "up" : "down",
      trendValue: `${revenueTrendValue >= 0 ? "+" : ""}${revenueTrendValue}%`
    },
    recentActivities,
    others: {
      enquiries,
      blogs,
      hotels
    },
    reminders
  };

  // Cache the results for 5 minutes
  await setCache(cacheKey, stats, 300);

  return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});
