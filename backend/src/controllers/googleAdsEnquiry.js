import GoogleAdsEnquiry from "../models/googleAdsEnquiry.js";


// CREATE ENQUIRY
export const createEnquiry = async (req, res) => {
  try {

    const enquiry = await GoogleAdsEnquiry.create(req.body);

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
      pages: Math.ceil(total / limit)
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
      { new: true }
    );

    res.json({
      success: true,
      data: enquiry
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
