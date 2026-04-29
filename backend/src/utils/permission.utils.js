import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate random credentials for staff
 * @param {string} fullName - Staff's full name
 * @param {string} staffId - Staff ID (ICYR_STxxxx)
 */
export const generateCredentials = (fullName, staffId) => {
  // Generate username: first 3 letters of name + random numbers + staffId suffix
  const namePart = fullName.split(" ")[0].substring(0, 3).toLowerCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const username = `${namePart}_${randomPart}`;

  // Generate random 12-character password with uppercase, lowercase, numbers, special chars
  const chars = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    special: "!@#$%^&*",
  };

  let password = "";
  password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
  password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
  password += chars.special[Math.floor(Math.random() * chars.special.length)];

  // Fill remaining characters randomly
  const allChars =
    chars.uppercase + chars.lowercase + chars.numbers + chars.special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return {
    username,
    tempPassword: password,
  };
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Get default permissions based on role
 * @param {string} role - Role (Admin, Manager, Staff)
 */
export const getDefaultPermissionsByRole = (role) => {
  const basePermissions = {
    canAccessLeads: false,
    canCreateLead: false,
    canEditLead: false,
    canDeleteLead: false,

    canAccessPackages: false,
    canCreatePackage: false,
    canEditPackage: false,
    canDeletePackage: false,

    canAccessBookings: false,
    canCreateBooking: false,
    canEditBooking: false,
    canDeleteBooking: false,

    canAccessInvoices: false,
    canCreateInvoice: false,
    canEditInvoice: false,

    canAccessReports: false,
    canAccessUsers: false,
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,

    canAccessStaff: false,
    canManageStaff: false,
    canAccessGallery: false,
    canEditGallery: false,

    canAccessBlogs: false,
    canCreateBlog: false,
    canEditBlog: false,
    canDeleteBlog: false,
  };

  // Apply role-based defaults
  if (role === "Admin") {
    return {
      ...basePermissions,
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
    };
  } else if (role === "Manager") {
    return {
      ...basePermissions,
      canAccessLeads: true,
      canCreateLead: true,
      canEditLead: true,

      canAccessPackages: true,
      canCreatePackage: true,
      canEditPackage: true,

      canAccessBookings: true,
      canCreateBooking: true,
      canEditBooking: true,

      canAccessInvoices: true,
      canCreateInvoice: true,
      canEditInvoice: true,

      canAccessReports: true,
      canAccessStaff: true,
      canAccessGallery: true,
      canEditGallery: true,

      canAccessBlogs: true,
      canCreateBlog: true,
      canEditBlog: true,
    };
  } else if (role === "Staff") {
    return {
      ...basePermissions,
      canAccessLeads: true,
      canCreateLead: true,
      canEditLead: true,

      canAccessPackages: true,

      canAccessBookings: true,

      canAccessInvoices: true,

      canAccessBlogs: true,
    };
  }

  return basePermissions;
};

/**
 * Get permission modules for display
 */
export const getPermissionModules = () => {
  return [
    {
      name: "Leads",
      permissions: [
        { key: "canAccessLeads", label: "View Leads" },
        { key: "canCreateLead", label: "Create Lead" },
        { key: "canEditLead", label: "Edit Lead" },
        { key: "canDeleteLead", label: "Delete Lead" },
      ],
    },
    {
      name: "Packages",
      permissions: [
        { key: "canAccessPackages", label: "View Packages" },
        { key: "canCreatePackage", label: "Create Package" },
        { key: "canEditPackage", label: "Edit Package" },
        { key: "canDeletePackage", label: "Delete Package" },
      ],
    },
    {
      name: "Bookings",
      permissions: [
        { key: "canAccessBookings", label: "View Bookings" },
        { key: "canCreateBooking", label: "Create Booking" },
        { key: "canEditBooking", label: "Edit Booking" },
        { key: "canDeleteBooking", label: "Delete Booking" },
      ],
    },
    {
      name: "Invoices",
      permissions: [
        { key: "canAccessInvoices", label: "View Invoices" },
        { key: "canCreateInvoice", label: "Create Invoice" },
        { key: "canEditInvoice", label: "Edit Invoice" },
      ],
    },
    {
      name: "Reports",
      permissions: [
        { key: "canAccessReports", label: "View Reports" },
      ],
    },
    {
      name: "Users Management",
      permissions: [
        { key: "canAccessUsers", label: "View Users" },
        { key: "canCreateUser", label: "Create User" },
        { key: "canEditUser", label: "Edit User" },
        { key: "canDeleteUser", label: "Delete User" },
      ],
    },
    {
      name: "Staff Management",
      permissions: [
        { key: "canAccessStaff", label: "View Staff" },
        { key: "canManageStaff", label: "Manage Staff" },
      ],
    },
    {
      name: "Gallery",
      permissions: [
        { key: "canAccessGallery", label: "View Gallery" },
        { key: "canEditGallery", label: "Edit Gallery" },
      ],
    },
    {
      name: "Blogs",
      permissions: [
        { key: "canAccessBlogs", label: "View Blogs" },
        { key: "canCreateBlog", label: "Create Blog" },
        { key: "canEditBlog", label: "Edit Blog" },
        { key: "canDeleteBlog", label: "Delete Blog" },
      ],
    },
  ];
};
