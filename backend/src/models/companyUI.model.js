import mongoose from "mongoose";

const companyUISchema = new mongoose.Schema(
  {
    headerLogo: {
      public_id: String,
      url: String,
    },
    footerLogo: {
      public_id: String,
      url: String,
    },
    signature: {
      public_id: String,
      url: String,
    },

    qrCodes: [
      {
        name: String,
        color: String,
        public_id: String,
        url: String,
      },
    ],

    // ✅ TESTIMONIALS
    testimonials: [
      {
        name: { type: String, required: true },
        address: { type: String },
        words: { type: String },
        photo: {
          public_id: String,
          url: String,
        },
      },
    ],

    // ✅ OUR TEAM
    ourTeam: [
      {
        name: { type: String, required: true },
        designation: { type: String },
        description: { type: String },
        photo: {
          public_id: String,
          url: String,
        },
      },
    ],
    aboutUs:{
      title:{
        type:String
      },
      aboutUsImage:{
        public_id: String,
          url: String,
      },
      bannerImageTitle:{
        type:String
      },
      bannerImage:{
         public_id: String,
          url: String,
      },
      bannerImageDescription:{
        type:String,
      },
      ourVisionImage:{
        public_id: String,
        url: String,
      },
       ourVisionImageTitle:{
        type:String,
       }

    },
    // ✅ VISION & MISSION
    ourVision: {
      type: String,
    },

    ourMission: {
      type: String,
    },

    companyName: {
      type: String,
      required: true,
      default: "Iconic Yatra",
    },

    contactPerson: String,
    call: String,
    support: String,
    email: String,
    address: String,
    website: String,
    gst: String,
    about: String,
    note: String,
    invoiceTerms: String,
    pdfFooter: String,
    currency: String,

    bankIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bank",
      },
    ],

    stats: {
      staff: { type: String, default: "0/10" },
      vendor: { type: String, default: "0/10" },
      agent: { type: String, default: "0/10" },
      referral: { type: String, default: "0/10" },
      client: { type: String, default: "0/10" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("CompanyUI", companyUISchema);
