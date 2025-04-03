const { pool } = require("../config/database");

class OrderModel {
  static async getAllOrders(page = 1, limit = 10, filters = {}) {
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
      const offset = (page - 1) * limit;

      // Build filter conditions
      let conditions = [];
      let params = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`o.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }
      if (filters.startDate) {
        conditions.push(`o.order_date >= $${paramIndex}`);
        params.push(filters.startDate);
        paramIndex++;
      }
      if (filters.endDate) {
        conditions.push(`o.order_date <= $${paramIndex}`);
        params.push(filters.endDate);
        paramIndex++;
      }
      let whereClause =
        conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

      // Determine sorting. Map inbound sortBy to DB columns.
      const validSortColumns = {
        orderdate: "o.order_date",
        createdat: "o.created_at",
        updatedat: "o.updated_at",
      };
      let sortColumn = validSortColumns.orderdate;
      if (filters.sortBy) {
        const key = filters.sortBy.toLowerCase();
        if (validSortColumns[key]) {
          sortColumn = validSortColumns[key];
        }
      }
      let sortOrder = "DESC";
      if (filters.sortOrder && filters.sortOrder.toUpperCase() === "ASC") {
        sortOrder = "ASC";
      }

      // Total count based on filters
      const countQuery = `SELECT COUNT(*) AS total_count FROM orders o ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Append pagination values to params
      params.push(limit, offset);

      const mainQuery = `
          SELECT 
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
          ${whereClause}
          ORDER BY ${sortColumn} ${sortOrder}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      const result = await pool.query(mainQuery, params);

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
      console.error("Error getting orders:", error);
      throw error;
    }
  }

  static async getOrderById(id) {
    try {
      console.log(`Looking up order with ID: ${id}`);

      if (!id) {
        console.error("Order ID is undefined or null");
        return null;
      }

      // Try parsing the ID to ensure it's a number
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        console.error(`Invalid order ID format: ${id}`);
        return null;
      }

      // Get the order information
      const orderQuery = `
        SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          o.total_price AS "totalPrice",
          o.status,
          o.table_id AS "tableId",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt",
          u.username,
          u.email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = $1
      `;

      console.log(`Executing order query with ID: ${parsedId}`);
      const orderResult = await pool.query(orderQuery, [parsedId]);

      if (orderResult.rows.length === 0) {
        console.log(`No order found with ID: ${parsedId}`);
        return null;
      }

      const order = orderResult.rows[0];
      console.log(`Found order: ${order.orderId}`);

      // Get order details
      const detailsQuery = `
        SELECT 
          od.id,
          od.id AS "dishId",
          d.name AS "dishName",
          d.image AS "imageUrl",
          od.quantity,
          od.price,
          od.special_requests AS "specialRequests",
          od.created_at AS "createdAt"
        FROM order_details od
        JOIN dishes d ON od.id = d.id
        WHERE od.order_id = $1
      `;

      console.log(`Getting details for order: ${parsedId}`);
      const detailsResult = await pool.query(detailsQuery, [parsedId]);
      console.log(
        `Found ${detailsResult.rows.length} items for order ${parsedId}`
      );

      // Add details to order
      order.items = detailsResult.rows;

      return order;
    } catch (error) {
      console.error(`Error in getOrderById: ${error.message}`);
      console.error(error.stack); // Include stack trace for better debugging
      throw error;
    }
  }

  static async createOrder(orderData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      console.log("Starting order creation process...");

      // Validate table if provided
      if (orderData.tableId) {
        const tableQuery = "SELECT status FROM tables WHERE table_id = $1";
        const tableResult = await client.query(tableQuery, [orderData.tableId]);

        if (tableResult.rows.length === 0) {
          throw new Error("Bàn không tồn tại");
        }

        if (tableResult.rows[0].status === "occupied") {
          throw new Error("Bàn đã được sử dụng");
        }
      }

      // Calculate the total price based on items
      let totalPrice = 0;
      const validatedItems = [];

      // Validate and calculate price for each item
      for (const item of orderData.items) {
        const { dishId, quantity, specialRequests } = item;

        // Based on your schema output, dishes table uses 'id', not 'dish_id'
        const dishQuery = `
          SELECT 
            id, 
            name, 
            price, 
            image AS image_url 
          FROM dishes 
          WHERE id = $1 
          AND available = true
        `;

        const dishResult = await client.query(dishQuery, [dishId]);

        if (dishResult.rows.length === 0) {
          throw new Error(
            `Món ăn với ID ${dishId} không tồn tại hoặc không khả dụng`
          );
        }

        const dish = dishResult.rows[0];
        const itemPrice = parseFloat(dish.price) * quantity;
        totalPrice += itemPrice;

        validatedItems.push({
          dishId: dish.id, // Use the correct dish ID field
          dishName: dish.name,
          imageUrl: dish.image_url,
          quantity,
          price: dish.price,
          specialRequests: specialRequests || null,
        });
      }

      // Create the order with the calculated total price
      const orderQuery = `
        INSERT INTO orders (
          user_id, 
          total_price, 
          status, 
          table_id, 
          order_date, 
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
        RETURNING 
          order_id AS "orderId", 
          user_id AS "userId", 
          total_price AS "totalPrice", 
          status, 
          table_id AS "tableId",
          order_date AS "orderDate", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
      `;

      const orderResult = await client.query(orderQuery, [
        orderData.userId,
        totalPrice,
        orderData.status || "pending",
        orderData.tableId || null,
      ]);

      const newOrder = orderResult.rows[0];
      console.log("Created order:", newOrder.orderId);

      // Now insert the order details - use dish_id for order_details table
      for (const item of validatedItems) {
        const detailQuery = `
          INSERT INTO order_details (
            order_id, 
            dish_id, 
            quantity, 
            price, 
            special_requests, 
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `;

        await client.query(detailQuery, [
          newOrder.orderId,
          item.dishId,
          item.quantity,
          item.price,
          item.specialRequests,
        ]);

        console.log(`Added item ${item.dishName} to order ${newOrder.orderId}`);
      }

      // If table is specified, update table status
      if (orderData.tableId) {
        await client.query(
          "UPDATE tables SET status = 'occupied', updated_at = NOW() WHERE table_id = $1",
          [orderData.tableId]
        );
        console.log(`Updated table ${orderData.tableId} status to occupied`);
      }

      // Add the order items to the response
      newOrder.items = validatedItems;

      await client.query("COMMIT");
      console.log("Transaction committed successfully");

      return newOrder;
    } catch (error) {
      try {
        console.error(
          "Error encountered, rolling back transaction:",
          error.message
        );
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError.message);
      }
      throw error;
    } finally {
      client.release();
      console.log("Database client released");
    }
  }

  // Cập nhật phương thức updateOrderStatus để làm việc với cả admin và user
  static async updateOrderStatus(id, status) {
    try {
      console.log(`Updating order ${id} to status: ${status}`);

      // First verify the order exists
      const checkOrderQuery = `SELECT order_id, status FROM orders WHERE order_id = $1`;
      const orderResult = await pool.query(checkOrderQuery, [id]);

      if (orderResult.rows.length === 0) {
        throw new Error(`Order with ID ${id} not found`);
      }

      const currentStatus = orderResult.rows[0].status;
      console.log(
        `Current order status: ${currentStatus}, changing to: ${status}`
      );

      // Update the order status
      const updateQuery = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING order_id, status, updated_at
      `;

      const result = await pool.query(updateQuery, [status, id]);

      if (result.rows.length === 0) {
        throw new Error(`Failed to update order ${id}`);
      }

      console.log(`Successfully updated order ${id} to ${status}`);

      return {
        message: "Cập nhật trạng thái đơn hàng thành công",
        order: result.rows[0],
      };
    } catch (error) {
      console.error(`Error updating order status: ${error.message}`);
      throw error;
    }
  }

  static async getOrderDetails(orderId) {
    try {
      const result = await pool.query(
        `SELECT 
          od.id AS "id",
          od.id AS "dishId",
          d.name AS "dishName",
          d.image AS "imageUrl",  /* Changed from image_url to image based on schema */
          od.quantity AS "quantity",
          od.price AS "price",
          od.special_requests AS "specialRequests",
          od.created_at AS "createdAt"
        FROM order_details od
        JOIN dishes d ON od.id = d.id  /* Changed from d.id to d.id based on schema */
        WHERE od.order_id = $1`,
        [orderId]
      );

      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      throw error;
    }
  }

  static async getOrdersByUserId(userId, page = 1, limit = 10) {
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const countResult = await pool.query(
        `SELECT COUNT(*) AS total_count FROM orders WHERE user_id = $1`,
        [userId]
      );
      const totalCount = parseInt(countResult.rows[0].total_count);

      // Get paginated orders for specific user
      const result = await pool.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          o.total_price AS "totalPrice",
          o.status AS "status",
          o.order_date AS "orderDate",
          o.created_at AS "createdAt",
          o.updated_at AS "updatedAt"
        FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.order_date DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
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
      console.error("Error getting user orders:", error);
      throw error;
    }
  }

