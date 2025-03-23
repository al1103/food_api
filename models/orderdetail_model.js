const { sql, poolPromise } = require("../config/database");
const { pool } = require("../config/database");

class ReservationModel {
  static async getAllReservations() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          r.ReservationID,
          r.UserID,
          u.Username,
          r.TableNumber,
          r.ReservationTime,
          r.statusCode,
          r.created_at,
          r.updated_at
        FROM Reservations r
        JOIN Users u ON r.UserID = u.UserID
        ORDER BY r.ReservationTime DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đặt bàn:", error);
      throw error;
    }
  }

  static async createReservation(reservationData) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("userId", sql.VarChar(36), reservationData.userId)
        .input("tableNumber", sql.Int, reservationData.tableNumber)
        .input(
          "reservationTime",
          sql.DateTime,
          new Date(reservationData.reservationTime)
        )
        .input("statusCode", sql.VarChar(20), "pending").query(`
          INSERT INTO Reservations (
            UserID, TableNumber, ReservationTime, statusCode, created_at, updated_at
          ) VALUES (
            @userId, @tableNumber, @reservationTime, @statusCode, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS ReservationID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo đặt bàn:", error);
      throw error;
    }
  }

  static async updateReservationStatus(id, statusCode) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("reservationId", sql.Int, id)
        .input("statusCode", sql.VarChar(20), statusCode).query(`
          UPDATE Reservations 
          SET statusCode = @statusCode, updated_at = GETDATE()
          WHERE ReservationID = @reservationId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
      throw error;
    }
  }
}

class OrderDetailModel {
  static async getOrderDetailsByOrderId(orderId) {
    try {
      const result = await pool.query(
        `SELECT 
          od.id AS "id",
          od.order_id AS "orderId",
          od.dish_id AS "dishId",
          d.name AS "dishName",
          d.image_url AS "imageUrl",
          od.quantity AS "quantity",
          od.price AS "price",
          od.special_requests AS "specialRequests",
          od.created_at AS "createdAt"
        FROM order_details od
        JOIN dishes d ON od.dish_id = d.dish_id
        WHERE od.order_id = $1`,
        [orderId]
      );

      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      throw error;
    }
  }

  static async createOrderDetail(orderDetailData) {
    try {
      const result = await pool.query(
        `INSERT INTO order_details (
          order_id, dish_id, quantity, price, special_requests, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id AS "id"`,
        [
          orderDetailData.orderId,
          orderDetailData.dishId,
          orderDetailData.quantity,
          orderDetailData.price,
          orderDetailData.specialRequests || null,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi tạo chi tiết đơn hàng:", error);
      throw error;
    }
  }

  static async updateOrderDetail(id, orderDetailData) {
    try {
      await pool.query(
        `UPDATE order_details 
        SET quantity = $1, 
            special_requests = $2
        WHERE id = $3`,
        [orderDetailData.quantity, orderDetailData.specialRequests || null, id]
      );

      return { message: "Cập nhật chi tiết đơn hàng thành công" };
    } catch (error) {
      console.error("Lỗi khi cập nhật chi tiết đơn hàng:", error);
      throw error;
    }
  }

  static async deleteOrderDetail(id) {
    try {
      await pool.query(`DELETE FROM order_details WHERE id = $1`, [id]);

      return { message: "Xóa chi tiết đơn hàng thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa chi tiết đơn hàng:", error);
      throw error;
    }
  }
}

module.exports = { ReservationModel, OrderDetailModel };
