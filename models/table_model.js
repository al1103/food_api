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
        [tableData.tableNumber, tableData.capacity, "available"]
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

  static async getTableWithCustomers(tableId) {
    try {
      // Lấy thông tin bàn
      const tableResult = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM tables 
        WHERE table_id = $1`,
        [tableId]
      );

      const table = tableResult.rows[0];

      if (!table) {
        return null;
      }

      // Lấy thông tin đơn hàng hiện tại đang sử dụng bàn này (nếu có)
      const orderResult = await pool.query(
        `SELECT
          o.order_id AS "orderId",
          o.user_id AS "userId",
          o.status,
          o.total_amount AS "totalAmount",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt",
          u.name AS "userName",
          u.email AS "userEmail",
          u.phone AS "userPhone"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.table_id = $1 AND o.status NOT IN ('completed', 'cancelled')
        ORDER BY o.created_at DESC
        LIMIT 1`,
        [tableId]
      );

      // Kết hợp thông tin
      return {
        ...table,
        currentOrder: orderResult.rows[0] || null,
        isOccupied: orderResult.rows.length > 0,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi tiết bàn:", error);
      throw error;
    }
  }

  static async getAllTablesWithStatus() {
    try {
      // Lấy danh sách tất cả bàn
      const result = await pool.query(
        `SELECT 
          t.table_id AS "tableId",
          t.table_number AS "tableNumber",
          t.capacity,
          t.status,
          t.created_at AS "tableCreatedAt",
          t.updated_at AS "tableUpdatedAt",
          o.order_id AS "currentOrderId",
          o.status AS "orderStatus",
          o.created_at AS "orderCreatedAt",
          u.name AS "customerName"
        FROM tables t
        LEFT JOIN (
          SELECT DISTINCT ON (table_id) *
          FROM orders
          WHERE status NOT IN ('completed', 'cancelled')
          ORDER BY table_id, created_at DESC
        ) o ON t.table_id = o.table_id
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY t.table_number ASC`
      );

      // Xử lý kết quả
      return result.rows.map((row) => ({
        tableId: row.tableId,
        tableNumber: row.tableNumber,
        capacity: row.capacity,
        status: row.status,
        createdAt: row.tableCreatedAt,
        updatedAt: row.tableUpdatedAt,
        currentOrder: row.currentOrderId
          ? {
              orderId: row.currentOrderId,
              status: row.orderStatus,
              createdAt: row.orderCreatedAt,
              customerName: row.customerName,
            }
          : null,
        isOccupied: !!row.currentOrderId,
      }));
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bàn với trạng thái:", error);
      throw error;
    }
  }

  static async updateTableStatus(id, status) {
    try {
      const result = await pool.query(
        `UPDATE tables SET
          status = $1,
          updated_at = NOW()
        WHERE table_id = $2
        RETURNING table_id AS "tableId", table_number AS "tableNumber", status`,
        [status, id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái bàn:", error);
      throw error;
    }
  }

  // Lấy thông tin khách hàng và món ăn đã đặt tại bàn
  static async getTableCustomersAndOrders(tableId) {
    try {
      // Lấy thông tin khách hàng và đơn hàng đang hoạt động tại bàn
      const result = await pool.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.name AS "userName",
          u.phone AS "userPhone",
          o.status AS "orderStatus",
          o.total_amount AS "totalAmount",
          o.created_at AS "orderCreatedAt",
          o.updated_at AS "orderUpdatedAt",
          od.item_id AS "itemId",
          i.name AS "itemName",
          od.quantity AS "quantity",
          od.price AS "price"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN order_details od ON o.order_id = od.order_id
        JOIN items i ON od.item_id = i.item_id
        WHERE o.table_id = $1 AND o.status NOT IN ('completed', 'cancelled')
        ORDER BY o.created_at ASC`,
        [tableId]
      );

      // Xử lý kết quả để nhóm món ăn theo từng khách hàng
      const orders = {};
      result.rows.forEach((row) => {
        if (!orders[row.orderId]) {
          orders[row.orderId] = {
            orderId: row.orderId,
            userId: row.userId,
            userName: row.userName,
            userPhone: row.userPhone,
            orderStatus: row.orderStatus,
            totalAmount: row.totalAmount,
            orderCreatedAt: row.orderCreatedAt,
            orderUpdatedAt: row.orderUpdatedAt,
            items: [],
          };
        }
        orders[row.orderId].items.push({
          itemId: row.itemId,
          itemName: row.itemName,
          quantity: row.quantity,
          price: row.price,
        });
      });

      // Trả về danh sách khách hàng và món ăn đã đặt
      return Object.values(orders);
    } catch (error) {
      console.error(
        "Lỗi khi lấy thông tin khách hàng và món ăn tại bàn:",
        error
      );
      throw error;
    }
  }

  // Method to get all active orders for a specific table
  static async getActiveOrdersByTableId(tableId) {
    try {
      const result = await pool.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username AS "userName",
          u.phone_number AS "userPhone",
          o.status AS "status",
          o.total_price AS "totalAmount",
          o.status AS "paidStatus",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.table_id = $1 AND o.status NOT IN ('completed', 'cancelled')
        ORDER BY o.created_at ASC`,
        [tableId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching active orders for table:", error);
      throw error;
    }
  }

  // Tìm bàn trống phù hợp với số lượng khách
  static async findAvailableTable(numberOfGuests) {
    try {
      const result = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status
        FROM tables
        WHERE status = 'available' AND capacity >= $1
        ORDER BY capacity ASC
        LIMIT 1`,
        [numberOfGuests]
      );

      return result.rows[0]; // Trả về bàn phù hợp nhất
    } catch (error) {
      console.error("Lỗi khi tìm bàn trống:", error);
      throw error;
    }
  }

  // Đặt bàn trước
  static async reserveTable(tableId, reservationTime) {
    try {
      const result = await pool.query(
        `UPDATE tables
        SET status = 'reserved',
            reservation_time = $1,
            updated_at = NOW()
        WHERE table_id = $2 AND status = 'available'
        RETURNING table_id AS "tableId", table_number AS "tableNumber", status AS "reservationStatus", reservation_time AS "reservationTime"`,
        [reservationTime, tableId]
      );

      if (result.rows.length === 0) {
        throw new Error("Bàn không khả dụng hoặc đã được đặt trước");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi đặt bàn trước:", error);
      throw error;
    }
  }

  // Hủy đặt bàn
  static async cancelReservation(reservationId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lấy thông tin yêu cầu đặt bàn
      const reservationResult = await client.query(
        `SELECT table_id FROM reservations WHERE reservation_id = $1 AND status = 'confirmed'`,
        [reservationId]
      );

      const tableId = reservationResult.rows[0]?.table_id;

      if (!tableId) {
        throw new Error(
          "Không thể hủy đặt bàn. Yêu cầu chưa được xác nhận hoặc không tồn tại."
        );
      }

      // Cập nhật trạng thái của yêu cầu đặt bàn
      await client.query(
        `UPDATE reservations
        SET status = 'cancelled', updated_at = NOW()
        WHERE reservation_id = $1`,
        [reservationId]
      );

      // Cập nhật trạng thái của bàn
      await client.query(
        `UPDATE tables
        SET status = 'available', updated_at = NOW()
        WHERE table_id = $1`,
        [tableId]
      );

      await client.query("COMMIT");

      return { message: "Hủy đặt bàn thành công" };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi hủy đặt bàn:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async cancelReservationRequest(reservationId) {
    try {
      const result = await pool.query(
        `UPDATE reservations
        SET status = 'cancelled', updated_at = NOW()
        WHERE reservation_id = $1 AND status = 'pending'
        RETURNING reservation_id AS "reservationId", status`,
        [reservationId]
      );

      if (result.rows.length === 0) {
        throw new Error(
          "Không thể hủy yêu cầu đặt bàn. Yêu cầu không tồn tại hoặc đã được xử lý."
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu đặt bàn:", error);
      throw error;
    }
  }

  // Đặt bàn trước với số lượng người, ngày giờ và ghi chú
  static async reserveTableWithDetails(numberOfGuests, reservationTime, note) {
    try {
      // Tìm bàn trống phù hợp
      const result = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status
        FROM tables
        WHERE status = 'available' AND capacity >= $1
        ORDER BY capacity ASC
        LIMIT 1`,
        [numberOfGuests]
      );

      const table = result.rows[0];
      if (!table) {
        throw new Error("Không có bàn trống phù hợp");
      }

      // Đặt bàn trước
      const updateResult = await pool.query(
        `UPDATE tables
        SET status = 'reserved',
            reservation_time = $1,
            note = $2,
            updated_at = NOW()
        WHERE table_id = $3
        RETURNING table_id AS "tableId", table_number AS "tableNumber", status AS "reservationStatus", reservation_time AS "reservationTime", note`,
        [reservationTime, note, table.tableId]
      );

      return updateResult.rows[0];
    } catch (error) {
      console.error("Lỗi khi đặt bàn trước:", error);
      throw error;
    }
  }

  // Lấy danh sách các yêu cầu đặt bàn
  static async getReservations() {
    try {
      const result = await pool.query(
        `SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          status AS "reservationStatus",
          reservation_time AS "reservationTime",
          note,
          capacity
        FROM tables
        WHERE status = 'reserved'
        ORDER BY reservation_time ASC`
      );

      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu đặt bàn:", error);
      throw error;
    }
  }

  // Lưu yêu cầu đặt bàn từ client
  static async createReservationRequest(
    userId,
    tableId,
    reservationTime,
    partySize,
    customerName,
    phoneNumber,
    specialRequests
  ) {
    try {
      const result = await pool.query(
        `INSERT INTO reservations (
          user_id, table_id, reservation_time, party_size, customer_name, phone_number, special_requests, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW()
        )
        RETURNING reservation_id AS "reservationId", user_id AS "userId", table_id AS "tableId", reservation_time AS "reservationTime", party_size AS "partySize", customer_name AS "customerName", phone_number AS "phoneNumber", special_requests AS "specialRequests", status, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [
          userId,
          tableId,
          reservationTime,
          partySize,
          customerName,
          phoneNumber,
          specialRequests,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi tạo yêu cầu đặt bàn:", error);
      throw error;
    }
  }

  // Lấy danh sách yêu cầu đặt bàn
  static async getPendingReservations() {
    try {
      const result = await pool.query(
        `SELECT 
          reservation_id AS "reservationId",
          user_id AS "userId",
          table_id AS "tableId",
          reservation_time AS "reservationTime",
          party_size AS "partySize",
          customer_name AS "customerName",
          phone_number AS "phoneNumber",
          special_requests AS "specialRequests",
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM reservations
        WHERE status = 'pending'
        ORDER BY reservation_time ASC`
      );

      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu đặt bàn:", error);
      throw error;
    }
  }

  // Xác nhận yêu cầu đặt bàn và gán bàn
  static async confirmReservation(reservationId, tableId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Cập nhật trạng thái của yêu cầu đặt bàn
      const reservationResult = await client.query(
        `UPDATE reservations
        SET status = 'confirmed', table_id = $1, updated_at = NOW()
        WHERE reservation_id = $2
        RETURNING reservation_id AS "reservationId", user_id AS "userId", table_id AS "tableId", reservation_time AS "reservationTime", party_size AS "partySize", customer_name AS "customerName", phone_number AS "phoneNumber", special_requests AS "specialRequests", status, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [tableId, reservationId]
      );

      // Cập nhật trạng thái của bàn
      await client.query(
        `UPDATE tables
        SET status = 'reserved', updated_at = NOW()
        WHERE table_id = $1`,
        [tableId]
      );

      await client.query("COMMIT");

      return reservationResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi xác nhận yêu cầu đặt bàn:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TableModel;
