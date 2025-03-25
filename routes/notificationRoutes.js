const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notificationController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// User notification routes
router.get("/", auth, NotificationController.getUserNotifications);
router.post("/read/:id", auth, NotificationController.markAsRead);
router.post("/read-all", auth, NotificationController.markAllAsRead);
router.get("/subscribe", auth, NotificationController.setupSSEForUser);

// Admin notification routes
router.get(
  "/admin",
  auth,
  adminAuth,
  NotificationController.getAdminNotifications
);
router.get(
  "/admin/subscribe",
  auth,
  adminAuth,
  NotificationController.setupSSEForAdmin
);

module.exports = router;
