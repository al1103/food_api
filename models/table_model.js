const { pool } = require("../config/database");

class TableModel {
  static async getAllTables(
    page = 1,
    limit = 10,
    sortBy = "table_number",
    sortOrder = "ASC"
  ) {
    try {
      // Validate and sanitize inputs
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));

      // Whitelist allowed sort columns to prevent SQL injection
      const allowedSortColumns = [
        "table_id",
        "table_number",
        "capacity",
        "status",
        "created_at",
        "updated_at",
      ];
      sortBy = allowedSortColumns.includes(sortBy.toLowerCase())
        ? sortBy.toLowerCase()
        : "table_number";

      // Validate sort order
      sortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) AS total_count FROM tables"
      );
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Get paginated data
      const result = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM tables
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      return {
        tables: result.rows,
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
      const result = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM tables 
        WHERE table_id = $1`,
        [id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bàn:", error);
      throw error;
    }
  }

  static async createTable(tableData) {
    try {
      const result = await pool.query(
        `INSERT INTO tables (
          table_number, capacity, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NOW(), NOW()
        ) RETURNING table_id AS "tableId"`,
        [
          tableData.tableNumber,
          tableData.capacity,
          tableData.status || "available",
        ]
      );

      return await this.getTableById(result.rows[0].tableId);
    } catch (error) {
      console.error("Lỗi khi tạo bàn mới:", error);
      throw error;
    }
  }

  static async updateTable(id, tableData) {
    try {
      await pool.query(
        `UPDATE tables SET
          capacity = $1,
          status = $2,
          updated_at = NOW()
        WHERE table_id = $3`,
        [tableData.capacity, tableData.status, id]
      );

      return await this.getTableById(id);
    } catch (error) {
      console.error("Lỗi khi cập nhật bàn:", error);
      throw error;
    }
  }

  static async deleteTable(id) {
    try {
      await pool.query("DELETE FROM tables WHERE table_id = $1", [id]);
      return { message: "Xóa bàn thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa bàn:", error);
      throw error;
    }
  }
}

module.exports = TableModel;
