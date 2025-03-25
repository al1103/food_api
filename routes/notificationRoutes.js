const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notificationController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// User notification routes
router.get("/user", auth, NotificationController.getUserNotifications);
router.post("/read/:id", auth, NotificationController.markAsRead);
router.post("/read-all", auth, NotificationController.markAllAsRead);

// SSE subscription endpoint for users
router.get(
  "/subscribe",
  auth,
  NotificationController.subscribeUserNotifications
);

// Admin notification routes
router.get("/admin", adminAuth, NotificationController.getAdminNotifications);
router.get(
  "/admin/subscribe",
  adminAuth,
  NotificationController.subscribeAdminNotifications
);

module.exports = router;
