import { CustomQuotation } from "../../models/quotation/customQuotation.model.js";
import ReceivedVoucher from "../../models/payment.model.js";
import QuickQuotation from "../../models/quotation/quickQuotation.model.js";
import { Vehicle } from "../../models/quotation/vehicle.model.js";
import { FlightQuotation } from "../../models/quotation/flightQuotation.model.js";
import { HotelQuotation } from "../../models/quotation/hotelQuotation.model.js";
import { fullQuotation } from "../../models/quotation/fullQuotation.model.js";
import { Lead } from "../../models/lead.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { startOfDay, endOfDay, startOfMonth, subMonths, format, addDays } from 'date-fns';
import { getCache, setCache, clearPattern } from "../../utils/cache.js";
import Company from "../../models/company.model.js";
import emailQueue from "../../utils/emailQueue.js";
import { buildHotelAvailabilityRequestEmail } from "../../utils/customQuotationMailerTemplates.js";
import EmailAccount from "../../models/emailAccount.model.js";

const escapeRegex = (string) => {
  if (!string || typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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
        { "clientDetails.clientName": regex },
        { leadId: regex }
      ]
    } : {})
      .select("_id quotationId clientDetails.clientName")
      .limit(limit)
      .lean(),

    // Quick Quotations
    QuickQuotation.find(regex ? {
      $or: [
        { quickQuotationId: regex },
        { customerName: regex },
        { email: regex },
        { leadId: regex }
      ]
    } : {})
      .select("_id quickQuotationId customerName")
      .limit(limit)
      .lean(),

    // Vehicle Quotations
    Vehicle.find(regex ? {
      $or: [
        { vehicleQuotationId: regex },
        { "basicsDetails.clientName": regex },
        { leadId: regex }
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
        { "personalDetails.fullName": regex },
        { "personalDetails.emailId": regex },
        { leadId: regex }
      ]
    } : {})
      .select("_id flightQuotationId clientDetails.clientName personalDetails.fullName")
      .limit(limit)
      .lean(),

    // Hotel Quotations
    HotelQuotation.find(regex ? {
      $or: [
        { hotelQuotationId: regex },
        { "clientDetails.clientName": regex },
        { leadId: regex }
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
    if (q.availabilityHotels && q.availabilityHotels.length > 0) {
      q.availabilityHotels.forEach(ah => stays.push({
        ...ah, quotationId: q.quotationId, quotationType: "CustomQuotation", _id: q._id, clientName: q.clientDetails?.clientName || "Guest"
      }));
    } else {
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
    }
  });

  quick.forEach(q => {
    if (q.availabilityHotels && q.availabilityHotels.length > 0) {
      q.availabilityHotels.forEach(ah => stays.push({
        ...ah, quotationId: q.quickQuotationId, quotationType: "QuickQuotation", _id: q._id, clientName: q.customerName || "Guest"
      }));
    } else {
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
    }
  });

  hotel.forEach(q => {
    if (q.availabilityHotels && q.availabilityHotels.length > 0) {
      q.availabilityHotels.forEach(ah => stays.push({
        ...ah, quotationId: q.hotelQuotationId, quotationType: "HotelQuotation", _id: q._id, clientName: q.clientDetails?.clientName || "Guest"
      }));
    } else {
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
    }
  });

  res.status(200).json(new ApiResponse(200, stays, "Stay locations fetched successfully"));
});

