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
      if (filters.status) {
        conditions += `WHERE o.status = $${paramIndex++}`;
        queryParams.push(filters.status);
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
          o.status AS "status",
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
          o.status AS "status",
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

  static async updateOrderStatus(
    orderId,
    status,
    tableId = null,
    reservationId = null
  ) {
    try {
      const client = await pool.connect();

      try {
        // Start transaction
        await client.query("BEGIN");

        // Check if order exists
        const checkOrderQuery = "SELECT 1 FROM orders WHERE order_id = $1";
        const checkOrderResult = await client.query(checkOrderQuery, [orderId]);

        if (checkOrderResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return { success: false, message: "Không tìm thấy đơn hàng" };
        }

        // Update order status
        const updateOrderQuery = `
          UPDATE orders 
          SET status = $1, 
              table_id = COALESCE($2, table_id),
              updated_at = NOW()
          WHERE order_id = $3
          RETURNING 
            order_id AS "orderId",
            status AS "status",
            table_id AS "tableId",
            updated_at AS "updatedAt"
        `;

        const orderResult = await client.query(updateOrderQuery, [
          status,
          tableId,
          orderId,
        ]);
        const updatedOrder = orderResult.rows[0];
        let updatedTable = null;
        let updatedReservation = null;

        // If tableId is provided, update the table status based on order status
        if (tableId) {
          // Check if table exists
          const checkTableQuery = "SELECT 1 FROM tables WHERE table_id = $1";
          const checkTableResult = await client.query(checkTableQuery, [
            tableId,
          ]);

          if (checkTableResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return { success: false, message: "Không tìm thấy bàn" };
          }

          // Determine table status based on order status
          let tableStatus = "available";
          if (
            status === "processing" ||
            status === "ready" ||
            status === "serving"
          ) {
            tableStatus = "occupied";
          } else if (status === "completed" || status === "canceled") {
            tableStatus = "available";
          }

          // Update table status
          const updateTableQuery = `
            UPDATE tables 
            SET status = $1, updated_at = NOW()
            WHERE table_id = $2
            RETURNING 
              table_id AS "tableId",
              table_number AS "tableNumber",
              status,
              updated_at AS "updatedAt"
          `;

          const tableResult = await client.query(updateTableQuery, [
            tableStatus,
            tableId,
          ]);
          updatedTable = tableResult.rows[0];
        }

        // If reservationId is provided, update the reservation status
        if (reservationId) {
          // Check if reservation exists
          const checkReservationQuery =
            "SELECT 1 FROM reservations WHERE reservation_id = $1";
          const checkReservationResult = await client.query(
            checkReservationQuery,
            [reservationId]
          );

          if (checkReservationResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return {
              success: false,
              message: "Không tìm thấy thông tin đặt bàn",
            };
          }

          // Determine reservation status based on order status
          let reservationStatus = "pending";
          if (
            status === "processing" ||
            status === "ready" ||
            status === "serving"
          ) {
            reservationStatus = "confirmed";
          } else if (status === "completed") {
            reservationStatus = "completed";
          } else if (status === "canceled") {
            reservationStatus = "canceled";
          }

          // Update reservation status
          const updateReservationQuery = `
            UPDATE reservations 
            SET status = $1, 
                table_id = COALESCE($2, table_id),
                updated_at = NOW()
            WHERE reservation_id = $3
            RETURNING 
              reservation_id AS "reservationId",
              status,
              table_id AS "tableId",
              updated_at AS "updatedAt"
          `;

          const reservationResult = await client.query(updateReservationQuery, [
            reservationStatus,
            tableId,
            reservationId,
          ]);
          updatedReservation = reservationResult.rows[0];
        }

        // Commit transaction
        await client.query("COMMIT");

        return {
          success: true,
          message: `Cập nhật trạng thái đơn hàng thành '${status}' thành công`,
          data: {
            order: updatedOrder,
            table: updatedTable,
            reservation: updatedReservation,
          },
        };
      } catch (error) {
        // Rollback transaction on error
        await client.query("ROLLBACK");
        console.error("Transaction error:", error);
        throw error;
      } finally {
        // Release client back to pool
        client.release();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // --- Food management methods added ---
  static async createFood({ name, description, price, imageUrl, category }) {
    try {
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
    } catch (error) {
      console.error("Error creating food:", error);
      throw error;
    }
  }

  static async updateFood(
    foodId,
    { name, description, price, imageUrl, category }
  ) {
    try {
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
    } catch (error) {
      console.error("Error updating food:", error);
      throw error;
    }
  }

  static async deleteFood(foodId) {
    try {
      // First, you might check for existence in your controller or here as needed.
      const query = `
        DELETE FROM foods
        WHERE food_id = $1
      `;
      await pool.query(query, [foodId]);
      return { success: true, message: "Xóa món ăn thành công" };
    } catch (error) {
      console.error("Error deleting food:", error);
      throw error;
    }
  }
  // --- End food management methods ---

  // --- Dashboard management methods ---
  static async getDashboardStats() {
    try {
      // Get orders statistics
      const totalOrdersResult = await pool.query(
        "SELECT COUNT(*) AS total FROM orders"
      );
      const totalOrders = parseInt(totalOrdersResult.rows[0].total);

      const completedOrdersResult = await pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE status = 'completed'"
      );
      const completedOrders = parseInt(completedOrdersResult.rows[0].total);

      const pendingOrdersResult = await pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'"
      );
      const pendingOrders = parseInt(pendingOrdersResult.rows[0].total);

      // Calculate total revenue
      const revenueResult = await pool.query(
        "SELECT SUM(total_price) AS total FROM orders WHERE status = 'completed'"
      );
      const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

      // Get reservation statistics
      const totalReservationsResult = await pool.query(
        "SELECT COUNT(*) AS total FROM reservations"
      );
      const totalReservations = parseInt(totalReservationsResult.rows[0].total);

      const todayReservationsResult = await pool.query(
        "SELECT COUNT(*) AS total FROM reservations WHERE reservation_time::date = CURRENT_DATE"
      );
      const todayReservations = parseInt(todayReservationsResult.rows[0].total);

      // Get table information
      const totalTablesResult = await pool.query(
        "SELECT COUNT(*) AS total FROM tables"
      );
      const totalTables = parseInt(totalTablesResult.rows[0].total);

      const availableTablesResult = await pool.query(
        "SELECT COUNT(*) AS total FROM tables WHERE status = 'available'"
      );
      const availableTables = parseInt(availableTablesResult.rows[0].total);

      // Get user statistics
      const totalUsersResult = await pool.query(
        "SELECT COUNT(*) AS total FROM users"
      );
      const totalUsers = parseInt(totalUsersResult.rows[0].total);

      // Get popular dishes (top 5)
      const popularDishesResult = await pool.query(`
        SELECT 
          d.id AS "dishId", 
          d.name AS "dishName",
          SUM(od.quantity) AS "count",
          d.price
        FROM order_details od
        JOIN dishes d ON od.dish_id = d.id
        JOIN orders o ON od.order_id = o.order_id
        WHERE o.status = 'completed'
        GROUP BY d.id, d.name, d.price
        ORDER BY "count" DESC
        LIMIT 5
      `);

      // Get dishes totals
      const dishCountResult = await pool.query(`
        SELECT COUNT(*) AS total,
        SUM(CASE WHEN available = true THEN 1 ELSE 0 END) AS available_count
        FROM dishes
      `);

      const dishesTotal = parseInt(dishCountResult.rows[0].total || 0);
      const dishesAvailable = parseInt(
        dishCountResult.rows[0].available_count || 0
      );

      return {
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue,
        },
        reservations: {
          total: totalReservations,
          today: todayReservations,
        },
        tables: {
          total: totalTables,
          available: availableTables,
        },
        users: {
          total: totalUsers, // Thêm số lượng người dùng
        },
        dishes: {
          total: dishesTotal,
          available: dishesAvailable,
        },
        popularDishes: popularDishesResult.rows,
      };
    } catch (error) {
      console.error("Dashboard error:", error);
      throw error;
    }
  }

  // --- Dish management methods ---
  static async getAllDishes(page = 1, limit = 10, filters = {}) {
    try {
      let queryConditions = "";
      const queryParams = [];
      let paramIndex = 1;

      if (filters.category) {
        queryConditions = "WHERE category = $1";
        queryParams.push(filters.category);
        paramIndex++;
      }

      const countQuery = `
        SELECT COUNT(*) AS total
        FROM dishes
        ${queryConditions}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      const paginatedQueryParams = [...queryParams, limit, offset];

      const query = `
        SELECT 
          dish_id AS "dishId",
          name,
          description,
          price,
          image_url AS "imageUrl",
          available,
          category,
          is_top AS "isTop",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dishes
        ${queryConditions}
        ORDER BY is_top DESC, ${filters.sortBy || "dish_id"} ${
        filters.sortOrder || "ASC"
      }
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      const result = await pool.query(query, paginatedQueryParams);

      return {
        dishes: result.rows,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error getting dishes:", error);
      throw error;
    }
  }

  static async getDishById(dishId) {
    try {
      const query = `
        SELECT 
          dish_id AS "dishId",
          name,
          description,
          price,
          image_url AS "imageUrl",
          available,
          category,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dishes
        WHERE dish_id = $1
      `;

      const result = await pool.query(query, [dishId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error getting dish by ID:", error);
      throw error;
    }
  }

  static async createDish({
    name,
    description,
    price,
    imageUrl,
    category,
    available = true,
  }) {
    try {
      const query = `
        INSERT INTO dishes (
          name, description, price, image_url, category, available, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        ) RETURNING 
          dish_id AS "dishId", 
          name, 
          description, 
          price, 
          image_url AS "imageUrl", 
          category,
          available,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(query, [
        name,
        description,
        price,
        imageUrl,
        category,
        available,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error creating dish:", error);
      throw error;
    }
  }

  static async updateDish(
    dishId,
    { name, description, price, imageUrl, category, available }
  ) {
    try {
      // Check if dish exists
      const checkQuery = "SELECT image_url FROM dishes WHERE dish_id = $1";
      const checkResult = await pool.query(checkQuery, [dishId]);

      if (checkResult.rows.length === 0) {
        throw new Error("Món ăn không tồn tại");
      }

      // Build update query dynamically
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
      if (available !== undefined) {
        updates.push(`available = $${paramIndex++}`);
        values.push(available);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      // If no fields to update except updated_at
      if (updates.length === 1) {
        throw new Error("Không có thông tin nào được cập nhật");
      }

      // Add dishId to values array
      values.push(dishId);

      const query = `
        UPDATE dishes
        SET ${updates.join(", ")}
        WHERE dish_id = $${paramIndex}
        RETURNING 
          dish_id AS "dishId", 
          name, 
          description, 
          price, 
          image_url AS "imageUrl", 
          category,
          available,
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating dish:", error);
      throw error;
    }
  }

  static async deleteDish(dishId) {
    try {
      // Check if dish is used in any orders
      const orderCheckQuery = `
        SELECT 1 FROM order_details WHERE dish_id = $1 LIMIT 1
      `;

      const orderCheckResult = await pool.query(orderCheckQuery, [dishId]);

      if (orderCheckResult.rows.length > 0) {
        throw new Error("Không thể xóa món ăn đã được sử dụng trong đơn hàng");
      }

      const deleteQuery = "DELETE FROM dishes WHERE dish_id = $1";
      await pool.query(deleteQuery, [dishId]);

      return { success: true, message: "Xóa món ăn thành công" };
    } catch (error) {
      console.error("Error deleting dish:", error);
      throw error;
    }
  }

  static async updateTopDishes() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Đặt tất cả các món ăn về trạng thái không phải top
      await client.query(`UPDATE dishes SET is_top = FALSE`);

      // Đánh dấu các món ăn đứng top (dựa trên số lượng bán ra)
      const result = await client.query(`
        WITH top_dishes AS (
          SELECT 
            d.dish_id
          FROM dishes d
          JOIN order_details od ON d.dish_id = od.dish_id
          JOIN orders o ON od.order_id = o.order_id
          WHERE o.status = 'completed'
          GROUP BY d.dish_id
          ORDER BY SUM(od.quantity) DESC
          LIMIT 5
        )
        UPDATE dishes
        SET is_top = TRUE
        WHERE dish_id IN (SELECT dish_id FROM top_dishes)
        RETURNING dish_id AS "dishId", name, is_top AS "isTop"
      `);

      await client.query("COMMIT");

      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi cập nhật món đứng top:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getTopDishes() {
    try {
      const query = `
        SELECT 
          dish_id AS "dishId",
          name,
          description,
          price,
          image_url AS "imageUrl",
          category,
          available,
          is_top AS "isTop",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dishes
        WHERE is_top = TRUE
        ORDER BY updated_at DESC
      `;

      const result = await pool.query(query);

      return result.rows;
    } catch (error) {
      console.error("Error getting top dishes:", error);
      throw error;
    }
  }

  // --- Table management methods ---
  static async getAllTables(page = 1, limit = 10, filters = {}) {
    try {
      // Build query conditions
      let queryConditions = "";
      const queryParams = [];
      let paramIndex = 1;

      // Set default sort options
      const sortBy = filters.sortBy || "table_id";
      const sortOrder = filters.sortOrder || "ASC";

      if (filters.status) {
        queryConditions = "WHERE status = $1";
        queryParams.push(filters.status);
        paramIndex++;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM tables
        ${queryConditions}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Calculate pagination values
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Add pagination parameters
      const paginatedQueryParams = [...queryParams, limit, offset];

      // Get tables with pagination
      const query = `
        SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM tables
        ${queryConditions}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      const result = await pool.query(query, paginatedQueryParams);

      return {
        tables: result.rows,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Error getting tables:", error);
      throw error;
    }
  }

  static async getTableById(tableId) {
    try {
      const query = `
        SELECT 
          table_id AS "tableId",
          table_number AS "tableNumber",
          capacity,
          status,
          created_at AS "createdAt",
          reservation_time AS "reservationTime",
          note,
          updated_at AS "updatedAt"
        FROM tables
        WHERE table_id = $1
      `;

      const result = await pool.query(query, [tableId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error getting table by ID:", error);
      throw error;
    }
  }

  static async createTable({ tableNumber, capacity, status = "available" }) {
    try {
      // Check if table number already exists
      const checkQuery = `
        SELECT 1 FROM tables WHERE table_number = $1
      `;

      const checkResult = await pool.query(checkQuery, [tableNumber]);

      if (checkResult.rows.length > 0) {
        throw new Error("Bàn với số này đã tồn tại");
      }

      const query = `
        INSERT INTO tables (
          table_number, capacity, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NOW(), NOW()
        ) RETURNING 
          table_id AS "tableId", 
          table_number AS "tableNumber", 
          capacity, 
          status, 
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(query, [tableNumber, capacity, status]);

      return result.rows[0];
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
  }

  static async updateTable(tableId, { tableNumber, capacity, status }) {
    try {
      // Check if table exists
      const checkQuery = "SELECT 1 FROM tables WHERE table_id = $1";
      const checkResult = await pool.query(checkQuery, [tableId]);

      if (checkResult.rows.length === 0) {
        throw new Error("Bàn không tồn tại");
      }

      // If table number is changed, check it doesn't conflict
      if (tableNumber !== undefined) {
        const numberCheckQuery = `
          SELECT 1 FROM tables WHERE table_number = $1 AND table_id != $2
        `;

        const numberCheckResult = await pool.query(numberCheckQuery, [
          tableNumber,
          tableId,
        ]);

        if (numberCheckResult.rows.length > 0) {
          throw new Error("Bàn với số này đã tồn tại");
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (tableNumber !== undefined) {
        updates.push(`table_number = $${paramIndex++}`);
        values.push(tableNumber);
      }
      if (capacity !== undefined) {
        updates.push(`capacity = $${paramIndex++}`);
        values.push(capacity);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      // If no fields to update except updated_at
      if (updates.length === 1) {
        throw new Error("Không có thông tin nào được cập nhật");
      }

      // Add tableId to values array
      values.push(tableId);

      const query = `
        UPDATE tables
        SET ${updates.join(", ")}
        WHERE table_id = $${paramIndex}
        RETURNING 
          table_id AS "tableId", 
          table_number AS "tableNumber", 
          capacity, 
          status, 
          updated_at AS "updatedAt"
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating table:", error);
      throw error;
    }
  }

  static async deleteTable(tableId) {
    try {
      // Check if table is used in any active orders
      const orderCheckQuery = `
        SELECT 1 FROM orders WHERE table_id = $1 AND status != 'completed' LIMIT 1
      `;

      const orderCheckResult = await pool.query(orderCheckQuery, [tableId]);

      if (orderCheckResult.rows.length > 0) {
        throw new Error("Không thể xóa bàn đang được sử dụng trong đơn hàng");
      }

      // Check if table is used in any active reservations
      const reservationCheckQuery = `
        SELECT 1 FROM reservations WHERE table_id = $1 AND status = 'pending' LIMIT 1
      `;

      const reservationCheckResult = await pool.query(reservationCheckQuery, [
        tableId,
      ]);

      if (reservationCheckResult.rows.length > 0) {
        throw new Error("Không thể xóa bàn đang có đặt chỗ");
      }

      const deleteQuery = "DELETE FROM tables WHERE table_id = $1";
      await pool.query(deleteQuery, [tableId]);

      return { success: true, message: "Xóa bàn thành công" };
    } catch (error) {
      console.error("Error deleting table:", error);
      throw error;
    }
  }

  static async getTableAvailability() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) AS count
        FROM tables
        GROUP BY status
      `;

      const result = await pool.query(query);

      // Transform into a more friendly format
      const availability = {
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
        total: 0,
      };

      result.rows.forEach((row) => {
        availability[row.status] = parseInt(row.count);
        availability.total += parseInt(row.count);
      });

      return availability;
    } catch (error) {
      console.error("Error getting table availability:", error);
      throw error;
    }
  }

  // Get confirmed reserved tables by user
  static async getConfirmedReservedTables(page = 1, limit = 10, filters = {}) {
    try {
      // Set default values
      const offset = (page - 1) * limit;

      // Base query to get reservations
      let query = `
        SELECT 
          r.reservation_id, 
          r.user_id, 
          r.table_id, 
          r.reservation_time, 
          r.party_size, 
          r.status, 
          r.special_requests,
          r.created_at,
          t.table_number,
          t.capacity,
          u.username,
          u.email,
          u.phone_number
        FROM 
          reservations r
        JOIN 
          tables t ON r.table_id = t.table_id
        JOIN 
          users u ON r.user_id = u.user_id
        WHERE 
          r.status = 'confirmed'
      `;

      // Add filter conditions
      const queryParams = [];
      let paramIndex = 1;

      if (filters.userId) {
        query += ` AND r.user_id = $${paramIndex++}`;
        queryParams.push(filters.userId);
      }

      // Add LIMIT and OFFSET for pagination
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);

      // Execute query with parameters
      const result = await pool.query(query, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM reservations r
        WHERE r.status = 'confirmed'
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (filters.userId) {
        countQuery += ` AND r.user_id = $${countParamIndex++}`;
        countParams.push(filters.userId);
      }
      const countResult = await pool.query(countQuery, countParams);
      // Calculate pagination information
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        reservations: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error("Error in getConfirmedReservedTables:", error);
      throw error;
    }
  }

  static async updateReservationStatus(reservationId, status, tableId = null) {
    try {
      const client = await pool.connect();

      try {
        // Start transaction
        await client.query("BEGIN");

        // Update reservation status
        const updateReservationQuery = `
          UPDATE reservations 
          SET status = $1, 
              ${tableId ? "table_id = $3," : ""} 
              updated_at = NOW()
          WHERE reservation_id = $2
          RETURNING *
        `;

        const params = tableId
          ? [status, reservationId, tableId]
          : [status, reservationId];

        const reservationResult = await client.query(
          updateReservationQuery,
          params
        );

        if (reservationResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return {
            success: false,
            message: "Không tìm thấy thông tin đặt bàn",
          };
        }

        const updatedReservation = reservationResult.rows[0];
        let updatedTable = null;

        // If confirmed, update the table status to 'reserved'
        if (status === "confirmed") {
          // Use the tableId parameter if provided, otherwise use the one from the reservation
          const tableIdToUpdate = tableId || updatedReservation.table_id;

          if (tableIdToUpdate) {
            const updateTableQuery = `
              UPDATE tables
              SET status = 'reserved', updated_at = NOW()
              WHERE table_id = $1
              RETURNING *
            `;

            const tableResult = await client.query(updateTableQuery, [
              tableIdToUpdate,
            ]);

            if (tableResult.rows.length === 0) {
              await client.query("ROLLBACK");
              return {
                success: false,
                message: "Không tìm thấy bàn để cập nhật",
              };
            }

            updatedTable = tableResult.rows[0];
          }
        }

        // If canceled or completed, update the table status back to 'available'
        if (status === "canceled" || status === "completed") {
          // Use the tableId parameter if provided, otherwise use the one from the reservation
          const tableIdToUpdate = tableId || updatedReservation.table_id;

          if (tableIdToUpdate) {
            const updateTableQuery = `
              UPDATE tables
              SET status = 'available', updated_at = NOW()
              WHERE table_id = $1
              RETURNING *
            `;

            const tableResult = await client.query(updateTableQuery, [
              tableIdToUpdate,
            ]);

            if (tableResult.rows.length > 0) {
              updatedTable = tableResult.rows[0];
            }
          }
        }

        // Commit transaction
        await client.query("COMMIT");

        return {
          success: true,
          message: `Cập nhật trạng thái đặt bàn thành '${status}' thành công`,
          data: {
            reservation: updatedReservation,
            table: updatedTable,
          },
        };
      } catch (error) {
        // Rollback transaction on error
        await client.query("ROLLBACK");
        throw error;
      } finally {
        // Release client back to pool
        client.release();
      }
    } catch (error) {
      console.error("Error updating reservation status:", error);
      throw error;
    }
  }
}

module.exports = AdminModel;