  // Thêm phương thức getOrdersByDateRange để thống kê
  static async getOrdersByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT 
          status, 
          COUNT(*) as count, 
          SUM(total_price) as total_revenue
        FROM orders 
        WHERE order_date BETWEEN $1 AND $2
        GROUP BY status
      `;

      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error("Error getting orders by date range:", error);
      throw error;
    }
  }

  // Thêm phương thức updateOrderPayment vào OrderModel

  // Phương thức cập nhật thông tin thanh toán đơn hàng
  static async updateOrderPayment(orderId, paymentData) {
    try {
      const { paidStatus, paidAmount, paymentMethod, paidAt } = paymentData;

      const result = await pool.query(
        `UPDATE orders SET
          paid_status = $1,
          paid_amount = $2,
          payment_method = $3,
          paid_at = $4,
          updated_at = NOW()
        WHERE order_id = $5
        RETURNING *`,
        [paidStatus, paidAmount, paymentMethod, paidAt, orderId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Format kết quả trả về
      const order = result.rows[0];
      return {
        orderId: order.order_id,
        userId: order.user_id,
        tableId: order.table_id,
        status: order.status,
        totalAmount: order.total_amount,
        paidStatus: order.paid_status,
        paidAmount: order.paid_amount,
        paymentMethod: order.payment_method,
        paidAt: order.paid_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật thanh toán đơn hàng:", error);
      throw error;
    }
  }
}

module.exports = OrderModel;
