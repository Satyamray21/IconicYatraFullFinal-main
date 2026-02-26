import mongoose from "mongoose";
import { addressSchema } from "../common/address.common.js";

function generateUserId(role) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // random 4 digit
    if (role === "Superadmin") return `SUAMD_${randomNum}`;
    if (role === "Admin") return `AMD_${randomNum}`;
    if (role === "Executive") return `EXE_${randomNum}`;
    return `USR_${randomNum}`;
}

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    userRole: {
        type: String,
        enum: ["Superadmin", "Admin", "Executive"],
        required: true
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: addressSchema,
    profileImg: { type: String }, // image URL or path
    userId: { type: String, unique: true }
}, { timestamps: true });

// Auto-generate userId
userSchema.pre("save", function (next) {
    if (!this.userId) {
        this.userId = generateUserId(this.userRole);
    }
    next();
});

export const User = mongoose.model("User", userSchema);
