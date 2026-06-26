import { prisma } from "../config/db.js";

const getSettingsController = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettingsController = async (req, res, next) => {
  try {
    const updates = req.body;
    
    // updates is an object { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { getSettingsController, updateSettingsController };
