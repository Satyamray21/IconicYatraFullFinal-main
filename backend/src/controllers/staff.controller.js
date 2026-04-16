import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Staff } from "../models/staff.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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

// UPDATE staff with optional photo updates
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

  // Parse nested fields when sent as JSON strings (multipart/form-data from dashboard)
  let parsedUpdate = { ...updateData };
  if (typeof parsedUpdate.personalDetails === 'string') {
    parsedUpdate.personalDetails = JSON.parse(parsedUpdate.personalDetails);
  }
  if (typeof parsedUpdate.staffLocation === 'string') {
    parsedUpdate.staffLocation = JSON.parse(parsedUpdate.staffLocation);
  }
  if (typeof parsedUpdate.address === 'string') {
    parsedUpdate.address = JSON.parse(parsedUpdate.address);
  }
  if (typeof parsedUpdate.bank === 'string') {
    parsedUpdate.bank = JSON.parse(parsedUpdate.bank);
  }

  // Handle file uploads if provided
  const files = req.files || {};
  
  if (files.staffPhoto && files.staffPhoto[0]) {
    const upload = await uploadOnCloudinary(files.staffPhoto[0].path, files.staffPhoto[0].mimetype);
    if (upload) {
      parsedUpdate.personalDetails = {
        ...parsedUpdate.personalDetails,
        staffPhoto: {
          url: upload.secure_url,
          publicId: upload.public_id
        }
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
          publicId: upload.public_id
        }
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
          publicId: upload.public_id
        }
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