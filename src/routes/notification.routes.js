import express from "express";
import { getNotificationsController } from "../controllers/notification.controller.js";
import protect from "../middlewares/protect.middleware.js";

const router = express.Router();

router.get("/", protect, getNotificationsController);

export default router;
