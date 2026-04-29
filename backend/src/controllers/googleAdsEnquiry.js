import GoogleAdsEnquiry from "../models/googleAdsEnquiry.js";

// CREATE ENQUIRY
export const createEnquiry = async (req, res) => {
  try {
    const enquiry = await GoogleAdsEnquiry.create(req.body);

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL ENQUIRIES (CRM)
export const getAllEnquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) filter.status = status;

    const enquiries = await GoogleAdsEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await GoogleAdsEnquiry.countDocuments(filter);

    res.json({
      success: true,
      data: enquiries,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enquiry = await GoogleAdsEnquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SINGLE
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await GoogleAdsEnquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE MULTIPLE
export const deleteMultipleEnquiries = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !ids.length) {
      return res.status(400).json({
        success: false,
        message: "No IDs provided",
      });
    }

    await GoogleAdsEnquiry.deleteMany({
      _id: { $in: ids },
    });

    res.json({
      success: true,
      message: "Selected enquiries deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
