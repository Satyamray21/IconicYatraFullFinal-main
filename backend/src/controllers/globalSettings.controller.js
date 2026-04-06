import GlobalSettings from "../models/globalSettings.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Get Global Settings
export const getGlobalSettings = asyncHandler(async (req, res) => {
  let settings = await GlobalSettings.findOne();

  if (!settings) {
    settings = await GlobalSettings.create({});
  }

  res.json(settings);
});


// ✅ Update Global Settings
export const updateGlobalSettings = asyncHandler(async (req, res) => {
  let settings = await GlobalSettings.findOne();

  if (!settings) {
    settings = await GlobalSettings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  res.json(settings);
});
