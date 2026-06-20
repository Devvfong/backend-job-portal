import { getNotificationsForUser } from "../services/notification.service.js";

const getNotificationsController = async (req, res, next) => {
  try {
    const notifications = await getNotificationsForUser(req.user);

    return res.status(200).json({
      status: "success",
      data: notifications,
      unread: notifications.filter((notification) => !notification.read).length,
    });
  } catch (error) {
    next(error);
  }
};

export { getNotificationsController };
