// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
  id: { type: String, required: true, unique: true },
  name: { type: String, sparse: true, default: undefined },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model("Counter", counterSchema);
