import mongoose from "mongoose";
import { addressSchema } from "../common/address.common.js";
import { firmSchema } from "../common/firm.common.js";
import { bankSchema } from "../common/bankDetails.common.js";
const associateSchema = mongoose.Schema({
  personalDetails: {
    dob: {
      type: Date,
    },
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
    associateType: {
      type: String,
      enum: ["B2B Vendor", "Hotel Vendor", "Referral Partner", "Staff", "Sub Agent", "Vehicle Vendor"],
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    title: {

      type: String,
      required: true,
    }


  },
  associateId: {
    type: String,

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
}, { timestamps: true })
associateSchema.pre("save", async function (next) {
  if (this.isNew && !this.associateId) {
    const Associate = mongoose.model("Associate", associateSchema);

    const lastAssociate = await Associate.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastAssociate && lastAssociate.associateId) {
      const lastId = lastAssociate.associateId;
      const numberPart = parseInt(lastId.replace("ICYR_AST_", ""));
      nextNumber = numberPart + 1;
    }

    this.associateId = `ICYR_AST_${String(nextNumber).padStart(4, "0")}`;
  }

  next();
});
export const Associate = mongoose.model("Associate", associateSchema);