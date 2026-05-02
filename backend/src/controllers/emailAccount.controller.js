import EmailAccount from "../models/emailAccount.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createEmailAccount = asyncHandler(async (req, res) => {
  const { email, appPassword, displayName, companyId } = req.body;

  if (!email || !appPassword) {
    throw new ApiError(400, "Email and App Password are required");
  }

  const existing = await EmailAccount.findOne({ email });
  if (existing) {
    throw new ApiError(400, "Email account already exists");
  }

  const account = await EmailAccount.create({
    email,
    appPassword,
    displayName,
    companyId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, account, "Email account created successfully"));
});

export const getAllEmailAccounts = asyncHandler(async (req, res) => {
  const accounts = await EmailAccount.find().populate("companyId", "companyName");
  return res
    .status(200)
    .json(new ApiResponse(200, accounts, "Email accounts fetched successfully"));
});

export const updateEmailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedAccount = await EmailAccount.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true },
  );

  if (!updatedAccount) {
    throw new ApiError(404, "Email account not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedAccount, "Email account updated successfully"),
    );
});

export const deleteEmailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await EmailAccount.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Email account not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email account deleted successfully"));
});
