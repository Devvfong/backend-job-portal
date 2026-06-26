import { prisma } from "../config/db.js";
import { appSettings } from "../config/settings.cache.js";

const ALLOWED_SETTING_KEYS = new Set([
  "maintenance_mode",
  "contact_email",
  "max_upload_size_mb",
]);

// @desc    Get all settings
// @route   GET /api/v1/settings
// @access  Public or Protected depending on use cases
export const getSettingsController = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    res.status(200).json(settingsObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Get public settings
// @route   GET /api/v1/settings/public
// @access  Public
export const getPublicSettingsController = async (req, res, next) => {
  try {
    res.status(200).json({
      maintenance_mode: appSettings["maintenance_mode"],
      contact_email: appSettings["contact_email"],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upsert settings
// @route   PUT /api/v1/settings
// @access  Protected (Super Admin)
export const updateSettingsController = async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { maintenance_mode: 'true', contact_email: '...' }

    // Reject any keys that are not in the whitelist
    const rejectedKeys = Object.keys(updates).filter((key) => !ALLOWED_SETTING_KEYS.has(key));
    if (rejectedKeys.length > 0) {
      return res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: `Unauthorized setting keys: ${rejectedKeys.join(", ")}`,
      });
    }

    // Process all updates in a transaction
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      // Update cache instantly
      appSettings[key] = String(value);

      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await prisma.$transaction(updatePromises);

    res.status(200).json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};
