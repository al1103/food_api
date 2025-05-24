const { pool } = require("../config/database");

class ReservationModel {
  static async getAllReservations(page = 1, limit = 10) {
    try {
      // Validate and sanitize inputs
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) AS total_count FROM reservations"
      );
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Get paginated data with user information
      const result = await pool.query(
        `SELECT
          r.reservation_id AS "reservationId",
          r.user_id AS "userId",
          u.username,
          r.table_id AS "tableId",
          r.reservation_time AS "reservationTime",
          r.status,
          r.party_size AS "partySize",
          r.customer_name AS "customerName",
          r.phone_number AS "phoneNumber",
          r.special_requests AS "specialRequests",
          r.cancel_reason AS "cancelReason",
          r.created_at AS "createdAt",
          r.updated_at AS "updatedAt"
        FROM reservations r
        JOIN users u ON r.user_id = u.user_id
        ORDER BY r.reservation_time DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      return {
        reservations: result.rows,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đặt bàn:", error);
      throw error;
    }
  }

  static async createReservation(
    userId,
    tableId,
    reservationTime,
    partySize,
    specialRequests = null,
    orderId = null
  ) {
    try {
      console.log("Creating reservation with time:", reservationTime);
      console.log(
        "Time after conversion:",
        new Date(reservationTime).toISOString()
      );

      // First, validate the date is parseable
      const reservationDate = new Date(reservationTime);
      if (isNaN(reservationDate.getTime())) {
        throw new Error("Invalid reservation time format");
      }

      const result = await pool.query(
        `INSERT INTO reservations (
          user_id, table_id, reservation_time, party_size,
          status, special_requests, order_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        ) RETURNING
          reservation_id AS "reservationId",
          user_id AS "userId",
          table_id AS "tableId",
          reservation_time AS "reservationTime",
          party_size AS "partySize",
          status,
          special_requests AS "specialRequests",
          order_id AS "orderId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"`,
        [
          userId,
          tableId,
          reservationDate,
          partySize,
          "pending",
          specialRequests,
          orderId,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi tạo đặt bàn:", error);
      throw error;
    }
  }

  static async getReservationById(id) {
    try {
      const result = await pool.query(
        `SELECT
          r.reservation_id AS "reservationId",
          r.user_id AS "userId",
          u.username,
          r.table_id AS "tableId",
          r.reservation_time AS "reservationTime",
          r.status,
          r.party_size AS "partySize",
          r.customer_name AS "customerName",
          r.phone_number AS "phoneNumber",
          r.special_requests AS "specialRequests",
          r.created_at AS "createdAt",
          r.updated_at AS "updatedAt"
        FROM reservations r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.reservation_id = $1`,
        [id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đặt bàn:", error);
      throw error;
    }
  }

  static async updateReservationStatus(id, status, cancelReason = null) {
    try {
      await pool.query(
        `UPDATE reservations
         SET status = $1,
             cancel_reason = $2,
             updated_at = NOW()
         WHERE reservation_id = $3`,
        [status, status === 'cancelled' ? cancelReason : null, id]
      );

      return await this.getReservationById(id);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
      throw error;
    }
  }

  static async getReservationsByUserId(userId, page = 1, limit = 10) {
    try {
      // Validate and sanitize inputs
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));
      const offset = (page - 1) * limit;

      // Get total count for this user
      const countResult = await pool.query(
        "SELECT COUNT(*) AS total_count FROM reservations WHERE user_id = $1",
        [userId]
      );
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Get paginated data for this user
      const result = await pool.query(
        `SELECT
        r.reservation_id AS "reservationId",
        r.user_id AS "userId",
        u.username,
        r.table_id AS "tableId",
        t.table_number AS "tableName",
        r.reservation_time AS "reservationTime",
        r.status,
        r.party_size AS "partySize",
        r.customer_name AS "customerName",
        r.phone_number AS "phoneNumber",
        r.special_requests AS "specialRequests",
        r.cancel_reason AS "cancelReason",
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
      FROM reservations r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN tables t ON r.table_id = t.table_id
      WHERE r.user_id = $1
      ORDER BY r.reservation_time DESC
      LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      return {
        reservations: result.rows,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đặt bàn của người dùng:", error);
      throw error;
    }
  }
}

module.exports = ReservationModel;
