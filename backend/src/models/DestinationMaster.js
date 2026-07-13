import mongoose from "mongoose";

const DestinationMasterSchema = new mongoose.Schema({
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
  tourType: {
    type: String,
    enum: ["Domestic", "International"],
    required: true
  },
  sector: String,     // for Domestic
  country: String,    // for International
  description: String,
  tourTypeDescription: {
    type: String,
    default: ""
  }
});

export default mongoose.model("DestinationMaster", DestinationMasterSchema);
