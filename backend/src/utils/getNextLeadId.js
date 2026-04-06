// utils/getNextLeadId.js
import { Counter } from "../models/Counter.js";

export const getNextLeadId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "leadId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ICYR_${counter.seq.toString().padStart(4, "0")}`;
};
