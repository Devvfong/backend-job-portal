import express from "express";
import {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
} from "../controllers/notification.controller.js";
import protect from "../middlewares/protect.middleware.js";

const router = express.Router();

router.get("/", protect, getNotificationsController);
router.patch("/read-all", protect, markAllNotificationsReadController);
router.patch("/:id/read", protect, markNotificationReadController);
router.delete("/:id", protect, deleteNotificationController);

export default router;