const { sql, poolPromise } = require("../config/database");

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
          r.Status,
          r.CreatedAt,
          r.UpdatedAt
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
        .input("status", sql.VarChar(20), "pending").query(`
          INSERT INTO Reservations (
            UserID, TableNumber, ReservationTime, Status, CreatedAt, UpdatedAt
          ) VALUES (
            @userId, @tableNumber, @reservationTime, @status, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS ReservationID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo đặt bàn:", error);
      throw error;
    }
  }

  static async updateReservationStatus(id, status) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("reservationId", sql.Int, id)
        .input("status", sql.VarChar(20), status).query(`
          UPDATE Reservations 
          SET Status = @status, UpdatedAt = GETDATE()
          WHERE ReservationID = @reservationId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
      throw error;
    }
  }
}

module.exports = ReservationModel;
