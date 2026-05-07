import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Staff } from "../models/staff.model.js";
import { LoginHistory } from "../models/loginHistory.model.js";
import { Lead } from "../models/lead.model.js";
import QuickQuotation from "../models/quotation/quickQuotation.model.js";
import { CustomQuotation } from "../models/quotation/customQuotation.model.js";
import { FlightQuotation } from "../models/quotation/flightQuotation.model.js";
import { HotelQuotation } from "../models/quotation/hotelQuotation.model.js";
import { fullQuotation } from "../models/quotation/fullQuotation.model.js";
import { Vehicle } from "../models/quotation/vehicle.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { startOfDay, startOfMonth, subMonths } from 'date-fns';

// CREATE Staff with optional multiple photo uploads
export const createStaff = asyncHandler(async (req, res) => {
  const { personalDetails, staffLocation, address, bank } = req.body;

  // Parse personalDetails if it's a string (from form-data)
  let parsedPersonalDetails = personalDetails;
  if (typeof personalDetails === 'string') {
    parsedPersonalDetails = JSON.parse(personalDetails);
  }

  // Parse other nested objects if they come as strings
  let parsedStaffLocation = staffLocation;
  let parsedAddress = address;
  let parsedBank = bank;
  
  if (typeof staffLocation === 'string') {
    parsedStaffLocation = JSON.parse(staffLocation);
  }
  if (typeof address === 'string') {
    parsedAddress = JSON.parse(address);
  }
  if (typeof bank === 'string') {
    parsedBank = JSON.parse(bank);
  }

  // Validate required fields
  if (!parsedPersonalDetails?.mobileNumber || !parsedPersonalDetails?.fullName) {
    throw new ApiError(400, "Required fields missing in personalDetails");
  }

  // Check for existing staff
  const existing = await Staff.findOne({
    $or: [
      { "personalDetails.mobileNumber": parsedPersonalDetails.mobileNumber },
      { "personalDetails.email": parsedPersonalDetails.email }
    ]
  });

  if (existing) {
    throw new ApiError(409, "Staff with this mobile number or email already exists");
  }

  // Handle file uploads (all optional)
  const files = req.files || {};
  
  // Upload staff photo if provided
  let staffPhotoData = null;
  if (files.staffPhoto && files.staffPhoto[0]) {
    const upload = await uploadOnCloudinary(files.staffPhoto[0].path, files.staffPhoto[0].mimetype);
    if (upload) {
      staffPhotoData = {
        url: upload.secure_url,
        publicId: upload.public_id
      };
    }
  }

  // Upload aadhar photo if provided
  let aadharPhotoData = null;
  if (files.aadharPhoto && files.aadharPhoto[0]) {
    const upload = await uploadOnCloudinary(files.aadharPhoto[0].path, files.aadharPhoto[0].mimetype);
    if (upload) {
      aadharPhotoData = {
        url: upload.secure_url,
        publicId: upload.public_id
      };
    }
  }

  // Upload pan photo if provided
  let panPhotoData = null;
  if (files.panPhoto && files.panPhoto[0]) {
    const upload = await uploadOnCloudinary(files.panPhoto[0].path, files.panPhoto[0].mimetype);
    if (upload) {
      panPhotoData = {
        url: upload.secure_url,
        publicId: upload.public_id
      };
    }
  }

  // Generate staff ID
  const lastStaff = await Staff.findOne().sort({ staffId: -1 });
  let nextId = 1;

  if (lastStaff && lastStaff.staffId) {
    const lastIdNumber = parseInt(lastStaff.staffId.replace("ICYR_ST", ""));
    nextId = lastIdNumber + 1;
  }

  const staffId = `ICYR_ST${String(nextId).padStart(4, "0")}`;

  // Prepare staff data
  const staffData = {
    staffId,
    personalDetails: {
      ...parsedPersonalDetails,
      aadharNumber: parsedPersonalDetails?.aadharNumber || undefined,
      panNumber: parsedPersonalDetails?.panNumber || undefined,
      staffPhoto: staffPhotoData,
      aadharPhoto: aadharPhotoData,
      panPhoto: panPhotoData,
    },
    staffLocation: parsedStaffLocation,
    address: parsedAddress,
    bank: parsedBank
  };

  const staff = await Staff.create(staffData);

  return res
    .status(201)
    .json(new ApiResponse(201, staff, "Staff created successfully"));
});

// GET all staff
export const getAllStaff = asyncHandler(async (req, res) => {
  const staffList = await Staff.find().lean();

  return res
    .status(200)
    .json(new ApiResponse(200, staffList, "All staff fetched successfully"));
});

// GET single staff
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let staff;

  if (mongoose.Types.ObjectId.isValid(id)) {
    staff = await Staff.findById(id).lean();
  } else {
    staff = await Staff.findOne({ staffId: id }).lean();
  }

  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, staff, "Staff fetched successfully"));
});

