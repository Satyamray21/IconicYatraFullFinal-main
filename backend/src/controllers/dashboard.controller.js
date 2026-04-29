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

export const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Lead Stats
  const leadStats = await Lead.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedLeadStats = {
    total: 0,
    active: 0,
    confirmed: 0,
    cancelled: 0
  };

  leadStats.forEach(stat => {
    const status = stat._id?.toLowerCase();
    formattedLeadStats.total += stat.count;
    if (status === 'active') formattedLeadStats.active = stat.count;
    else if (status === 'confirmed') formattedLeadStats.confirmed = stat.count;
    else if (status === 'cancelled') formattedLeadStats.cancelled = stat.count;
  });

  // 2. Quotation Stats (Aggregate from all models)
  const [customQ, flightQ, fullQ, hotelQ, quickQ, vehicleQ] = await Promise.all([
    CustomQuotation.countDocuments(),
    FlightQuotation.countDocuments(),
    fullQuotation.countDocuments(),
    HotelQuotation.countDocuments(),
    QuickQuotation.countDocuments(),
    Vehicle.countDocuments()
  ]);

  const totalQuotations = customQ + flightQ + fullQ + hotelQ + quickQ + vehicleQ;

  // 3. Tour/Package Stats
  const packages = await Package.find({}, 'status validFrom validTill');
  const today = new Date();
  
  const tourStats = {
    total: packages.length,
    active: 0,
    upcoming: 0,
    completed: 0
  };

  packages.forEach(pkg => {
    const status = pkg.status?.toLowerCase();
    const startDate = pkg.validFrom ? new Date(pkg.validFrom) : null;
    const endDate = pkg.validTill ? new Date(pkg.validTill) : null;

    if (status === 'confirmed' || status === 'active') {
      if (startDate && startDate > today) tourStats.upcoming++;
      else if (endDate && endDate < today) tourStats.completed++;
      else tourStats.active++;
    } else if (status === 'completed') {
      tourStats.completed++;
    }
  });

  // 4. Invoice & Revenue Stats
  const invoices = await Invoice.find({}, 'totalAmount createdAt');
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  // 5. Monthly Revenue (Last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(subMonths(today, i));
    
    const revenue = invoices
      .filter(inv => {
        const date = new Date(inv.createdAt);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    monthlyRevenue.push({
      month: format(monthStart, 'MMM'),
      revenue
    });
  }

  // 6. Activities (Recent or Date-filtered)
  const { activityDate } = req.query;
  let activityFilter = {};
  let activityLimit = 10;

  if (activityDate) {
    const start = startOfDay(new Date(activityDate));
    const end = endOfDay(new Date(activityDate));
    activityFilter = {
      timestamp: { $gte: start, $lte: end }
    };
    activityLimit = 50; // Show more when filtering by date
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
      details: { customQ, flightQ, fullQ, hotelQ, quickQ, vehicleQ }
    },
    tours: tourStats,
    invoices: {
      total: invoices.length,
      revenue: totalRevenue,
      monthlyRevenue
    },
    recentActivities,
    others: {
      enquiries,
      blogs,
      hotels
    },
    reminders
  };

  return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});
