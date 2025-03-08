const { sql, poolPromise } = require("../config/database");

class TableModel {
  static async getAllTables(
    page = 1,
    limit = 10,
    sortBy = "TableNumber",
    sortOrder = "ASC"
  ) {
    try {
      const pool = await poolPromise;

      // Validate and sanitize inputs
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));

      // Whitelist allowed sort columns to prevent SQL injection
      const allowedSortColumns = [
        "TableID",
        "TableNumber",
        "Capacity",
        "Status",
        "CreatedAt",
        "UpdatedAt",
      ];
      sortBy = allowedSortColumns.includes(sortBy) ? sortBy : "TableNumber";

      // Validate sort order
      sortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const countResult = await pool.request().query(`
        SELECT COUNT(*) AS TotalCount FROM Tables
      `);
      const totalCount = countResult.recordset[0].TotalCount;

      // Get paginated data
      const result = await pool
        .request()
        .input("offset", sql.Int, offset)
        .input("limit", sql.Int, limit).query(`
          SELECT 
            TableID,
            TableNumber,
            Capacity,
            Status,
            CreatedAt,
            UpdatedAt
          FROM Tables
          ORDER BY ${sortBy} ${sortOrder}
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      return {
        tables: result.recordset,
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
