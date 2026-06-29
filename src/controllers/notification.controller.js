import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationForUser,
} from "../services/notification.service.js";

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

const markNotificationReadController = async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.user.id, req.params.id);
    if (!notification) {
      return res.status(404).json({
        status: "fail",
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsReadController = async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user.id);
    return res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotificationController = async (req, res, next) => {
  try {
    const deleted = await deleteNotificationForUser(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Notification deleted",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
};