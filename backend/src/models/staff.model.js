import mongoose from "mongoose"
import { addressSchema } from "../common/address.common.js";
import { firmSchema } from "../common/firm.common.js";
import { bankSchema } from "../common/bankDetails.common.js";
const staffSchema = new mongoose.Schema({
  personalDetails: {
    fullName: {
      type: String,
      required: true
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true
    },
    alternateContact: {
      type: String,
      unique: true
    },
    designation: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      enum: ['Superadmin', 'Admin', 'Executive'],
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
  },
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  staffLocation: {
    country: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },

  address: addressSchema,
  firm: firmSchema,
  bank: bankSchema,
}, { timestamps: true });

export const Staff = new mongoose.model("Staff", staffSchema);