import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const findTenant = async () => {
  try {
    await mongoose.connect("mongodb+srv://makazsatyam_db_user:thQEb5S9vFKjzNgc@cluster0.qhowjjn.mongodb.net/globevisitors?retryWrites=true&w=majority");
    console.log("Connected to MongoDB.");

    const Company = mongoose.models.Company || mongoose.model("Company", new mongoose.Schema({}, { strict: false }));
    const company = await Company.findOne({ domain: "globevisitors.com" });
    if (!company) {
        console.log("Company globevisitors.com not found!");
        process.exit(1);
    }
    
    console.log("Company ID:", company._id);

    const Staff = mongoose.models.Staff || mongoose.model("Staff", new mongoose.Schema({}, { strict: false }));
    const StaffPermission = mongoose.models.StaffPermission || mongoose.model("StaffPermission", new mongoose.Schema({}, { strict: false }));

    const staffList = await Staff.find({ companyId: company._id }).lean();
    
    if (staffList.length === 0) {
      console.log("No staff members found for this company!");
      process.exit(1);
    }

    console.log("--- FOUND STAFF MEMBERS ---");
    for (const staff of staffList) {
      const email = staff.personalDetails?.email;
      console.log(`Name: ${staff.personalDetails?.fullName}, Email: ${email}`);
      
      const perm = await StaffPermission.findOne({ staffId: staff._id }).lean();
      if (perm) {
        console.log(`Username (Login ID): ${perm.credentials?.username}`);
        console.log(`Password Hash (Cannot decrypt): ${perm.credentials?.password ? "YES" : "NO"}`);
      }
      console.log("---------------------------");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

findTenant();
