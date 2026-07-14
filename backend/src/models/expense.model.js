import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
    category: {
      type: String,
      required: true,
      enum: ["Travel", "Meals", "Office Supplies", "Utilities", "Salary", "Other"],
    },
    paymentMode: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    particulars: {
      type: String,
    },
    receiptImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    this.month = d.getMonth() + 1;
    this.year = d.getFullYear();
  }
  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
