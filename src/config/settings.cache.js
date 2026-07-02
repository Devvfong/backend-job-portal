import { prisma } from "./db.js";

const appSettings = {
  maintenance_mode: "false",
  contact_email: "support@nexthire.com",
  max_upload_size_mb: "5",
};

const initSettingsCache = async () => {
  try {
    const settings = await prisma.setting.findMany();
    settings.forEach((s) => {
      appSettings[s.key] = s.value;
    });
    console.log("✅ System settings cache initialized");
  } catch (error) {
    console.error("Failed to initialize settings cache:", error);
  }
};

const getSetting = (key) => appSettings[key];

export { appSettings, initSettingsCache, getSetting };


const SETTINGS_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

const refreshSettingsCache = async () => {
  try {
    const settings = await prisma.setting.findMany();
    settings.forEach((s) => {
      appSettings[s.key] = s.value;
    });
  } catch (error) {
    console.error('Failed to refresh settings cache:', error);
  }
};

setInterval(refreshSettingsCache, SETTINGS_REFRESH_MS);

