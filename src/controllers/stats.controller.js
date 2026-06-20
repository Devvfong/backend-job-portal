import { getGlobalStatsService } from "../services/stats.service.js";

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

export { getGlobalStatsController };
