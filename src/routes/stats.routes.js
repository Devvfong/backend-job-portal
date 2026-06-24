import express from "express";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { getGlobalStatsController, getAdminDashboardController } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", getGlobalStatsController);
router.get("/admin", protect, authorize("super_admin"), getAdminDashboardController);

export default router;
