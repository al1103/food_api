const { pool } = require("../config/database");

class NotificationModel {
  static async createNotification(notificationData) {
    try {
      const {
        title,
        content,
        type,
        referenceId,
        isRead = false,
        status = "unread",
        userId, // Cần là UUID hoặc null
        priority = "low",
      } = notificationData;

      // Kiểm tra xem userId có phải là UUID không
      if (
        userId !== null &&
        typeof userId === "string" &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId
        )
      ) {
        console.warn(
          `Warning: userId ${userId} does not appear to be a valid UUID`
        );
        // Quyết định xem có nên tiếp tục hay không - có thể throw error hoặc set userId = null
      }

      const query = `
        INSERT INTO notifications (
          title, content, type, reference_id, is_read, status, user_id, priority, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING 
          notification_id AS "notificationId", 
          title, 
          content, 
          type, 
          reference_id AS "referenceId", 
          is_read AS "isRead", 
          status, 
          user_id AS "userId", 
          priority, 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(query, [
        title,
        content,
        type,
        referenceId,
        isRead,
        status,
        userId, // Có thể là UUID hoặc null
        priority,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Đảm bảo các phương thức khác cũng xử lý UUID đúng
  static async getNotificationsByUserId(userId, page = 1, limit = 10) {
    try {
      // Validate userId
      if (
        !userId ||
        typeof userId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId
        )
      ) {
        throw new Error(`Invalid UUID format for userId: ${userId}`);
      }

      // Validate params
      page = parseInt(page);
      limit = parseInt(limit);
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;

      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM notifications 
        WHERE user_id = $1 OR (user_id IS NULL AND type = 'global')
      `;
      const countResult = await pool.query(countQuery, [userId]);
      const totalItems = parseInt(countResult.rows[0].total);

      // Get notifications
      const query = `
        SELECT
          notification_id AS "notificationId",
          title,
          content,
          type,
          reference_id AS "referenceId",
          is_read AS "isRead",
          status,
          user_id AS "userId",
          priority,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM notifications
        WHERE user_id = $1 OR (user_id IS NULL AND type = 'global')
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userId, limit, offset]);

      return {
        items: result.rows,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error getting notifications by user ID:", error);
      throw error;
    }
  }

  static async getNotificationById(notificationId) {
    try {
      const query = `
        SELECT
          notification_id AS "notificationId",
          title,
          content,
          type,
          reference_id AS "referenceId",
          is_read AS "isRead",
          status,
          user_id AS "userId",
          priority,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM notifications
        WHERE notification_id = $1
      `;

      const result = await pool.query(query, [notificationId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting notification by ID:", error);
      throw error;
    }
  }

  static async markAsRead(notificationId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = true, status = 'read', updated_at = NOW()
        WHERE notification_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [notificationId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications
        SET is_read = true, status = 'read', updated_at = NOW()
        WHERE user_id = $1 OR (user_id IS NULL AND type = 'global')
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);

      return result.rowCount;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  static async getAdminNotifications(page = 1, limit = 10) {
    try {
      // Validate params
      page = parseInt(page);
      limit = parseInt(limit);
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;

      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM notifications 
        WHERE user_id IS NULL
      `;
      const countResult = await pool.query(countQuery);
      const totalItems = parseInt(countResult.rows[0].total);

      // Get notifications
      const query = `
        SELECT
          notification_id AS "notificationId",
          title,
          content,
          type,
          reference_id AS "referenceId",
          is_read AS "isRead",
          status,
          user_id AS "userId",
          priority,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM notifications
        WHERE user_id IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limit, offset]);

      return {
        items: result.rows,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error getting admin notifications:", error);
      throw error;
    }
  }
}

module.exports = NotificationModel;
