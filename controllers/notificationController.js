const { pool } = require("../config/database");
const NotificationModel = require("../models/notification_model");

// Store active SSE connections
const sseClients = {
  users: new Map(), // userId -> response object
  admins: new Set(), // Set of admin response objects
};

class NotificationController {
  // Kiểm tra và chuyển đổi userId nếu cần
  static validateUserId(userId) {
    // Nếu userId là null hoặc undefined, trả về null (thông báo cho admin)
    if (userId === null || userId === undefined) {
      return null;
    }

    // Kiểm tra xem userId có định dạng UUID không
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn(
        `Invalid UUID format for userId: ${userId}. This may cause issues.`,
      );
    }

    return userId;
  }

  // Create notification when a new order is placed
  static async createOrderNotification(orderId, userId, status) {
    try {
      console.log(
        `Creating notification for order: ${orderId}, status: ${status}`,
      );
      userId = NotificationController.validateUserId(userId);

      // Create notification for admin (regardless of userId)
      const adminNotification = {
        title: "Đơn hàng mới",
        content: `Đơn hàng mới #${orderId} đã được tạo với trạng thái ${status}.`,
        type: "order_new",
        referenceId: orderId,
        isRead: false,
        status: "unread",
        userId: null, // null for admin notifications
        priority: "high",
      };

      const adminNotifResult = await NotificationModel.createNotification(
        adminNotification,
      );

      // Send SSE notification to all admins
      NotificationController.sendSSEToAllAdmins(adminNotifResult);

      // Create notification for user if userId is valid
      if (userId) {
        const userNotification = {
          title: "Đơn hàng đã được đặt",
          content: `Đơn hàng #${orderId} của bạn đã được đặt thành công và đang chờ xác nhận.`,
          type: "order_status",
          referenceId: orderId,
          isRead: false,
          status: "unread",
          userId: userId,
          priority: "medium",
        };

        const userNotifResult = await NotificationModel.createNotification(
          userNotification,
        );

        // Send SSE notification to the user
        NotificationController.sendSSEToUser(userId, userNotifResult);
      }

      return true;
    } catch (error) {
      console.error("Error creating order notification:", error);
      throw error;
    }
  }

  // Phương thức để lấy danh sách thông báo của user
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Validate userId
      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID is required",
        });
      }

      const notifications = await NotificationModel.getNotificationsByUserId(
        userId,
        page,
        limit,
      );

      return res.status(200).json({
        status: "success",
        data: notifications,
      });
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return res.status(500).json({
        status: "error",
        message: "Không thể lấy thông báo: " + error.message,
      });
    }
  }

  // Phương thức để lấy danh sách thông báo cho admin
  static async getAdminNotifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const notifications = await NotificationModel.getAdminNotifications(
        page,
        limit,
      );

      return res.status(200).json({
        status: "success",
        data: notifications,
      });
    } catch (error) {
      console.error("Error getting admin notifications:", error);
      return res.status(500).json({
        status: "error",
        message: "Không thể lấy thông báo: " + error.message,
      });
    }
  }

  // Phương thức để đánh dấu một thông báo là đã đọc
  static async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const notificationId = req.params.id;

      if (!notificationId) {
        return res.status(400).json({
          status: "error",
          message: "Notification ID is required",
        });
      }

      const result = await NotificationModel.markAsRead(notificationId);

      return res.status(200).json({
        status: "success",
        message: "Đã đánh dấu thông báo là đã đọc",
        data: result,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        status: "error",
        message: "Không thể cập nhật thông báo: " + error.message,
      });
    }
  }

  // Phương thức để đánh dấu tất cả thông báo của user là đã đọc
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID is required",
        });
      }

      const result = await NotificationModel.markAllAsRead(userId);

      return res.status(200).json({
        status: "success",
        message: "Đã đánh dấu tất cả thông báo là đã đọc",
        count: result,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({
        status: "error",
        message: "Không thể cập nhật thông báo: " + error.message,
      });
    }
  }

  // Thêm phương thức này để tạo thông báo cập nhật trạng thái đơn hàng
  static async integrateWithOrderUpdate(orderId, userId, oldStatus, newStatus) {
    try {
      console.log(
        `Creating notification for order status update: ${orderId}, ${oldStatus} -> ${newStatus}`,
      );
      userId = NotificationController.validateUserId(userId);

      // Admin notification
      const adminNotification = {
        title: `Đơn hàng #${orderId} đã được cập nhật`,
        content: `Trạng thái đã thay đổi từ "${oldStatus}" thành "${newStatus}"`,
        type: "order_status",
        referenceId: orderId,
        isRead: false,
        status: "unread",
        userId: null, // null for admin notifications
        priority: "medium",
      };

      // Tạo thông báo cho admin
      const adminNotifResult = await NotificationModel.createNotification(
        adminNotification,
      );
      NotificationController.sendSSEToAllAdmins(adminNotifResult);

      // User notification (if userId exists)
      if (userId) {
        const userNotification = {
          title: "Cập nhật trạng thái đơn hàng",
          content: NotificationController.getOrderStatusMessage(
            orderId,
            newStatus,
          ),
          type: "order_status",
          referenceId: orderId,
          isRead: false,
          status: "unread",
          userId: userId,
          priority: "medium",
        };

        // Tạo thông báo cho user
        const userNotifResult = await NotificationModel.createNotification(
          userNotification,
        );
        NotificationController.sendSSEToUser(userId, userNotifResult);
      }

      console.log("Notifications created successfully");
      return true;
    } catch (error) {
      console.error(
        "Error in notificationController.integrateWithOrderUpdate:",
        error,
      );
      // Don't throw, just log the error
      return false;
    }
  }

  // Thêm hàm integrateWithOrderCreate để sử dụng trong orderController
  static async integrateWithOrderCreate(newOrder, userId) {
    try {
      console.log(`Creating notification for new order ${newOrder.orderId}`);
      return await NotificationController.createOrderNotification(
        newOrder.orderId,
        userId,
        newOrder.status,
      );
    } catch (error) {
      console.error(
        "Error in notificationController.integrateWithOrderCreate:",
        error,
      );
      // Don't throw, just log the error
      return false;
    }
  }

  // Helper function for status messages
  static getOrderStatusMessage(orderId, status) {
    switch (status) {
      case "pending":
        return `Đơn hàng #${orderId} của bạn đang chờ xác nhận.`;
      case "confirmed":
        return `Đơn hàng #${orderId} của bạn đã được xác nhận.`;
      case "processing":
        return `Đơn hàng #${orderId} của bạn đang được chuẩn bị.`;
      case "completed":
        return `Đơn hàng #${orderId} của bạn đã được hoàn thành.`;
      case "cancelled":
        return `Đơn hàng #${orderId} của bạn đã bị hủy.`;
      default:
        return `Trạng thái đơn hàng #${orderId} đã được cập nhật thành ${status}.`;
    }
  }

  // Các phương thức để gửi SSE tới client
  static sendSSEToUser(userId, notification) {
    try {
      const userRes = sseClients.users.get(userId);
      if (userRes) {
        console.log(`Sending SSE to user ${userId}`);
        userRes.write(`data: ${JSON.stringify(notification)}\n\n`);
      } else {
        console.log(`No active SSE connection for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error sending SSE to user ${userId}:`, error);
    }
  }

  static sendSSEToAllAdmins(notification) {
    try {
      console.log(`Sending SSE to ${sseClients.admins.size} admins`);
      sseClients.admins.forEach((res) => {
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
      });
    } catch (error) {
      console.error("Error sending SSE to admins:", error);
    }
  }

  // Phương thức để thiết lập SSE connection cho user
  static setupSSEForUser(req, res) {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID is required for SSE",
        });
      }

      // Thiết lập các headers cho SSE
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Để ngăn chặn proxy buffering
      });

      // Gửi một event ban đầu
      res.write(
        `data: ${JSON.stringify({
          type: "connection",
          message: "SSE connected",
        })}\n\n`,
      );

      // Lưu kết nối vào Map
      sseClients.users.set(userId, res);

      console.log(`SSE connection established for user ${userId}`);

      // Xử lý khi client ngắt kết nối
      req.on("close", () => {
        sseClients.users.delete(userId);
        console.log(`SSE connection closed for user ${userId}`);
      });
    } catch (error) {
      console.error("Error setting up SSE for user:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể thiết lập kết nối SSE: " + error.message,
      });
    }
  }

  // Phương thức để thiết lập SSE connection cho admin
  static setupSSEForAdmin(req, res) {
    try {
      // Thiết lập các headers cho SSE
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Để ngăn chặn proxy buffering
      });

      // Gửi một event ban đầu
      res.write(
        `data: ${JSON.stringify({
          type: "connection",
          message: "Admin SSE connected",
        })}\n\n`,
      );

      // Lưu kết nối vào Set
      sseClients.admins.add(res);

      console.log("Admin SSE connection established");

      // Xử lý khi client ngắt kết nối
      req.on("close", () => {
        sseClients.admins.delete(res);
        console.log("Admin SSE connection closed");
      });
    } catch (error) {
      console.error("Error setting up SSE for admin:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể thiết lập kết nối SSE: " + error.message,
      });
    }
  }
}

module.exports = NotificationController;
