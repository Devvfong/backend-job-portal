import { getGlobalStatsService, getAdminDashboardService } from "../services/stats.service.js";
import { encryptId } from "../utils/crypto.js";

const getGlobalStatsController = async (req, res, next) => {
  try {
    const stats = await getGlobalStatsService();
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminDashboardController = async (req, res, next) => {
  try {
    const stats = await getAdminDashboardService();
    const recentUsers = (stats.recentUsers || []).map((user) => ({
      ...user,
      encryptedId: encryptId(user.id),
    }));

    return res.status(200).json({
      status: "success",
      data: {
        ...stats,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getGlobalStatsController, getAdminDashboardController };