/** JWT staff login only — own document, no canAccessStaff. */
export const getMyStaffProfile = asyncHandler(async (req, res) => {
  const sid = req.user?.id;
  if (!sid) {
    throw new ApiError(401, "Unauthorized");
  }
  const staff = await Staff.findById(sid).lean();
  if (!staff) {
    throw new ApiError(404, "Staff profile not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, staff, "Staff fetched successfully"));
});

async function runStaffUpdateById(id, req, res) {
  const updateData = req.body;

  let existingStaff;
  if (mongoose.Types.ObjectId.isValid(id)) {
    existingStaff = await Staff.findById(id);
  } else {
    existingStaff = await Staff.findOne({ staffId: id });
  }

  if (!existingStaff) {
    throw new ApiError(404, "Staff not found");
  }

  let parsedUpdate = { ...updateData };
  if (typeof parsedUpdate.personalDetails === "string") {
    parsedUpdate.personalDetails = JSON.parse(parsedUpdate.personalDetails);
  }
  if (typeof parsedUpdate.staffLocation === "string") {
    parsedUpdate.staffLocation = JSON.parse(parsedUpdate.staffLocation);
  }
  if (typeof parsedUpdate.address === "string") {
    parsedUpdate.address = JSON.parse(parsedUpdate.address);
  }
  if (typeof parsedUpdate.bank === "string") {
    parsedUpdate.bank = JSON.parse(parsedUpdate.bank);
  }

  // Handle optional unique fields: set to undefined if empty string to avoid unique index collision
  if (parsedUpdate.personalDetails) {
    if (parsedUpdate.personalDetails.aadharNumber === "") {
      parsedUpdate.personalDetails.aadharNumber = undefined;
    }
    if (parsedUpdate.personalDetails.panNumber === "") {
      parsedUpdate.personalDetails.panNumber = undefined;
    }
  }

  const files = req.files || {};

  if (files.staffPhoto && files.staffPhoto[0]) {
    const upload = await uploadOnCloudinary(files.staffPhoto[0].path, files.staffPhoto[0].mimetype);
    if (upload) {
      parsedUpdate.personalDetails = {
        ...parsedUpdate.personalDetails,
        staffPhoto: {
          url: upload.secure_url,
          publicId: upload.public_id,
        },
      };
    }
  }

  if (files.aadharPhoto && files.aadharPhoto[0]) {
    const upload = await uploadOnCloudinary(files.aadharPhoto[0].path, files.aadharPhoto[0].mimetype);
    if (upload) {
      parsedUpdate.personalDetails = {
        ...parsedUpdate.personalDetails,
        aadharPhoto: {
          url: upload.secure_url,
          publicId: upload.public_id,
        },
      };
    }
  }

  if (files.panPhoto && files.panPhoto[0]) {
    const upload = await uploadOnCloudinary(files.panPhoto[0].path, files.panPhoto[0].mimetype);
    if (upload) {
      parsedUpdate.personalDetails = {
        ...parsedUpdate.personalDetails,
        panPhoto: {
          url: upload.secure_url,
          publicId: upload.public_id,
        },
      };
    }
  }

  let updatedStaff;

  if (mongoose.Types.ObjectId.isValid(id)) {
    updatedStaff = await Staff.findByIdAndUpdate(id, parsedUpdate, {
      new: true,
      runValidators: true,
    });
  } else {
    updatedStaff = await Staff.findOneAndUpdate({ staffId: id }, parsedUpdate, {
      new: true,
      runValidators: true,
    });
  }

  if (!updatedStaff) {
    throw new ApiError(404, "Staff not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedStaff, "Staff updated successfully"));
}

export const updateMyStaffProfile = asyncHandler(async (req, res) => {
  const sid = req.user?.id;
  if (!sid) {
    throw new ApiError(401, "Unauthorized");
  }
  const me = await Staff.findById(sid).lean();
  if (!me) {
    throw new ApiError(404, "Staff not found");
  }
  return runStaffUpdateById(me.staffId, req, res);
});

// UPDATE staff with optional photo updates
export const updateStaff = asyncHandler(async (req, res) => {
  return runStaffUpdateById(req.params.id, req, res);
});

// DELETE staff
export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let deleted;

  if (mongoose.Types.ObjectId.isValid(id)) {
    deleted = await Staff.findByIdAndDelete(id);
  } else {
    deleted = await Staff.findOneAndDelete({ staffId: id });
  }

  if (!deleted) {
    throw new ApiError(404, "Staff not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Staff deleted successfully"));
});

export const getStaffDashboardStats = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(new Date());
  const last3Months = startOfMonth(subMonths(new Date(), 3));
  const last6Months = startOfMonth(subMonths(new Date(), 6));
  const last12Months = startOfMonth(subMonths(new Date(), 12));

  const periods = [
    { title: "Today's", date: today },
    { title: "This Month", date: thisMonth },
    { title: "Last 3 Months", date: last3Months },
    { title: "Last 6 Months", date: last6Months },
    { title: "Last 12 Months", date: last12Months },
  ];

  const quotationModels = [
    QuickQuotation,
    CustomQuotation,
    FlightQuotation,
    HotelQuotation,
    fullQuotation,
    Vehicle
  ];

  const stats = await Promise.all(periods.map(async (period) => {
    const [activeStaffIds, leadCount] = await Promise.all([
      LoginHistory.distinct("userId", { 
        timestamp: { $gte: period.date },
        status: "Login Successful" 
      }),
      Lead.countDocuments({ createdAt: { $gte: period.date } })
    ]);

    const qCounts = await Promise.all(quotationModels.map(model => 
      model.countDocuments({ createdAt: { $gte: period.date } })
    ));

    const totalQuotations = qCounts.reduce((a, b) => a + b, 0);

    return {
      title: period.title,
      active: activeStaffIds.length,
      lead: leadCount,
      quotation: totalQuotations
    };
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Staff dashboard stats fetched successfully"));
});