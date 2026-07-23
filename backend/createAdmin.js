import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// The user model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userRole: { type: String, enum: ["Superadmin", "Admin", "Executive", "Accounts"], required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const createSuperadmin = async () => {
  try {
    await mongoose.connect("mongodb+srv://satyamray0651:Satyam123@cluster0.y7vezi8.mongodb.net/?retryWrites=true&w=majority");
    console.log("Connected to MongoDB.");

    // Fetch the Master Tenant (globevisitors.com)
    const companySchema = new mongoose.Schema({ domain: String, name: String });
    const Company = mongoose.models.Company || mongoose.model("Company", companySchema);
    
    let masterTenant = await Company.findOne({ domain: "globevisitors.com" });
    
    if (!masterTenant) {
        console.warn("Master Tenant (globevisitors.com) not found in DB!");
        const allComps = await Company.find({});
        console.log("All companies in DB:", allComps);
        if (allComps.length > 0) {
            masterTenant = allComps[0];
            console.log("Using first available company instead:", masterTenant.domain);
        } else {
            console.error("NO COMPANIES EXIST AT ALL!");
            process.exit(1);
        }
    }
    console.log("Found Master Tenant ID:", masterTenant._id);

    const email = "superadmin@globevisitors.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      existingAdmin.companyId = masterTenant._id;
      await existingAdmin.save();
      console.log(`Updated existing superadmin: ${email} / ${password}`);
    } else {
      const newAdmin = new User({
        name: "SaaS Superadmin",
        email: email,
        password: hashedPassword,
        userRole: "Superadmin",
        companyId: masterTenant._id
      });
      await newAdmin.save();
      console.log(`Created new superadmin: ${email} / ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

createSuperadmin();
