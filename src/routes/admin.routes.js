import express from "express";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { getModerationLogsController } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/logs", protect, authorize("super_admin"), getModerationLogsController);

export default router;
