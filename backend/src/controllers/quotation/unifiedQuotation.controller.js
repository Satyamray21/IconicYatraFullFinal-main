import { CustomQuotation } from "../../models/quotation/customQuotation.model.js";
import ReceivedVoucher from "../../models/payment.model.js";
import QuickQuotation from "../../models/quotation/quickQuotation.model.js";
import { Vehicle } from "../../models/quotation/vehicle.model.js";
import { FlightQuotation } from "../../models/quotation/flightQuotation.model.js";
import { HotelQuotation } from "../../models/quotation/hotelQuotation.model.js";
import { fullQuotation } from "../../models/quotation/fullQuotation.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { startOfDay, endOfDay, startOfMonth, subMonths, format, addDays } from 'date-fns';
import { getCache, setCache } from "../../utils/cache.js";
import Company from "../../models/company.model.js";
import emailQueue from "../../utils/emailQueue.js";
import { buildHotelAvailabilityRequestEmail } from "../../utils/customQuotationMailerTemplates.js";
import EmailAccount from "../../models/emailAccount.model.js";

export const searchAllQuotations = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const limit = 10;
  
  const cacheKey = `quotations:search:${search || 'all'}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Quotations fetched from cache", "cache"));
  }

  const regex = search ? { $regex: search, $options: "i" } : null;

  const [custom, quick, vehicle, flight, hotel] = await Promise.all([
    // Custom Quotations
    CustomQuotation.find(regex ? {
      $or: [
        { quotationId: regex },
        { "clientDetails.clientName": regex }
      ]
    } : {})
      .select("_id quotationId clientDetails.clientName")
      .limit(limit)
      .lean(),

    // Quick Quotations
    QuickQuotation.find(regex ? {
      $or: [
        { quickQuotationId: regex },
        { customerName: regex }
      ]
    } : {})
      .select("_id quickQuotationId customerName")
      .limit(limit)
      .lean(),

    // Vehicle Quotations
    Vehicle.find(regex ? {
      $or: [
        { vehicleQuotationId: regex },
        { "basicsDetails.clientName": regex }
      ]
    } : {})
      .select("_id vehicleQuotationId basicsDetails.clientName")
      .limit(limit)
      .lean(),

    // Flight Quotations
    FlightQuotation.find(regex ? {
      $or: [
        { flightQuotationId: regex },
        { "clientDetails.clientName": regex },
        { "personalDetails.fullName": regex }
      ]
    } : {})
      .select("_id flightQuotationId clientDetails.clientName personalDetails.fullName")
      .limit(limit)
      .lean(),

    // Hotel Quotations
    HotelQuotation.find(regex ? {
      $or: [
        { hotelQuotationId: regex },
        { "clientDetails.clientName": regex }
      ]
    } : {})
      .select("_id hotelQuotationId clientDetails.clientName")
      .limit(limit)
      .lean(),
  ]);

  const results = [
    ...custom.map(q => ({ _id: q._id, quotationId: q.quotationId, clientName: q.clientDetails?.clientName || "N/A", type: "Custom" })),
    ...quick.map(q => ({ _id: q._id, quotationId: q.quickQuotationId, clientName: q.customerName || "N/A", type: "Quick" })),
    ...vehicle.map(q => ({ _id: q._id, quotationId: q.vehicleQuotationId, clientName: q.basicsDetails?.clientName || "N/A", type: "Vehicle" })),
    ...flight.map(q => ({ _id: q._id, quotationId: q.flightQuotationId, clientName: q.clientDetails?.clientName || q.personalDetails?.fullName || "N/A", type: "Flight" })),
    ...hotel.map(q => ({ _id: q._id, quotationId: q.hotelQuotationId, clientName: q.clientDetails?.clientName || "N/A", type: "Hotel" })),
  ];

  await setCache(cacheKey, results, 300); // Cache for 5 minutes

  return res.status(200).json(new ApiResponse(200, results, "Quotations fetched successfully", "database"));
});

export const getUnifiedQuotationStats = asyncHandler(async (req, res) => {
  const cacheKey = "quotations:stats";
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Quotation stats fetched from cache", "cache"));
  }

  const today = new Date();
  
  const periods = [
    { title: "Today's", start: startOfDay(today), end: endOfDay(today) },
    { title: "This Month", start: startOfMonth(today), end: today },
    { title: "Last 3 Months", start: startOfMonth(subMonths(today, 2)), end: today },
    { title: "Last 6 Months", start: startOfMonth(subMonths(today, 5)), end: today },
    { title: "Last 12 Months", start: startOfMonth(subMonths(today, 11)), end: today },
  ];

  const models = [CustomQuotation, QuickQuotation, Vehicle, FlightQuotation, HotelQuotation, fullQuotation];

  const calculateStatsForPeriod = async (start, end) => {
    const query = { createdAt: { $gte: start, $lte: end } };
    
    const counts = await Promise.all(models.map(async (model) => {
      const results = await model.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$finalizeStatus",
            count: { $sum: 1 }
          }
        }
      ]);
      return results;
    }));

    let finalized = 0;
    let inProcess = 0;
    let cancelled = 0;

    counts.flat().forEach(stat => {
      const status = stat._id || 'draft'; // fallback for old records
      if (status === 'finalized') finalized += stat.count;
      else if (status === 'cancelled') cancelled += stat.count;
      else inProcess += stat.count; // everything else is in process
    });

    return { confirmed: finalized, inProcess, cancelledIncomplete: cancelled };
  };

  const stats = await Promise.all(periods.map(async (p) => {
    const counts = await calculateStatsForPeriod(p.start, p.end);
    return { title: p.title, ...counts };
  }));

  await setCache(cacheKey, stats, 600); // Cache for 10 minutes

  return res.status(200).json(new ApiResponse(200, stats, "Quotation stats fetched successfully", "database"));
});

export const getPaymentSummary = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || "";
  
  const searchRegex = search ? new RegExp(search, "i") : null;

  const customQuery = { finalizeStatus: "finalized" };
  const quickQuery = { finalizeStatus: "finalized" };
  const flightQuery = { finalizeStatus: "finalized" };
  const vehicleQuery = { finalizeStatus: "finalized" };
  const hotelQuery = { finalizeStatus: "finalized" };
  const voucherQuery = { accountType: { $regex: /^client$/i } };

  if (searchRegex) {
    customQuery["clientDetails.clientName"] = searchRegex;
    quickQuery["customerName"] = searchRegex;
    flightQuery.$or = [
      { "clientDetails.clientName": searchRegex },
      { "personalDetails.fullName": searchRegex }
    ];
    vehicleQuery["basicsDetails.clientName"] = searchRegex;
    hotelQuery["clientDetails.clientName"] = searchRegex;
    voucherQuery["partyName"] = searchRegex;
  }

  // Fetch all finalized quotations matching search to get total amounts per client
  const [custom, quick, flight, vehicle, hotel] = await Promise.all([
    CustomQuotation.find(customQuery).lean(),
    QuickQuotation.find(quickQuery).lean(),
    FlightQuotation.find(flightQuery).lean(),
    Vehicle.find(vehicleQuery).lean(),
    HotelQuotation.find(hotelQuery).lean(),
  ]);

  const clientMap = {};

  const getClientNode = (name) => {
    const cName = name || "Unknown";
    if (!clientMap[cName]) {
      clientMap[cName] = { clientName: cName, totalAmount: 0, receivedBalance: 0, due: 0, transactions: [] };
    }
    return clientMap[cName];
  };

  // Custom
  custom.forEach(q => {
    const pkg = q.finalizedPackage?.toLowerCase() || 'standard';
    let base = q.tourDetails?.quotationDetails?.packageCalculations?.[pkg]?.finalTotal || 0;
    (q.tourDetails?.quotationDetails?.additionalServices || []).forEach(s => {
      if (s.included === 'no') base += (s.totalAmount || 0);
    });
    getClientNode(q.clientDetails?.clientName).totalAmount += base;
  });

  // Quick
  quick.forEach(q => {
    getClientNode(q.customerName).totalAmount += (q.totalCost || 0);
  });

  // Flight
  flight.forEach(q => {
    const name = q.clientDetails?.clientName || q.personalDetails?.fullName;
    getClientNode(name).totalAmount += (q.totalFare || 0);
  });

  // Vehicle
  vehicle.forEach(q => {
    getClientNode(q.basicsDetails?.clientName).totalAmount += (q.totalAmount || 0);
  });

  // Fetch payments only for Clients (exclude associate/vendor) matching search
  const vouchers = await ReceivedVoucher.find(voucherQuery).lean();
  
  vouchers.forEach(v => {
    const node = getClientNode(v.partyName);
    const amount = Number(v.amount) || 0;
    const isReceive = v.drCr === "Cr" || v.paymentType === "Receive Voucher";
    const isPayment = v.drCr === "Dr" || v.paymentType === "Payment Voucher";

    if (isReceive) node.receivedBalance += amount;
    else if (isPayment) node.receivedBalance -= amount;

    node.transactions.push({
      amount: v.amount,
      date: v.date,
      status: v.paymentType || v.drCr
    });
  });

  const summary = [];
  for (const key in clientMap) {
    const c = clientMap[key];
    c.due = Math.max(0, c.totalAmount - c.receivedBalance);
    // Exclude clients whose due is 0
    if (c.due > 0) {
      c.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      summary.push(c);
    }
  }

  summary.sort((a, b) => b.due - a.due);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedSummary = summary.slice(startIndex, endIndex);

  return res.status(200).json(new ApiResponse(200, {
    data: paginatedSummary,
    totalCount: summary.length,
    page,
    totalPages: Math.ceil(summary.length / limit)
  }, "Payment summary fetched successfully"));
});



export const getUpcomingStayLocations = asyncHandler(async (req, res) => {
  const custom = await CustomQuotation.find({ finalizeStatus: "finalized" }).lean();
  const quick = await QuickQuotation.find({ finalizeStatus: "finalized" }).lean();
  const hotel = await HotelQuotation.find({ finalizeStatus: "finalized" }).lean();

  const stays = [];

  const processDestinations = (quotation, quotationType, idField, clientName, arrivalDate, destinations, paxDetails, roomDetails) => {
    if (!destinations || destinations.length === 0) return;
    
    let currentCheckIn = arrivalDate ? new Date(arrivalDate) : new Date();
    
    const today = startOfDay(new Date());
    if (currentCheckIn < today) return;

    destinations.forEach((dest) => {
      const nights = Number(dest.nights) || 1;
      const currentCheckOut = addDays(currentCheckIn, nights);

      stays.push({
        quotationId: quotation[idField],
        quotationType,
        _id: quotation._id,
        clientName: clientName || "Guest",
        city: dest.cityName || dest.city || dest.destination || "City",
        nights,
        checkInDate: isNaN(currentCheckIn) ? "TBD" : format(currentCheckIn, "dd MMM yyyy"),
        checkOutDate: isNaN(currentCheckOut) ? "TBD" : format(currentCheckOut, "dd MMM yyyy"),
        adults: paxDetails?.adults,
        children: paxDetails?.children,
        kids: paxDetails?.kids,
        infants: paxDetails?.infants,
        noOfRooms: roomDetails?.numberOfRooms || dest.noOfRooms || 1,
        sharingType: roomDetails?.sharingType || dest.sharingType || "Double sharing",
        mealPlan: roomDetails?.mealPlan || dest.mealPlan || "Breakfast Only",
        roomCategory: roomDetails?.roomCategory || dest.roomCategory || "Premium Room"
      });

      currentCheckIn = currentCheckOut; // next destination check-in is current check-out
    });
  };

  custom.forEach(q => {
    const qd = q.tourDetails?.quotationDetails;
    processDestinations(
      q,
      "CustomQuotation",
      "quotationId",
      q.clientDetails?.clientName,
      q.tourDetails?.arrivalDate,
      qd?.destinations || [],
      { adults: qd?.adults, children: qd?.children, kids: qd?.kids, infants: qd?.infants },
      { numberOfRooms: qd?.rooms?.numberOfRooms, sharingType: qd?.rooms?.sharingType, mealPlan: qd?.mealPlan }
    );
  });

  quick.forEach(q => {
    const qd = q.packageSnapshot?.quotationDetails;
    const arrivalDate = q.arrivalDate || qd?.arrivalDate;
    const destinations = q.destinations || qd?.destinations || q.packageSnapshot?.stayLocations || q.packageSnapshot?.destinationNights || [];
    
    processDestinations(
      q,
      "QuickQuotation",
      "quickQuotationId",
      q.customerName,
      arrivalDate,
      destinations,
      { adults: q.adults, children: q.children, kids: q.kids, infants: q.infants },
      { numberOfRooms: q.noOfRooms || q.numberOfRooms, sharingType: q.roomType || q.sharingType, mealPlan: q.mealPlan || qd?.mealPlan }
    );
  });

  hotel.forEach(q => {
    processDestinations(
      q,
      "HotelQuotation",
      "hotelQuotationId",
      q.clientDetails?.clientName,
      q.pickupDrop?.arrivalDate,
      q.stayLocation || [],
      { adults: q.clientDetails?.adults, children: q.clientDetails?.children, kids: q.clientDetails?.kids, infants: q.clientDetails?.infants },
      { numberOfRooms: q.accommodationDetails?.noOfRooms, sharingType: q.accommodationDetails?.sharingType, mealPlan: q.accommodationDetails?.mealPlan }
    );
  });

  res.status(200).json(new ApiResponse(200, stays, "Stay locations fetched successfully"));
});

export const previewHotelAvailabilityEmail = asyncHandler(async (req, res) => {
  const { stay, companyId } = req.body;

  let options = {};
  if (companyId) {
    const company = await Company.findById(companyId).lean();
    if (company) {
      options.companyName = company.companyName;
      options.companyLogo = company.logo;
      options.companyPhone = company.phone;
      options.companyEmail = company.email;
      options.companyWebsite = company.companyWebsite;
      options.companyAddress = company.address;
    }
  }

  const emailData = buildHotelAvailabilityRequestEmail(stay, options);
  res.status(200).json(new ApiResponse(200, { normal: emailData }, "Preview generated"));
});

export const sendHotelAvailabilityEmail = asyncHandler(async (req, res) => {
  const { to, cc, subject, bodyHtml, senderAccount, companyId } = req.body;

  let smtpConfig;
  let fromEmail = "info@iconicyatra.com";
  let fromName = "Iconic Yatra";

  if (senderAccount) {
    const account = await EmailAccount.findById(senderAccount);
    if (account) {
      smtpConfig = {
        service: account.service || "gmail",
        auth: {
          user: account.email,
          pass: account.appPassword,
        },
      };
      if (account.host) smtpConfig.host = account.host;
      if (account.port) smtpConfig.port = account.port;
      if (account.secure !== undefined) smtpConfig.secure = account.secure;

      fromEmail = account.email;
      fromName = account.displayName || account.label || "Reservation Team";
    }
  }

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    cc,
    subject,
    html: bodyHtml,
  };

  emailQueue.add("hotel-availability", { mailOptions, smtpConfig });

  res.status(200).json(new ApiResponse(200, null, "Email added to queue successfully"));
});

