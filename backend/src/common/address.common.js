
import mongoose from "mongoose";

export const addressSchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String
  },
  addressLine3: {
    type: String
  },
  pincode: {
    type: String
  }
}, { _id: false }); 
