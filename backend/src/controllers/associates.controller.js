import { Associate } from "../models/associates.model.js";



export const createAssociate = async (req, res, next) => {
  try {
    // Destructure the entire expected request body
    const {
      personalDetails,
      staffLocation,
      address,
      firm,
      bank
    } = req.body;

    // Optional: Validate top-level required objects before saving
    if (!personalDetails || !staffLocation || !address || !firm || !bank) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newAssociate = new Associate({

      personalDetails: {
        fullName: personalDetails.fullName,
        mobileNumber: personalDetails.mobileNumber,
        alternateContact: personalDetails.alternateContact,
        associateType: personalDetails.associateType,
        email: personalDetails.email
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
        gstIn: firm.gstIn,
        cin: firm.cin,
        pan: firm.pan,
        existingTurnOver: firm.existingTurnOver,
        firmName: firm.firmName,
        firmDescription: firm.firmDescription
      },
      bank: {
        bankName: bank.bankName,
        branchName: bank.branchName,
        accountHolderName: bank.accountHolderName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode
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
    const updated = await Associate.findOneAndUpdate(
      { associateId: req.params.id },
      req.body,
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