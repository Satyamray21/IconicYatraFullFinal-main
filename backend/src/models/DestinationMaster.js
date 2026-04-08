import mongoose from "mongoose";

const DestinationMasterSchema = new mongoose.Schema({
  tourType: {
    type: String,
    enum: ["Domestic", "International"],
    required: true
  },
  sector: String,     // for Domestic
  country: String,    // for International
  description: String
});

export default mongoose.model("DestinationMaster", DestinationMasterSchema);
