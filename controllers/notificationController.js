const { pool } = require("../config/database");
const NotificationModel = require("../models/notification_model");
const UserModel = require("../models/user_model");

// Store active SSE connections
const sseClients = {
  users: new Map(), // userId -> response object
  admins: new Set(), // Set of admin response objects
};

class NotificationController {
  // Create notification when a new order is placed
  static async createOrderNotification(orderId, userId, status) {
    try {
      // Get order details for notification content
      const orderQuery = `
        SELECT order_id, total_price, order_date 
        FROM orders 
        WHERE order_id = $1
      `;
      const orderResult = await pool.query(orderQuery, [orderId]);

      if (orderResult.rows.length === 0) {
        console.error("Order not found for notification:", orderId);
        return null;
      }

      const order = orderResult.rows[0];

      // Get user info for personalized notification
      const user = await UserModel.getUserById(userId);

      // Create notification for admins
      const adminNotification = {
        title: "Đơn hàng mới",
        content: `${
          user ? user.username : "Khách hàng"
        } đã đặt đơn hàng #${orderId} với tổng giá trị ${order.total_price}đ`,
        type: "order_new",
        referenceId: orderId,
        isRead: false,
        status: "unread",
        userId: null, // null indicates it's for all admins
        priority: "high",
      };

      // Create notification for user
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

      // Save both notifications
      const adminNotifResult = await NotificationModel.createNotification(
        adminNotification
      );
      const userNotifResult = await NotificationModel.createNotification(
        userNotification
      );

      // Send SSE notifications
      NotificationController.sendSSEToAdmins(adminNotifResult);
      NotificationController.sendSSEToUser(userId, userNotifResult);

      return {
        adminNotification: adminNotifResult,
        userNotification: userNotifResult,
      };
    } catch (error) {
      console.error("Error creating order notification:", error);
      throw error;
    }
  }

  // Create notification when order status changes
  static async createStatusChangeNotification(
    orderId,
    userId,
    oldStatus,
    newStatus
  ) {
    try {
      let title, content, priority;

      switch (newStatus) {
        case "confirmed":
          title = "Đơn hàng đã được xác nhận";
          content = `Đơn hàng #${orderId} của bạn đã được xác nhận và đang được chuẩn bị.`;
          priority = "medium";
          break;
        case "processing":
          title = "Đơn hàng đang được xử lý";
          content = `Đơn hàng #${orderId} của bạn đang được nhà bếp chuẩn bị.`;
          priority = "medium";
          break;
        case "completed":
          title = "Đơn hàng đã hoàn thành";
          content = `Đơn hàng #${orderId} của bạn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`;
          priority = "high";
          break;
        case "cancelled":
          title = "Đơn hàng đã bị hủy";
          content = `Đơn hàng #${orderId} của bạn đã bị hủy.`;
          priority = "high";
          break;
        default:
          title = "Cập nhật đơn hàng";
          content = `Trạng thái đơn hàng #${orderId} của bạn đã được cập nhật từ "${oldStatus}" sang "${newStatus}".`;
          priority = "low";
      }

      const notification = {
        title,
        content,
        type: "order_status",
        referenceId: orderId,
        isRead: false,
        status: "unread",
        userId,
        priority,
      };

      const result = await NotificationModel.createNotification(notification);

      // Send SSE to the specific user
      NotificationController.sendSSEToUser(userId, result);

      return result;
    } catch (error) {
      console.error("Error creating status change notification:", error);
      throw error;
    }
  }

  // Get user's notifications with pagination
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const notifications = await NotificationModel.getNotificationsByUserId(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        status: "success",
        data: notifications.items,
        pagination: notifications.pagination,
      });
    } catch (error) {
      console.error("Error getting user notifications:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể lấy thông báo",
        error: error.message,
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = req.user.userId;

      // Check if notification belongs to user
      const notification = await NotificationModel.getNotificationById(
        notificationId
      );

      if (!notification) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy thông báo",
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Bạn không có quyền truy cập thông báo này",
        });
      }

      await NotificationModel.markAsRead(notificationId);

      res.status(200).json({
        status: "success",
        message: "Đã đánh dấu thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể cập nhật trạng thái thông báo",
        error: error.message,
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      await NotificationModel.markAllAsRead(userId);

      res.status(200).json({
        status: "success",
        message: "Đã đánh dấu tất cả thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể cập nhật trạng thái thông báo",
        error: error.message,
      });
    }
  }

  // Get admin notifications with pagination
  static async getAdminNotifications(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const notifications = await NotificationModel.getAdminNotifications(
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        status: "success",
        data: notifications.items,
        pagination: notifications.pagination,
      });
    } catch (error) {
      console.error("Error getting admin notifications:", error);
      res.status(500).json({
        status: "error",
        message: "Không thể lấy thông báo cho admin",
        error: error.message,
      });
    }
  }

  // SSE endpoint for user notifications
  static subscribeUserNotifications(req, res) {
    const userId = req.user.userId;

    // Set headers for SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial connection confirmation
    res.write(
      `data: ${JSON.stringify({
        event: "connected",
        message: "SSE connection established",
      })}\n\n`
    );

    // Add this client to active connections
    sseClients.users.set(userId, res);

    // Handle client disconnect
    req.on("close", () => {
      sseClients.users.delete(userId);
      console.log(`User ${userId} disconnected from notifications SSE`);
    });
  }

  // SSE endpoint for admin notifications
  static subscribeAdminNotifications(req, res) {
    // Set headers for SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial connection confirmation
    res.write(
      `data: ${JSON.stringify({
        event: "connected",
        message: "Admin SSE connection established",
      })}\n\n`
    );

    // Add this client to active admin connections
    sseClients.admins.add(res);

    // Handle client disconnect
    req.on("close", () => {
      sseClients.admins.delete(res);
      console.log("Admin disconnected from notifications SSE");
    });
  }

  // Helper to send SSE to specific user
  static sendSSEToUser(userId, notification) {
    const client = sseClients.users.get(userId);
    if (client) {
      client.write(
        `data: ${JSON.stringify({
          event: "notification",
          data: notification,
        })}\n\n`
      );
    }
  }

  // Helper to send SSE to all admins
  static sendSSEToAdmins(notification) {
    sseClients.admins.forEach((client) => {
      client.write(
        `data: ${JSON.stringify({
          event: "notification",
          data: notification,
        })}\n\n`
      );
    });
  }

  // When integrated with your order controller, add to order creation:
  static async integrateWithOrderCreate(newOrder, userId) {
    return await NotificationController.createOrderNotification(
      newOrder.orderId,
      userId,
      newOrder.status
    );
  }

  // For order status updates:
  static async integrateWithOrderUpdate(orderId, userId, oldStatus, newStatus) {
    return await NotificationController.createStatusChangeNotification(
      orderId,
      userId,
      oldStatus,
      newStatus
    );
  }
}

/* HOW TO USE THIS CONTROLLER:
 
In orderController.js:

// When creating an order:
const newOrder = await OrderModel.createOrder({...});
await NotificationController.integrateWithOrderCreate(newOrder, userId);

// When updating order status:
const oldStatus = order.status;
await OrderModel.updateOrderStatus(orderId, status);
await NotificationController.integrateWithOrderUpdate(orderId, order.userId, oldStatus, status);
*/

module.exports = NotificationController;
