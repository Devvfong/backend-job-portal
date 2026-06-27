import { prisma } from "../config/db.js";
import { appSettings, getSetting } from "../config/settings.cache.js";

const ALLOWED_SETTING_KEYS = new Set([
  "maintenance_mode",
  "maintenance_reason",
  "contact_email",
  "max_upload_size_mb",
  "spam_apply_threshold",
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

    let shouldNotifyByEmail = false;
    if (updates.notify_users_by_email === "true") {
      shouldNotifyByEmail = true;
    }
    delete updates.notify_users_by_email;

    // Reject any keys that are not in the whitelist
    const rejectedKeys = Object.keys(updates).filter((key) => !ALLOWED_SETTING_KEYS.has(key));
    if (rejectedKeys.length > 0) {
      return res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: `Unauthorized setting keys: ${rejectedKeys.join(", ")}`,
      });
    }

    const oldMaintenanceMode = getSetting("maintenance_mode");

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

    // If maintenance mode was just turned ON
    if (updates.maintenance_mode === "true" && oldMaintenanceMode !== "true") {
      const reason = updates.maintenance_reason || "System is undergoing maintenance";
      
      // 1. Broadcast to all active WebSocket clients
      import("../realtime/websocket.js").then(({ broadcastToAll, REALTIME_EVENTS }) => {
        broadcastToAll(REALTIME_EVENTS.MAINTENANCE_MODE, { reason });
      });

      // 2. Trigger background email job if requested
      if (shouldNotifyByEmail) {
        import("../services/email.service.js").then(async ({ sendMaintenanceEmail }) => {
          try {
            const users = await prisma.user.findMany({
              where: { role: { in: ["job_seeker", "company_admin"] } },
              select: { id: true, email: true, name: true }
            });
            console.log(`Sending maintenance emails to ${users.length} users in the background...`);
            for (const user of users) {
              await sendMaintenanceEmail(user, reason);
              // Small delay to prevent rate-limiting from Resend
              await new Promise((r) => setTimeout(r, 100));
            }
          } catch (err) {
            console.error("Background maintenance email job failed:", err);
          }
        });
      }
    }

    res.status(200).json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};
