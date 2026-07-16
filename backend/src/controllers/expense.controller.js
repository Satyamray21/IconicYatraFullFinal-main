import Expense from "../models/expense.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/ActivityLog.js";

// @desc    Create a new expense
export const createExpense = asyncHandler(async (req, res) => {
  const {
    companyId,
    date,
    category,
    paymentMode,
    amount,
    particulars,
    receiptImage,
  } = req.body;

  if (!companyId || !date || !category || !paymentMode || !amount) {
    res.status(400);
    throw new Error("Please provide all required fields.");
  }

  const expense = await Expense.create({
    companyId,
    date,
    category,
    paymentMode,
    amount,
    particulars,
    receiptImage,
  });

  await logActivity({
    action: "CREATE",
    model: "Expense",
    refId: expense._id.toString(),
    description: `Expense of ₹${amount} for ${category} created by ${req.user?.name || req.user?.staffUserId || 'System'}`,
    user: req.user?.name || req.user?.staffUserId || "System",
  });

  res.status(201).json({
    success: true,
    message: "Expense created successfully",
    data: expense,
  });
});

// @desc    Get all expenses
export const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find().populate("companyId", "companyName").sort({ date: -1, createdAt: -1 });
  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

// @desc    Get expense by ID
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate("companyId", "companyName");
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  res.status(200).json({ success: true, data: expense });
});

// @desc    Update expense
export const updateExpense = asyncHandler(async (req, res) => {
  const updatedExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedExpense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  await logActivity({
    action: "UPDATE",
    model: "Expense",
    refId: updatedExpense._id.toString(),
    description: `Expense updated by ${req.user?.name || req.user?.staffUserId || 'System'}`,
    user: req.user?.name || req.user?.staffUserId || "System",
  });

  res.status(200).json({ success: true, message: "Expense updated", data: updatedExpense });
});

// @desc    Delete expense
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  await logActivity({
    action: "DELETE",
    model: "Expense",
    refId: expense._id.toString(),
    description: `Expense of ₹${expense.amount} for ${expense.category} deleted by ${req.user?.name || req.user?.staffUserId || 'System'}`,
    user: req.user?.name || req.user?.staffUserId || "System",
  });

  res.status(200).json({ success: true, message: "Expense deleted" });
});
