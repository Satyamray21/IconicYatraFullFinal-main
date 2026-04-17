import { asyncHandler } from '../utils/asyncHandler.js';
import { Lead } from '../models/lead.model.js';
import LeadSourceOption from '../models/LeadSourceOptions.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfDay, startOfMonth, subMonths } from "date-fns";
import { getNextLeadId } from "../utils/getNextLeadId.js";
import { LeadOptions } from "../models/leadOptions.model.js"
import { calculateAccommodation } from "../utils/calculateAccommondation.js"
import { logActivity } from "../utils/ActivityLog.js"
//  Helper for single-value fields
const handleAddMoreValue = (valueObj) => {
  if (typeof valueObj === "string") return valueObj;
  if (valueObj?.value === "addMore" && valueObj?.newValue) {
    return valueObj.newValue;
  }
  return valueObj?.value || "";
};


//  Helper for array fields
const handleAddMoreArray = (arr = []) => {
  if (!Array.isArray(arr)) {
    arr = [arr]; // convert single value to array
  }
  return arr.map((item) => handleAddMoreValue(item));
};
const saveAddMoreValue = async (fieldName, value) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return;

  // If value is an object from Add More, extract actual value
  if (typeof value === "object" && value.value === "addMore") {
    value = value.newValue;
  }

  if (Array.isArray(value)) {
    for (const v of value) {
      const exists = await LeadOptions.findOne({ fieldName, value: v.trim() });
      if (!exists) {
        await LeadOptions.create({ fieldName, value: v.trim() });
      }
    }
  } else {
    const exists = await LeadOptions.findOne({ fieldName, value: value.trim() });
    if (!exists) {
      await LeadOptions.create({ fieldName, value: value.trim() });
    }
  }
};



//createLead

export const createLead = asyncHandler(async (req, res) => {
  const {
    // Personal & Official
    fullName,
    mobile,
    alternateNumber,
    email,
    title,
    dob,
    source,
    assignedTo,
    businessType,
    priority,
    note,
    city,
    country,
    state,
    pincode,
    address1,
    address2,
    address3,
    referralBy,
    agentName,

    // Tour
    tourType,
    tourDestination,
    servicesRequired,
    adults,
    children,
    kidsWithoutMattress,
    infants,
    arrivalDate,
    arrivalCity,
    arrivalLocation,
    departureDate,
    departureCity,
    departureLocation,
    hotelType,
    mealPlan,
    transport,
    sharingType,
    noOfRooms = 0,
    noOfMattress,
    noOfNights,
    requirementNote,
  } = req.body;

  // ✅ Handle addMore for single values
  const sourceToSave = handleAddMoreValue(source);
  const agentNameToSave = handleAddMoreValue(agentName);
  const referredByToSave = handleAddMoreValue(referralBy);
  const arrivalCityToSave = handleAddMoreValue(arrivalCity);
  const arrivalLocationToSave = handleAddMoreValue(arrivalLocation);
  const departureCityToSave = handleAddMoreValue(departureCity);
  const departureLocationToSave = handleAddMoreValue(departureLocation);

  // ✅ Handle addMore for arrays
  const servicesRequiredToSave = handleAddMoreArray(servicesRequired);
  const hotelTypeToSave = handleAddMoreArray(hotelType);

  await Promise.all([
    saveAddMoreValue("source", sourceToSave),
    saveAddMoreValue("agentName", agentNameToSave),
    saveAddMoreValue("referredBy", referredByToSave),
    saveAddMoreValue("tourDestination", tourDestination),
    saveAddMoreValue("servicesRequired", servicesRequiredToSave),
    saveAddMoreValue("arrivalCity", arrivalCityToSave),
    saveAddMoreValue("arrivalLocation", arrivalLocationToSave),
    saveAddMoreValue("departureCity", departureCityToSave),
    saveAddMoreValue("departureLocation", departureLocationToSave),
    saveAddMoreValue("hotelType", hotelTypeToSave),
    saveAddMoreValue("mealPlan", mealPlan),
    saveAddMoreValue("sharingType", sharingType),
    saveAddMoreValue("country", country),
  ]);

  // ✅ Prepare members & accommodation objects
  const members = {
    adults,
    children,
    kidsWithoutMattress,
    infants,
  };

  const accommodation = {
    hotelType: hotelTypeToSave,
    mealPlan,
    transport,
    sharingType,
    noOfRooms,
    noOfMattress,
    noOfNights,
    requirementNote,
  };

  // ✅ Auto-calculate rooms & mattresses
  const { autoCalculatedRooms, extraMattress } = calculateAccommodation(
    members,
    accommodation
  );
  accommodation.noOfRooms = autoCalculatedRooms;
  accommodation.noOfMattress = extraMattress;

  // ✅ Build schema fields
  const personalDetails = {
    fullName,
    mobile,
    alternateNumber,
    emailId: email,
    title,
    dateOfBirth: dob,
  };

  const location = { country, state, city };

  const address = {
    addressLine1: address1,
    addressLine2: address2,
    addressLine3: address3,
    pincode,
  };

  const officialDetail = {
    businessType,
    priority,
    source: sourceToSave,
    agentName: agentNameToSave,
    referredBy: referredByToSave,
    assignedTo,
  };

  const tourDetails = {
    tourType,
    tourDestination,
    servicesRequired: servicesRequiredToSave,
    members,
    pickupDrop: {
      arrivalDate,
      arrivalCity: arrivalCityToSave,
      arrivalLocation: arrivalLocationToSave,
      departureDate,
      departureCity: departureCityToSave,
      departureLocation: departureLocationToSave,
    },
    accommodation,
  };

  // ✅ Generate lead ID
  const totalLeads = await Lead.countDocuments();
  const leadId = await getNextLeadId();

  // ✅ Create lead
  const newLead = await Lead.create({
    personalDetails,
    location,
    address,
    officialDetail,
    tourDetails,
    leadId,
    status: "Active",
  });
  await logActivity({
    action: "Created",
    model: "Lead",
    referenceId: leadId,
    description: `Lead ${leadId} created successfully by ${req.user?.name || 'System'}`,
    performedBy: req.user?.name || "System",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newLead, "Lead created successfully"));
});



