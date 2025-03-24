const { pool } = require("../config/database");

class AdminModel {
  // Order management methods
  static async getAllOrders(page, limit, filters = {}) {
    try {
      // Define the base query conditions
      let conditions = "";
      const queryParams = [];
      let paramIndex = 1;

      // Add status filter if provided
      if (filters.statusCode) {
        conditions += `WHERE o.statusCode = $${paramIndex++}`;
        queryParams.push(filters.statusCode);
      }

      // Add date range filter if provided
      if (filters.fromDate && filters.toDate) {
        conditions += conditions ? " AND " : "WHERE ";
        conditions += `o.order_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        queryParams.push(new Date(filters.fromDate), new Date(filters.toDate));
      } else if (filters.fromDate) {
        conditions += conditions ? " AND " : "WHERE ";
        conditions += `o.order_date >= $${paramIndex++}`;
        queryParams.push(new Date(filters.fromDate));
      } else if (filters.toDate) {
        conditions += conditions ? " AND " : "WHERE ";
        conditions += `o.order_date <= $${paramIndex++}`;
        queryParams.push(new Date(filters.toDate));
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM orders o
        ${conditions}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);

      // Calculate pagination values
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Clone queryParams for the main query
      const mainQueryParams = [...queryParams];

      // Add pagination parameters
      mainQueryParams.push(limit, offset);

      // Get orders with pagination
      const query = `
        SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username AS "username",
          o.total_price AS "totalPrice",
          o.statusCode AS "statusCode",
          o.table_id AS "tableId",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ${conditions}
        ORDER BY o.order_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      const result = await pool.query(query, mainQueryParams);

      return {
        orders: result.rows,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error getting orders:", error);
      throw error;
    }
  }

  static async getOrderById(orderId) {
    try {
      // Check if order exists and get basic order info
      const orderQuery = `
        SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username AS "username",
          u.email AS "email",
          o.total_price AS "totalPrice",
          o.statusCode AS "statusCode",
          o.table_id AS "tableId",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = $1
      `;

      const orderResult = await pool.query(orderQuery, [orderId]);

      if (orderResult.rows.length === 0) {
        return null;
      }

      // Get order details
      const detailsQuery = `
        SELECT 
          od.id AS "id",
          od.dish_id AS "dishId",
          d.name AS "dishName",
          d.image_url AS "imageUrl",
          od.quantity AS "quantity",
          od.price AS "price",
          od.special_requests AS "specialRequests",
          od.created_at AS "createdAt"
        FROM order_details od
        JOIN dishes d ON od.dish_id = d.dish_id
        WHERE od.order_id = $1
      `;

      const detailsResult = await pool.query(detailsQuery, [orderId]);

      // Combine order and details
      const order = orderResult.rows[0];
      order.details = detailsResult.rows;

      return order;
    } catch (error) {
      console.error("Error getting order details:", error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId, statusCode) {
    try {
      // Check if order exists
      const checkQuery = "SELECT 1 FROM orders WHERE order_id = $1";
      const checkResult = await pool.query(checkQuery, [orderId]);

      if (checkResult.rows.length === 0) {
        return { success: false, message: "Không tìm thấy đơn hàng" };
      }

      // Update order status
      const updateQuery = `
        UPDATE orders 
        SET statusCode = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING 
          order_id AS "orderId",
          statusCode AS "statusCode",
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(updateQuery, [statusCode, orderId]);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // --- Food management methods added ---
  static async createFood({ name, description, price, imageUrl, category }) {
    const query = `
      INSERT INTO foods(name, description, price, image_url, category, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING 
        food_id AS "foodId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, [
      name,
      description,
      price,
      imageUrl,
      category,
    ]);
    return result.rows[0];
  }

  static async updateFood(
    foodId,
    { name, description, price, imageUrl, category }
  ) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(imageUrl);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    // Always update updated_at
    updates.push(`updated_at = NOW()`);
    if (updates.length === 1) {
      throw new Error("Không có thông tin nào được cập nhật");
    }
    values.push(foodId); // last parameter

    const query = `
      UPDATE foods
      SET ${updates.join(", ")}
      WHERE food_id = $${paramIndex}
      RETURNING 
        food_id AS "foodId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteFood(foodId) {
    // First, you might check for existence in your controller or here as needed.
    const query = `
      DELETE FROM foods
      WHERE food_id = $1
    `;
    await pool.query(query, [foodId]);
    return;
  }
  // --- End food management methods ---
}

module.exports = AdminModel;
