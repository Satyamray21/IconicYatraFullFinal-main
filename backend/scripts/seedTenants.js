import mongoose from "mongoose";
import dotenv from "dotenv";
import Company from "../src/models/company.model.js";

dotenv.config();

const seedTenants = async () => {
  try {
    // Read the MONGODB_URL and DB_NAME from the .env file (if DB_NAME exists)
    const dbUrl = process.env.MONGODB_URL + (process.env.DB_NAME ? `/${process.env.DB_NAME}` : "");
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB Test Database.");

    // Create Company A (Localhost testing)
    const companyA = await Company.findOneAndUpdate(
      { domain: "localhost" },
      {
        companyName: "Company A (Localhost)",
        domain: "localhost",
        address: "123 Localhost St",
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log("Seeded Company A (Localhost):", companyA._id);

    // Import Staff model (dynamically to avoid top-level issues)
    const { Staff } = await import("../src/models/staff.model.js");
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Seed a Staff Member for Company A so you can log in!
    const staffDoc = await Staff.findOneAndUpdate(
      { "personalDetails.email": "admin@localhost.com" },
      {
        companyId: companyA._id,
        staffId: "STF-TEST-001",
        personalDetails: {
          fullName: "Test Admin",
          mobileNumber: "9999999999",
          email: "admin@localhost.com",
          designation: "Admin",
          userRole: "Superadmin",
        },
        staffLocation: {
          country: "TestCountry",
          state: "TestState",
          city: "TestCity"
        },
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const { StaffPermission } = await import("../src/models/staffPermission.model.js");
    await StaffPermission.findOneAndUpdate(
      { staffId: staffDoc._id },
      {
        staffId: staffDoc._id,
        staffUserId: "admin@localhost.com",
        credentials: {
          username: "admin@localhost.com",
          password: hashedPassword,
        },
        role: "Superadmin",
        status: "Active",
        permissions: {
          canAccessDashboard: true,
          canAccessLeads: true,
          canCreateLead: true,
          canEditLead: true,
          canDeleteLead: true,
          canAccessSettings: true,
          canAccessStaff: true,
          canAccessUsers: true,
          canAccessQuotations: true,
          canAccessInvoices: true,
          canEditInvoice: true,
          canCreateInvoice: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("Seeded Test Staff: admin@localhost.com (Password: 123456)");

    // Create Company B (Fake Domain testing)
    const companyB = await Company.findOneAndUpdate(
      { domain: "agency-test.com" },
      {
        companyName: "Company B (Agency Test)",
        domain: "agency-test.com",
        address: "456 Fake Domain Blvd",
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log("Seeded Company B (Agency Test):", companyB._id);

    console.log("Successfully seeded tenant companies!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tenants:", error);
    process.exit(1);
  }
};

seedTenants();
