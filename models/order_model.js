const { pool } = require("../config/database");

class OrderModel {
  static async getAllOrders(page = 1, limit = 10) {
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const countResult = await pool.query(
        `SELECT COUNT(*) AS total_count FROM orders`
      );
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Get paginated orders
      const result = await pool.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username AS "username",
          o.total_price AS "totalPrice",
          o.status AS "status",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        orders: result.rows,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      throw error;
    }
  }

  static async getOrderById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          o.total_price AS "totalPrice",
          o.status AS "status",
          o.table_id AS "tableId",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt",
          u.username AS "username",
          u.email AS "email"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = $1`,
        [id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
      throw error;
    }
  }

  static async createOrder(orderData) {
    try {
      const result = await pool.query(
        `INSERT INTO orders (user_id, total_price, status, table_id, order_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
         RETURNING order_id AS "orderId"`,
        [
          orderData.userId,
          orderData.totalPrice,
          orderData.status || "pending",
          orderData.tableId || null,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      throw error;
    }
  }

  static async updateOrderStatus(id, status) {
    try {
      await pool.query(
        `UPDATE orders 
         SET status = $1, updated_at = NOW()
         WHERE order_id = $2`,
        [status, id]
      );

      return { message: "Cập nhật trạng thái đơn hàng thành công" };
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      throw error;
    }
  }

  static async getOrderDetails(orderId) {
    try {
      const result = await pool.query(
        `SELECT 
          od.id AS "id",
          od.dish_id AS "dishId",
          d.name AS "dishName",
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
}

module.exports = OrderModel;
