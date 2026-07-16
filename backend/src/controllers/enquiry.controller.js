import Enquiry from "../models/enquiry.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/ActivityLog.js";

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

  await logActivity({
    action: "CREATE",
    model: "Enquiry",
    refId: enquiry._id,
    description: `New web enquiry from ${name} for ${destination || 'TBD'}`,
    user: "System",
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

  await logActivity({
    action: "UPDATE",
    model: "Enquiry",
    refId: enquiry._id,
    description: `Enquiry from ${enquiry.name} status updated to ${enquiry.talkStatus} by ${req.user?.name || req.user?.staffUserId || talkedBy || 'System'}`,
    user: req.user?.name || req.user?.staffUserId || talkedBy || "System",
  });

  res.status(200).json({
    success: true,
    message: "Enquiry updated successfully",
    data: enquiry,
  });
});

/* ================= DELETE SINGLE ================= */
export const deleteEnquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const enquiry = await Enquiry.findByIdAndDelete(id);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Enquiry deleted successfully",
  });
});

/* ================= DELETE MULTIPLE ================= */
export const deleteMultipleEnquiries = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !ids.length) {
    return res.status(400).json({
      success: false,
      message: "No IDs provided",
    });
  }

  await Enquiry.deleteMany({
    _id: { $in: ids },
  });

  res.status(200).json({
    success: true,
    message: "Selected enquiries deleted successfully",
  });
});
