import mongoose from "mongoose";
import { addressSchema } from "../common/address.common.js";
import { bankSchema } from "../common/bankDetails.common.js";

const staffSchema = new mongoose.Schema(
  {
    personalDetails: {
      title:{
        type:String
      },
      fullName: {
        type: String,
        required: true,
      },
      mobileNumber: {
        type: String,
        required: true,
        unique: true,
      },
      alternateContact: {
        type: String,
        
      },
      designation: {
        type: String,
        required: true,
      },
      userRole: {
        type: String,
        enum: ["Admin", "Manager", "Executive"],
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      aadharNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      panNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      dob:{
        type: Date,
      },
      // Optional photo fields
      staffPhoto: {
        url: String,
        publicId: String,
      },
      aadharPhoto: {
        url: String,
        publicId: String,
      },
      panPhoto: {
        url: String,
        publicId: String,
      },
    },
    staffId: {
      type: String,
      required: true,
      unique: true,
    },
    staffLocation: {
      country: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
    },
    address: addressSchema,
    bank: bankSchema,
  },
  { timestamps: true },
);

export const Staff = new mongoose.model("Staff", staffSchema);