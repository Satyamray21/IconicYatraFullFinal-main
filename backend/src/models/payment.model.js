import mongoose from "mongoose";

const receivedVoucherSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["Receive Voucher", "Payment Voucher"],
      default: "Receive Voucher",
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

    paymentScreenshot: {
      type: String,
    },

    accountType: {
      type: String,
      required: true,
    },

    partyName: {
      type: String,
      required: true,
    },

    paymentMode: {
      type: String,
      required: true,
    },

    referenceNumber: {
      type: String,
    },

    particulars: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    invoice: {
      type: String,
      unique: true,
      sparse: true,
    },

    drCr: {
      type: String,
      enum: ["Dr", "Cr"],
    },

    receiptNumber: {
      type: Number,
      required: true,
    },

    invoiceId: {
      type: String,
      required: true,
    },

    /** Links voucher to custom (or other) quotation id, e.g. ICYR_CQ_0001 */
    quotationRef: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

receivedVoucherSchema.pre("save", function (next) {
  if (this.paymentType === "Receive Voucher") {
    this.drCr = "Cr";
  } else {
    this.drCr = "Dr";
  }
  next();
});

receivedVoucherSchema.index(
  { companyId: 1, month: 1, year: 1, receiptNumber: 1 },
  { unique: true }
);

const ReceivedVoucher = mongoose.model(
  "ReceivedVoucher",
  receivedVoucherSchema
);

export default ReceivedVoucher;