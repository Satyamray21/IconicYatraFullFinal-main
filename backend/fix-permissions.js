import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error("MONGODB_URL is not defined in .env file");
  process.exit(1);
}

const staffPermissionSchema = new mongoose.Schema({
  staffUserId: String,
  role: String,
  permissions: mongoose.Schema.Types.Mixed
}, { strict: false });

const StaffPermission = mongoose.model('StaffPermission', staffPermissionSchema);

async function fixAllAdmins() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const allPermissions = {
      canAccessDashboard: true,
      canAccessLeads: true,
      canCreateLead: true,
      canEditLead: true,
      canDeleteLead: true,
      canAccessPackages: true,
      canCreatePackage: true,
      canEditPackage: true,
      canDeletePackage: true,
      canAccessBookings: true,
      canCreateBooking: true,
      canEditBooking: true,
      canDeleteBooking: true,
      canAccessInvoices: true,
      canCreateInvoice: true,
      canEditInvoice: true,
      canAccessQuotations: true,
      canCreateQuotation: true,
      canEditQuotation: true,
      canDeleteQuotation: true,
      canAccessEnquiries: true,
      canManageEnquiries: true,
      canAccessDestinations: true,
      canManageDestinations: true,
      canAccessAssociates: true,
      canManageAssociates: true,
      canAccessPayments: true,
      canManagePayments: true,
      canAccessReports: true,
      canAccessUsers: true,
      canCreateUser: true,
      canEditUser: true,
      canDeleteUser: true,
      canAccessStaff: true,
      canManageStaff: true,
      canAccessGallery: true,
      canEditGallery: true,
      canAccessBlogs: true,
      canCreateBlog: true,
      canEditBlog: true,
      canDeleteBlog: true,
      canAccessSettings: true,
    };

    const result = await StaffPermission.updateMany(
      { role: "Admin" },
      { $set: { permissions: allPermissions } }
    );

    console.log(`Successfully updated ${result.modifiedCount} Admin accounts with full permissions!`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

fixAllAdmins();
