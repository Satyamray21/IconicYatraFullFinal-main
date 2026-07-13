import mongoose from "mongoose";

const staffPermissionSchema = new mongoose.Schema(
  {
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company', 
      required: true 
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true,
    },
    staffUserId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Manager", "Staff"],
    },
    credentials: {
      username: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      lastChangedAt: {
        type: Date,
      },
      tempPassword: {
        type: String,
      },
      isTemporary: {
        type: Boolean,
        default: false,
      },
    },
    permissions: {
      canAccessDashboard: { type: Boolean, default: false },

      canAccessLeads: { type: Boolean, default: false },
      canCreateLead: { type: Boolean, default: false },
      canEditLead: { type: Boolean, default: false },
      canDeleteLead: { type: Boolean, default: false },
      
      canAccessPackages: { type: Boolean, default: false },
      canCreatePackage: { type: Boolean, default: false },
      canEditPackage: { type: Boolean, default: false },
      canDeletePackage: { type: Boolean, default: false },
      
      canAccessBookings: { type: Boolean, default: false },
      canCreateBooking: { type: Boolean, default: false },
      canEditBooking: { type: Boolean, default: false },
      canDeleteBooking: { type: Boolean, default: false },
      
      canAccessInvoices: { type: Boolean, default: false },
      canCreateInvoice: { type: Boolean, default: false },
      canEditInvoice: { type: Boolean, default: false },

      canAccessQuotations: { type: Boolean, default: false },
      canCreateQuotation: { type: Boolean, default: false },
      canEditQuotation: { type: Boolean, default: false },
      canDeleteQuotation: { type: Boolean, default: false },

      canAccessEnquiries: { type: Boolean, default: false },
      canManageEnquiries: { type: Boolean, default: false },

      canAccessDestinations: { type: Boolean, default: false },
      canManageDestinations: { type: Boolean, default: false },

      canAccessAssociates: { type: Boolean, default: false },
      canManageAssociates: { type: Boolean, default: false },

      canAccessPayments: { type: Boolean, default: false },
      canManagePayments: { type: Boolean, default: false },
      
      canAccessReports: { type: Boolean, default: false },
      canAccessUsers: { type: Boolean, default: false },
      canCreateUser: { type: Boolean, default: false },
      canEditUser: { type: Boolean, default: false },
      canDeleteUser: { type: Boolean, default: false },
      
      canAccessStaff: { type: Boolean, default: false },
      canManageStaff: { type: Boolean, default: false },
      canAccessGallery: { type: Boolean, default: false },
      canEditGallery: { type: Boolean, default: false },
      
      canAccessBlogs: { type: Boolean, default: false },
      canCreateBlog: { type: Boolean, default: false },
      canEditBlog: { type: Boolean, default: false },
      canDeleteBlog: { type: Boolean, default: false },

      canAccessSettings: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

// Index for faster queries
staffPermissionSchema.index({ staffId: 1 });
staffPermissionSchema.index({ staffUserId: 1 });
staffPermissionSchema.index({ "credentials.username": 1 });

export const StaffPermission = mongoose.model("StaffPermission", staffPermissionSchema);
