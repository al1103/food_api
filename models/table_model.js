const { sql, poolPromise } = require("../config/database");

class TableModel {
  static async getAllTables() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          TableID,
          TableNumber,
          Capacity,
          Status,
          CreatedAt,
          UpdatedAt
        FROM Tables
        ORDER BY TableNumber ASC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bàn:", error);
      throw error;
    }
  }

  static async getTableById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("tableId", sql.Int, id).query(`
          SELECT * FROM Tables WHERE TableID = @tableId
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bàn:", error);
      throw error;
    }
  }

  static async createTable(tableData) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("tableNumber", sql.Int, tableData.tableNumber)
        .input("capacity", sql.Int, tableData.capacity)
        .input("status", sql.VarChar(20), tableData.status || "available")
        .query(`
          INSERT INTO Tables (
            TableNumber, Capacity, Status, CreatedAt, UpdatedAt
          ) VALUES (
            @tableNumber, @capacity, @status, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS TableID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo bàn mới:", error);
      throw error;
    }
  }

  static async updateTable(id, tableData) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("tableId", sql.Int, id)
        .input("capacity", sql.Int, tableData.capacity)
        .input("status", sql.VarChar(20), tableData.status).query(`
          UPDATE Tables 
          SET Capacity = @capacity,
              Status = @status,
              UpdatedAt = GETDATE()
          WHERE TableID = @tableId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật bàn:", error);
      throw error;
    }
  }

  static async deleteTable(id) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("tableId", sql.Int, id)
        .query("DELETE FROM Tables WHERE TableID = @tableId");
    } catch (error) {
      console.error("Lỗi khi xóa bàn:", error);
      throw error;
    }
  }
}

module.exports = TableModel;
