import Enquiry from "../models/enquiry.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, mobile, persons, destination, travelDate } = req.body;

  if (!name || !mobile || !persons) {
    return res.status(400).json({
      success: false,
      message: "Name, Mobile and Persons are required",
    });
  }

  const enquiry = await Enquiry.create({
    name,
    email,
    mobile,
    persons,
    destination,
    travelDate,
  });

  res.status(201).json({
    success: true,
    message: "Enquiry submitted successfully",
    data: enquiry,
  });
});
export const getAllEnquiries = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = status ? { talkStatus: status } : {};

  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: enquiries,
  });
});
export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { talkStatus, remarks, talkedBy } = req.body;

  const enquiry = await Enquiry.findById(id);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  enquiry.talkStatus = talkStatus || enquiry.talkStatus;
  enquiry.remarks = remarks || enquiry.remarks;
  enquiry.talkedBy = talkedBy || enquiry.talkedBy;

  if (talkStatus === "connected") {
    enquiry.talkedAt = new Date();
  }

  await enquiry.save();

  res.status(200).json({
    success: true,
    message: "Enquiry updated successfully",
    data: enquiry,
  });
});