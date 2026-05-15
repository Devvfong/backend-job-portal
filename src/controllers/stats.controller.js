import { getGlobalStatsService } from "../services/stats.service.js";

const getGlobalStatsController = async (req, res) => {
  try {
    const stats = await getGlobalStatsService();
    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

export { getGlobalStatsController };
