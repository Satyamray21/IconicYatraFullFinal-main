import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  personalDetails: {
    fullName: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,


    },
    alternateNumber: {
      type: String,
    },
    emailId: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      enum: ['Mr', 'Mrs', 'Ms'],
      default: "Mr"
    },
    dateOfBirth: {
      type: String,
      required: true
    }
  },
  location: {
    country: {
      type: String,
      default: 'India',
      required: true,

    },
    state: {
      type: String,
      required: true,

    },
    city: {
      type: String,
      required: true
    }
  },
  address: {
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: {
      type: String,
    },
    addressLine3: {
      type: String
    },
    pincode: {
      type: String,
      required: true
    }
  },
  officialDetail: {
    businessType: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true,
    },
    source: {
      type: String,

    },
    agentName: {
      type: String,
      validate: {
        validator: function (v) {
          return this.officialDetail?.source !== 'Agent' || (v && v.trim() !== '');
        },
        message: 'Agent name is required if source is Agent'
      }
    },
    referredBy: {
      type: String,
      validate: {
        validator: function (v) {
          return this.officialDetail?.source !== 'Reference' || (v && v.trim() !== '');
        },
        message: 'Referred By is required if source is Reference'
      }
    },

    assignedTo: {
      type: String,
      required: true,
    },
  },
  leadId: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Cancelled', 'Confirmed', 'Not Converted'],
    default: 'Active',
  },
  tourDetails: {
    tourType: String,
    tourDestination: String,
    servicesRequired: [String],
    members: {
      adults: Number,
      children: Number,
      kidsWithoutMattress: Number,
      infants: Number,
    },
    pickupDrop: {
      arrivalDate: Date,
      arrivalCity: String,
      arrivalLocation: String,
      departureDate: Date,
      departureCity: String,
      departureLocation: String,
      noOfVehicles: { type: Number, default: 0 },
    },
    accommodation: {
      hotelType: [String],
      mealPlan: String,
      transport: Boolean,
      sharingType: String,
      noOfRooms: Number,
      noOfMattress: Number,
      noOfNights: Number,
      requirementNote: String,
    }
  },

  // Additive follow-up tracker (defaults keep old leads working as-is)
  followUps: {
    status: {
      type: String,
      enum: [
        "Pending",
        "Scheduled",
        "In Progress",
        "Interested",
        "No Response",
        "Completed",
        "Max Reached",
      ],
      default: "Pending",
    },
    maxAllowed: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextFollowUpAt: {
      type: Date,
      default: null,
    },
    lastFollowUpAt: {
      type: Date,
      default: null,
    },
    lastNote: {
      type: String,
      default: "",
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        method: {
          type: String,
          enum: ["Call", "WhatsApp", "Email", "Meeting", "Other"],
          default: "Call",
        },
        outcome: {
          type: String,
          enum: [
            "Connected",
            "Not Reachable",
            "Call Back Later",
            "Interested",
            "Not Interested",
            "Wrong Number",
            "Other",
          ],
          default: "Connected",
        },
        note: { type: String, default: "" },
        nextFollowUpAt: { type: Date, default: null },
        createdBy: { type: String, default: "System" },
      },
    ],
  },

}, { timestamps: true })
export const Lead = new mongoose.model("Lead", leadSchema);