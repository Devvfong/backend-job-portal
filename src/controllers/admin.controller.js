import { getModerationLogsService } from "../services/admin.service.js";

const getModerationLogsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await getModerationLogsService(page, limit);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export { getModerationLogsController };