// view Lead
export const viewAllLeads = asyncHandler(async (req, res) => {
  try {
     const lead = await Lead.find().sort({ createdAt: -1 });
    res.status(200)
      .json(new ApiResponse(200, lead, "All leads fetched successfully"))
  }
  catch (err) {
    console.log("Error", err.message);
    throw new ApiError(404, {}, "No lead found")
  }
})
//update Lead
export const updateLead = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { personalDetails, location, address, officialDetail, tourDetails } = req.body;

  if (!leadId) {
    throw new ApiError(400, "leadId is required");
  }

  console.log("➡️ Updating lead with ID:", leadId);

  const existingLead = await Lead.findOne({ leadId });

  if (!existingLead) {
    throw new ApiError(404, "Lead not found");
  }

  // Source default fallback
  let sourceToSave = officialDetail?.source || existingLead.officialDetail.source;

  // Handle new source creation
  if (officialDetail?.sourceType === 'addMore' && officialDetail?.newSource) {
    console.log("🆕 Adding new source:", officialDetail.newSource);

    const existingSource = await LeadSourceOption.findOne({
      businessType: officialDetail.businessType,
      sourceName: officialDetail.newSource,
    });

    if (!existingSource) {
      await LeadSourceOption.create({
        businessType: officialDetail.businessType,
        sourceName: officialDetail.newSource,
      });

      console.log("✅ New source created in LeadSourceOption");
    }

    sourceToSave = officialDetail.newSource;
  }

  // Update sections safely
  if (personalDetails) {
    console.log("✏️ Updating personalDetails");
    Object.assign(existingLead.personalDetails, personalDetails);
  }

  if (location) {
    console.log("📍 Updating location");
    Object.assign(existingLead.location, location);
  }

  if (address) {
    console.log("🏠 Updating address");
    Object.assign(existingLead.address, address);
  }

  if (officialDetail) {
    console.log("🗂️ Updating officialDetail");

    existingLead.officialDetail = {
      ...existingLead.officialDetail,
      ...officialDetail,
      source: sourceToSave, // override with correct source
    };
  }

  if (tourDetails) {
    console.log("🎫 Updating tourDetails");
    Object.assign(existingLead.tourDetails, tourDetails);
  }

  try {
    await existingLead.save();
    console.log("✅ Lead updated and saved successfully");
    res.status(200).json(new ApiResponse(200, existingLead, "Lead updated successfully"));
  } catch (error) {
    console.error("❌ Error saving lead:", error);
    throw new ApiError(500, error.message || "Failed to update lead");
  }
});