export const saveAvailabilityHotels = asyncHandler(async (req, res) => {
  const { stays } = req.body;
  const groupedStays = {};
  
  stays.forEach(stay => {
    const qId = stay._id;
    if (!qId) return;
    if (!groupedStays[qId]) {
      groupedStays[qId] = {
         quotationType: stay.quotationType,
         hotels: []
      };
    }
    groupedStays[qId].hotels.push(stay);
  });

  for (const qId in groupedStays) {
     const { quotationType, hotels } = groupedStays[qId];
     if (quotationType === "CustomQuotation") {
        await CustomQuotation.findByIdAndUpdate(qId, { availabilityHotels: hotels });
     } else if (quotationType === "QuickQuotation") {
        await QuickQuotation.findByIdAndUpdate(qId, { availabilityHotels: hotels });
     } else if (quotationType === "HotelQuotation") {
        await HotelQuotation.findByIdAndUpdate(qId, { availabilityHotels: hotels });
     }
  }

  res.status(200).json(new ApiResponse(200, null, "Availability hotels saved successfully"));
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

/**
 * Synchronize lead updates across all associated quotations:
 * - Quick Quotations (customerName, title, email, phone, clientLocation, members, rooms, pickupDrop, etc.)
 * - Custom Quotations (clientDetails, sector, tourDetails, quotationDetails, vehicleDetails, etc.)
 * - Vehicle, Flight, Hotel, and Full quotations
 *
 * @param {Object} lead - The updated Lead document
 * @param {Object} previousLeadInfo - Snapshot of lead details before update
 * @returns {Promise<Object>} sync summary
 */
export const syncLeadToQuotations = async (lead, previousLeadInfo = {}) => {
  if (!lead) return { success: false, message: "No lead provided" };

  const leadId = lead.leadId;
  const newName = lead.personalDetails?.fullName?.trim() || "";
  const prevName = previousLeadInfo.fullName?.trim() || "";
  const newEmail = lead.personalDetails?.emailId?.trim() || "";
  const prevEmail = previousLeadInfo.emailId?.trim() || "";
  const newPhone = lead.personalDetails?.mobile?.trim() || "";
  const prevPhone = previousLeadInfo.mobile?.trim() || "";
  const newTitle = lead.personalDetails?.title || "Mr";
  const newStatus = lead.status;

  const locationParts = [
    lead.location?.city,
    lead.location?.state,
    lead.location?.country,
  ].filter(Boolean);
  const newLocation = locationParts.join(", ") || lead.location?.city || "";

  const tourDetails = lead.tourDetails || {};
  const members = tourDetails.members || {};
  const pickupDrop = tourDetails.pickupDrop || {};
  const accommodation = tourDetails.accommodation || {};

  // 1. ================= QUICK QUOTATIONS =================
  const quickOrConditions = [];
  if (leadId) quickOrConditions.push({ leadId });
  if (newName) quickOrConditions.push({ customerName: { $regex: new RegExp(`^${escapeRegex(newName)}$`, "i") } });
  if (prevName) quickOrConditions.push({ customerName: { $regex: new RegExp(`^${escapeRegex(prevName)}$`, "i") } });
  if (newEmail) quickOrConditions.push({ email: { $regex: new RegExp(`^${escapeRegex(newEmail)}$`, "i") } });
  if (prevEmail) quickOrConditions.push({ email: { $regex: new RegExp(`^${escapeRegex(prevEmail)}$`, "i") } });
  if (newPhone) quickOrConditions.push({ phone: newPhone });
  if (prevPhone) quickOrConditions.push({ phone: prevPhone });

  let updatedQuickCount = 0;
  if (quickOrConditions.length > 0) {
    const matchingQuickQuotes = await QuickQuotation.find({ $or: quickOrConditions });
    for (const qq of matchingQuickQuotes) {
      if (leadId) qq.leadId = leadId;
      if (newName) qq.customerName = newName;
      if (newEmail) qq.email = newEmail;
      if (newPhone) qq.phone = newPhone;
      if (newTitle) qq.title = newTitle;
      if (newLocation) qq.clientLocation = newLocation;

      // Update members
      if (members.adults !== undefined && members.adults !== null && Number(members.adults) > 0) {
        qq.adults = Number(members.adults);
      }
      if (members.children !== undefined && members.children !== null) {
        qq.children = Number(members.children);
      }
      if (members.kidsWithoutMattress !== undefined && members.kidsWithoutMattress !== null) {
        qq.kids = Number(members.kidsWithoutMattress);
      }
      if (members.infants !== undefined && members.infants !== null) {
        qq.infants = Number(members.infants);
      }

      // Update accommodation
      if (accommodation.noOfRooms !== undefined && accommodation.noOfRooms !== null && Number(accommodation.noOfRooms) > 0) {
        qq.noOfRooms = Number(accommodation.noOfRooms);
      }
      if (accommodation.noOfMattress !== undefined && accommodation.noOfMattress !== null) {
        qq.noOfMattress = Number(accommodation.noOfMattress);
      }
      if (accommodation.sharingType) {
        qq.roomType = accommodation.sharingType;
      }

      // Update pickup/drop
      const arrivalPt = (pickupDrop.arrivalLocation || pickupDrop.arrivalCity || "").trim();
      if (arrivalPt) qq.pickupPoint = arrivalPt;
      const departurePt = (pickupDrop.departureLocation || pickupDrop.departureCity || "").trim();
      if (departurePt) qq.dropPoint = departurePt;
      if (pickupDrop.arrivalDate) {
        const arrDate = new Date(pickupDrop.arrivalDate);
        if (!isNaN(arrDate.getTime())) qq.pickupTime = arrDate;
      }
      if (pickupDrop.departureDate) {
        const depDate = new Date(pickupDrop.departureDate);
        if (!isNaN(depDate.getTime())) qq.dropTime = depDate;
      }
      if (pickupDrop.noOfVehicles !== undefined && pickupDrop.noOfVehicles !== null) {
        qq.noOfVehicles = Number(pickupDrop.noOfVehicles);
      }

      // Update status if appropriate
      if (newStatus === "Cancelled" && qq.finalizeStatus !== "finalized") {
        qq.finalizeStatus = "cancelled";
      } else if (newStatus === "Confirmed" && qq.finalizeStatus === "draft") {
        qq.finalizeStatus = "finalized";
        if (!qq.finalizedAt) qq.finalizedAt = new Date();
      } else if (newStatus === "Active" && qq.finalizeStatus === "cancelled") {
        qq.finalizeStatus = "draft";
      }

      // Update packageSnapshot quotationDetails if present
      if (qq.packageSnapshot && typeof qq.packageSnapshot === "object") {
        const snapQD = { ...(qq.packageSnapshot.quotationDetails || {}) };
        if (pickupDrop.arrivalDate) {
          const arrD = new Date(pickupDrop.arrivalDate);
          if (!isNaN(arrD.getTime())) snapQD.arrivalDate = format(arrD, "yyyy-MM-dd");
        }
        if (pickupDrop.departureDate) {
          const depD = new Date(pickupDrop.departureDate);
          if (!isNaN(depD.getTime())) snapQD.departureDate = format(depD, "yyyy-MM-dd");
        }
        if (accommodation.noOfRooms) snapQD.noOfRooms = Number(accommodation.noOfRooms);
        if (accommodation.noOfMattress !== undefined) snapQD.noOfMattress = Number(accommodation.noOfMattress);
        if (accommodation.mealPlan) snapQD.mealPlan = accommodation.mealPlan;
        if (newLocation) qq.packageSnapshot.clientLocation = newLocation;
        qq.packageSnapshot.quotationDetails = snapQD;
        qq.markModified("packageSnapshot");
      }

      await qq.save();
      await clearPattern(`quickQuotation:${qq._id}`);
      updatedQuickCount++;
    }
  }

  // 2. ================= CUSTOM QUOTATIONS =================
  const customOrConditions = [];
  if (leadId) customOrConditions.push({ leadId });
  if (newName) customOrConditions.push({ "clientDetails.clientName": { $regex: new RegExp(`^${escapeRegex(newName)}$`, "i") } });
  if (prevName) customOrConditions.push({ "clientDetails.clientName": { $regex: new RegExp(`^${escapeRegex(prevName)}$`, "i") } });

  let updatedCustomCount = 0;
  if (customOrConditions.length > 0) {
    const matchingCustomQuotes = await CustomQuotation.find({ $or: customOrConditions });
    for (const cq of matchingCustomQuotes) {
      if (leadId) cq.leadId = leadId;
      if (!cq.clientDetails) cq.clientDetails = {};

      if (newName) cq.clientDetails.clientName = newName;
      if (tourDetails.tourType && ["Domestic", "International"].includes(tourDetails.tourType)) {
        cq.clientDetails.tourType = tourDetails.tourType;
      }
      if (tourDetails.tourDestination || lead.location?.state) {
        cq.clientDetails.sector = tourDetails.tourDestination || lead.location?.state;
      }

      if (!cq.tourDetails) cq.tourDetails = {};

      // Title update
      if (newName) {
        if (!cq.tourDetails.quotationTitle || cq.tourDetails.quotationTitle.startsWith("Quotation for") || (prevName && cq.tourDetails.quotationTitle.includes(prevName))) {
          cq.tourDetails.quotationTitle = `Quotation for ${newName}`;
        }
      }

      if (pickupDrop.arrivalCity) cq.tourDetails.arrivalCity = pickupDrop.arrivalCity;
      if (pickupDrop.departureCity) cq.tourDetails.departureCity = pickupDrop.departureCity;
      if (pickupDrop.arrivalDate) {
        const arrDate = new Date(pickupDrop.arrivalDate);
        if (!isNaN(arrDate.getTime())) {
          cq.tourDetails.arrivalDate = format(arrDate, "yyyy-MM-dd");
        }
      }
      if (pickupDrop.departureDate) {
        const depDate = new Date(pickupDrop.departureDate);
        if (!isNaN(depDate.getTime())) {
          cq.tourDetails.departureDate = format(depDate, "yyyy-MM-dd");
        }
      }
      if (accommodation.transport !== undefined) {
        cq.tourDetails.transport = accommodation.transport ? "Yes" : "No";
      }

      // Quotation details (members, rooms, mealPlan)
      if (!cq.tourDetails.quotationDetails) cq.tourDetails.quotationDetails = {};
      const qd = cq.tourDetails.quotationDetails;
      if (members.adults !== undefined && members.adults !== null && Number(members.adults) > 0) {
        qd.adults = Number(members.adults);
      }
      if (members.children !== undefined && members.children !== null) {
        qd.children = Number(members.children);
      }
      if (members.kidsWithoutMattress !== undefined && members.kidsWithoutMattress !== null) {
        qd.kids = Number(members.kidsWithoutMattress);
      }
      if (members.infants !== undefined && members.infants !== null) {
        qd.infants = Number(members.infants);
      }
      if (accommodation.mealPlan) {
        qd.mealPlan = accommodation.mealPlan;
      }

      if (!qd.rooms) qd.rooms = {};
      if (accommodation.noOfRooms !== undefined && accommodation.noOfRooms !== null && Number(accommodation.noOfRooms) > 0) {
        qd.rooms.numberOfRooms = Number(accommodation.noOfRooms);
      }
      if (accommodation.sharingType) {
        qd.rooms.sharingType = accommodation.sharingType;
      }
      if (accommodation.noOfMattress !== undefined && accommodation.noOfMattress !== null) {
        qd.rooms.mattress = Number(accommodation.noOfMattress);
      }
      if (accommodation.hotelType) {
        const hType = Array.isArray(accommodation.hotelType) ? accommodation.hotelType[0] : accommodation.hotelType;
        if (hType) qd.rooms.roomType = hType;
      }

      // Vehicle details
      if (!cq.tourDetails.vehicleDetails) cq.tourDetails.vehicleDetails = {};
      if (!cq.tourDetails.vehicleDetails.basicsDetails) cq.tourDetails.vehicleDetails.basicsDetails = {};
      if (newName) cq.tourDetails.vehicleDetails.basicsDetails.clientName = newName;

      if (!cq.tourDetails.vehicleDetails.pickupDropDetails) cq.tourDetails.vehicleDetails.pickupDropDetails = {};
      const pdd = cq.tourDetails.vehicleDetails.pickupDropDetails;
      if (pickupDrop.arrivalDate) {
        const arrDate = new Date(pickupDrop.arrivalDate);
        if (!isNaN(arrDate.getTime())) pdd.pickupDate = format(arrDate, "yyyy-MM-dd");
      }
      if (pickupDrop.arrivalLocation || pickupDrop.arrivalCity) {
        pdd.pickupLocation = pickupDrop.arrivalLocation || pickupDrop.arrivalCity;
      }
      if (pickupDrop.departureDate) {
        const depDate = new Date(pickupDrop.departureDate);
        if (!isNaN(depDate.getTime())) pdd.dropDate = format(depDate, "yyyy-MM-dd");
      }
      if (pickupDrop.departureLocation || pickupDrop.departureCity) {
        pdd.dropLocation = pickupDrop.departureLocation || pickupDrop.departureCity;
      }

      // Status sync
      if (newStatus === "Cancelled" && cq.finalizeStatus !== "finalized") {
        cq.finalizeStatus = "cancelled";
      } else if (newStatus === "Confirmed" && cq.finalizeStatus === "draft") {
        cq.finalizeStatus = "finalized";
        if (!cq.finalizedAt) cq.finalizedAt = new Date();
      } else if (newStatus === "Active" && cq.finalizeStatus === "cancelled") {
        cq.finalizeStatus = "draft";
      }

      cq.markModified("tourDetails");
      cq.markModified("clientDetails");
      await cq.save();
      await clearPattern(`customQuotation:${cq.quotationId}`);
      updatedCustomCount++;
    }
  }

  // 3. ================= OTHER QUOTATIONS (Vehicle, Flight, Hotel, Full) =================
  let updatedVehicleCount = 0;
  let updatedFlightCount = 0;
  let updatedHotelCount = 0;
  let updatedFullCount = 0;

  const namesToMatch = [prevName, newName].filter(Boolean);
  const nameRegexList = namesToMatch.map(n => ({ $regex: new RegExp(`^${escapeRegex(n)}$`, "i") }));

  if (nameRegexList.length > 0 || leadId) {
    // Vehicle
    const vCond = [];
    if (leadId) vCond.push({ leadId });
    nameRegexList.forEach(r => vCond.push({ "basicsDetails.clientName": r }));
    const vRes = await Vehicle.updateMany(
      { $or: vCond },
      {
        $set: {
          ...(newName ? { "basicsDetails.clientName": newName } : {}),
          ...(newPhone ? { "basicsDetails.mobile": newPhone } : {}),
          ...(newEmail ? { "basicsDetails.email": newEmail } : {}),
          ...(leadId ? { leadId } : {})
        }
      }
    );
    updatedVehicleCount = vRes.modifiedCount || 0;

    // Flight
    const fCond = [];
    if (leadId) fCond.push({ leadId });
    nameRegexList.forEach(r => {
      fCond.push({ "clientDetails.clientName": r });
      fCond.push({ "personalDetails.fullName": r });
    });
    const fRes = await FlightQuotation.updateMany(
      { $or: fCond },
      {
        $set: {
          ...(newName ? { "clientDetails.clientName": newName, "personalDetails.fullName": newName } : {}),
          ...(newPhone ? { "personalDetails.mobileNumber": newPhone } : {}),
          ...(newEmail ? { "personalDetails.emailId": newEmail } : {}),
          ...(leadId ? { leadId } : {})
        }
      }
    );
    updatedFlightCount = fRes.modifiedCount || 0;

    // Hotel
    const hCond = [];
    if (leadId) hCond.push({ leadId });
    nameRegexList.forEach(r => {
      hCond.push({ "clientDetails.clientName": r });
      hCond.push({ "personalDetails.fullName": r });
    });
    const hRes = await HotelQuotation.updateMany(
      { $or: hCond },
      {
        $set: {
          ...(newName ? { "clientDetails.clientName": newName, "personalDetails.fullName": newName } : {}),
          ...(newPhone ? { "personalDetails.contactNumber": newPhone } : {}),
          ...(newEmail ? { "personalDetails.email": newEmail } : {}),
          ...(leadId ? { leadId } : {})
        }
      }
    );
    updatedHotelCount = hRes.modifiedCount || 0;

    // Full
    const fullCond = [];
    if (leadId) fullCond.push({ leadId });
    nameRegexList.forEach(r => fullCond.push({ "clientDetails.clientName": r }));
    const fullRes = await fullQuotation.updateMany(
      { $or: fullCond },
      {
        $set: {
          ...(newName ? { "clientDetails.clientName": newName } : {}),
          ...(tourDetails.tourDestination ? { "clientDetails.sector": tourDetails.tourDestination } : {}),
          ...(leadId ? { leadId } : {})
        }
      }
    );
    updatedFullCount = fullRes.modifiedCount || 0;
  }

  // Clear all cached quotations and unified statistics
  await Promise.all([
    clearPattern("quickQuotations:*"),
    clearPattern("customQuotations:*"),
    clearPattern("flightQuotations:*"),
    clearPattern("quotations:search:*"),
    clearPattern("quotations:stats"),
    clearPattern("dashboard:stats:*"),
  ]);

  return {
    success: true,
    leadId,
    updatedQuickCount,
    updatedCustomCount,
    updatedVehicleCount,
    updatedFlightCount,
    updatedHotelCount,
    updatedFullCount,
  };
};

/**
 * Endpoint to manually or programmatically synchronize quotations with a lead
 */
export const syncLeadQuotationsController = asyncHandler(async (req, res) => {
  const targetLeadId = req.params.leadId || req.body.leadId;
  if (!targetLeadId) {
    throw new ApiError(400, "leadId is required");
  }

  const lead = await Lead.findOne({ leadId: targetLeadId });
  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  const result = await syncLeadToQuotations(lead, req.body.previousLeadInfo || {});
  return res.status(200).json(new ApiResponse(200, result, "Quotations synchronized successfully with lead"));
});

