import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },

    resume: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    status: {
      type: String,
      enum: ["Applied", "Interview Scheduled", "Rejected", "Selected"],
      default: "Applied",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Career", careerSchema);
