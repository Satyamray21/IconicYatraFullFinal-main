import SocialLinks from "../models/SocialLinks.js";

// GET social links
export const getSocialLinks = async (req, res) => {
  try {
    let links = await SocialLinks.findOne();

    if (!links) {
      links = await SocialLinks.create({});
    }

    res.status(200).json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE social links
export const updateSocialLinks = async (req, res) => {
  try {
    let links = await SocialLinks.findOne();

    if (!links) {
      links = new SocialLinks(req.body);
    } else {
      Object.assign(links, req.body);
    }

    await links.save();

    res.status(200).json({
      message: "Social links updated successfully",
      data: links,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
