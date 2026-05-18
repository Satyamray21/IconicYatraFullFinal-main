// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, sparse: true, default: undefined },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model("Counter", counterSchema);
