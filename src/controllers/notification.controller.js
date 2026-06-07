import { getNotificationsForUser } from "../services/notification.service.js";

const getNotificationsController = async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user);

    return res.status(200).json({
      status: "success",
      data: notifications,
      unread: notifications.filter((notification) => !notification.read).length,
    });
  } catch (err) {
    console.error("Notification error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

export { getNotificationsController };