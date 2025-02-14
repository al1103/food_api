const { sql, poolPromise } = require("../config/database");

class OrderModel {
  static async getAllOrders() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          o.OrderID,
          o.UserID,
          u.Username,
          o.TotalPrice,
          o.Status,
          o.OrderDate,
          o.CreatedAt,
          o.UpdatedAt
        FROM Orders o
        JOIN Users u ON o.UserID = u.UserID
        ORDER BY o.OrderDate DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  }

  static async getOrderById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("orderId", sql.Int, id).query(`
          SELECT 
            o.*,
            u.Username,
            u.Email
          FROM Orders o
          JOIN Users u ON o.UserID = u.UserID
          WHERE o.OrderID = @orderId
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
      throw error;
    }
  }

  static async createOrder(orderData) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("userId", sql.VarChar(36), orderData.userId)
        .input("totalPrice", sql.Decimal(10, 2), orderData.totalPrice).query(`
          INSERT INTO Orders (UserID, TotalPrice, Status)
          VALUES (@userId, @totalPrice, 'pending');
          SELECT SCOPE_IDENTITY() AS OrderID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  }

  static async updateOrderStatus(id, status) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("orderId", sql.Int, id)
        .input("status", sql.VarChar(20), status).query(`
          UPDATE Orders 
          SET Status = @status
          WHERE OrderID = @orderId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  }
}

module.exports = OrderModel;
