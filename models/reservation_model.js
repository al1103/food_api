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
          r.statusCode,
          r.party_size AS "partySize",
          r.customer_name AS "customerName",
          r.phone_number AS "phoneNumber",
          r.special_requests AS "specialRequests",
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

  static async createReservation(reservationData) {
    try {
      const result = await pool.query(
        `INSERT INTO reservations (
          user_id, table_id, reservation_time, party_size,
          statusCode, customer_name, phone_number, special_requests, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        ) RETURNING reservation_id AS "reservationId"`,
        [
          reservationData.userId,
          reservationData.tableId,
          new Date(reservationData.reservationTime),
          reservationData.partySize,
          "pending",
          reservationData.customerName,
          reservationData.phoneNumber,
          reservationData.specialRequests || null,
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
          r.statusCode,
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

  static async updateReservationStatus(id, statusCode) {
    try {
      await pool.query(
        `UPDATE reservations 
         SET statusCode = $1, updated_at = NOW()
         WHERE reservation_id = $2`,
        [statusCode, id]
      );

      return await this.getReservationById(id);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
      throw error;
    }
  }
}

module.exports = ReservationModel;