//view Data wise 
export const viewAllLeadsReports = asyncHandler(async (req, res) => {
  try {
    const leads = await Lead.find();

    const now = new Date();

    // Define date ranges
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const last3Months = subMonths(now, 3);
    const last6Months = subMonths(now, 6);
    const last12Months = subMonths(now, 12);

    // Helper to count by status in a given date range
    const getStatusCounts = async (fromDate) => {
      const result = await Lead.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts = {
        Active: 0,
        Confirmed: 0,
        Cancelled: 0,
      };

      result.forEach((item) => {
        counts[item._id] = item.count;
      });

      return counts;
    };

    const today = await getStatusCounts(todayStart);
    const thisMonth = await getStatusCounts(monthStart);
    const last3 = await getStatusCounts(last3Months);
    const last6 = await getStatusCounts(last6Months);
    const last12 = await getStatusCounts(last12Months);

    const stats = [
      { title: "Today's", ...today },
      { title: "This Month", ...thisMonth },
      { title: "Last 3 Months", ...last3 },
      { title: "Last 6 Months", ...last6 },
      { title: "Last 12 Months", ...last12 },
    ];

    res
      .status(200)
      .json(new ApiResponse(200, stats, "All leads fetched successfully"));
  } catch (err) {
    console.log("Error", err.message);
    throw new ApiError(404, {}, "No lead found");
  }
});


// Delete Lead
export const deleteLead = asyncHandler(async (req, res) => {
  const { leadId } = req.params;

  if (!leadId) {
    throw new ApiError(400, "leadId is required");
  }

  const deletedLead = await Lead.findOneAndDelete({ leadId });

  if (!deletedLead) {
    throw new ApiError(404, "Lead not found");
  }
  await logActivity({
    action: "Deleted",
    model: "Lead",
    referenceId: leadId,
    description: `Lead ${leadId} deleted by ${req.user?.name || 'System'}`,
    performedBy: req.user?.name || "System",
  });

  res.status(200).json(new ApiResponse(200, {}, "Lead deleted successfully"));
});

//view by LeadId 
export const viewByLeadId = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  if (!leadId) {
    throw new ApiError(400, "leadId is required");
  }
  const lead = await Lead.findOne({ leadId });
  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }
  res.status(200)
    .json(new ApiResponse(200, lead, "Lead fetched successfully by given Id"));
})
//change in Status
export const changeLeadStatus = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;

  // FIX: Change 'Confirm' to 'Confirmed' to match frontend and error message
  const allowedStatuses = ['Active', 'Cancelled', 'Confirmed'];

  if (!leadId) {
    throw new ApiError(400, "leadId is required");
  }

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, "Valid status is required (Active, Cancelled, Confirmed)");
  }

  const lead = await Lead.findOne({ leadId });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  const currentStatus = lead.status;

  if (currentStatus === 'Cancelled') {
    throw new ApiError(400, "Cancelled lead cannot be changed to another status");
  }

  if (currentStatus === 'Confirmed' && status === 'Active') {
    throw new ApiError(400, "Confirmed lead cannot be changed back to Active");
  }

  if (currentStatus === status) {
    return res.status(200).json(new ApiResponse(200, lead, `Status is already ${status}`));
  }

  lead.status = status;
  await lead.save();
  await logActivity({
    action: "Status Changed",
    model: "Lead",
    referenceId: leadId,
    description: `Lead ${leadId} status changed from ${currentStatus} to ${status} by ${req.user?.name || 'System'}`,
    performedBy: req.user?.name || "System",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, lead, `Lead status updated from ${currentStatus} to ${status}`));
});

export const getLeadOptions = asyncHandler(async (req, res) => {
  const options = await LeadOptions.find().sort({ fieldName: 1, value: 1 });

  return res.status(200).json(
    new ApiResponse(200, options, "Lead options fetched successfully")
  );
});
export const addLeadOption = asyncHandler(async (req, res) => {
  const { fieldName, value } = req.body;

  if (!fieldName || !value) {
    throw new ApiError(400, "fieldName and value are required");
  }

  const exists = await LeadOptions.findOne({ fieldName, value });

  if (!exists) {
    await LeadOptions.create({ fieldName, value });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { fieldName, value }, "Option added successfully"));
});
