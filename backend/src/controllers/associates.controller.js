import { Associate } from "../models/associates.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Helper function to convert flat object with dot notation to nested object
const convertToNestedObject = (flatObj) => {
  const result = {};
  
  for (const key in flatObj) {
    // Skip only null and undefined, allow empty strings
    if (flatObj[key] === null || flatObj[key] === undefined) {
      continue;
    }
    
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = flatObj[key];
  }
  
  return result;
};



export const createAssociate = async (req, res, next) => {
  try {
    // Convert FormData flat structure to nested objects if needed
    const bodyData = Object.keys(req.body).some(key => key.includes('.')) 
      ? convertToNestedObject(req.body) 
      : req.body;

    // Destructure the entire expected request body
    const {
      personalDetails,
      staffLocation,
      address,
      firm,
      bank
    } = bodyData;

    // Handle QR Code file upload if provided
    let qrCodeUrl = null;
    if (req.file) {
      const uploadResponse = await uploadOnCloudinary(
        req.file.path,
        req.file.mimetype
      );
      if (uploadResponse) {
        qrCodeUrl = uploadResponse.secure_url;
      }
    }

    // Optional: Validate top-level required objects before saving
    if (!personalDetails || !staffLocation || !address || !firm || !bank) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newAssociate = new Associate({

      personalDetails: {
        title:personalDetails.title,
        fullName: personalDetails.fullName,
        mobileNumber: personalDetails.mobileNumber,
        alternateContact: personalDetails.alternateContact,
        associateType: personalDetails.associateType,
        email: personalDetails.email,
        dob: personalDetails.dob
      },
      staffLocation: {
        country: staffLocation.country,
        state: staffLocation.state,
        city: staffLocation.city
      },
      address: {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        addressLine3: address.addressLine3,
        pincode: address.pincode
      },
    firm: {
  firmType: firm.firmType,
  gstin: firm.gstin,          // ✅ FIXED
  cin: firm.cin,
  pan: firm.pan,
  turnover: firm.turnover,    // ✅ FIXED
  firmName: firm.firmName,
  firmDescription: firm.firmDescription,
  sameAsContact: firm.sameAsContact,
  address1: firm.address1,
  address2: firm.address2,
  address3: firm.address3,
  supportingDocs: firm.supportingDocs
},


      bank: {
        bankName: bank.bankName,
        branchName: bank.branchName,
        accountHolderName: bank.accountHolderName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId,
        qrCode: qrCodeUrl || bank.qrCode
      }
    });

    const savedAssociate = await newAssociate.save();

    res.status(201).json(savedAssociate);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    next(err);
  }
};


// Get All Associates
export const getAllAssociates = async (req, res, next) => {
  try {
    const associates = await Associate.find().sort({ createdAt: -1 });
    res.status(200).json(associates);
  } catch (err) {
    next(err);
  }
};

// Get Single Associate by ID
// Get Associate by associateId
export const getAssociateById = async (req, res, next) => {
  try {
    const associate = await Associate.findOne({ associateId: req.params.id });
    if (!associate) return res.status(404).json({ message: "Not found" });
    res.status(200).json(associate);
  } catch (err) {
    next(err);
  }
};

// Update Associate by associateId
export const updateAssociate = async (req, res, next) => {
  try {
    // Convert FormData flat structure to nested objects
    let updateData = convertToNestedObject(req.body);

    // Handle QR Code file upload if provided
    if (req.file) {
      const uploadResponse = await uploadOnCloudinary(
        req.file.path,
        req.file.mimetype
      );
      if (uploadResponse) {
        // Set the QR code URL in the bank object
        if (!updateData.bank) {
          updateData.bank = {};
        }
        updateData.bank.qrCode = uploadResponse.secure_url;
      }
    }

    const updated = await Associate.findOneAndUpdate(
      { associateId: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete Associate
export const deleteAssociate = async (req, res, next) => {
  try {
    const deleted = await Associate.findOneAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};