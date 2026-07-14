import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import { verifyToken } from "../middleware/user.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes if needed. 
// Assuming `verifyToken` is the standard auth middleware used in the app.
router.use(verifyToken);

router.route("/")
  .post(createExpense)
  .get(getAllExpenses);

router.route("/:id")
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

export default router;
