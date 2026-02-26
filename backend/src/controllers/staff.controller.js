import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Staff } from "../models/staff.model.js";
import { Country } from "../models/country.model.js";
import { State } from "../models/state.model.js";
import { City } from "../models/city.model.js"
import { Counter } from "../models/Counter.js"
import mongoose from "mongoose";

// CREATE Staff
export const createStaff = asyncHandler(async (req, res) => {
  const { personalDetails, staffLocation, address, firm, bank } = req.body;

  if (!personalDetails?.mobileNumber || !personalDetails?.firstName) {
    throw new ApiError(400, "Required fields missing in personalDetails");
  }

  const existing = await Staff.findOne({
    "personalDetails.mobileNumber": personalDetails.mobileNumber
  });

  if (existing) {
    throw new ApiError(409, "Staff with this mobile number already exists");
  }

  // Find the maximum staffId
  const lastStaff = await Staff.findOne().sort({ staffId: -1 });
  let nextId = 1;

  if (lastStaff && lastStaff.staffId) {
    const lastIdNumber = parseInt(lastStaff.staffId.replace("ICYR_ST", ""));
    nextId = lastIdNumber + 1;
  }

  const staffId = `ICYR_ST${String(nextId).padStart(4, "0")}`;

  const staff = await Staff.create({
    staffId,
    personalDetails,
    staffLocation,
    address,
    firm,
    bank
  });

  return res
    .status(201)
    .json(new ApiResponse(201, staff, "Staff created successfully"));
});

// GET all staff
export const getAllStaff = asyncHandler(async (req, res) => {
  const staffList = await Staff.find()
    .populate("staffLocation.country")
    .populate("staffLocation.state")
    .populate("staffLocation.city");

  return res
    .status(200)
    .json(new ApiResponse(200, staffList, "All staff fetched successfully"));
});

// GET single staff
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let staff;

  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    staff = await Staff.findById(id)
      .populate("staffLocation.country")
      .populate("staffLocation.state")
      .populate("staffLocation.city");
  } else {
    // Otherwise, treat it as a custom staffId
    staff = await Staff.findOne({ staffId: id })
      .populate("staffLocation.country")
      .populate("staffLocation.state")
      .populate("staffLocation.city");
  }

  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, staff, "Staff fetched successfully"));
});


// UPDATE staff
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  let updatedStaff;

  if (mongoose.Types.ObjectId.isValid(id)) {
    // Update by MongoDB _id
    updatedStaff = await Staff.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  } else {
    // Update by custom staffId
    updatedStaff = await Staff.findOneAndUpdate({ staffId: id }, updateData, {
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

  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    deleted = await Staff.findByIdAndDelete(id);
  } else {
    // If not ObjectId, treat it as custom staffId
    deleted = await Staff.findOneAndDelete({ staffId: id });
  }

  if (!deleted) {
    throw new ApiError(404, "Staff not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Staff deleted successfully"));
});