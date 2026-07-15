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

import { getCache, setCache, clearPattern } from '../utils/cache.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const updateResult = await Lead.updateMany(
      { status: "Active", "tourDetails.pickupDrop.departureDate": { $lt: now } },
      { $set: { status: "Not Converted" } }
    );
    if (updateResult.modifiedCount > 0) {
      await clearPattern('leads:*');
      await clearPattern('dashboard:stats:*');
    }
  } catch(e) {
    console.error("Auto-convert failed", e);
  }

  const { activityDate, activityType, activityPage = 1, reminderPage = 1 } = req.query;
  const cacheKey = `dashboard:stats:${req.companyId}:${activityDate || 'all'}:${activityType || 'all'}:ap${activityPage}:rp${reminderPage}`;

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
    notConverted: 0,
    trend: leadTrendValue >= 0 ? "up" : "down",
    trendValue: `${leadTrendValue >= 0 ? "+" : ""}${leadTrendValue}%`
  };

  leadStats.forEach(stat => {
    const status = stat._id?.toLowerCase();
    formattedLeadStats.total += stat.count;
    if (status === 'active') formattedLeadStats.active = stat.count;
    else if (status === 'confirmed') formattedLeadStats.confirmed = stat.count;
    else if (status === 'cancelled') formattedLeadStats.cancelled = stat.count;
    else if (status === 'not converted') formattedLeadStats.notConverted = stat.count;
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

  if (activityDate) {
    const start = startOfDay(new Date(activityDate));
    const end = endOfDay(new Date(activityDate));
    activityFilter.timestamp = { $gte: start, $lte: end };
  }

  if (activityType && activityType !== 'all') {
    if (activityType === 'Quotation') {
      // Special case for Quotation to include related models if needed
      activityFilter.model = { $regex: /Quotation|Vehicle/i };
    } else {
      activityFilter.model = activityType;
    }
  }

  const pageNum = parseInt(activityPage) || 1;
  const activityLimitSize = parseInt(req.query.activityLimit) || 50;
  const activitySkip = (pageNum - 1) * activityLimitSize;

  const [recentActivities, totalActivities] = await Promise.all([
    ActivityLog.find(activityFilter)
      .sort({ timestamp: -1 })
      .skip(activitySkip)
      .limit(activityLimitSize)
      .lean(),
    ActivityLog.countDocuments(activityFilter)
  ]);

  // 7. Others (Enquiries, Blogs, Hotels)
  const [enquiries, blogs, hotels] = await Promise.all([
    Enquiry.countDocuments(),
    Blog.countDocuments(),
    Hotel.countDocuments()
  ]);

  // 8. Upcoming Reminders & Appointments (Paginated)
  const rPageNum = parseInt(reminderPage) || 1;
  const reminderLimit = parseInt(req.query.reminderLimit) || 10;
  const reminderSkip = (rPageNum - 1) * reminderLimit;

  const reminderQuery = {
    status: 'pending',
    dateTime: { $gte: startOfDay(today) }
  };

  const [reminders, totalReminders] = await Promise.all([
    Reminder.find(reminderQuery)
      .sort({ dateTime: -1 }) // Latest first
      .lean(),
    Reminder.countDocuments(reminderQuery)
  ]);

  // 9. Dynamic Action Items (System Suggested)
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const [recentLeads, quickQs, customQs, flightQs, fullQs, hotelQs, vehicleQs] = await Promise.all([
    Lead.find({ createdAt: { $gte: tenDaysAgo }, status: 'Active' }).select('personalDetails.emailId personalDetails.fullName createdAt').lean(),
    QuickQuotation.find({ createdAt: { $gte: tenDaysAgo } }).select('email customerName finalizeStatus createdAt').lean(),
    CustomQuotation.find({ createdAt: { $gte: tenDaysAgo } }).select('clientDetails.email clientDetails.clientName isDraft createdAt').lean(),
    FlightQuotation.find({ createdAt: { $gte: tenDaysAgo } }).select('clientDetails.email clientDetails.clientName isDraft createdAt').lean(),
    fullQuotation.find({ createdAt: { $gte: tenDaysAgo } }).select('clientDetails.email clientDetails.clientName isDraft createdAt').lean(),
    HotelQuotation.find({ createdAt: { $gte: tenDaysAgo } }).select('clientDetails.email clientDetails.clientName isDraft createdAt').lean(),
    Vehicle.find({ createdAt: { $gte: tenDaysAgo } }).select('clientDetails.email clientDetails.clientName isDraft createdAt').lean()
  ]);

  const qEmails = new Set();
  const allQs = [...quickQs, ...customQs, ...flightQs, ...fullQs, ...hotelQs, ...vehicleQs];

  allQs.forEach(q => {
    const email = q.email || q.clientDetails?.email;
    if (email) qEmails.add(email.toLowerCase().trim());
  });

  const leadsNeedQuotation = recentLeads
    .filter(l => {
      const email = l.personalDetails?.emailId;
      return email && !qEmails.has(email.toLowerCase().trim());
    })
    .map(l => ({
      _id: `suggested_lead_${l._id}`,
      title: `Create Quotation for ${l.personalDetails.fullName}`,
      description: `New lead from ${format(l.createdAt, 'dd MMM')} needs a quotation.`,
      type: 'task',
      priority: 'high',
      dateTime: l.createdAt,
      status: 'pending',
      suggestedAction: 'create_quotation'
    }));

  const draftQuotations = allQs
    .filter(q => q.finalizeStatus === 'draft' || q.isDraft === true)
    .map(q => ({
      _id: `suggested_quote_${q._id}`,
      title: `Finalize/Mail Quote for ${q.customerName || q.clientDetails?.clientName}`,
      description: `Quotation created on ${format(q.createdAt, 'dd MMM')} is still in draft.`,
      type: 'reminder',
      priority: 'medium',
      dateTime: q.createdAt,
      status: 'pending',
      suggestedAction: 'mail_quotation'
    }));

  const allRemindersList = [...reminders, ...leadsNeedQuotation, ...draftQuotations]
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  const totalRemindersCount = allRemindersList.length;
  const paginatedReminders = allRemindersList.slice(reminderSkip, reminderSkip + reminderLimit);

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
    reminders: paginatedReminders,
    pagination: {
      reminders: {
        total: totalRemindersCount,
        page: reminderPage,
        limit: reminderLimit,
        pages: Math.ceil(totalRemindersCount / reminderLimit)
      },
      activities: {
        total: totalActivities,
        page: activityPage,
        limit: activityLimitSize,
        pages: Math.ceil(totalActivities / activityLimitSize)
      }
    },
    actionItems: {
      leadsNeedQuotation: leadsNeedQuotation.length,
      draftQuotations: draftQuotations.length
    }
  };

  // Cache the results for 5 minutes
  await setCache(cacheKey, stats, 300);

  return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});
