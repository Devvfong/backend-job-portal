import express from "express";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { getSettingsController, updateSettingsController } from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/", getSettingsController);
router.put("/", protect, authorize("super_admin"), updateSettingsController);

export default router;
